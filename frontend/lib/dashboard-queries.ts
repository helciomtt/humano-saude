// =====================================================
// DASHBOARD QUERIES — Blueprint 12
// Queries SQL tipadas para Dashboard Operacional
// Lê de Views, Functions e Tables do Supabase
// =====================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BigNumbersMetrics,
  OperationalHealthData,
  SalesByDayData,
  FunnelData,
  GatewayStats,
  FraudItem,
  RealtimeEvent,
  AnalyticsHealth,
  MarketingAttribution,
  AnalyticsFunnel,
  AnalyticsVisitorsOnline,
} from '@/lib/types/analytics';
import { logger } from '@/lib/logger';

// =====================================================
// CONSTANTES FINANCEIRAS
// =====================================================

const MP_PIX_FEE_PERCENT = 0.70;    // 0,70% do valor
const MP_PIX_FEE_FIXED = 0.25;      // R$0,25 por transação
const TAX_RATE_PERCENT = 12.5;      // 12,5% (IBS+CBS reforma tributária)

// =====================================================
// HELPERS
// =====================================================

function getBrazilDate(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const brazilOffset = -3 * 60;
  const utcOffset = d.getTimezoneOffset();
  const diff = brazilOffset - (-utcOffset);
  return new Date(d.getTime() + diff * 60 * 1000);
}

function startOfDayBrazil(date?: Date): string {
  const d = getBrazilDate(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayBrazil(date?: Date): string {
  const d = getBrazilDate(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function getDateRangeForPeriod(period: string): { startIso: string; endIso: string; label: string } {
  const now = getBrazilDate();
  const start = getBrazilDate();

  switch (period) {
    case 'today':
      return { startIso: startOfDayBrazil(), endIso: endOfDayBrazil(), label: 'Hoje' };
    case 'yesterday': {
      const y = getBrazilDate();
      y.setDate(y.getDate() - 1);
      return { startIso: startOfDayBrazil(y), endIso: endOfDayBrazil(y), label: 'Ontem' };
    }
    case '7d': case 'last_7d':
      start.setDate(now.getDate() - 7);
      return { startIso: start.toISOString(), endIso: now.toISOString(), label: 'Últimos 7 dias' };
    case '14d': case 'last_14d':
      start.setDate(now.getDate() - 14);
      return { startIso: start.toISOString(), endIso: now.toISOString(), label: 'Últimos 14 dias' };
    case '30d': case 'last_30d':
      start.setDate(now.getDate() - 30);
      return { startIso: start.toISOString(), endIso: now.toISOString(), label: 'Últimos 30 dias' };
    case '90d':
      start.setDate(now.getDate() - 90);
      return { startIso: start.toISOString(), endIso: now.toISOString(), label: 'Últimos 90 dias' };
    default:
      start.setDate(now.getDate() - 30);
      return { startIso: start.toISOString(), endIso: now.toISOString(), label: 'Últimos 30 dias' };
  }
}

// =====================================================
// CÁLCULO DE LUCRO LÍQUIDO
// =====================================================

export function calculateNetProfit(revenue: number, salesCount: number) {
  const percentFee = revenue * (MP_PIX_FEE_PERCENT / 100);
  const fixedFee = salesCount * MP_PIX_FEE_FIXED;
  const totalGatewayFees = percentFee + fixedFee;
  const taxableAmount = revenue - totalGatewayFees;
  const taxes = taxableAmount * (TAX_RATE_PERCENT / 100);
  const netProfit = revenue - totalGatewayFees - taxes;

  return {
    revenue,
    gatewayFees: totalGatewayFees,
    percentFee,
    fixedFee,
    taxes,
    netProfit,
    profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
  };
}

// =====================================================
// 1. fetchDashboardMetrics — via RPC get_analytics_period
// =====================================================

export async function fetchDashboardMetrics(
  supabase: SupabaseClient,
  options: { startIso: string; endIso: string }
): Promise<BigNumbersMetrics> {
  try {
    const { data, error } = await supabase.rpc('get_analytics_period', {
      start_date: options.startIso,
      end_date: options.endIso,
    });

    if (!error && data && data.length > 0) {
      const row = data[0];
      // Calculate previous period for deltas
      const durationMs = new Date(options.endIso).getTime() - new Date(options.startIso).getTime();
      const prevEnd = new Date(new Date(options.startIso).getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);

      const { data: prevData } = await supabase.rpc('get_analytics_period', {
        start_date: prevStart.toISOString(),
        end_date: prevEnd.toISOString(),
      });

      const prev = prevData?.[0];
      const revenueChange = prev?.total_revenue > 0
        ? ((row.total_revenue - prev.total_revenue) / prev.total_revenue) * 100 : 0;
      const aovChange = prev?.average_order_value > 0
        ? ((row.average_order_value - prev.average_order_value) / prev.average_order_value) * 100 : 0;
      const visitorsChange = prev?.unique_visitors > 0
        ? ((row.unique_visitors - prev.unique_visitors) / prev.unique_visitors) * 100 : 0;

      return {
        revenue: Number(row.total_revenue) || 0,
        sales: Number(row.total_sales) || 0,
        conversion_rate: Number(row.conversion_rate) || 0,
        average_order_value: Number(row.average_order_value) || 0,
        revenue_change: Math.round(revenueChange * 10) / 10,
        aov_change: Math.round(aovChange * 10) / 10,
        visitors_change: Math.round(visitorsChange * 10) / 10,
        time_change: 0,
        unique_visitors: Number(row.unique_visitors) || 0,
        paid_sales: Number(row.paid_sales) || 0,
        failed_sales: Number(row.failed_sales) || 0,
        pending_sales: Number(row.pending_sales) || 0,
      };
    }
  } catch (err) {
    logger.error('❌ fetchDashboardMetrics RPC error:', err);
  }

  // Fallback: query direta
  try {
    const { count: visitorCount } = await supabase
      .from('analytics_visits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', options.startIso)
      .lte('created_at', options.endIso);

    const { data: sales } = await supabase
      .from('checkout_attempts')
      .select('total_amount, status')
      .gte('created_at', options.startIso)
      .lte('created_at', options.endIso);

    const paidSales = (sales || []).filter(s => ['paid', 'approved', 'completed'].includes(s.status));
    const failedSales = (sales || []).filter(s => ['failed', 'refused', 'canceled'].includes(s.status));
    const pendingSales = (sales || []).filter(s => s.status === 'pending');
    const revenue = paidSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const aov = paidSales.length > 0 ? revenue / paidSales.length : 0;
    const visitors = visitorCount || 0;
    const convRate = visitors > 0 ? (paidSales.length / visitors) * 100 : 0;

    return {
      revenue, sales: paidSales.length, conversion_rate: Math.round(convRate * 100) / 100,
      average_order_value: Math.round(aov * 100) / 100,
      revenue_change: 0, aov_change: 0, visitors_change: 0, time_change: 0,
      unique_visitors: visitors, paid_sales: paidSales.length,
      failed_sales: failedSales.length, pending_sales: pendingSales.length,
    };
  } catch {
    return {
      revenue: 0, sales: 0, conversion_rate: 0, average_order_value: 0,
      revenue_change: 0, aov_change: 0, visitors_change: 0, time_change: 0,
      unique_visitors: 0, paid_sales: 0, failed_sales: 0, pending_sales: 0,
    };
  }
}

// =====================================================
// 2. fetchOperationalHealth
// =====================================================

function normalizeReason(reason: string | null): string {
  if (!reason) return 'Desconhecido';
  const r = reason.toLowerCase();
  if (r.includes('cancel') || r.includes('cancelado')) return 'Cancelado';
  if (r.includes('recusado') || r.includes('refused') || r.includes('rejected')) return 'Recusado';
  if (r.includes('boleto')) return 'Boleto vencido';
  if (r.includes('pix')) return 'Pix expirado';
  if (r.includes('chargeback')) return 'Chargeback';
  if (r.includes('estorn')) return 'Estornado';
  if (r.includes('fraud')) return 'Fraude';
  if (r.includes('timeout') || r.includes('expir')) return 'Expirado';
  return reason.slice(0, 30);
}

export async function fetchOperationalHealth(
  supabase: SupabaseClient,
  options: { startIso: string; endIso: string }
): Promise<OperationalHealthData> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Abandoned carts
  let abandonedCarts = { count: 0, totalValue: 0, last24h: 0 };
  try {
    const { data: carts } = await supabase
      .from('abandoned_carts')
      .select('total_amount, created_at, status')
      .eq('status', 'abandoned')
      .gte('created_at', options.startIso)
      .lte('created_at', options.endIso);

    if (carts) {
      abandonedCarts = {
        count: carts.length,
        totalValue: carts.reduce((s, c) => s + (Number(c.total_amount) || 0), 0),
        last24h: carts.filter(c => c.created_at >= last24h).length,
      };
    }
  } catch { /* empty */ }

  // Failed payments
  let failedPayments = { count: 0, totalValue: 0, reasons: [] as Array<{ reason: string; count: number }> };
  try {
    const { data: failed } = await supabase
      .from('checkout_attempts')
      .select('total_amount, failure_reason, status')
      .in('status', ['failed', 'refused', 'canceled'])
      .gte('created_at', options.startIso)
      .lte('created_at', options.endIso);

    if (failed) {
      const reasonMap: Record<string, number> = {};
      failed.forEach(f => {
        const r = normalizeReason(f.failure_reason);
        reasonMap[r] = (reasonMap[r] || 0) + 1;
      });

      failedPayments = {
        count: failed.length,
        totalValue: failed.reduce((s, f) => s + (Number(f.total_amount) || 0), 0),
        reasons: Object.entries(reasonMap)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };
    }
  } catch { /* empty */ }

  // Chargebacks
  let chargebacks = { count: 0, totalValue: 0 };
  try {
    const { data: cb } = await supabase
      .from('checkout_attempts')
      .select('total_amount')
      .eq('status', 'chargeback')
      .gte('created_at', options.startIso)
      .lte('created_at', options.endIso);

    if (cb) {
      chargebacks = {
        count: cb.length,
        totalValue: cb.reduce((s, c) => s + (Number(c.total_amount) || 0), 0),
      };
    }
  } catch { /* empty */ }

  return { abandonedCarts, failedPayments, chargebacks };
}

// =====================================================
// 3. fetchSalesByDay
// =====================================================

export async function fetchSalesByDay(
  supabase: SupabaseClient,
  startIso: string,
  endIso: string
): Promise<SalesByDayData[]> {
  try {
    const { data } = await supabase
      .from('checkout_attempts')
      .select('total_amount, created_at')
      .in('status', ['paid', 'approved', 'completed'])
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) return [];

    const byDay: Record<string, { revenue: number; sales: number }> = {};
    data.forEach(s => {
      const day = s.created_at?.slice(0, 10) || 'unknown';
      if (!byDay[day]) byDay[day] = { revenue: 0, sales: 0 };
      byDay[day].revenue += Number(s.total_amount) || 0;
      byDay[day].sales += 1;
    });

    return Object.entries(byDay)
      .map(([date, vals]) => ({
        date: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
        revenue: Math.round(vals.revenue * 100) / 100,
        sales: vals.sales,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

// =====================================================
// 4. fetchFunnelData
// =====================================================

export async function fetchFunnelData(supabase: SupabaseClient): Promise<FunnelData> {
  try {
    const { data } = await supabase.from('analytics_funnel').select('*').single();
    if (data) {
      return {
        visitors: data.step_visitors || 0,
        interested: data.step_interested || 0,
        checkoutStarted: data.step_checkout_started || 0,
        purchased: data.step_purchased || 0,
      };
    }
  } catch { /* empty */ }

  return { visitors: 0, interested: 0, checkoutStarted: 0, purchased: 0 };
}

// =====================================================
// 5. fetchAnalyticsHealth — View analytics_health
// =====================================================

export async function fetchAnalyticsHealth(supabase: SupabaseClient): Promise<AnalyticsHealth | null> {
  try {
    const { data, error } = await supabase.from('analytics_health').select('*').single();
    if (error) return null;
    return data as AnalyticsHealth;
  } catch {
    return null;
  }
}

// =====================================================
// 6. fetchMarketingAttribution — View
// =====================================================

export async function fetchMarketingAttribution(supabase: SupabaseClient): Promise<MarketingAttribution[]> {
  try {
    const { data } = await supabase.from('marketing_attribution').select('*').limit(10);
    return (data || []) as MarketingAttribution[];
  } catch {
    return [];
  }
}

// =====================================================
// 7. fetchAnalyticsFunnel — View
// =====================================================

export async function fetchAnalyticsFunnel(supabase: SupabaseClient): Promise<AnalyticsFunnel | null> {
  try {
    const { data } = await supabase.from('analytics_funnel').select('*').single();
    return data as AnalyticsFunnel;
  } catch {
    return null;
  }
}

// =====================================================
// 8. fetchVisitorsOnline — View
// =====================================================

export async function fetchVisitorsOnline(supabase: SupabaseClient): Promise<AnalyticsVisitorsOnline> {
  try {
    const { data } = await supabase.from('analytics_visitors_online').select('*').single();
    if (data) return data as AnalyticsVisitorsOnline;
  } catch { /* empty */ }
  return { online_count: 0, mobile_count: 0, desktop_count: 0, tablet_count: 0 };
}

// =====================================================
// 9. fetchGatewayStats
// =====================================================

export async function fetchGatewayStats(
  supabase: SupabaseClient,
  options: { startIso: string; endIso: string }
): Promise<GatewayStats[]> {
  try {
    const { data } = await supabase
      .from('checkout_attempts')
      .select('gateway, total_amount, status, metadata')
      .gte('created_at', options.startIso)
      .lte('created_at', options.endIso);

    if (!data || data.length === 0) return [];

    const gateways: Record<string, { total: number; approved: number; revenue: number; tickets: number[]; fallback: number }> = {};

    data.forEach(s => {
      const gw = s.gateway || 'unknown';
      if (!gateways[gw]) gateways[gw] = { total: 0, approved: 0, revenue: 0, tickets: [], fallback: 0 };
      gateways[gw].total += 1;
      if (['paid', 'approved', 'completed'].includes(s.status)) {
        gateways[gw].approved += 1;
        gateways[gw].revenue += Number(s.total_amount) || 0;
        gateways[gw].tickets.push(Number(s.total_amount) || 0);
      }
      if (s.metadata && typeof s.metadata === 'object' && 'is_fallback' in s.metadata) {
        gateways[gw].fallback += 1;
      }
    });

    return Object.entries(gateways).map(([gateway, stats]) => ({
      gateway,
      total_sales: stats.total,
      approval_rate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
      avg_ticket: stats.tickets.length > 0
        ? Math.round((stats.tickets.reduce((a, b) => a + b, 0) / stats.tickets.length) * 100) / 100
        : 0,
      total_revenue: Math.round(stats.revenue * 100) / 100,
      fallback_count: stats.fallback,
      rescue_rate: stats.total > 0 ? Math.round((stats.fallback / stats.total) * 100) : 0,
    }));
  } catch {
    return [];
  }
}

// =====================================================
// 10. fetchFraudAnalysis
// =====================================================

export async function fetchFraudAnalysis(supabase: SupabaseClient): Promise<FraudItem[]> {
  try {
    const { data } = await supabase
      .from('checkout_attempts')
      .select('id, customer_name, total_amount, created_at, gateway')
      .eq('status', 'fraud_analysis')
      .order('created_at', { ascending: true })
      .limit(20);

    if (!data) return [];

    return data.map(item => ({
      id: item.id,
      customer_name: item.customer_name || 'N/A',
      total_amount: Number(item.total_amount) || 0,
      created_at: item.created_at,
      hours_in_analysis: Math.round((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60) * 10) / 10,
      gateway: item.gateway || 'unknown',
    }));
  } catch {
    return [];
  }
}

// =====================================================
// 11. fetchRealtimeEvents — Feed de atividade
// =====================================================

export async function fetchRealtimeEvents(supabase: SupabaseClient): Promise<RealtimeEvent[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const events: RealtimeEvent[] = [];

  try {
    // Vendas
    const { data: sales } = await supabase
      .from('checkout_attempts')
      .select('id, customer_name, total_amount, created_at')
      .in('status', ['paid', 'approved', 'completed'])
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);

    (sales || []).forEach(s => {
      events.push({
        id: `sale-${s.id}`,
        type: 'sale',
        title: 'Venda Confirmada',
        detail: s.customer_name || 'Cliente',
        amount: Number(s.total_amount) || 0,
        timestamp: s.created_at,
      });
    });
  } catch { /* empty */ }

  try {
    // Carrinhos abandonados
    const { data: carts } = await supabase
      .from('abandoned_carts')
      .select('id, customer_name, total_amount, created_at')
      .eq('status', 'abandoned')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    (carts || []).forEach(c => {
      events.push({
        id: `cart-${c.id}`,
        type: 'cart_abandoned',
        title: 'Carrinho Abandonado',
        detail: c.customer_name || 'Anônimo',
        amount: Number(c.total_amount) || 0,
        timestamp: c.created_at,
      });
    });
  } catch { /* empty */ }

  try {
    // Pagamentos falhados
    const { data: failed } = await supabase
      .from('checkout_attempts')
      .select('id, customer_name, total_amount, created_at, failure_reason')
      .in('status', ['failed', 'refused', 'canceled'])
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    (failed || []).forEach(f => {
      events.push({
        id: `fail-${f.id}`,
        type: 'payment_failed',
        title: 'Pagamento Falhado',
        detail: normalizeReason(f.failure_reason),
        amount: Number(f.total_amount) || 0,
        timestamp: f.created_at,
      });
    });
  } catch { /* empty */ }

  try {
    // Visitas recentes
    const { data: visits } = await supabase
      .from('analytics_visits')
      .select('id, page_path, city, device_type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    (visits || []).forEach(v => {
      events.push({
        id: `visit-${v.id}`,
        type: 'visit',
        title: 'Visita',
        detail: `${v.page_path || '/'} • ${v.city || 'Desconhecido'}`,
        timestamp: v.created_at,
      });
    });
  } catch { /* empty */ }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}

// =====================================================
// 12. fetchActionCenterRecommendations
// =====================================================

export async function fetchActionCenterRecommendations(supabase: SupabaseClient) {
  try {
    const { data } = await supabase
      .from('ads_recommendations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  } catch {
    return [];
  }
}
