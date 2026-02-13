'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

// Tipo para os dados do lead vindos do backend Python
export type ScannedLeadData = {
  nome: string;
  whatsapp: string;
  email?: string;
  operadora_atual?: string;
  valor_atual?: number;
  idades: number[];
  economia_estimada?: number;
  valor_proposto?: number;
  tipo_contratacao?: string;
  dados_pdf?: any;
  observacoes?: string;
};

// Tipo para a resposta da função
export type SaveLeadResponse = {
  success: boolean;
  lead_id?: string;
  error?: string;
  message?: string;
};

/**
 * Server Action: Salva um lead escaneado pela IA no Supabase
 * 
 * @param leadData - Dados do lead retornados pelo backend Python
 * @returns Promise<SaveLeadResponse> - Resultado da operação
 */
export async function saveScannedLead(
  leadData: ScannedLeadData
): Promise<SaveLeadResponse> {
  try {
    const sb = createServiceClient();

    // Validação básica
    if (!leadData.nome || !leadData.whatsapp) {
      return {
        success: false,
        error: 'validation_error',
        message: 'Nome e WhatsApp são obrigatórios'
      };
    }

    // Verifica se já existe um lead com esse WhatsApp
    const { data: existingLead } = await sb
      .from('insurance_leads')
      .select('id, nome')
      .eq('whatsapp', leadData.whatsapp)
      .single();

    if (existingLead) {
      return {
        success: false,
        error: 'duplicate_lead',
        message: `Lead já existe: ${existingLead.nome}`,
        lead_id: existingLead.id
      };
    }

    // Prepara os dados para inserção
    const leadToInsert = {
      nome: leadData.nome,
      whatsapp: leadData.whatsapp,
      email: leadData.email || null,
      operadora_atual: leadData.operadora_atual || null,
      valor_atual: leadData.valor_atual || null,
      idades: leadData.idades,
      economia_estimada: leadData.economia_estimada || null,
      valor_proposto: leadData.valor_proposto || null,
      tipo_contratacao: leadData.tipo_contratacao || null,
      status: 'novo' as const,
      origem: 'scanner_pdf',
      prioridade: 'media',
      dados_pdf: leadData.dados_pdf || null,
      observacoes: leadData.observacoes || null,
      historico: [
        {
          timestamp: new Date().toISOString(),
          evento: 'lead_criado',
          origem: 'scanner_pdf',
          detalhes: 'Lead criado automaticamente pelo Scanner de PDF'
        }
      ],
      arquivado: false
    };

    // Insere o lead no Supabase
    const { data, error } = await sb
      .from('insurance_leads')
      .insert(leadToInsert)
      .select('id')
      .single();

    if (error) {
      logger.error('Erro ao salvar lead no Supabase', error);
      return {
        success: false,
        error: 'database_error',
        message: `Erro ao salvar no banco: ${error.message}`
      };
    }

    // Revalida o cache da página de leads
    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');

    logger.info('Lead salvo com sucesso', { lead_id: data.id });

    return {
      success: true,
      lead_id: data.id,
      message: 'Lead salvo com sucesso!'
    };

  } catch (error: any) {
    logger.error('Erro inesperado ao salvar lead', error);
    return {
      success: false,
      error: 'unexpected_error',
      message: error?.message || 'Erro inesperado ao salvar lead'
    };
  }
}

/**
 * Server Action: Busca todos os leads do dashboard
 * 
 * @param filters - Filtros opcionais (status, limite, offset)
 * @returns Promise com array de leads
 */
export async function getLeads(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const sb = createServiceClient();
    let query = sb
      .from('insurance_leads')
      .select('*')
      .eq('arquivado', false)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar leads', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };

  } catch (error: any) {
    logger.error('Erro inesperado ao buscar leads', error);
    return { success: false, data: [], error: error?.message };
  }
}

/**
 * Server Action: Atualiza o status de um lead
 * 
 * @param leadId - ID do lead
 * @param newStatus - Novo status
 * @param observacao - Observação opcional
 * @returns Promise<SaveLeadResponse>
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: string,
  observacao?: string
): Promise<SaveLeadResponse> {
  try {
    const sb = createServiceClient();

    // Busca o lead atual (incluindo whatsapp para sync)
    const { data: currentLead, error: fetchError } = await sb
      .from('insurance_leads')
      .select('status, historico, whatsapp, nome')
      .eq('id', leadId)
      .single();

    if (fetchError || !currentLead) {
      return {
        success: false,
        error: 'not_found',
        message: 'Lead não encontrado'
      };
    }

    // Prepara o novo histórico
    const novoHistorico = [
      ...(currentLead.historico || []),
      {
        timestamp: new Date().toISOString(),
        evento: 'mudanca_status',
        status_anterior: currentLead.status,
        status_novo: newStatus,
        observacao: observacao || null
      }
    ];

    // Atualiza o lead no insurance_leads (admin)
    const { error: updateError } = await sb
      .from('insurance_leads')
      .update({
        status: newStatus,
        historico: novoHistorico
      })
      .eq('id', leadId);

    if (updateError) {
      logger.error('Erro ao atualizar status do lead', updateError, { lead_id: leadId, new_status: newStatus });
      return {
        success: false,
        error: 'database_error',
        message: `Erro ao atualizar: ${updateError.message}`
      };
    }

    // ═══ SYNC: Atualizar leads_indicacao do corretor ═══
    // Mapeamento de status: insurance_leads → leads_indicacao
    const STATUS_MAP: Record<string, string> = {
      novo: 'simulou',
      contatado: 'entrou_em_contato',
      negociacao: 'em_analise',
      proposta_enviada: 'proposta_enviada',
      ganho: 'fechado',
      perdido: 'perdido',
      pausado: 'em_analise',
    };

    const statusCorretor = STATUS_MAP[newStatus];
    if (statusCorretor && currentLead.whatsapp) {
      try {
        // Buscar leads_indicacao pelo telefone (pode ter mais de um corretor)
        const whatsappDigits = currentLead.whatsapp.replace(/\D/g, '');
        const { data: indicacoes } = await sb
          .from('leads_indicacao')
          .select('id, corretor_id, telefone, status')
          .or(`telefone.ilike.%${whatsappDigits}%,telefone.ilike.%${whatsappDigits.slice(-11)}%`);

        if (indicacoes && indicacoes.length > 0) {
          for (const indicacao of indicacoes) {
            // Atualizar status no leads_indicacao
            await sb
              .from('leads_indicacao')
              .update({
                status: statusCorretor,
                updated_at: new Date().toISOString(),
              })
              .eq('id', indicacao.id);

            logger.info('Sync leads_indicacao', { indicacao_id: indicacao.id, status: statusCorretor, corretor_id: indicacao.corretor_id });
          }
        }
      } catch (syncErr) {
        // Não falhar se sync falhar
        logger.warn('Sync leads_indicacao falhou', { error: String(syncErr) });
      }
    }

    // Revalida o cache
    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');
    revalidatePath('/dashboard/corretor/indicacoes');

    return {
      success: true,
      lead_id: leadId,
      message: 'Status atualizado com sucesso!'
    };

  } catch (error: any) {
    logger.error('Erro ao atualizar status', error);
    return {
      success: false,
      error: 'unexpected_error',
      message: error?.message || 'Erro inesperado'
    };
  }
}

/**
 * Server Action: Busca estatísticas do dashboard
 * 
 * @returns Promise com estatísticas
 */
export async function getDashboardStats() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('dashboard_stats')
      .select('*')
      .single();

    if (error) {
      logger.error('Erro ao buscar estatísticas', error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data };

  } catch (error: any) {
    logger.error('Erro ao buscar estatísticas', error);
    return { success: false, data: null, error: error?.message };
  }
}

// =============================================
// Server Action: Salva lead da calculadora /economizar no insurance_leads (admin)
// Salva TUDO: dados OCR, dados digitados, resultado simulação, propostas
// =============================================

export type SaveCalculadoraLeadData = {
  nome: string;
  telefone: string;
  email?: string;
  operadora_atual?: string;
  valor_atual?: number;
  idades?: number[] | string[];
  economia_estimada?: number;
  valor_proposto?: number;
  tipo_pessoa?: string;
  plano_atual?: string;
  corretor_slug?: string;
  corretor_id?: string;
  // Dados completos para o admin ver TUDO
  dados_ocr?: Record<string, unknown>;
  resultado_simulacao?: Record<string, unknown>;
  propostas?: Record<string, unknown>[];
};

export async function saveCalculadoraLead(
  data: SaveCalculadoraLeadData
): Promise<SaveLeadResponse> {
  try {
    if (!data.nome || !data.telefone) {
      return {
        success: false,
        error: 'validation_error',
        message: 'Nome e telefone são obrigatórios',
      };
    }

    const sb = createServiceClient();
    const whatsapp = data.telefone.replace(/\D/g, '');

    // Montar dados_pdf com TODAS as informações para o admin
    const dadosCompletos = {
      origem_pagina: 'calculadora_economia',
      dados_ocr: data.dados_ocr || null,
      dados_digitados: {
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone,
        operadora: data.operadora_atual || null,
        plano: data.plano_atual || null,
        valor_atual: data.valor_atual || null,
        tipo_pessoa: data.tipo_pessoa || null,
        idades: data.idades || [],
      },
      resultado_simulacao: data.resultado_simulacao || null,
      propostas: data.propostas || null,
      corretor: data.corretor_slug ? {
        slug: data.corretor_slug,
        id: data.corretor_id || null,
      } : null,
      timestamp: new Date().toISOString(),
    };

    // Verificar duplicata por whatsapp
    const { data: existing } = await sb
      .from('insurance_leads')
      .select('id, nome, historico')
      .eq('whatsapp', whatsapp)
      .maybeSingle();

    if (existing) {
      const novoHistorico = [
        ...(Array.isArray(existing.historico) ? existing.historico : []),
        {
          timestamp: new Date().toISOString(),
          evento: 'nova_simulacao',
          origem: 'calculadora_economia',
          detalhes: `Nova simulação: ${data.operadora_atual || 'sem operadora'}, R$ ${data.valor_atual?.toFixed(2) || '?'}`,
        },
      ];

      await sb
        .from('insurance_leads')
        .update({
          operadora_atual: data.operadora_atual || undefined,
          valor_atual: data.valor_atual || undefined,
          economia_estimada: data.economia_estimada || undefined,
          valor_proposto: data.valor_proposto || undefined,
          dados_pdf: dadosCompletos,
          historico: novoHistorico,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return {
        success: true,
        lead_id: existing.id,
        message: 'Lead atualizado com novos dados da simulação',
      };
    }

    // Observações detalhadas para o admin
    const observacoes = [
      `📋 SIMULAÇÃO DA CALCULADORA`,
      data.corretor_slug ? `👤 Via corretor: ${data.corretor_slug}` : '🌐 Tráfego direto',
      data.tipo_pessoa ? `Tipo: ${data.tipo_pessoa}` : null,
      data.operadora_atual ? `Operadora atual: ${data.operadora_atual}` : null,
      data.plano_atual ? `Plano: ${data.plano_atual}` : null,
      data.valor_atual ? `Valor atual: R$ ${data.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
      data.economia_estimada ? `💰 Economia estimada: R$ ${data.economia_estimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` : null,
      data.idades?.length ? `Vidas: ${data.idades.length} (idades: ${data.idades.join(', ')})` : null,
    ].filter(Boolean).join('\n');

    const { data: newLead, error } = await sb
      .from('insurance_leads')
      .insert({
        nome: data.nome,
        whatsapp,
        email: data.email || null,
        operadora_atual: data.operadora_atual || null,
        valor_atual: data.valor_atual || null,
        idades: data.idades || [],
        economia_estimada: data.economia_estimada || null,
        valor_proposto: data.valor_proposto || null,
        tipo_contratacao: data.tipo_pessoa === 'PJ' ? 'PME' : 'individual',
        status: 'novo',
        origem: 'calculadora_economia',
        prioridade: data.economia_estimada && data.economia_estimada > 500 ? 'alta' : 'media',
        observacoes,
        dados_pdf: dadosCompletos,
        historico: [
          {
            timestamp: new Date().toISOString(),
            evento: 'lead_criado',
            origem: 'calculadora_economia',
            detalhes: `Lead pela calculadora${data.corretor_slug ? ` (corretor: ${data.corretor_slug})` : ''}. ${data.idades?.length || 0} vida(s).`,
          },
        ],
        arquivado: false,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Erro ao salvar lead da calculadora', error);
      return {
        success: false,
        error: 'database_error',
        message: `Erro ao salvar: ${error.message}`,
      };
    }

    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');

    logger.info('Lead da calculadora salvo', { lead_id: newLead?.id, corretor: data.corretor_slug || 'direto' });

    return {
      success: true,
      lead_id: newLead?.id,
      message: 'Lead salvo com sucesso!',
    };
  } catch (error: any) {
    logger.error('Erro inesperado (calculadora)', error);
    return {
      success: false,
      error: 'unexpected_error',
      message: error?.message || 'Erro inesperado',
    };
  }
}
