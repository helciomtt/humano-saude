// =====================================================
// API: /api/ads/metrics — Métricas de Marketing
// Retorna insights agregados das campanhas Meta
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getMarketingInsights, SUPPORTED_DATE_PRESETS } from '@/lib/meta-marketing';
import { isMetaConfigured } from '@/lib/ads/meta-client';
import type { MetaDatePreset } from '@/lib/ads/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const datePreset = (searchParams.get('period') || 'last_7d') as MetaDatePreset;
    const level = (searchParams.get('level') || 'campaign') as 'campaign' | 'adset' | 'ad';

    // Validar date preset
    const validPresets = SUPPORTED_DATE_PRESETS.map((p) => p.value);
    if (!validPresets.includes(datePreset)) {
      return NextResponse.json(
        { error: `Período inválido. Válidos: ${validPresets.join(', ')}` },
        { status: 400 }
      );
    }

    const { metrics, campaigns } = await getMarketingInsights(datePreset, level);

    return NextResponse.json({
      success: true,
      period: datePreset,
      level,
      metrics,
      campaigns,
      availablePeriods: SUPPORTED_DATE_PRESETS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar métricas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
