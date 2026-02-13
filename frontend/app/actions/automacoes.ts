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

export type CrmWorkflow = {
  id: string;
  nome: string;
  descricao: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: Array<{ type: string; config?: Record<string, unknown> }>;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_by: string | null;
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

// =====================================================
// CRM WORKFLOWS (tabela crm_workflows)
// =====================================================

/**
 * Busca todos os workflows CRM
 */
export async function getCrmWorkflows(): Promise<CrmWorkflow[]> {
  const { data, error } = await supabase
    .from('crm_workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Erro ao buscar workflows CRM:', error);
    return [];
  }

  return (data || []) as CrmWorkflow[];
}

/**
 * Cria um novo workflow CRM
 */
export async function createCrmWorkflow(dados: {
  nome: string;
  descricao?: string;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  actions: Array<{ type: string; config?: Record<string, unknown> }>;
}) {
  const { data, error } = await supabase
    .from('crm_workflows')
    .insert({
      nome: dados.nome,
      descricao: dados.descricao || null,
      trigger_type: dados.trigger_type,
      trigger_config: dados.trigger_config || {},
      actions: dados.actions,
      is_active: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao criar workflow CRM:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`${PORTAL}/automacao`);
  return { success: true, data };
}

/**
 * Alterna o status ativo/inativo de um workflow CRM
 */
export async function toggleCrmWorkflow(id: string, is_active: boolean) {
  const { error } = await supabase
    .from('crm_workflows')
    .update({ is_active })
    .eq('id', id);

  if (error) {
    logger.error('Erro ao alterar workflow CRM:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`${PORTAL}/automacao`);
  return { success: true };
}

/**
 * Remove um workflow CRM
 */
export async function deleteCrmWorkflow(id: string) {
  const { error } = await supabase
    .from('crm_workflows')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Erro ao deletar workflow CRM:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`${PORTAL}/automacao`);
  return { success: true };
}

/**
 * Busca o histórico de execuções de um workflow
 */
export async function getWorkflowExecutions(workflowId: string, limit = 20) {
  const { data, error } = await supabase
    .from('crm_workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Erro ao buscar execuções:', error);
    return [];
  }

  return data || [];
}
