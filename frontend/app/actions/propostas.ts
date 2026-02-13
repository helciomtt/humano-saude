'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type {
  PropostaInsert,
  PropostaUpdate,
  PropostaStatus,
} from '@/lib/types/database';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR PROPOSTAS
// ========================================

export async function getPropostas(filters?: {
  status?: PropostaStatus;
  lead_id?: string;
  operadora_id?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('propostas')
      .select('*, insurance_leads(nome, whatsapp), operadoras(nome, logo_url), planos(nome)')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
    if (filters?.operadora_id) query = query.eq('operadora_id', filters.operadora_id);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar propostas:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// BUSCAR PROPOSTA POR ID
// ========================================

export async function getPropostaById(id: string) {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*, insurance_leads(*), operadoras(*), planos(*), cotacoes(*)')
      .eq('id', id)
      .single();

    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// CRIAR PROPOSTA
// ========================================

export async function createProposta(input: PropostaInsert) {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .insert(input)
      .select('id, numero_proposta')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar proposta:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/contratos`);
    revalidatePath(`${PORTAL}/vendas`);
    revalidatePath(PORTAL);

    return { success: true, data, message: 'Proposta criada com sucesso!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// ATUALIZAR PROPOSTA
// ========================================

export async function updateProposta(id: string, updates: PropostaUpdate) {
  try {
    const { error } = await supabase
      .from('propostas')
      .update(updates)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/contratos`);
    return { success: true, message: 'Proposta atualizada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// ATIVAR PROPOSTA (aprovar → ativa)
// ========================================

export async function ativarProposta(id: string) {
  try {
    const { error } = await supabase
      .from('propostas')
      .update({
        status: 'ativa',
        ativada_em: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/contratos`);
    revalidatePath(`${PORTAL}/faturamento`);
    return { success: true, message: 'Proposta ativada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// STATS DE PROPOSTAS
// ========================================

export async function getPropostaStats() {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('status, valor_mensalidade, comissao_corretor');

    if (error) return { success: false, data: null, error: error.message };

    const stats = {
      total: data?.length || 0,
      ativas: data?.filter((p: any) => p.status === 'ativa').length || 0,
      em_analise: data?.filter((p: any) => p.status === 'analise').length || 0,
      canceladas: data?.filter((p: any) => p.status === 'cancelada').length || 0,
      receita_recorrente: data
        ?.filter((p: any) => p.status === 'ativa')
        .reduce((sum: number, p: any) => sum + (p.valor_mensalidade || 0), 0) || 0,
      comissoes_totais: data
        ?.filter((p: any) => p.status === 'ativa')
        .reduce((sum: number, p: any) => sum + (p.comissao_corretor || 0), 0) || 0,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
