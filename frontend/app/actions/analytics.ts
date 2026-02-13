'use server';

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ========================================
// VISITAS - ANALYTICS
// ========================================

export async function getAnalyticsVisits(filters?: {
  startDate?: string;
  endDate?: string;
  utm_source?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('analytics_visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.startDate) query = query.gte('visit_date', filters.startDate);
    if (filters?.endDate) query = query.lte('visit_date', filters.endDate);
    if (filters?.utm_source) query = query.eq('utm_source', filters.utm_source);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar analytics:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// STATS DE ANALYTICS
// ========================================

export async function getAnalyticsStats(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('analytics_visits')
      .select('session_id, page_views, session_duration, utm_source, device_category, page_path, visit_date')
      .gte('visit_date', startStr);

    if (error) return { success: false, data: null, error: error.message };

    const visits = data || [];
    const uniqueSessions = new Set(visits.map((v: any) => v.session_id).filter(Boolean));

    // Agrupar por dia
    const porDia: Record<string, number> = {};
    visits.forEach((v: any) => {
      if (v.visit_date) {
        porDia[v.visit_date] = (porDia[v.visit_date] || 0) + 1;
      }
    });

    // Top fontes
    const fontes: Record<string, number> = {};
    visits.forEach((v: any) => {
      const src = v.utm_source || 'direto';
      fontes[src] = (fontes[src] || 0) + 1;
    });
    const topFontes = Object.entries(fontes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([fonte, count]) => ({ fonte, count }));

    // Top páginas
    const paginas: Record<string, number> = {};
    visits.forEach((v: any) => {
      if (v.page_path) {
        paginas[v.page_path] = (paginas[v.page_path] || 0) + (v.page_views || 1);
      }
    });
    const topPaginas = Object.entries(paginas)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pagina, views]) => ({ pagina, views }));

    // Dispositivos
    const devices: Record<string, number> = {};
    visits.forEach((v: any) => {
      const dev = v.device_category || 'desktop';
      devices[dev] = (devices[dev] || 0) + 1;
    });

    const stats = {
      total_visitas: visits.length,
      sessoes_unicas: uniqueSessions.size,
      page_views: visits.reduce((sum: number, v: any) => sum + (v.page_views || 1), 0),
      duracao_media: visits.length > 0
        ? Math.round(
            visits.reduce((sum: number, v: any) => sum + (v.session_duration || 0), 0) /
              visits.length
          )
        : 0,
      por_dia: porDia,
      top_fontes: topFontes,
      top_paginas: topPaginas,
      dispositivos: devices,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
