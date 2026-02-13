// =====================================================
// API — /api/admin/analytics
// Views SQL: health, attribution, funnel
// =====================================================

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  fetchAnalyticsHealth,
  fetchMarketingAttribution,
  fetchAnalyticsFunnel,
} from '@/lib/dashboard-queries';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [health, attribution, funnel] = await Promise.all([
      fetchAnalyticsHealth(supabase),
      fetchMarketingAttribution(supabase),
      fetchAnalyticsFunnel(supabase),
    ]);

    return NextResponse.json({
      success: true,
      data: { health, attribution, funnel },
    });
  } catch (error) {
    logger.error('❌ Admin Analytics Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
