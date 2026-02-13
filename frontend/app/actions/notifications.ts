'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR NOTIFICAÇÕES
// ========================================

export async function getNotificacoes(filters?: {
  lida?: boolean;
  tipo?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('notificacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.lida !== undefined) query = query.eq('lida', filters.lida);
    if (filters?.tipo) query = query.eq('tipo', filters.tipo);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar notificações:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// CONTAR NÃO LIDAS
// ========================================

export async function getNotificacaoCount() {
  try {
    const { count, error } = await supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('lida', false);

    if (error) return { success: false, count: 0, error: error.message };
    return { success: true, count: count || 0 };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, count: 0, error: msg };
  }
}

// ========================================
// MARCAR COMO LIDA
// ========================================

export async function markNotificacaoAsRead(id: string) {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/notificacoes`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// MARCAR TODAS COMO LIDAS
// ========================================

export async function markAllNotificacoesAsRead() {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('lida', false);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/notificacoes`);
    return { success: true, message: 'Todas as notificações marcadas como lidas!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// CRIAR NOTIFICAÇÃO (uso interno)
// ========================================

export async function createNotificacao(input: {
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  link?: string;
  user_id?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        titulo: input.titulo,
        mensagem: input.mensagem,
        tipo: input.tipo,
        link: input.link || null,
        user_id: input.user_id || null,
        lida: false,
        metadata: {},
      })
      .select('id')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar notificação:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/notificacoes`);
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}
