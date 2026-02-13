// =====================================================
// API: /api/ads/optimize — Otimização automática (CRON)
// Protegido por CRON_SECRET ou Bearer token
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { optimizeCampaigns } from '@/lib/ads/optimize-campaigns';
import { isMetaConfigured } from '@/lib/ads/meta-client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Autenticação via CRON_SECRET ou Authorization header
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret) {
      const providedSecret =
        authHeader?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('secret');

      if (providedSecret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const result = await optimizeCampaigns();

    return NextResponse.json({
      success: true,
      summary: {
        total: result.totalAds,
        paused: result.paused,
        scaled: result.scaled,
        noAction: result.noAction,
      },
      logs: result.logs,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Erro na otimização:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// GET para consultar status (sem executar)
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ads/optimize',
    method: 'POST',
    description: 'Executa otimização automática de campanhas Meta Ads',
    authentication: 'CRON_SECRET via Bearer token ou query param ?secret=',
    configured: isMetaConfigured(),
  });
}
