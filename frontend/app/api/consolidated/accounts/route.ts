// =====================================================
// API: /api/consolidated/accounts — Connected Accounts
// Gerenciamento de contas conectadas (Meta, Google, GA4)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isMetaConfigured, getMetaConfig } from '@/lib/ads/meta-client';
import type { PlatformAccount } from '@/lib/consolidator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// =====================================================
// GET — List connected accounts
// =====================================================

export async function GET() {
  try {
    const accounts: PlatformAccount[] = [];

    // 1. Meta Ads
    const metaConfigured = isMetaConfigured();
    if (metaConfigured) {
      const config = getMetaConfig();
      accounts.push({
        id: 'meta-ads',
        platform: 'meta',
        name: 'Meta Ads (Facebook & Instagram)',
        accountId: config.adAccountId ? `act_${config.adAccountId}` : '—',
        isConnected: true,
        lastSync: new Date().toISOString(),
        status: 'active',
      });
    } else {
      accounts.push({
        id: 'meta-ads',
        platform: 'meta',
        name: 'Meta Ads (Facebook & Instagram)',
        accountId: '',
        isConnected: false,
        lastSync: '',
        status: 'expired',
      });
    }

    // 2. Google Ads (check env)
    const googleConfigured = !!(process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_REFRESH_TOKEN);
    accounts.push({
      id: 'google-ads',
      platform: 'google',
      name: 'Google Ads',
      accountId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
      isConnected: googleConfigured,
      lastSync: googleConfigured ? new Date().toISOString() : '',
      status: googleConfigured ? 'active' : 'expired',
    });

    // 3. GA4 (check env or Supabase settings)
    let ga4Connected = false;
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('integration_settings')
        .select('ga4_property_id')
        .eq('is_default', true)
        .limit(1)
        .single();

      ga4Connected = !!(data?.ga4_property_id || process.env.GA4_PROPERTY_ID);
    } catch {
      ga4Connected = !!process.env.GA4_PROPERTY_ID;
    }

    accounts.push({
      id: 'ga4',
      platform: 'ga4',
      name: 'Google Analytics 4',
      accountId: process.env.GA4_PROPERTY_ID || '',
      isConnected: ga4Connected,
      lastSync: ga4Connected ? new Date().toISOString() : '',
      status: ga4Connected ? 'active' : 'expired',
    });

    return NextResponse.json({
      success: true,
      accounts,
      summary: {
        total: accounts.length,
        connected: accounts.filter(a => a.isConnected).length,
        disconnected: accounts.filter(a => !a.isConnected).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Accounts API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST — Save account configuration
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, accountId, accessToken } = body;

    if (!platform || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Platform e accountId são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Upsert into integration_settings
    const updateData: Record<string, string> = {};
    if (platform === 'meta') {
      updateData.meta_ad_account_id = accountId;
      if (accessToken) updateData.meta_access_token = accessToken;
    } else if (platform === 'google') {
      updateData.google_ads_customer_id = accountId;
    } else if (platform === 'ga4') {
      updateData.ga4_property_id = accountId;
    }

    const { error } = await supabase
      .from('integration_settings')
      .upsert({
        ...updateData,
        is_default: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'is_default' });

    if (error) {
      logger.error('❌ Save account error:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar configuração' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Conta ${platform} configurada com sucesso`,
    });
  } catch (error) {
    logger.error('❌ Accounts POST Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
