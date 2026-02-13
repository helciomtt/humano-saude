'use server';

import { createServiceClient } from '@/lib/supabase';
import type { CorretorDashboard, Renovacao, RenovacaoUpdate } from '@/lib/types/corretor';
import type { Comissao } from '@/lib/types/database';
import { logger } from '@/lib/logger';

// ========================================
// DASHBOARD DO CORRETOR
// ========================================

export async function getCorretorDashboard(corretorId: string): Promise<{
  success: boolean;
  data?: CorretorDashboard;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretor_dashboard')
      .select('*')
      .eq('corretor_id', corretorId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorDashboard]', err);
    return { success: false, error: 'Erro ao carregar dashboard' };
  }
}

// ========================================
// COMISSÕES & FINANCEIRO
// ========================================

export async function getComissoes(
  corretorId: string,
  filtros?: { mes?: string; status?: string },
): Promise<{
  success: boolean;
  data?: Comissao[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('comissoes')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('mes_referencia', { ascending: false });

    if (filtros?.mes) {
      query = query.gte('mes_referencia', `${filtros.mes}-01`)
        .lte('mes_referencia', `${filtros.mes}-31`);
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getComissoes]', err);
    return { success: false, error: 'Erro ao carregar comissões' };
  }
}

export async function getComissoesResumo(corretorId: string): Promise<{
  success: boolean;
  data?: {
    total_recebido: number;
    total_pendente: number;
    total_mes_atual: number;
    quantidade_propostas_ativas: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: comissoes, error } = await supabase
      .from('comissoes')
      .select('valor_comissao, status, mes_referencia')
      .eq('corretor_id', corretorId);

    if (error) throw error;

    const mesAtual = new Date().toISOString().slice(0, 7);

    const resumo = {
      total_recebido: 0,
      total_pendente: 0,
      total_mes_atual: 0,
      quantidade_propostas_ativas: 0,
    };

    (comissoes ?? []).forEach((c) => {
      if (c.status === 'paga') {
        resumo.total_recebido += Number(c.valor_comissao);
      }
      if (c.status === 'pendente') {
        resumo.total_pendente += Number(c.valor_comissao);
      }
      if (c.mes_referencia?.startsWith(mesAtual)) {
        resumo.total_mes_atual += Number(c.valor_comissao);
        resumo.quantidade_propostas_ativas++;
      }
    });

    return { success: true, data: resumo };
  } catch (err) {
    logger.error('[getComissoesResumo]', err);
    return { success: false, error: 'Erro ao carregar resumo' };
  }
}

// Grade de comissionamento: calcula baseado na regra de faixa
export async function calcularComissao(
  valorMensalidade: number,
  faixa: '100%' | '200%' | '300%',
  comissaoPadraoPct: number,
): Promise<{ valor: number; descricao: string }> {
  const multiplicadores: Record<string, number> = {
    '100%': 1,
    '200%': 2,
    '300%': 3,
  };

  const multiplicador = multiplicadores[faixa] ?? 1;
  const valor = (valorMensalidade * comissaoPadraoPct / 100) * multiplicador;

  return {
    valor: Math.round(valor * 100) / 100,
    descricao: `${comissaoPadraoPct}% × ${multiplicador}x = R$ ${valor.toFixed(2)}`,
  };
}

// ========================================
// RENOVAÇÕES (Gold Mine)
// ========================================

export async function getRenovacoes(
  corretorId: string,
  diasLimite: number = 60,
): Promise<{
  success: boolean;
  data?: Renovacao[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    // Calcula datas-limite dinamicamente (coluna gerada não existe na tabela)
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - 30); // Inclui vencidos há até 30 dias
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + diasLimite);

    const { data, error } = await supabase
      .from('renovacoes')
      .select('*')
      .eq('corretor_id', corretorId)
      .gte('data_vencimento', minDate.toISOString().split('T')[0])
      .lte('data_vencimento', maxDate.toISOString().split('T')[0])
      .neq('status', 'renovado')
      .neq('status', 'cancelado')
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    // Computa dias_para_vencimento dinamicamente
    const enriched: Renovacao[] = (data ?? []).map((row) => {
      const vencimento = new Date(row.data_vencimento);
      const diffMs = vencimento.getTime() - now.getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...row, dias_para_vencimento: dias };
    });

    return { success: true, data: enriched };
  } catch (err) {
    logger.error('[getRenovacoes]', err);
    return { success: false, error: 'Erro ao carregar renovações' };
  }
}

export async function updateRenovacao(
  renovacaoId: string,
  updates: RenovacaoUpdate,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('renovacoes')
      .update(updates)
      .eq('id', renovacaoId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[updateRenovacao]', err);
    return { success: false, error: 'Erro ao atualizar renovação' };
  }
}

// ========================================
// MATERIAIS DE VENDAS
// ========================================

export async function getMateriais(filtros?: {
  categoria?: string;
  operadora_id?: string;
  busca?: string;
}): Promise<{
  success: boolean;
  data?: Array<Record<string, unknown>>;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('materiais_vendas')
      .select('*, operadora:operadoras(nome, logo_url)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true });

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.operadora_id) {
      query = query.eq('operadora_id', filtros.operadora_id);
    }

    if (filtros?.busca) {
      query = query.ilike('nome', `%${filtros.busca}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getMateriais]', err);
    return { success: false, error: 'Erro ao carregar materiais' };
  }
}

// ========================================
// BANNER GENERATOR
// ========================================

export async function requestBanner(
  corretorId: string,
  nomeCorretor: string,
  whatsappCorretor: string,
  templateId?: string,
): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('banner_requests')
      .insert({
        corretor_id: corretorId,
        nome_corretor: nomeCorretor,
        whatsapp_corretor: whatsappCorretor,
        template_id: templateId,
        status: 'pendente',
      })
      .select('id')
      .single();

    if (error) throw error;

    // TODO: Disparar webhook para Nano Banana API renderizar o banner
    // await fetch(process.env.NANO_BANANA_WEBHOOK_URL, { ... })

    return { success: true, data };
  } catch (err) {
    logger.error('[requestBanner]', err);
    return { success: false, error: 'Erro ao solicitar banner' };
  }
}

// ========================================
// AUTH DO CORRETOR
// ========================================

export async function getCorretorById(corretorId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('*')
      .eq('id', corretorId)
      .eq('ativo', true)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorById]', err);
    return { success: false, error: 'Corretor não encontrado' };
  }
}
