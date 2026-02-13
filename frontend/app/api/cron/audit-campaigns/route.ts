// =====================================================
// API — /api/cron/audit-campaigns
// Cron Job — Camada 5 (Ads Auditor)
// Vercel Cron: every 30 minutes
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { AdsAuditor } from '@/lib/services/ads-auditor';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s max

async function getCredentials(): Promise<{ accessToken: string; adAccountId: string }> {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';
  let adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID || '';

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('integration_settings')
      .select('setting_value')
      .eq('setting_key', 'meta_ad_account_id')
      .single();
    if (data?.setting_value) adAccountId = data.setting_value;
  } catch { /* fallback to env */ }

  return { accessToken, adAccountId };
}

export async function GET(request: NextRequest) {
  try {
    // Validar cron secret (Vercel envia CRON_SECRET no header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken, adAccountId } = await getCredentials();

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { success: false, error: 'Meta credentials not configured' },
        { status: 400 }
      );
    }

    const auditor = new AdsAuditor(accessToken, adAccountId);
    const result = await auditor.runAudit();

    logger.info(
      `✅ Cron Audit: ${result.campaigns_analyzed} campaigns, ` +
      `${result.recommendations.length} recommendations, ` +
      `${result.alerts_generated} alerts`
    );

    return NextResponse.json({
      success: true,
      data: {
        campaignsAnalyzed: result.campaigns_analyzed,
        recommendationsCount: result.recommendations.length,
        alertsGenerated: result.alerts_generated,
        opportunitiesFound: result.opportunities_found,
        durationMs: result.duration_ms,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('❌ Cron Audit Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro no audit' },
      { status: 500 }
    );
  }
}
