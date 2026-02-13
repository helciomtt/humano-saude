'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { TarefaInsert, TarefaUpdate, TarefaStatus } from '@/lib/types/database';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR TAREFAS
// ========================================

export async function getTarefas(filters?: {
  status?: TarefaStatus;
  prioridade?: string;
  atribuido_a?: string;
  lead_id?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('tarefas')
      .select('*, insurance_leads(nome)')
      .order('prioridade', { ascending: false })
      .order('data_vencimento', { ascending: true });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.prioridade) query = query.eq('prioridade', filters.prioridade);
    if (filters?.atribuido_a) query = query.eq('atribuido_a', filters.atribuido_a);
    if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar tarefas:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// CRIAR TAREFA
// ========================================

export async function createTarefa(input: TarefaInsert) {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .insert(input)
      .select('id, titulo')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar tarefa:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/tarefas`);
    return { success: true, data, message: 'Tarefa criada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// ATUALIZAR TAREFA
// ========================================

export async function updateTarefa(id: string, updates: TarefaUpdate) {
  try {
    const updateData: any = { ...updates };
    if (updates.status === 'concluida') {
      updateData.concluida_em = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tarefas')
      .update(updateData)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/tarefas`);
    return { success: true, message: 'Tarefa atualizada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// DELETAR TAREFA
// ========================================

export async function deleteTarefa(id: string) {
  try {
    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/tarefas`);
    return { success: true, message: 'Tarefa removida!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// STATS DE TAREFAS
// ========================================

export async function getTarefaStats() {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('status, prioridade, data_vencimento');

    if (error) return { success: false, data: null, error: error.message };

    const hoje = new Date().toISOString().split('T')[0];

    const stats = {
      total: data?.length || 0,
      pendentes: data?.filter((t: any) => t.status === 'pendente').length || 0,
      em_andamento: data?.filter((t: any) => t.status === 'em_andamento').length || 0,
      concluidas: data?.filter((t: any) => t.status === 'concluida').length || 0,
      urgentes: data?.filter((t: any) => t.prioridade === 'urgente' && t.status !== 'concluida').length || 0,
      atrasadas: data?.filter(
        (t: any) => t.data_vencimento && t.data_vencimento < hoje && t.status !== 'concluida'
      ).length || 0,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
