'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

export type Automacao = {
  id: string;
  nome: string;
  descricao: string;
  trigger_evento: string;
  acoes: string[];
  ativa: boolean;
  execucoes: number;
  ultima_execucao: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Busca todas as automações do Supabase
 */
export async function getAutomacoes(): Promise<Automacao[]> {
  const { data, error } = await supabase
    .from('automacoes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Erro ao buscar automações:', error);
    return [];
  }

  return (data || []) as Automacao[];
}

/**
 * Alterna o status ativa/inativa de uma automação
 */
export async function toggleAutomacao(id: string, ativa: boolean) {
  const { error } = await supabase
    .from('automacoes')
    .update({ ativa })
    .eq('id', id);

  if (error) {
    logger.error('Erro ao alterar automação:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`${PORTAL}/automacao`);
  return { success: true };
}
