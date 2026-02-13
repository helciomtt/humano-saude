'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { IntegrationSettingInsert, IntegrationSettingUpdate } from '@/lib/types/database';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR INTEGRAÇÕES
// ========================================

export async function getIntegrations() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .order('integration_name', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar integrações:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// BUSCAR INTEGRAÇÃO POR NOME
// ========================================

export async function getIntegrationByName(name: string) {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_name', name)
      .single();

    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// SALVAR/ATUALIZAR INTEGRAÇÃO
// ========================================

export async function upsertIntegration(input: {
  integration_name: string;
  encrypted_credentials: Record<string, unknown>;
  config?: Record<string, unknown>;
  is_active?: boolean;
}) {
  try {
    const { data: existing } = await supabase
      .from('integration_settings')
      .select('id')
      .eq('integration_name', input.integration_name)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('integration_settings')
        .update({
          encrypted_credentials: input.encrypted_credentials,
          config: input.config || {},
          is_active: input.is_active ?? true,
          last_sync_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      // Insert
      const { error } = await supabase
        .from('integration_settings')
        .insert({
          integration_name: input.integration_name,
          encrypted_credentials: input.encrypted_credentials,
          config: input.config || {},
          is_active: input.is_active ?? true,
        });

      if (error) return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/integracoes`);
    return { success: true, message: 'Integração salva!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// TOGGLE INTEGRAÇÃO (ativar/desativar)
// ========================================

export async function toggleIntegration(id: string, is_active: boolean) {
  try {
    const { error } = await supabase
      .from('integration_settings')
      .update({ is_active })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/integracoes`);
    return { success: true, message: is_active ? 'Integração ativada!' : 'Integração desativada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// WEBHOOK LOGS
// ========================================

export async function getWebhookLogs(filters?: {
  source?: string;
  status?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.source) query = query.eq('source', filters.source);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar webhook logs:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// CONFIGURAÇÕES DO SISTEMA (usa integration_settings)
// ========================================

export async function getSystemConfig() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('config, encrypted_credentials')
      .eq('integration_name', 'system_config')
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: data ? { ...data.config, ...data.encrypted_credentials } : null,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

export async function saveSystemConfig(config: Record<string, unknown>) {
  try {
    const { whatsapp_api_token, smtp_host, smtp_port, smtp_user, ...publicConfig } = config;

    const result = await upsertIntegration({
      integration_name: 'system_config',
      encrypted_credentials: {
        whatsapp_api_token: whatsapp_api_token || '',
        smtp_host: smtp_host || '',
        smtp_port: smtp_port || '',
        smtp_user: smtp_user || '',
      },
      config: publicConfig,
      is_active: true,
    });

    revalidatePath(`${PORTAL}/configuracoes`);
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// PERFIL DO ADMIN (usa integration_settings)
// ========================================

export async function getAdminProfile() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('integration_name', 'admin_profile')
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data?.config || null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

export async function saveAdminProfile(profile: Record<string, unknown>) {
  try {
    const result = await upsertIntegration({
      integration_name: 'admin_profile',
      encrypted_credentials: {},
      config: profile,
      is_active: true,
    });

    revalidatePath(`${PORTAL}/perfil`);
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}
