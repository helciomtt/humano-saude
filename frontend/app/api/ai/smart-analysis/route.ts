// =====================================================
// API — /api/ai/smart-analysis
// Camada 3 — Análise sem IA (100% regras locais)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateFullAnalysis } from '@/lib/smart-analyzer';
import { getMarketingInsights } from '@/lib/meta-marketing';
import { getGatewaySales } from '@/lib/analytics-hub/internal/data-connector';
import type { CampaignData, AdSetData, AdData, PerformancePeriod } from '@/lib/types/ai-performance';
import { logger } from '@/lib/logger';

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'last_7d') as PerformancePeriod;
    const refresh = searchParams.get('refresh') === 'true';

    const cacheKey = `smart-${period}`;
    if (!refresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return NextResponse.json({ success: true, data: cached.data, cached: true });
      }
    }

    const [campaignResult, adSetResult, adResult] = await Promise.all([
      getMarketingInsights(period, 'campaign'),
      getMarketingInsights(period, 'adset'),
      getMarketingInsights(period, 'ad'),
    ]);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (period === 'today' ? 0 : period === 'last_7d' ? 7 : 30));

    const salesData = await getGatewaySales(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );

    const campaigns: CampaignData[] = campaignResult.campaigns.map(c => ({
      id: c.campaign_id, name: c.campaign_name, status: c.status || 'ACTIVE',
      objective: c.objective, spend: c.spend, impressions: c.impressions,
      clicks: c.clicks, reach: c.reach, purchases: c.purchases,
      purchaseValue: c.purchaseValue, leads: c.leads, roas: c.roas,
      ctr: c.ctr, cpc: c.cpc,
      cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
      frequency: c.reach > 0 ? c.impressions / c.reach : 0,
    }));

    const adSets: AdSetData[] = adSetResult.campaigns.map(a => ({
      id: a.campaign_id, name: a.campaign_name, campaignId: a.campaign_id,
      status: a.status || 'ACTIVE', spend: a.spend, impressions: a.impressions,
      clicks: a.clicks, reach: a.reach, purchases: a.purchases,
      purchaseValue: a.purchaseValue, roas: a.roas, ctr: a.ctr, cpc: a.cpc,
      cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
      frequency: a.reach > 0 ? a.impressions / a.reach : 0,
    }));

    const ads: AdData[] = adResult.campaigns.map(a => ({
      id: a.campaign_id, name: a.campaign_name, adSetId: '', campaignId: a.campaign_id,
      status: a.status || 'ACTIVE', spend: a.spend, impressions: a.impressions,
      clicks: a.clicks, purchases: a.purchases, purchaseValue: a.purchaseValue,
      roas: a.roas, ctr: a.ctr, cpc: a.cpc,
      cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
    }));

    const analysis = generateFullAnalysis(
      campaignResult.metrics,
      campaigns,
      adSets,
      ads,
      salesData.totalRevenue > 0 ? salesData : undefined
    );

    cache.set(cacheKey, { data: analysis, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('❌ Smart Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
