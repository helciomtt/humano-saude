'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

export type RegraIA = {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'automacao' | 'otimizacao' | 'seguranca' | 'processamento';
  ativa: boolean;
  condicao: string;
  acao: string;
  ultima_execucao: string | null;
  execucoes: number;
  created_at: string;
  updated_at: string;
};

/**
 * Busca todas as regras de IA do Supabase
 */
export async function getRegrasIA(): Promise<RegraIA[]> {
  const { data, error } = await supabase
    .from('regras_ia')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Erro ao buscar regras IA:', error);
    return [];
  }

  return (data || []) as RegraIA[];
}

/**
 * Alterna o status ativa/inativa de uma regra
 */
export async function toggleRegraIA(id: string, ativa: boolean) {
  const { error } = await supabase
    .from('regras_ia')
    .update({ ativa })
    .eq('id', id);

  if (error) {
    logger.error('Erro ao alterar regra IA:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`${PORTAL}/regras-ia`);
  return { success: true };
}
