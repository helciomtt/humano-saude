'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// =============================================
// TIPOS
// =============================================

export interface LeadIndicacao {
  id: string;
  corretor_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  operadora_atual: string | null;
  plano_atual: string | null;
  valor_atual: number | null;
  qtd_vidas: number;
  idades: string[] | null;
  valor_estimado_min: number | null;
  valor_estimado_max: number | null;
  economia_estimada: number | null;
  status: string;
  clicou_no_contato: boolean;
  data_contato: string | null;
  origem: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CorretorPublico {
  id: string;
  nome: string;
  slug: string;
  foto_url: string | null;
  logo_personalizada_url: string | null;
  cor_primaria: string | null;
  whatsapp: string | null;
  telefone: string | null;
  email: string | null;
}

// =============================================
// 1. VALIDAR SLUG DO CORRETOR
// =============================================

export async function getCorretorBySlug(slug: string): Promise<{
  success: boolean;
  data?: CorretorPublico;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('id, nome, slug, foto_url, logo_personalizada_url, cor_primaria, whatsapp, telefone, email')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Corretor não encontrado' };
    }

    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorBySlug]', err);
    return { success: false, error: 'Erro ao buscar corretor' };
  }
}

// =============================================
// 2. SALVAR LEAD DA INDICAÇÃO
// =============================================

export async function salvarLeadIndicacao(dados: {
  corretor_id?: string;
  origem?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  operadora_atual?: string;
  plano_atual?: string;
  valor_atual?: number;
  qtd_vidas?: number;
  idades?: string[];
  valor_estimado_min?: number;
  valor_estimado_max?: number;
  economia_estimada?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; lead_id?: string; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('leads_indicacao')
      .insert({
        corretor_id: dados.corretor_id || null,
        nome: dados.nome || null,
        email: dados.email || null,
        telefone: dados.telefone || null,
        cpf: dados.cpf || null,
        operadora_atual: dados.operadora_atual || null,
        plano_atual: dados.plano_atual || null,
        valor_atual: dados.valor_atual || null,
        qtd_vidas: dados.qtd_vidas || 1,
        idades: dados.idades || null,
        valor_estimado_min: dados.valor_estimado_min || null,
        valor_estimado_max: dados.valor_estimado_max || null,
        economia_estimada: dados.economia_estimada || null,
        status: 'simulou',
        origem: dados.origem || 'link_corretor',
        metadata: dados.metadata || {},
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, lead_id: data?.id };
  } catch (err) {
    logger.error('[salvarLeadIndicacao]', err);
    return { success: false, error: 'Erro ao salvar lead' };
  }
}

// =============================================
// 3. MARCAR CLICOU NO CONTATO
// =============================================

export async function marcarClicouContato(leadId: string): Promise<{ success: boolean }> {
  try {
    const supabase = createServiceClient();

    await supabase
      .from('leads_indicacao')
      .update({
        clicou_no_contato: true,
        data_contato: new Date().toISOString(),
        status: 'entrou_em_contato',
      })
      .eq('id', leadId);

    return { success: true };
  } catch (err) {
    logger.error('[marcarClicouContato]', err);
    return { success: false };
  }
}

// =============================================
// 4. ATUALIZAR STATUS DO LEAD
// =============================================

export async function atualizarStatusLead(
  leadId: string,
  novoStatus: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('leads_indicacao')
      .update({ status: novoStatus })
      .eq('id', leadId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[atualizarStatusLead]', err);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

// =============================================
// 5. LISTAR INDICAÇÕES DO CORRETOR (Dashboard)
// =============================================

export async function getIndicacoesCorretor(
  corretorId: string,
  filtros?: {
    status?: string;
    busca?: string;
    pagina?: number;
    limite?: number;
  },
): Promise<{
  success: boolean;
  data?: LeadIndicacao[];
  total?: number;
  resumo?: {
    total: number;
    simularam: number;
    contataram: number;
    em_analise: number;
    fechados: number;
    taxa_conversao: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 20;
    const offset = (pagina - 1) * limite;

    // Query principal
    let query = supabase
      .from('leads_indicacao')
      .select('*', { count: 'exact' })
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false });

    if (filtros?.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status);
    }

    if (filtros?.busca) {
      query = query.or(
        `nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%`,
      );
    }

    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Resumo de métricas
    const { data: metricas } = await supabase
      .from('leads_indicacao')
      .select('status')
      .eq('corretor_id', corretorId);

    const total = metricas?.length || 0;
    const simularam = metricas?.filter((m) => m.status === 'simulou').length || 0;
    const contataram = metricas?.filter((m) =>
      ['entrou_em_contato', 'em_analise', 'proposta_enviada', 'fechado'].includes(m.status),
    ).length || 0;
    const em_analise = metricas?.filter((m) =>
      ['em_analise', 'proposta_enviada'].includes(m.status),
    ).length || 0;
    const fechados = metricas?.filter((m) => m.status === 'fechado').length || 0;

    return {
      success: true,
      data: data ?? [],
      total: count ?? 0,
      resumo: {
        total,
        simularam,
        contataram,
        em_analise,
        fechados,
        taxa_conversao: total > 0 ? Math.round((fechados / total) * 100) : 0,
      },
    };
  } catch (err) {
    logger.error('[getIndicacoesCorretor]', err);
    return { success: false, error: 'Erro ao buscar indicações' };
  }
}
