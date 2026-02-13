// =====================================================
// CONSOLIDATOR — Motor de Agregação Multi-Plataforma
// Humano Saúde — Cockpit de Campanhas & Dashboard Consolidado
// =====================================================

// =====================================================
// 1. INTERFACES — Tipagem completa
// =====================================================

export type Platform = 'meta' | 'google' | 'ga4' | 'manual';
export type FunnelStage = 'topo' | 'meio' | 'fundo' | 'retargeting' | 'indefinido';
export type DateRangePreset = 'today' | 'yesterday' | '7d' | '14d' | '30d' | 'this_month' | 'custom';
export type CampaignSortField =
  | 'spend' | 'impressions' | 'clicks' | 'ctr' | 'cpc'
  | 'cpm' | 'roas' | 'conversions' | 'revenue' | 'name';

export interface DateRange {
  preset: DateRangePreset;
  startDate?: string; // ISO
  endDate?: string;   // ISO
}

export interface ConsolidatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalConversions: number;
  totalRevenue: number;
  totalLeads: number;
  roas: number;
  cpa: number;
  cpl: number;
  cpc: number;
  ctr: number;
  cpm: number;
  frequency: number;
  conversionRate: number;
  costPerMil: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalCampaigns: number;
  topCampaignName: string;
  topCampaignRoas: number;
}

export interface CockpitCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  platform: Platform;
  funnelStage: FunnelStage;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  leads: number;
  cpl: number;
  linkClicks: number;
  landingPageViews: number;
  initiateCheckout: number;
  purchases: number;
  purchaseValue: number;
  addToCart: number;
  viewContent: number;
  dailyBudget: number;
  lifetimeBudget: number;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  thumbnailUrl?: string;
}

export interface FunnelData {
  stage: FunnelStage;
  label: string;
  count: number;
  spend: number;
  conversions: number;
  roas: number;
  color: string;
}

export interface ConsciousnessLevel {
  level: string;
  label: string;
  campaigns: number;
  spend: number;
  conversions: number;
  percentage: number;
  color: string;
}

export interface PlatformAccount {
  id: string;
  platform: Platform;
  name: string;
  accountId: string;
  isConnected: boolean;
  lastSync: string;
  status: 'active' | 'expired' | 'error';
}

export interface CockpitAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  campaignId?: string;
  createdAt: string;
}

export interface ComparisonDataPoint {
  date: string;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number;
  clicks: number;
  impressions: number;
}

export interface ConversionFunnelStep {
  step: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface AIBenchmarks {
  roasMin: number;
  roasGood: number;
  roasExcellent: number;
  ctrMin: number;
  ctrGood: number;
  cpcMax: number;
  cpmMax: number;
  cpaMax: number;
}

export const DEFAULT_BENCHMARKS: AIBenchmarks = {
  roasMin: 2.0,
  roasGood: 3.5,
  roasExcellent: 5.0,
  ctrMin: 1.5,
  ctrGood: 3.0,
  cpcMax: 2.0,
  cpmMax: 50.0,
  cpaMax: 80.0,
};

// =====================================================
// 2. FUNNEL CLASSIFICATION
// =====================================================

const TOPO_KEYWORDS = ['topo', 'awareness', 'alcance', 'branding', 'reconhecimento', 'top_of'];
const MEIO_KEYWORDS = ['meio', 'consideration', 'consideracao', 'engajamento', 'trafego', 'traffic', 'middle'];
const FUNDO_KEYWORDS = ['fundo', 'conversion', 'conversao', 'venda', 'bottom', 'purchase', 'compra'];
const RETARGETING_KEYWORDS = ['retargeting', 'remarketing', 'remarket', 'lookalike', 'custom_audience'];

export function classifyFunnelStage(campaignName: string, objective?: string): FunnelStage {
  const name = (campaignName || '').toLowerCase();
  const obj = (objective || '').toLowerCase();

  if (RETARGETING_KEYWORDS.some(k => name.includes(k) || obj.includes(k))) return 'retargeting';
  if (FUNDO_KEYWORDS.some(k => name.includes(k) || obj.includes(k))) return 'fundo';
  if (MEIO_KEYWORDS.some(k => name.includes(k) || obj.includes(k))) return 'meio';
  if (TOPO_KEYWORDS.some(k => name.includes(k) || obj.includes(k))) return 'topo';

  // Fallback: classify by objective
  if (['OUTCOME_AWARENESS', 'BRAND_AWARENESS', 'REACH'].includes(objective || '')) return 'topo';
  if (['OUTCOME_TRAFFIC', 'TRAFFIC', 'ENGAGEMENT', 'VIDEO_VIEWS'].includes(objective || '')) return 'meio';
  if (['OUTCOME_SALES', 'CONVERSIONS', 'OUTCOME_LEADS', 'LEAD_GENERATION'].includes(objective || '')) return 'fundo';

  return 'indefinido';
}

// =====================================================
// 3. AGGREGATE METRICS
// =====================================================

export function aggregateConsolidatedMetrics(campaigns: CockpitCampaign[]): ConsolidatedMetrics {
  if (!campaigns.length) {
    return {
      totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalReach: 0,
      totalConversions: 0, totalRevenue: 0, totalLeads: 0,
      roas: 0, cpa: 0, cpl: 0, cpc: 0, ctr: 0, cpm: 0, frequency: 0,
      conversionRate: 0, costPerMil: 0,
      activeCampaigns: 0, pausedCampaigns: 0, totalCampaigns: 0,
      topCampaignName: '—', topCampaignRoas: 0,
    };
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      reach: acc.reach + c.reach,
      conversions: acc.conversions + c.conversions,
      revenue: acc.revenue + c.revenue,
      leads: acc.leads + c.leads,
    }),
    { spend: 0, impressions: 0, clicks: 0, reach: 0, conversions: 0, revenue: 0, leads: 0 }
  );

  const active = campaigns.filter(c => c.status === 'ACTIVE').length;
  const paused = campaigns.filter(c => c.status === 'PAUSED').length;

  const topCampaign = [...campaigns].sort((a, b) => b.roas - a.roas)[0];

  return {
    totalSpend: totals.spend,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalReach: totals.reach,
    totalConversions: totals.conversions,
    totalRevenue: totals.revenue,
    totalLeads: totals.leads,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    frequency: totals.reach > 0 ? totals.impressions / totals.reach : 0,
    conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
    costPerMil: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    activeCampaigns: active,
    pausedCampaigns: paused,
    totalCampaigns: campaigns.length,
    topCampaignName: topCampaign?.name || '—',
    topCampaignRoas: topCampaign?.roas || 0,
  };
}

// =====================================================
// 4. BUILD FUNNEL DATA
// =====================================================

const FUNNEL_LABELS: Record<FunnelStage, { label: string; color: string }> = {
  topo: { label: 'Topo — Awareness', color: '#3B82F6' },
  meio: { label: 'Meio — Consideração', color: '#8B5CF6' },
  fundo: { label: 'Fundo — Conversão', color: '#D4AF37' },
  retargeting: { label: 'Retargeting', color: '#10B981' },
  indefinido: { label: 'Não Classificado', color: '#6B7280' },
};

export function buildFunnelData(campaigns: CockpitCampaign[]): FunnelData[] {
  const stages: FunnelStage[] = ['topo', 'meio', 'fundo', 'retargeting', 'indefinido'];

  return stages.map(stage => {
    const filtered = campaigns.filter(c => c.funnelStage === stage);
    const spend = filtered.reduce((s, c) => s + c.spend, 0);
    const conversions = filtered.reduce((s, c) => s + c.conversions, 0);
    const revenue = filtered.reduce((s, c) => s + c.revenue, 0);
    const { label, color } = FUNNEL_LABELS[stage];

    return {
      stage,
      label,
      count: filtered.length,
      spend,
      conversions,
      roas: spend > 0 ? revenue / spend : 0,
      color,
    };
  }).filter(f => f.count > 0);
}

// =====================================================
// 5. GENERATE ALERTS
// =====================================================

export function generateAlerts(
  metrics: ConsolidatedMetrics,
  campaigns: CockpitCampaign[],
  benchmarks: AIBenchmarks = DEFAULT_BENCHMARKS
): CockpitAlert[] {
  const alerts: CockpitAlert[] = [];
  const now = new Date().toISOString();

  // ROAS below minimum
  if (metrics.totalSpend > 0 && metrics.roas < benchmarks.roasMin) {
    alerts.push({
      id: 'roas-low',
      type: metrics.roas < 1 ? 'danger' : 'warning',
      title: 'ROAS Abaixo da Meta',
      message: `ROAS atual ${metrics.roas.toFixed(2)}x está ${metrics.roas < 1 ? 'negativo' : 'abaixo do mínimo'} (meta: ${benchmarks.roasMin}x)`,
      metric: 'roas',
      value: metrics.roas,
      threshold: benchmarks.roasMin,
      createdAt: now,
    });
  }

  // ROAS excellent
  if (metrics.roas >= benchmarks.roasExcellent) {
    alerts.push({
      id: 'roas-excellent',
      type: 'success',
      title: 'ROAS Excelente! 🎯',
      message: `ROAS ${metrics.roas.toFixed(2)}x — acima de ${benchmarks.roasExcellent}x. Considere escalar investimento.`,
      metric: 'roas',
      value: metrics.roas,
      threshold: benchmarks.roasExcellent,
      createdAt: now,
    });
  }

  // CTR below minimum
  if (metrics.totalImpressions > 1000 && metrics.ctr < benchmarks.ctrMin) {
    alerts.push({
      id: 'ctr-low',
      type: 'warning',
      title: 'CTR Baixo',
      message: `CTR ${metrics.ctr.toFixed(2)}% abaixo do mínimo (${benchmarks.ctrMin}%). Revise criativos e segmentação.`,
      metric: 'ctr',
      value: metrics.ctr,
      threshold: benchmarks.ctrMin,
      createdAt: now,
    });
  }

  // CPC high
  if (metrics.totalClicks > 50 && metrics.cpc > benchmarks.cpcMax) {
    alerts.push({
      id: 'cpc-high',
      type: 'warning',
      title: 'CPC Alto',
      message: `CPC R$ ${metrics.cpc.toFixed(2)} acima do teto (R$ ${benchmarks.cpcMax}). Otimize lances.`,
      metric: 'cpc',
      value: metrics.cpc,
      threshold: benchmarks.cpcMax,
      createdAt: now,
    });
  }

  // CPM high
  if (metrics.totalImpressions > 1000 && metrics.cpm > benchmarks.cpmMax) {
    alerts.push({
      id: 'cpm-high',
      type: 'warning',
      title: 'CPM Elevado',
      message: `CPM R$ ${metrics.cpm.toFixed(2)} acima do limite (R$ ${benchmarks.cpmMax}). Considere ajustar público.`,
      metric: 'cpm',
      value: metrics.cpm,
      threshold: benchmarks.cpmMax,
      createdAt: now,
    });
  }

  // Zero conversions with spend
  if (metrics.totalSpend > 100 && metrics.totalConversions === 0) {
    alerts.push({
      id: 'zero-conversions',
      type: 'danger',
      title: 'Sem Conversões',
      message: `R$ ${metrics.totalSpend.toFixed(2)} investidos sem nenhuma conversão. Revise pixel e funil.`,
      metric: 'conversions',
      value: 0,
      threshold: 1,
      createdAt: now,
    });
  }

  // Campaign-level: high spend low ROAS
  campaigns
    .filter(c => c.spend > 50 && c.roas < 1 && c.status === 'ACTIVE')
    .slice(0, 3)
    .forEach(c => {
      alerts.push({
        id: `campaign-roas-${c.id}`,
        type: 'danger',
        title: `Campanha com ROAS Negativo`,
        message: `"${c.name}" gastou R$ ${c.spend.toFixed(2)} com ROAS ${c.roas.toFixed(2)}x`,
        campaignId: c.id,
        metric: 'roas',
        value: c.roas,
        threshold: 1,
        createdAt: now,
      });
    });

  return alerts.sort((a, b) => {
    const priority = { danger: 0, warning: 1, info: 2, success: 3 };
    return priority[a.type] - priority[b.type];
  });
}

// =====================================================
// 6. BUILD CONVERSION FUNNEL STEPS
// =====================================================

export function buildConversionFunnel(campaigns: CockpitCampaign[]): ConversionFunnelStep[] {
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalLandingViews = campaigns.reduce((s, c) => s + c.landingPageViews, 0);
  const totalInitCheckout = campaigns.reduce((s, c) => s + c.initiateCheckout, 0);
  const totalPurchases = campaigns.reduce((s, c) => s + c.purchases, 0);

  const steps: Array<{ step: string; label: string; value: number; color: string; icon: string }> = [
    { step: 'impressions', label: 'Impressões', value: totalImpressions, color: '#3B82F6', icon: 'Eye' },
    { step: 'clicks', label: 'Cliques', value: totalClicks, color: '#8B5CF6', icon: 'MousePointerClick' },
    { step: 'landing_views', label: 'Página Destino', value: totalLandingViews || Math.round(totalClicks * 0.85), color: '#D4AF37', icon: 'FileText' },
    { step: 'checkout', label: 'Checkout', value: totalInitCheckout || Math.round(totalClicks * 0.15), color: '#F59E0B', icon: 'ShoppingCart' },
    { step: 'purchase', label: 'Compra', value: totalPurchases, color: '#10B981', icon: 'CheckCircle' },
  ];

  const maxVal = steps[0]?.value || 1;

  return steps.map(s => ({
    ...s,
    percentage: maxVal > 0 ? (s.value / maxVal) * 100 : 0,
  }));
}

// =====================================================
// 7. DATE RANGE HELPER
// =====================================================

export function dateRangeToMetaPreset(range: DateRange): string {
  const map: Record<DateRangePreset, string> = {
    today: 'today',
    yesterday: 'yesterday',
    '7d': 'last_7d',
    '14d': 'last_14d',
    '30d': 'last_30d',
    this_month: 'this_month',
    custom: 'last_30d', // fallback for custom
  };
  return map[range.preset] || 'last_7d';
}

export function getDateRangeLabel(preset: DateRangePreset): string {
  const labels: Record<DateRangePreset, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    '7d': 'Últimos 7 dias',
    '14d': 'Últimos 14 dias',
    '30d': 'Últimos 30 dias',
    this_month: 'Este mês',
    custom: 'Personalizado',
  };
  return labels[preset] || 'Últimos 7 dias';
}

// =====================================================
// 8. FORMAT HELPERS
// =====================================================

export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('pt-BR');
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

// =====================================================
// 9. SORT CAMPAIGNS
// =====================================================

export function sortCampaigns(
  campaigns: CockpitCampaign[],
  field: CampaignSortField,
  direction: 'asc' | 'desc' = 'desc'
): CockpitCampaign[] {
  return [...campaigns].sort((a, b) => {
    let valA: number | string;
    let valB: number | string;

    if (field === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
      return direction === 'asc'
        ? valA.localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    }

    valA = a[field] as number;
    valB = b[field] as number;
    return direction === 'asc' ? valA - valB : valB - valA;
  });
}

// =====================================================
// 10. CSV EXPORT
// =====================================================

export function campaignsToCSV(campaigns: CockpitCampaign[]): string {
  const headers = [
    'Campanha', 'Status', 'Plataforma', 'Funil', 'Investimento', 'Impressões',
    'Cliques', 'CTR', 'CPC', 'CPM', 'Conversões', 'Receita', 'ROAS', 'CPA', 'Leads', 'CPL',
  ];

  const rows = campaigns.map(c => [
    `"${c.name}"`, c.status, c.platform, c.funnelStage,
    c.spend.toFixed(2), c.impressions, c.clicks,
    c.ctr.toFixed(2), c.cpc.toFixed(2), c.cpm.toFixed(2),
    c.conversions, c.revenue.toFixed(2), c.roas.toFixed(2),
    c.cpa.toFixed(2), c.leads, c.cpl.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
