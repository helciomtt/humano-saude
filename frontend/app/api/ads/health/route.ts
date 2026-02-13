// =====================================================
// API: /api/ads/health — Health Check Meta Ads
// Verifica conexão com Facebook Marketing API
// =====================================================

import { NextResponse } from 'next/server';
import { isMetaConfigured, getMetaConfig } from '@/lib/ads/meta-client';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  meta: {
    configured: boolean;
    connected: boolean;
    adAccountId: string | null;
    pageId: string | null;
    pixelConfigured: boolean;
    error?: string;
  };
  environment: {
    accessToken: boolean;
    adAccountId: boolean;
    pageId: boolean;
    pixelId: boolean;
    pageAccessToken: boolean;
    openaiKey: boolean;
  };
  timestamp: string;
}

export async function GET() {
  try {
    const envCheck = {
      accessToken: !!(process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN),
      adAccountId: !!(process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID),
      pageId: !!(process.env.META_PAGE_ID || process.env.FACEBOOK_PAGE_ID),
      pixelId: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
      pageAccessToken: !!process.env.META_PAGE_ACCESS_TOKEN,
      openaiKey: !!process.env.OPENAI_API_KEY,
    };

    const configured = isMetaConfigured();
    let connected = false;
    let adAccountName: string | null = null;
    let connectionError: string | undefined;

    if (configured) {
      try {
        const config = getMetaConfig();
        // Testar conexão real com API
        const res = await fetch(
          `https://graph.facebook.com/v21.0/act_${config.adAccountId}?fields=name,account_status&access_token=${config.accessToken}`
        );
        const data = await res.json();

        if (res.ok && !data.error) {
          connected = true;
          adAccountName = data.name || null;
        } else {
          connectionError = data.error?.message || 'Conexão falhou';
        }
      } catch (err) {
        connectionError = err instanceof Error ? err.message : 'Erro de rede';
      }
    }

    const config = configured ? getMetaConfig() : null;

    const health: HealthStatus = {
      status: connected ? 'ok' : configured ? 'degraded' : 'error',
      meta: {
        configured,
        connected,
        adAccountId: adAccountName
          ? `act_${config?.adAccountId} (${adAccountName})`
          : config?.adAccountId
            ? `act_${config.adAccountId}`
            : null,
        pageId: config?.pageId || null,
        pixelConfigured: envCheck.pixelId,
        ...(connectionError && { error: connectionError }),
      },
      environment: envCheck,
      timestamp: new Date().toISOString(),
    };

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        meta: {
          configured: false,
          connected: false,
          adAccountId: null,
          pageId: null,
          pixelConfigured: false,
          error: error instanceof Error ? error.message : 'Erro interno',
        },
        environment: {
          accessToken: false,
          adAccountId: false,
          pageId: false,
          pixelId: false,
          pageAccessToken: false,
          openaiKey: false,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
