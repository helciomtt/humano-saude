'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { OperadoraInsert, OperadoraUpdate } from '@/lib/types/database';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR OPERADORAS
// ========================================

export async function getOperadoras(apenasAtivas = true) {
  try {
    let query = supabase
      .from('operadoras')
      .select('*')
      .order('nome', { ascending: true });

    if (apenasAtivas) query = query.eq('ativa', true);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar operadoras:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// BUSCAR OPERADORA POR ID
// ========================================

export async function getOperadoraById(id: string) {
  try {
    const { data, error } = await supabase
      .from('operadoras')
      .select('*, planos(*)')
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
// CRIAR OPERADORA
// ========================================

export async function createOperadora(input: OperadoraInsert) {
  try {
    const { data, error } = await supabase
      .from('operadoras')
      .insert(input)
      .select('id, nome')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar operadora:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/configuracoes`);
    return { success: true, data, message: 'Operadora criada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// ATUALIZAR OPERADORA
// ========================================

export async function updateOperadora(id: string, updates: OperadoraUpdate) {
  try {
    const { error } = await supabase
      .from('operadoras')
      .update(updates)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/configuracoes`);
    return { success: true, message: 'Operadora atualizada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// DESEMPENHO POR OPERADORA (view)
// ========================================

export async function getDesempenhoOperadoras() {
  try {
    const { data, error } = await supabase
      .from('desempenho_operadoras')
      .select('*');

    if (error) {
      logger.error('❌ Erro ao buscar desempenho operadoras:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}
