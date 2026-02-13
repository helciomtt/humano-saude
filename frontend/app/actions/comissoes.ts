'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { ComissaoInsert, ComissaoStatus } from '@/lib/types/database';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR COMISSÕES
// ========================================

export async function getComissoes(filters?: {
  status?: ComissaoStatus;
  mes_referencia?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('comissoes')
      .select('*, propostas(numero_proposta, nome_titular, valor_mensalidade, operadora_id)')
      .order('mes_referencia', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.mes_referencia) query = query.eq('mes_referencia', filters.mes_referencia);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar comissões:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// CRIAR COMISSÃO
// ========================================

export async function createComissao(input: ComissaoInsert) {
  try {
    const { data, error } = await supabase
      .from('comissoes')
      .insert(input)
      .select('id')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar comissão:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/faturamento`);
    revalidatePath(`${PORTAL}/financeiro`);
    return { success: true, data, message: 'Comissão registrada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// MARCAR COMISSÃO COMO PAGA
// ========================================

export async function pagarComissao(id: string, forma_pagamento: string) {
  try {
    const { error } = await supabase
      .from('comissoes')
      .update({
        status: 'paga',
        forma_pagamento,
        data_pagamento: new Date().toISOString().split('T')[0],
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/faturamento`);
    revalidatePath(`${PORTAL}/financeiro`);
    return { success: true, message: 'Comissão paga!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// STATS FINANCEIROS
// ========================================

export async function getFinanceiroStats() {
  try {
    const { data: comissoes, error } = await supabase
      .from('comissoes')
      .select('status, valor_comissao, mes_referencia');

    if (error) return { success: false, data: null, error: error.message };

    const stats = {
      total_comissoes: comissoes?.length || 0,
      pendentes: comissoes?.filter((c: any) => c.status === 'pendente').length || 0,
      pagas: comissoes?.filter((c: any) => c.status === 'paga').length || 0,
      valor_pendente: comissoes
        ?.filter((c: any) => c.status === 'pendente')
        .reduce((sum: number, c: any) => sum + (c.valor_comissao || 0), 0) || 0,
      valor_pago: comissoes
        ?.filter((c: any) => c.status === 'paga')
        .reduce((sum: number, c: any) => sum + (c.valor_comissao || 0), 0) || 0,
      valor_total: comissoes?.reduce(
        (sum: number, c: any) => sum + (c.valor_comissao || 0), 0
      ) || 0,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
