// =====================================================
// API: /api/ads/cockpit — Cockpit de Campanhas Meta Ads
// Drill-down completo: métricas, campanhas, funil, alertas
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getMarketingInsights } from '@/lib/meta-marketing';
import { isMetaConfigured, getMetaConfig, getCampaigns } from '@/lib/ads/meta-client';
import { createServiceClient } from '@/lib/supabase';
import type { MetaDatePreset } from '@/lib/ads/types';
import {
  type CockpitCampaign,
  type Platform,
  classifyFunnelStage,
  aggregateConsolidatedMetrics,
  buildFunnelData,
  buildConversionFunnel,
  generateAlerts,
  DEFAULT_BENCHMARKS,
} from '@/lib/consolidator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Cache 3 min
let cockpitCache: { data: unknown; ts: number; period: string } | null = null;
const CACHE_TTL = 3 * 60 * 1000;

// =====================================================
// META GRAPH API — Campaign + AdSet + Ad Insights
// =====================================================

const META_API_VERSION = 'v21.0';

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  spend: string;
  impressions: string;
  clicks: string;
  reach: string;
  ctr: string;
  cpc: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

function extractAction(actions: MetaInsightRow['actions'], type: string): number {
  if (!actions) return 0;
  const a = actions.find(a => a.action_type === type);
  return a ? parseInt(a.value, 10) || 0 : 0;
}

function extractActionValue(values: MetaInsightRow['action_values'], type: string): number {
  if (!values) return 0;
  const a = values.find(a => a.action_type === type);
  return a ? parseFloat(a.value) || 0 : 0;
}

async function fetchMetaInsights(
  adAccountId: string,
  accessToken: string,
  datePreset: string,
  level: 'campaign' | 'adset' | 'ad' = 'campaign'
): Promise<MetaInsightRow[]> {
  const fields = [
    'campaign_id', 'campaign_name', 'objective',
    'spend', 'impressions', 'clicks', 'reach', 'ctr', 'cpc',
    'actions', 'action_values',
    'date_start', 'date_stop',
  ];

  if (level === 'adset') fields.push('adset_id', 'adset_name');
  if (level === 'ad') fields.push('ad_id', 'ad_name');

  const url = `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/insights?fields=${fields.join(',')}&level=${level}&date_preset=${datePreset}&limit=500&access_token=${accessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    logger.error('❌ Meta Insights Error:', data.error?.message);
    return [];
  }

  return data.data || [];
}

// =====================================================
// REVENUE FALLBACK — Supabase sales
// =====================================================

async function getSupabaseRevenue(period: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    const days = period === 'today' ? 0 : period === 'yesterday' ? 1
      : period === 'last_7d' ? 7 : period === 'last_14d' ? 14 : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from('vendas')
      .select('valor_total')
      .gte('created_at', since.toISOString())
      .eq('origem', 'meta_ads');

    return (data || []).reduce((s, v) => s + (v.valor_total || 0), 0);
  } catch {
    return 0;
  }
}

// =====================================================
// TRANSFORM TO CockpitCampaign
// =====================================================

function transformToCockpitCampaigns(
  rows: MetaInsightRow[],
  campaignStatuses: Map<string, string>
): CockpitCampaign[] {
  return rows.map(row => {
    const spend = parseFloat(row.spend) || 0;
    const impressions = parseInt(row.impressions, 10) || 0;
    const clicks = parseInt(row.clicks, 10) || 0;
    const reach = parseInt(row.reach, 10) || 0;

    const purchases = extractAction(row.actions, 'offsite_conversion.fb_pixel_purchase')
      + extractAction(row.actions, 'purchase');
    const purchaseValue = extractActionValue(row.action_values, 'offsite_conversion.fb_pixel_purchase')
      + extractActionValue(row.action_values, 'purchase');
    const leads = extractAction(row.actions, 'offsite_conversion.fb_pixel_lead')
      + extractAction(row.actions, 'lead');
    const linkClicks = extractAction(row.actions, 'link_click');
    const landingPageViews = extractAction(row.actions, 'landing_page_view');
    const initiateCheckout = extractAction(row.actions, 'offsite_conversion.fb_pixel_initiate_checkout')
      + extractAction(row.actions, 'initiate_checkout');
    const addToCart = extractAction(row.actions, 'offsite_conversion.fb_pixel_add_to_cart')
      + extractAction(row.actions, 'add_to_cart');
    const viewContent = extractAction(row.actions, 'offsite_conversion.fb_pixel_view_content')
      + extractAction(row.actions, 'view_content');

    const status = campaignStatuses.get(row.campaign_id) || 'ACTIVE';
    const funnelStage = classifyFunnelStage(row.campaign_name, row.objective);

    return {
      id: row.campaign_id,
      name: row.campaign_name,
      status,
      objective: row.objective || '',
      platform: 'meta' as Platform,
      funnelStage,
      spend,
      impressions,
      clicks,
      reach,
      frequency: reach > 0 ? impressions / reach : 0,
      ctr: parseFloat(row.ctr) || 0,
      cpc: parseFloat(row.cpc) || 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      conversions: purchases,
      revenue: purchaseValue,
      roas: spend > 0 ? purchaseValue / spend : 0,
      cpa: purchases > 0 ? spend / purchases : 0,
      leads,
      cpl: leads > 0 ? spend / leads : 0,
      linkClicks,
      landingPageViews,
      initiateCheckout,
      purchases,
      purchaseValue,
      addToCart,
      viewContent,
      dailyBudget: 0,
      lifetimeBudget: 0,
      startDate: row.date_start || '',
      endDate: row.date_stop || '',
      lastUpdated: new Date().toISOString(),
    };
  });
}

// =====================================================
// MAIN GET HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = (searchParams.get('period') || 'last_7d') as MetaDatePreset;
    const level = (searchParams.get('level') || 'campaign') as 'campaign' | 'adset' | 'ad';

    // Check cache
    const cacheKey = `${period}-${level}`;
    if (cockpitCache && cockpitCache.period === cacheKey && Date.now() - cockpitCache.ts < CACHE_TTL) {
      return NextResponse.json({ success: true, ...(cockpitCache.data as Record<string, unknown>), cached: true });
    }

    // Check Meta configured
    if (!isMetaConfigured()) {
      // Return demo data structure
      return NextResponse.json({
        success: true,
        demo: true,
        period,
        metrics: aggregateConsolidatedMetrics([]),
        campaigns: [],
        funnel: [],
        conversionFunnel: [],
        alerts: [],
        config: { metaConfigured: false },
        timestamp: new Date().toISOString(),
      });
    }

    const config = getMetaConfig();

    // Fetch in parallel: insights + active campaigns + revenue fallback
    const [insightRows, activeCampaignsRaw, fallbackRevenue] = await Promise.all([
      fetchMetaInsights(config.adAccountId, config.accessToken, period, level),
      getCampaigns(config.adAccountId, 'ACTIVE').catch(() => []),
      getSupabaseRevenue(period),
    ]);

    // Build campaign status map
    const statusMap = new Map<string, string>();
    if (Array.isArray(activeCampaignsRaw)) {
      activeCampaignsRaw.forEach((c: { id?: string; status?: string }) => {
        if (c.id) statusMap.set(c.id, c.status || 'ACTIVE');
      });
    }

    // Transform to CockpitCampaign[]
    const campaigns = transformToCockpitCampaigns(insightRows, statusMap);

    // Apply revenue fallback if Meta revenue is 0
    const totalMetaRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    if (totalMetaRevenue === 0 && fallbackRevenue > 0 && campaigns.length > 0) {
      // Distribute proportionally by spend
      const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
      campaigns.forEach(c => {
        const ratio = totalSpend > 0 ? c.spend / totalSpend : 1 / campaigns.length;
        c.revenue = fallbackRevenue * ratio;
        c.purchaseValue = c.revenue;
        c.roas = c.spend > 0 ? c.revenue / c.spend : 0;
      });
    }

    // Aggregate
    const metrics = aggregateConsolidatedMetrics(campaigns);
    const funnel = buildFunnelData(campaigns);
    const conversionFunnel = buildConversionFunnel(campaigns);
    const alerts = generateAlerts(metrics, campaigns, DEFAULT_BENCHMARKS);

    const result = {
      success: true,
      period,
      level,
      metrics,
      campaigns: campaigns.sort((a, b) => b.spend - a.spend),
      funnel,
      conversionFunnel,
      alerts,
      config: {
        metaConfigured: true,
        pixelConfigured: !!config.pixelId,
        pageConfigured: !!config.pageId,
        instagramConfigured: !!config.instagramId,
      },
      timestamp: new Date().toISOString(),
    };

    cockpitCache = { data: result, ts: Date.now(), period: cacheKey };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('❌ Cockpit API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
