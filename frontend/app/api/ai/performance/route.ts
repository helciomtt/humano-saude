// =====================================================
// API — /api/ai/performance
// Motor principal de IA — GET (análise) + POST (chat)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { runFullAIAnalysis, runQuickAnalysis, runLocalAnalysis, chatWithAI } from '@/lib/ai-performance-engine';
import { getMarketingInsights } from '@/lib/meta-marketing';
import { getGatewaySales } from '@/lib/analytics-hub/internal/data-connector';
import type { PerformanceData, CampaignData, PerformancePeriod } from '@/lib/types/ai-performance';
import { logger } from '@/lib/logger';

// Cache em memória (10 min)
const analysisCache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getDateRange(period: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case 'today': break;
    case 'yesterday': start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); break;
    case 'last_7d': start.setDate(start.getDate() - 7); break;
    case 'last_14d': start.setDate(start.getDate() - 14); break;
    case 'last_30d': start.setDate(start.getDate() - 30); break;
    default: start.setDate(start.getDate() - 7);
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'last_7d') as PerformancePeriod;
    const type = searchParams.get('type') || 'local';
    const refresh = searchParams.get('refresh') === 'true';

    const cacheKey = `perf-${period}-${type}`;
    if (!refresh) {
      const cached = analysisCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return NextResponse.json({ success: true, data: cached.data, cached: true });
      }
    }

    // Buscar dados da Meta Ads em 3 níveis
    const [campaignResult, adSetResult, adResult] = await Promise.all([
      getMarketingInsights(period, 'campaign'),
      getMarketingInsights(period, 'adset'),
      getMarketingInsights(period, 'ad'),
    ]);

    // Buscar vendas reais
    const { start, end } = getDateRange(period);
    const salesData = await getGatewaySales(start, end);

    // Montar PerformanceData
    const perfData: PerformanceData = {
      campaigns: campaignResult.campaigns.map((c): CampaignData => ({
        id: c.campaign_id,
        name: c.campaign_name,
        status: c.status || 'ACTIVE',
        objective: c.objective,
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        reach: c.reach,
        purchases: c.purchases,
        purchaseValue: c.purchaseValue,
        leads: c.leads,
        roas: c.roas,
        ctr: c.ctr,
        cpc: c.cpc,
        cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
        frequency: c.reach > 0 ? c.impressions / c.reach : 0,
      })),
      adSets: adSetResult.campaigns.map(a => ({
        id: a.campaign_id,
        name: a.campaign_name,
        campaignId: a.campaign_id,
        status: a.status || 'ACTIVE',
        spend: a.spend,
        impressions: a.impressions,
        clicks: a.clicks,
        reach: a.reach,
        purchases: a.purchases,
        purchaseValue: a.purchaseValue,
        roas: a.roas,
        ctr: a.ctr,
        cpc: a.cpc,
        cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
        frequency: a.reach > 0 ? a.impressions / a.reach : 0,
      })),
      ads: adResult.campaigns.map(a => ({
        id: a.campaign_id,
        name: a.campaign_name,
        adSetId: '',
        campaignId: a.campaign_id,
        status: a.status || 'ACTIVE',
        spend: a.spend,
        impressions: a.impressions,
        clicks: a.clicks,
        purchases: a.purchases,
        purchaseValue: a.purchaseValue,
        roas: a.roas,
        ctr: a.ctr,
        cpc: a.cpc,
        cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
      })),
      realSales: {
        totalRevenue: salesData.totalRevenue,
        totalSales: salesData.totalSales,
        avgTicket: salesData.avgTicket,
        period,
      },
      period,
      startDate: start,
      endDate: end,
    };

    let result;

    switch (type) {
      case 'full':
        result = await runFullAIAnalysis(perfData);
        break;
      case 'quick':
        result = await runQuickAnalysis(perfData);
        break;
      case 'local':
      default:
        result = runLocalAnalysis(perfData);
        break;
    }

    // Salvar em cache
    analysisCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ AI Performance Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, period, includeContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    let context: PerformanceData | undefined;

    if (includeContext) {
      const campaignResult = await getMarketingInsights((period || 'last_7d') as 'last_7d', 'campaign');
      const { start, end } = getDateRange(period || 'last_7d');
      const salesData = await getGatewaySales(start, end);

      context = {
        campaigns: campaignResult.campaigns.map((c): CampaignData => ({
          id: c.campaign_id, name: c.campaign_name, status: c.status || 'ACTIVE',
          objective: c.objective, spend: c.spend, impressions: c.impressions,
          clicks: c.clicks, reach: c.reach, purchases: c.purchases,
          purchaseValue: c.purchaseValue, leads: c.leads, roas: c.roas,
          ctr: c.ctr, cpc: c.cpc, cpm: 0, frequency: 0,
        })),
        adSets: [],
        ads: [],
        realSales: { totalRevenue: salesData.totalRevenue, totalSales: salesData.totalSales, avgTicket: salesData.avgTicket, period: period || 'last_7d' },
        period: period || 'last_7d',
        startDate: start,
        endDate: end,
      };
    }

    const response = await chatWithAI(message, context);

    return NextResponse.json({ success: true, data: { response } });
  } catch (error) {
    logger.error('❌ AI Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
