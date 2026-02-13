'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR CAMPANHAS
// ========================================

export async function getAdsCampaigns(filters?: {
  status?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('ads_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar campanhas:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// LISTAR CRIATIVOS
// ========================================

export async function getAdsCreatives(filters?: {
  campaign_id?: string;
  status?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('ads_creatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar criativos:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// LISTAR PÚBLICOS (AUDIENCES)
// ========================================

export async function getAdsAudiences() {
  try {
    const { data, error } = await supabase
      .from('ads_audiences')
      .select('*')
      .order('total_conversions', { ascending: false });

    if (error) {
      logger.error('❌ Erro ao buscar públicos:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// STATS DE ADS
// ========================================

export async function getAdsStats() {
  try {
    const { data: campaigns, error } = await supabase
      .from('ads_campaigns')
      .select('status, spend, impressions, clicks, leads_generated, cpl');

    if (error) return { success: false, data: null, error: error.message };

    const ativas = (campaigns || []).filter((c: any) => c.status === 'ACTIVE');

    const stats = {
      total_campanhas: campaigns?.length || 0,
      campanhas_ativas: ativas.length,
      investimento_total: campaigns?.reduce((sum: number, c: any) => sum + (c.spend || 0), 0) || 0,
      impressoes_total: campaigns?.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0) || 0,
      cliques_total: campaigns?.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0) || 0,
      leads_gerados: campaigns?.reduce((sum: number, c: any) => sum + (c.leads_generated || 0), 0) || 0,
      cpl_medio: ativas.length > 0
        ? Math.round(
            ativas.reduce((sum: number, c: any) => sum + (c.cpl || 0), 0) / ativas.length * 100
          ) / 100
        : 0,
      ctr_medio: campaigns && campaigns.length > 0
        ? Math.round(
            (campaigns.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0) /
              Math.max(campaigns.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0), 1)) *
              10000
          ) / 100
        : 0,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// ANÁLISE DE CAMPANHAS (view)
// ========================================

export async function getAnaliseCampanhas() {
  try {
    const { data, error } = await supabase
      .from('analise_campanhas')
      .select('*');

    if (error) {
      logger.error('❌ Erro ao buscar análise campanhas:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}
