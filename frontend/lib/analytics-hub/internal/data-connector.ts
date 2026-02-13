// =====================================================
// INTERNAL DATA CONNECTOR — Wrapper para SQL/Supabase
// Busca vendas, funil, resumo via RPC functions
// =====================================================

import { createServiceClient } from '@/lib/supabase';

// =====================================================
// TIPOS
// =====================================================

export interface GatewaySalesData {
  totalRevenue: number;
  totalSales: number;
  avgTicket: number;
  byDay: Array<{ date: string; revenue: number; sales: number }>;
}

export interface CheckoutFunnelData {
  pageViews: number;
  addToCart: number;
  checkoutInitiated: number;
  purchases: number;
  dropRates: {
    viewToCart: number;
    cartToCheckout: number;
    checkoutToPurchase: number;
  };
}

// =====================================================
// FUNÇÕES EXPORTADAS
// =====================================================

/**
 * Busca vendas do gateway via RPC ou query direta
 */
export async function getGatewaySales(
  startDate: string,
  endDate: string,
  status: string = 'approved'
): Promise<GatewaySalesData> {
  const supabase = createServiceClient();

  try {
    // Tenta via RPC primeiro
    const { data, error } = await supabase.rpc('get_gateway_sales', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_status: status,
    });

    if (!error && data) {
      return {
        totalRevenue: data.total_revenue ?? 0,
        totalSales: data.total_sales ?? 0,
        avgTicket: data.avg_ticket ?? 0,
        byDay: data.by_day ?? [],
      };
    }
  } catch { /* fallback */ }

  // Fallback: query direta na tabela de propostas/vendas
  try {
    const { data: vendas } = await supabase
      .from('propostas')
      .select('valor_total, created_at')
      .eq('status', 'aprovada')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (vendas && vendas.length > 0) {
      const totalRevenue = vendas.reduce((s: number, v: Record<string, number>) => s + (v.valor_total || 0), 0);
      return {
        totalRevenue,
        totalSales: vendas.length,
        avgTicket: totalRevenue / vendas.length,
        byDay: [],
      };
    }
  } catch { /* empty */ }

  return { totalRevenue: 0, totalSales: 0, avgTicket: 0, byDay: [] };
}

/**
 * Busca funil de checkout
 */
export async function getCheckoutFunnel(
  startDate: string,
  endDate: string
): Promise<CheckoutFunnelData> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc('get_checkout_funnel', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (!error && data) {
      const pv = data.page_views ?? 0;
      const atc = data.add_to_cart ?? 0;
      const ci = data.checkout_initiated ?? 0;
      const p = data.purchases ?? 0;

      return {
        pageViews: pv,
        addToCart: atc,
        checkoutInitiated: ci,
        purchases: p,
        dropRates: {
          viewToCart: pv > 0 ? ((pv - atc) / pv) * 100 : 0,
          cartToCheckout: atc > 0 ? ((atc - ci) / atc) * 100 : 0,
          checkoutToPurchase: ci > 0 ? ((ci - p) / ci) * 100 : 0,
        },
      };
    }
  } catch { /* empty */ }

  return {
    pageViews: 0,
    addToCart: 0,
    checkoutInitiated: 0,
    purchases: 0,
    dropRates: { viewToCart: 0, cartToCheckout: 0, checkoutToPurchase: 0 },
  };
}

/**
 * Busca resumo de analytics interno
 */
export async function getAnalyticsSummary(
  startDate: string,
  endDate: string
): Promise<{ totalVisits: number; uniqueSessions: number; avgDuration: number }> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc('get_analytics_summary', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (!error && data) {
      return {
        totalVisits: data.total_visits ?? 0,
        uniqueSessions: data.unique_sessions ?? 0,
        avgDuration: data.avg_duration ?? 0,
      };
    }
  } catch { /* empty */ }

  // Fallback: query direta
  try {
    const { count } = await supabase
      .from('analytics_visits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return {
      totalVisits: count ?? 0,
      uniqueSessions: 0,
      avgDuration: 0,
    };
  } catch {
    return { totalVisits: 0, uniqueSessions: 0, avgDuration: 0 };
  }
}

/**
 * Health check — verifica se as funções RPC existem
 */
export async function checkInternalFunctionsHealth(): Promise<{
  gatewaySales: boolean;
  checkoutFunnel: boolean;
  analyticsSummary: boolean;
}> {
  const supabase = createServiceClient();
  const results = { gatewaySales: false, checkoutFunnel: false, analyticsSummary: false };

  const today = new Date().toISOString().split('T')[0];

  try {
    const { error: e1 } = await supabase.rpc('get_gateway_sales', { p_start_date: today, p_end_date: today });
    results.gatewaySales = !e1;
  } catch { /* false */ }

  try {
    const { error: e2 } = await supabase.rpc('get_checkout_funnel', { p_start_date: today, p_end_date: today });
    results.checkoutFunnel = !e2;
  } catch { /* false */ }

  try {
    const { error: e3 } = await supabase.rpc('get_analytics_summary', { p_start_date: today, p_end_date: today });
    results.analyticsSummary = !e3;
  } catch { /* false */ }

  return results;
}
