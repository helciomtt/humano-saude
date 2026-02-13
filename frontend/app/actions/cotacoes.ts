'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type {
  CotacaoInsert,
  CotacaoUpdate,
  CotacaoStatus,
} from '@/lib/types/database';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR COTAÇÕES
// ========================================

export async function getCotacoes(filters?: {
  status?: CotacaoStatus;
  lead_id?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('cotacoes')
      .select('*, insurance_leads(nome, whatsapp), planos(nome, operadora_id)')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar cotações:', error);
      return { success: false, data: [], count: 0, error: error.message };
    }

    return { success: true, data: data || [], count: count || 0 };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], count: 0, error: msg };
  }
}

// ========================================
// BUSCAR COTAÇÃO POR ID
// ========================================

export async function getCotacaoById(id: string) {
  try {
    const { data, error } = await supabase
      .from('cotacoes')
      .select('*, insurance_leads(nome, whatsapp, email), planos(nome, tipo, operadora_id)')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// CRIAR COTAÇÃO
// ========================================

export async function createCotacao(input: CotacaoInsert) {
  try {
    // Gerar número da cotação
    const numero = `COT-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('cotacoes')
      .insert({ ...input, numero_cotacao: numero })
      .select('id, numero_cotacao')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar cotação:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/cotacoes`);
    revalidatePath(PORTAL);

    return { success: true, data, message: 'Cotação criada com sucesso!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// ATUALIZAR COTAÇÃO
// ========================================

export async function updateCotacao(id: string, updates: CotacaoUpdate) {
  try {
    const { error } = await supabase
      .from('cotacoes')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/cotacoes`);
    return { success: true, message: 'Cotação atualizada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// ENVIAR COTAÇÃO (mudar status)
// ========================================

export async function enviarCotacao(id: string) {
  try {
    const { error } = await supabase
      .from('cotacoes')
      .update({
        status: 'enviada' as CotacaoStatus,
        enviada_em: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/cotacoes`);
    return { success: true, message: 'Cotação enviada ao cliente!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// STATS DE COTAÇÕES
// ========================================

export async function getCotacaoStats() {
  try {
    const { data: all, error } = await supabase
      .from('cotacoes')
      .select('status, valor_total');

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    const stats = {
      total: all?.length || 0,
      pendentes: all?.filter((c) => c.status === 'pendente').length || 0,
      enviadas: all?.filter((c) => c.status === 'enviada').length || 0,
      aceitas: all?.filter((c) => c.status === 'aceita').length || 0,
      recusadas: all?.filter((c) => c.status === 'recusada').length || 0,
      valor_total: all?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0,
      taxa_conversao:
        all && all.length > 0
          ? Math.round(
              (all.filter((c) => c.status === 'aceita').length / all.length) *
                100
            )
          : 0,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
