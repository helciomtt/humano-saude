// =====================================================
// API: /api/meta/assets — Listar Assets da conta Meta
// Páginas, pixels, Instagram accounts
// =====================================================

import { NextResponse } from 'next/server';
import { isMetaConfigured, getMetaConfig } from '@/lib/ads/meta-client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const META_API_VERSION = 'v21.0';

export async function GET() {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const config = getMetaConfig();
    const { accessToken, adAccountId } = config;
    const base = `https://graph.facebook.com/${META_API_VERSION}`;

    // Buscar em paralelo: account info, pages, pixels, IG accounts
    const [accountRes, pagesRes, pixelsRes, igRes] = await Promise.all([
      fetch(`${base}/act_${adAccountId}?fields=name,account_status,currency,timezone_name,amount_spent&access_token=${accessToken}`).then((r) => r.json()),
      fetch(`${base}/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`).then((r) => r.json()),
      fetch(`${base}/act_${adAccountId}/adspixels?fields=id,name,last_fired_time&access_token=${accessToken}`).then((r) => r.json()),
      fetch(`${base}/me?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${accessToken}`).then((r) => r.json()).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      account: accountRes.error ? null : accountRes,
      pages: pagesRes.data || [],
      pixels: pixelsRes.data || [],
      instagram: igRes?.instagram_business_account || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar assets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
