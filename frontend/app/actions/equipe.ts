'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const PORTAL = '/portal-interno-hks-2026';

export interface MembroEquipe {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  whatsapp: string | null;
  foto_url: string | null;
  role: 'corretor' | 'supervisor' | 'admin';
  ativo: boolean;
  data_admissao: string | null;
  comissao_padrao_pct: number;
  created_at: string;
  updated_at: string;
  // Computed
  total_deals?: number;
  ultimo_login?: string | null;
}

/**
 * Busca todos os membros da equipe (corretores)
 */
export async function getEquipe(): Promise<MembroEquipe[]> {
  const { data, error } = await supabase
    .from('corretores')
    .select('*')
    .order('role', { ascending: true })
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar equipe:', error);
    return [];
  }

  return (data || []) as MembroEquipe[];
}

/**
 * Busca um membro específico
 */
export async function getMembro(id: string): Promise<MembroEquipe | null> {
  const { data, error } = await supabase
    .from('corretores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as MembroEquipe;
}

/**
 * Atualiza a role de um corretor
 */
export async function updateMembroRole(
  id: string,
  role: 'corretor' | 'supervisor' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('corretores')
    .update({ role })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`${PORTAL}/configuracoes`);
  return { success: true };
}

/**
 * Ativa/desativa um corretor
 */
export async function toggleMembroAtivo(
  id: string,
  ativo: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('corretores')
    .update({ ativo })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`${PORTAL}/configuracoes`);
  return { success: true };
}

/**
 * Remove um corretor da equipe
 */
export async function removerMembro(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('corretores')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`${PORTAL}/configuracoes`);
  return { success: true };
}

/**
 * Convida um novo membro (cria corretor com status pendente)
 */
export async function convidarMembro(dados: {
  nome: string;
  email: string;
  role: 'corretor' | 'supervisor' | 'admin';
}): Promise<{ success: boolean; error?: string }> {
  // Verificar se email já existe
  const { data: existing } = await supabase
    .from('corretores')
    .select('id')
    .eq('email', dados.email)
    .single();

  if (existing) {
    return { success: false, error: 'Este email já está cadastrado na equipe' };
  }

  const { error } = await supabase
    .from('corretores')
    .insert({
      nome: dados.nome,
      email: dados.email,
      role: dados.role,
      ativo: true,
      data_admissao: new Date().toISOString().split('T')[0],
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`${PORTAL}/configuracoes`);
  return { success: true };
}

/**
 * Atualiza dados de um membro
 */
export async function updateMembro(
  id: string,
  dados: Partial<Pick<MembroEquipe, 'nome' | 'email' | 'telefone' | 'whatsapp' | 'comissao_padrao_pct'>>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('corretores')
    .update(dados)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`${PORTAL}/configuracoes`);
  return { success: true };
}
