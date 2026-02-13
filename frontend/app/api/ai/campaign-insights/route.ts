// =====================================================
// API — /api/ai/campaign-insights
// Camada 2 — AI Campaign Advisor (GET + POST chat)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { analyzeCampaigns, chatAboutCampaigns } from '@/lib/ai-advisor';
import { getMarketingInsights } from '@/lib/meta-marketing';
import type { CampaignData, PerformancePeriod } from '@/lib/types/ai-performance';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'last_7d') as PerformancePeriod;

    const result = await getMarketingInsights(period, 'campaign');

    const campaigns: CampaignData[] = result.campaigns.map(c => ({
      id: c.campaign_id, name: c.campaign_name, status: c.status || 'ACTIVE',
      objective: c.objective, spend: c.spend, impressions: c.impressions,
      clicks: c.clicks, reach: c.reach, purchases: c.purchases,
      purchaseValue: c.purchaseValue, leads: c.leads, roas: c.roas,
      ctr: c.ctr, cpc: c.cpc,
      cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
      frequency: c.reach > 0 ? c.impressions / c.reach : 0,
    }));

    const analysis = await analyzeCampaigns(result.metrics, campaigns, period);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('❌ Campaign Insights Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, period, history } = body;

    if (!question) {
      return NextResponse.json({ success: false, error: 'Pergunta é obrigatória' }, { status: 400 });
    }

    const result = await getMarketingInsights((period || 'last_7d') as 'last_7d', 'campaign');
    const campaigns: CampaignData[] = result.campaigns.map(c => ({
      id: c.campaign_id, name: c.campaign_name, status: c.status || 'ACTIVE',
      objective: c.objective, spend: c.spend, impressions: c.impressions,
      clicks: c.clicks, reach: c.reach, purchases: c.purchases,
      purchaseValue: c.purchaseValue, leads: c.leads, roas: c.roas,
      ctr: c.ctr, cpc: c.cpc,
      cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
      frequency: c.reach > 0 ? c.impressions / c.reach : 0,
    }));

    const response = await chatAboutCampaigns(question, result.metrics, campaigns, history || []);

    return NextResponse.json({ success: true, data: { response } });
  } catch (error) {
    logger.error('❌ Campaign Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar pergunta' },
      { status: 500 }
    );
  }
}
