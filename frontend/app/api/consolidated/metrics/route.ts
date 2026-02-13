// =====================================================
// API: /api/consolidated/metrics — Dashboard Consolidado
// Métricas multi-plataforma: Meta + Google + GA4
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getMarketingInsights } from '@/lib/meta-marketing';
import { isMetaConfigured, getMetaConfig, getCampaigns } from '@/lib/ads/meta-client';
import { createServiceClient } from '@/lib/supabase';
import type { MetaDatePreset } from '@/lib/ads/types';
import {
  type CockpitCampaign,
  type Platform,
  type ComparisonDataPoint,
  classifyFunnelStage,
  aggregateConsolidatedMetrics,
  buildFunnelData,
  buildConversionFunnel,
  generateAlerts,
  DEFAULT_BENCHMARKS,
} from '@/lib/consolidator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Cache 5 min
let metricsCache: { data: unknown; ts: number; key: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// =====================================================
// META DATA FETCHER
// =====================================================

async function fetchMetaCampaigns(period: MetaDatePreset): Promise<CockpitCampaign[]> {
  if (!isMetaConfigured()) return [];

  try {
    const [insightsResult, activeCampaignsRaw] = await Promise.all([
      getMarketingInsights(period, 'campaign'),
      getCampaigns(getMetaConfig().adAccountId, 'ACTIVE').catch(() => []),
    ]);

    const statusMap = new Map<string, string>();
    if (Array.isArray(activeCampaignsRaw)) {
      activeCampaignsRaw.forEach((c: { id?: string; status?: string }) => {
        if (c.id) statusMap.set(c.id, c.status || 'ACTIVE');
      });
    }

    return insightsResult.campaigns.map(c => {
      const funnelStage = classifyFunnelStage(c.campaign_name, c.objective);
      const status = statusMap.get(c.campaign_id) || 'ACTIVE';

      return {
        id: c.campaign_id,
        name: c.campaign_name,
        status,
        objective: c.objective || '',
        platform: 'meta' as Platform,
        funnelStage,
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        reach: c.reach,
        frequency: c.reach > 0 ? c.impressions / c.reach : 0,
        ctr: c.ctr,
        cpc: c.cpc,
        cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
        conversions: c.purchases,
        revenue: c.purchaseValue,
        roas: c.roas,
        cpa: c.purchases > 0 ? c.spend / c.purchases : 0,
        leads: c.leads,
        cpl: c.leads > 0 ? c.spend / c.leads : 0,
        linkClicks: 0,
        landingPageViews: 0,
        initiateCheckout: 0,
        purchases: c.purchases,
        purchaseValue: c.purchaseValue,
        addToCart: 0,
        viewContent: 0,
        dailyBudget: 0,
        lifetimeBudget: 0,
        startDate: '',
        endDate: '',
        lastUpdated: new Date().toISOString(),
      };
    });
  } catch (error) {
    logger.error('❌ Meta fetch error:', error);
    return [];
  }
}

// =====================================================
// GOOGLE ADS DATA (placeholder — requires oauth)
// =====================================================

async function fetchGoogleAdsCampaigns(): Promise<CockpitCampaign[]> {
  // Google Ads integration placeholder
  // Will be activated when OAuth connect page is used
  return [];
}

// =====================================================
// GA4 SESSION DATA
// =====================================================

async function fetchGA4Sessions(period: string): Promise<{ users: number; sessions: number; bounceRate: number }> {
  try {
    const supabase = createServiceClient();
    const days = period === 'today' ? 0 : period === 'yesterday' ? 1
      : period === 'last_7d' || period === '7d' ? 7
      : period === 'last_14d' || period === '14d' ? 14 : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, count } = await supabase
      .from('analytics_visits')
      .select('*', { count: 'exact' })
      .gte('created_at', since.toISOString());

    const visits = data || [];
    const uniqueUsers = new Set(visits.map(v => v.visitor_id || v.ip)).size;

    return {
      users: uniqueUsers,
      sessions: count || visits.length,
      bounceRate: visits.length > 0
        ? (visits.filter(v => v.pages_viewed === 1).length / visits.length) * 100
        : 0,
    };
  } catch {
    return { users: 0, sessions: 0, bounceRate: 0 };
  }
}

// =====================================================
// SUPABASE REVENUE
// =====================================================

async function getRevenueFromSupabase(days: number): Promise<{ revenue: number; sales: number }> {
  try {
    const supabase = createServiceClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from('vendas')
      .select('valor_total')
      .gte('created_at', since.toISOString());

    const items = data || [];
    return {
      revenue: items.reduce((s, v) => s + (v.valor_total || 0), 0),
      sales: items.length,
    };
  } catch {
    return { revenue: 0, sales: 0 };
  }
}

// =====================================================
// COMPARISON DATA — daily aggregation
// =====================================================

function buildComparisonData(campaigns: CockpitCampaign[]): ComparisonDataPoint[] {
  // Group by start date if available, otherwise return empty
  const byDate = new Map<string, ComparisonDataPoint>();

  campaigns.forEach(c => {
    const date = c.startDate || new Date().toISOString().split('T')[0];
    const existing = byDate.get(date) || {
      date,
      spend: 0,
      revenue: 0,
      conversions: 0,
      roas: 0,
      clicks: 0,
      impressions: 0,
    };

    existing.spend += c.spend;
    existing.revenue += c.revenue;
    existing.conversions += c.conversions;
    existing.clicks += c.clicks;
    existing.impressions += c.impressions;
    existing.roas = existing.spend > 0 ? existing.revenue / existing.spend : 0;

    byDate.set(date, existing);
  });

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// =====================================================
// PERIOD TO DAYS
// =====================================================

function periodToDays(period: string): number {
  const map: Record<string, number> = {
    today: 0, yesterday: 1,
    last_7d: 7, '7d': 7,
    last_14d: 14, '14d': 14,
    last_30d: 30, '30d': 30,
    this_month: 30,
  };
  return map[period] ?? 30;
}

// =====================================================
// MAIN HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = searchParams.get('period') || 'last_7d';
    const platforms = (searchParams.get('platforms') || 'meta').split(',') as Platform[];

    // Cache check
    const cacheKey = `${period}-${platforms.join(',')}`;
    if (metricsCache && metricsCache.key === cacheKey && Date.now() - metricsCache.ts < CACHE_TTL) {
      return NextResponse.json({ success: true, ...(metricsCache.data as Record<string, unknown>), cached: true });
    }

    const metaPeriod = (['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month'].includes(period)
      ? period
      : period === '7d' ? 'last_7d' : period === '14d' ? 'last_14d' : period === '30d' ? 'last_30d' : 'last_7d'
    ) as MetaDatePreset;

    const days = periodToDays(period);

    // Fetch all sources in parallel
    const [metaCampaigns, googleCampaigns, ga4Data, supabaseRevenue] = await Promise.all([
      platforms.includes('meta') ? fetchMetaCampaigns(metaPeriod) : Promise.resolve([]),
      platforms.includes('google') ? fetchGoogleAdsCampaigns() : Promise.resolve([]),
      fetchGA4Sessions(period),
      getRevenueFromSupabase(days),
    ]);

    // Merge all campaigns
    const allCampaigns: CockpitCampaign[] = [...metaCampaigns, ...googleCampaigns];

    // Revenue fallback
    const totalAdRevenue = allCampaigns.reduce((s, c) => s + c.revenue, 0);
    if (totalAdRevenue === 0 && supabaseRevenue.revenue > 0 && allCampaigns.length > 0) {
      const totalSpend = allCampaigns.reduce((s, c) => s + c.spend, 0);
      allCampaigns.forEach(c => {
        const ratio = totalSpend > 0 ? c.spend / totalSpend : 1 / allCampaigns.length;
        c.revenue = supabaseRevenue.revenue * ratio;
        c.purchaseValue = c.revenue;
        c.roas = c.spend > 0 ? c.revenue / c.spend : 0;
      });
    }

    const metrics = aggregateConsolidatedMetrics(allCampaigns);
    const funnel = buildFunnelData(allCampaigns);
    const conversionFunnel = buildConversionFunnel(allCampaigns);
    const alerts = generateAlerts(metrics, allCampaigns, DEFAULT_BENCHMARKS);
    const comparison = buildComparisonData(allCampaigns);

    const result = {
      success: true,
      period,
      platforms,
      metrics,
      campaigns: allCampaigns.sort((a, b) => b.spend - a.spend),
      funnel,
      conversionFunnel,
      alerts,
      comparison,
      traffic: ga4Data,
      revenue: supabaseRevenue,
      integrations: {
        meta: isMetaConfigured(),
        google: false,
        ga4: ga4Data.sessions > 0,
      },
      timestamp: new Date().toISOString(),
    };

    metricsCache = { data: result, ts: Date.now(), key: cacheKey };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('❌ Consolidated Metrics Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
