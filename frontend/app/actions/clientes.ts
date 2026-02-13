'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR CLIENTES (leads com status 'ganho' + propostas ativas)
// ========================================

export async function getClientes(filters?: {
  search?: string;
  operadora?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('insurance_leads')
      .select('*, propostas(id, numero_proposta, status, valor_mensalidade, operadora_id)')
      .eq('status', 'ganho')
      .eq('arquivado', false)
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(
        `nome.ilike.%${filters.search}%,whatsapp.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar clientes:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// BUSCAR CLIENTE POR ID (lead + propostas + cotações)
// ========================================

export async function getClienteById(id: string) {
  try {
    const { data, error } = await supabase
      .from('insurance_leads')
      .select('*, propostas(*), cotacoes(*), whatsapp_contacts(phone, last_message_at)')
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
// STATS DE CLIENTES
// ========================================

export async function getClienteStats() {
  try {
    // Total de clientes (leads com status 'ganho')
    const { data: clientes, error: errClientes } = await supabase
      .from('insurance_leads')
      .select('id')
      .eq('status', 'ganho')
      .eq('arquivado', false);

    // Propostas ativas
    const { data: propostas, error: errPropostas } = await supabase
      .from('propostas')
      .select('valor_mensalidade')
      .eq('status', 'ativa');

    if (errClientes || errPropostas) {
      return {
        success: false,
        data: null,
        error: errClientes?.message || errPropostas?.message,
      };
    }

    const receita = propostas?.reduce(
      (sum: number, p: any) => sum + (p.valor_mensalidade || 0),
      0
    ) || 0;

    return {
      success: true,
      data: {
        total_clientes: clientes?.length || 0,
        propostas_ativas: propostas?.length || 0,
        receita_recorrente: receita,
        ticket_medio: propostas && propostas.length > 0
          ? Math.round(receita / propostas.length)
          : 0,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// PIPELINE COMPLETO (view)
// ========================================

export async function getPipeline() {
  try {
    const { data, error } = await supabase
      .from('pipeline_completo')
      .select('*');

    if (error) {
      logger.error('❌ Erro ao buscar pipeline:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}
