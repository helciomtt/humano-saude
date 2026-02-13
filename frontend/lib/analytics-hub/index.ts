// =====================================================
// ANALYTICS HUB — Centro Unificado de Métricas
// ÚNICO ponto de entrada para dados do Dashboard
// Combina: SQL + GA4 + Meta Ads → KPIs derivados
// =====================================================

import type { UnifiedDashboardData } from '@/lib/types/ai-performance';
import { getGatewaySales, getCheckoutFunnel } from './internal/data-connector';
import { fetchGA4TrafficData, fetchGA4Sources, fetchGA4Realtime, isGA4Configured } from './external/ga4-connector';
import { getMarketingInsights } from '@/lib/meta-marketing';

// =====================================================
// HELPERS
// =====================================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateRange(period: string): { startDate: string; endDate: string; label: string } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      return { startDate: formatDate(start), endDate: formatDate(end), label: 'Hoje' };
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      return { startDate: formatDate(start), endDate: formatDate(start), label: 'Ontem' };
    case 'last_7d':
      start.setDate(start.getDate() - 7);
      return { startDate: formatDate(start), endDate: formatDate(end), label: 'Últimos 7 dias' };
    case 'last_14d':
      start.setDate(start.getDate() - 14);
      return { startDate: formatDate(start), endDate: formatDate(end), label: 'Últimos 14 dias' };
    case 'last_30d':
    default:
      start.setDate(start.getDate() - 30);
      return { startDate: formatDate(start), endDate: formatDate(end), label: 'Últimos 30 dias' };
  }
}

// =====================================================
// FUNÇÃO PRINCIPAL — getUnifiedDashboardData()
// =====================================================

export async function getUnifiedDashboardData(
  period: string = 'last_7d'
): Promise<UnifiedDashboardData> {
  const { startDate, endDate, label } = getDateRange(period);

  // Buscar tudo em paralelo
  const [financialData, funnelData, ga4Traffic, ga4Sources, ga4Realtime, metaResult] = await Promise.allSettled([
    getGatewaySales(startDate, endDate),
    getCheckoutFunnel(startDate, endDate),
    isGA4Configured() ? fetchGA4TrafficData(startDate, endDate) : Promise.resolve(null),
    isGA4Configured() ? fetchGA4Sources(startDate, endDate) : Promise.resolve([]),
    isGA4Configured() ? fetchGA4Realtime() : Promise.resolve(null),
    getMarketingInsights(period as 'last_7d'),
  ]);

  // Extract results with fallbacks
  const financial = financialData.status === 'fulfilled' ? financialData.value : { totalRevenue: 0, totalSales: 0, avgTicket: 0, byDay: [] };
  const funnel = funnelData.status === 'fulfilled' ? funnelData.value : { pageViews: 0, addToCart: 0, checkoutInitiated: 0, purchases: 0, dropRates: { viewToCart: 0, cartToCheckout: 0, checkoutToPurchase: 0 } };
  const traffic = ga4Traffic.status === 'fulfilled' ? ga4Traffic.value : null;
  const sources = ga4Sources.status === 'fulfilled' ? ga4Sources.value : [];
  const realtime = ga4Realtime.status === 'fulfilled' ? ga4Realtime.value : null;
  const meta = metaResult.status === 'fulfilled' ? metaResult.value : { metrics: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalReach: 0, totalPurchases: 0, totalPurchaseValue: 0, totalLeads: 0, roas: 0, cpa: 0, cpl: 0, avgCpc: 0, avgCtr: 0, avgCpm: 0 }, campaigns: [] };

  // KPIs derivados (cross-source)
  const metaSpend = meta.metrics.totalSpend;
  const gatewayRevenue = financial.totalRevenue;
  const gatewaySales = financial.totalSales;
  const ga4Users = traffic?.totalUsers ?? 0;

  const roasReal = metaSpend > 0 ? gatewayRevenue / metaSpend : 0;
  const cpaReal = gatewaySales > 0 ? metaSpend / gatewaySales : 0;
  const conversaoReal = ga4Users > 0 ? (gatewaySales / ga4Users) * 100 : 0;

  return {
    period: { startDate, endDate, label },
    financial: {
      totalRevenue: financial.totalRevenue,
      totalSales: financial.totalSales,
      avgTicket: financial.avgTicket,
      revenueByDay: financial.byDay,
    },
    traffic: {
      totalUsers: traffic?.totalUsers ?? 0,
      totalSessions: traffic?.totalSessions ?? 0,
      totalPageViews: traffic?.totalPageViews ?? 0,
      avgSessionDuration: traffic?.avgSessionDuration ?? 0,
      bounceRate: traffic?.bounceRate ?? 0,
      sources: sources ?? [],
    },
    investment: {
      totalSpend: metaSpend,
      totalImpressions: meta.metrics.totalImpressions,
      totalClicks: meta.metrics.totalClicks,
      totalReach: meta.metrics.totalReach,
      activeCampaigns: meta.campaigns.length,
    },
    funnel: {
      pageViews: funnel.pageViews,
      addToCart: funnel.addToCart,
      checkoutInitiated: funnel.checkoutInitiated,
      purchases: funnel.purchases,
      dropRates: funnel.dropRates,
    },
    kpis: {
      roasReal,
      cpaReal,
      conversaoReal,
      ltv: financial.avgTicket * 12, // LTV = ticket * 12 meses (plano de saúde)
    },
    realtime: realtime ? {
      activeUsers: realtime.activeUsers,
      topPages: realtime.topPages,
    } : null,
    integrations: {
      ga4: isGA4Configured() && traffic !== null,
      meta: metaSpend > 0 || meta.campaigns.length > 0,
      gateway: financial.totalSales > 0,
    },
  };
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

export async function getTodayDashboard(): Promise<UnifiedDashboardData> {
  return getUnifiedDashboardData('today');
}

export async function getLast7DaysDashboard(): Promise<UnifiedDashboardData> {
  return getUnifiedDashboardData('last_7d');
}

export async function getLast30DaysDashboard(): Promise<UnifiedDashboardData> {
  return getUnifiedDashboardData('last_30d');
}

export async function getRealtimeMetrics(): Promise<UnifiedDashboardData['realtime']> {
  return fetchGA4Realtime();
}
