// =====================================================
// META MARKETING API — Insights de Performance
// Dashboard de métricas para Humano Saúde
// =====================================================

import { createServiceClient } from './supabase';
import type { MetaDatePreset } from './ads/types';
import { logger } from '@/lib/logger';

const META_API_VERSION = 'v21.0';

// =====================================================
// TIPOS
// =====================================================

export interface AdsMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalPurchases: number;
  totalPurchaseValue: number;
  totalLeads: number;
  roas: number;
  cpa: number;
  cpl: number;
  avgCpc: number;
  avgCtr: number;
  avgCpm: number;
}

interface CampaignInsight {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  purchases: number;
  purchaseValue: number;
  leads: number;
  roas: number;
  ctr: number;
  cpc: number;
}

// Usar apenas 1 tipo de evento para evitar duplicação
const PURCHASE_ACTION_TYPE = 'offsite_conversion.fb_pixel_purchase';
const LEAD_ACTION_TYPE = 'offsite_conversion.fb_pixel_lead';

// =====================================================
// OBTER CREDENCIAIS (Supabase ou env)
// =====================================================

async function getCredentials(): Promise<{
  accessToken: string;
  adAccountId: string;
}> {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';

  // Tentar buscar account ID dinâmico do integration_settings
  let adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID || '';

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('integration_settings')
      .select('meta_ad_account_id')
      .eq('is_default', true)
      .limit(1)
      .single();

    if (data?.meta_ad_account_id) {
      adAccountId = data.meta_ad_account_id;
    }
  } catch {
    // Usa env var
  }

  return { accessToken, adAccountId };
}

// =====================================================
// BUSCAR INSIGHTS
// =====================================================

export async function getMarketingInsights(
  datePreset: MetaDatePreset = 'last_7d',
  level: 'campaign' | 'adset' | 'ad' = 'campaign'
): Promise<{ metrics: AdsMetrics; campaigns: CampaignInsight[] }> {
  const { accessToken, adAccountId } = await getCredentials();

  if (!accessToken || !adAccountId) {
    return { metrics: emptyMetrics(), campaigns: [] };
  }

  const fields = [
    'campaign_id', 'campaign_name', 'objective',
    'spend', 'impressions', 'clicks', 'reach',
    'actions', 'action_values', 'ctr', 'cpc',
  ].join(',');

  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/insights?fields=${fields}&level=${level}&date_preset=${datePreset}&limit=500&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      logger.error('❌ Meta Insights Error:', data.error?.message);
      return { metrics: emptyMetrics(), campaigns: [] };
    }

    const rows = data.data || [];
    const campaigns: CampaignInsight[] = rows.map(parseInsightRow);
    const metrics = aggregateMetrics(campaigns);

    return { metrics, campaigns };
  } catch (error) {
    logger.error('❌ Erro ao buscar insights:', error);
    return { metrics: emptyMetrics(), campaigns: [] };
  }
}

// =====================================================
// PARSEAR ROW
// =====================================================

function parseInsightRow(row: Record<string, unknown>): CampaignInsight {
  const actions = (row.actions || []) as Array<{ action_type: string; value: string }>;
  const actionValues = (row.action_values || []) as Array<{ action_type: string; value: string }>;

  const purchases = parseInt(
    actions.find((a) => a.action_type === PURCHASE_ACTION_TYPE)?.value || '0',
    10
  );
  const purchaseValue = parseFloat(
    actionValues.find((a) => a.action_type === PURCHASE_ACTION_TYPE)?.value || '0'
  );
  const leads = parseInt(
    actions.find((a) => a.action_type === LEAD_ACTION_TYPE)?.value || '0',
    10
  );

  const spend = parseFloat(row.spend as string) || 0;

  return {
    campaign_id: row.campaign_id as string,
    campaign_name: row.campaign_name as string,
    objective: row.objective as string || '',
    status: '',
    spend,
    impressions: parseInt(row.impressions as string, 10) || 0,
    clicks: parseInt(row.clicks as string, 10) || 0,
    reach: parseInt(row.reach as string, 10) || 0,
    purchases,
    purchaseValue,
    leads,
    roas: spend > 0 ? purchaseValue / spend : 0,
    ctr: parseFloat(row.ctr as string) || 0,
    cpc: parseFloat(row.cpc as string) || 0,
  };
}

// =====================================================
// AGREGAR MÉTRICAS
// =====================================================

function aggregateMetrics(campaigns: CampaignInsight[]): AdsMetrics {
  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      reach: acc.reach + c.reach,
      purchases: acc.purchases + c.purchases,
      purchaseValue: acc.purchaseValue + c.purchaseValue,
      leads: acc.leads + c.leads,
    }),
    { spend: 0, impressions: 0, clicks: 0, reach: 0, purchases: 0, purchaseValue: 0, leads: 0 }
  );

  return {
    totalSpend: totals.spend,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalReach: totals.reach,
    totalPurchases: totals.purchases,
    totalPurchaseValue: totals.purchaseValue,
    totalLeads: totals.leads,
    roas: totals.spend > 0 ? totals.purchaseValue / totals.spend : 0,
    cpa: totals.purchases > 0 ? totals.spend / totals.purchases : 0,
    cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
    avgCpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    avgCtr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    avgCpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
  };
}

function emptyMetrics(): AdsMetrics {
  return {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalReach: 0,
    totalPurchases: 0,
    totalPurchaseValue: 0,
    totalLeads: 0,
    roas: 0,
    cpa: 0,
    cpl: 0,
    avgCpc: 0,
    avgCtr: 0,
    avgCpm: 0,
  };
}

// =====================================================
// PERÍODOS SUPORTADOS
// =====================================================

export const SUPPORTED_DATE_PRESETS: Array<{
  value: MetaDatePreset;
  label: string;
}> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_14d', label: 'Últimos 14 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'maximum', label: 'Todo o período' },
];
