// =====================================================
// CAMADA 4 — Campaign Analyzer (Funil de Consciência)
// Análise por estágio de funil e nível de consciência
// =====================================================

import type {
  CampaignData,
  FunnelStage,
  AwarenessLevel,
  BenchmarkRating,
  CampaignAnalysisResult,
  FullCampaignAnalysis,
} from '@/lib/types/ai-performance';

// =====================================================
// BENCHMARKS POR FUNIL
// =====================================================

const FUNNEL_BENCHMARKS = {
  ctr: {
    TOPO:  { min: 0.5, good: 1.0, excellent: 2.0 },
    MEIO:  { min: 1.0, good: 2.0, excellent: 3.0 },
    FUNDO: { min: 1.5, good: 3.0, excellent: 5.0 },
  },
  cpc: {
    TOPO:  { poor: 3.00, average: 2.00, good: 1.00 },
    MEIO:  { poor: 2.50, average: 1.50, good: 0.80 },
    FUNDO: { poor: 2.00, average: 1.20, good: 0.60 },
  },
  roas: {
    TOPO:  { poor: 0.5, breakeven: 1.0, good: 2.0 },
    MEIO:  { poor: 1.0, breakeven: 2.0, good: 3.5 },
    FUNDO: { poor: 1.5, breakeven: 2.5, good: 5.0 },
  },
  frequency: {
    TOPO:  { ideal: 3.0, warning: 5.0, fatigue: 8.0 },
    MEIO:  { ideal: 2.5, warning: 4.0, fatigue: 6.0 },
    FUNDO: { ideal: 4.0, warning: 7.0, fatigue: 10.0 },
  },
} as const;

// =====================================================
// DETECÇÃO DE FUNIL
// =====================================================

const FUNNEL_KEYWORDS: Record<FunnelStage, string[]> = {
  TOPO: ['alcance', 'awareness', 'brand', 'topo', 'top', 'cold', 'prospeccao', 'prospecção', 'reconhecimento', 'video_view', 'VIDEO_VIEWS'],
  MEIO: ['consideracao', 'consideração', 'traffic', 'trafego', 'tráfego', 'engajamento', 'engagement', 'meio', 'middle', 'warm', 'LINK_CLICKS', 'TRAFFIC'],
  FUNDO: ['conversao', 'conversão', 'conversion', 'vendas', 'sales', 'fundo', 'bottom', 'hot', 'retargeting', 'remarketing', 'purchase', 'CONVERSIONS', 'OUTCOME_SALES'],
};

function detectFunnelStage(campaign: CampaignData): FunnelStage {
  const searchStr = `${campaign.name} ${campaign.objective}`.toLowerCase();

  for (const [stage, keywords] of Object.entries(FUNNEL_KEYWORDS) as [FunnelStage, string[]][]) {
    if (keywords.some(kw => searchStr.includes(kw.toLowerCase()))) {
      return stage;
    }
  }

  // Heurística por objetivo da Meta
  if (campaign.objective.includes('AWARENESS') || campaign.objective.includes('REACH')) return 'TOPO';
  if (campaign.objective.includes('TRAFFIC') || campaign.objective.includes('ENGAGEMENT')) return 'MEIO';
  if (campaign.objective.includes('CONVERSION') || campaign.objective.includes('SALES')) return 'FUNDO';

  // Heurística por comportamento
  if (campaign.purchases > 0) return 'FUNDO';
  if (campaign.ctr > 1.5) return 'MEIO';
  return 'TOPO';
}

// =====================================================
// DETECÇÃO DE NÍVEL DE CONSCIÊNCIA
// =====================================================

function detectAwarenessLevel(campaign: CampaignData, stage: FunnelStage): AwarenessLevel {
  const name = campaign.name.toLowerCase();

  // Detecção por nome
  if (name.includes('inconsciente') || name.includes('unaware')) return 'inconsciente';
  if (name.includes('problema') || name.includes('problem')) return 'problema';
  if (name.includes('solucao') || name.includes('solution')) return 'solucao';
  if (name.includes('produto') || name.includes('product')) return 'produto';
  if (name.includes('oferta') || name.includes('offer') || name.includes('promo')) return 'totalmente_consciente';

  // Mapping por funil
  switch (stage) {
    case 'TOPO': return campaign.reach > 1000 ? 'inconsciente' : 'problema';
    case 'MEIO': return campaign.ctr > 2 ? 'solucao' : 'problema';
    case 'FUNDO': return campaign.purchases > 0 ? 'totalmente_consciente' : 'produto';
  }
}

// =====================================================
// RATING POR FUNIL
// =====================================================

function rateCtrByFunnel(ctr: number, stage: FunnelStage): BenchmarkRating {
  const bench = FUNNEL_BENCHMARKS.ctr[stage];
  if (ctr >= bench.excellent) return 'excellent';
  if (ctr >= bench.good) return 'good';
  if (ctr >= bench.min) return 'average';
  return 'poor';
}

function rateCpcByFunnel(cpc: number, stage: FunnelStage): BenchmarkRating {
  const bench = FUNNEL_BENCHMARKS.cpc[stage];
  if (cpc <= bench.good) return 'excellent';
  if (cpc <= bench.average) return 'good';
  if (cpc <= bench.poor) return 'average';
  return 'poor';
}

function rateRoasByFunnel(roas: number, stage: FunnelStage): BenchmarkRating {
  const bench = FUNNEL_BENCHMARKS.roas[stage];
  if (roas >= bench.good) return 'excellent';
  if (roas >= bench.breakeven) return 'good';
  if (roas >= bench.poor) return 'average';
  return 'poor';
}

function rateFrequencyByFunnel(freq: number, stage: FunnelStage): BenchmarkRating {
  const bench = FUNNEL_BENCHMARKS.frequency[stage];
  if (freq <= bench.ideal) return 'excellent';
  if (freq <= bench.warning) return 'good';
  if (freq <= bench.fatigue) return 'average';
  return 'poor';
}

function ratingToScore(rating: BenchmarkRating): number {
  switch (rating) {
    case 'excellent': return 100;
    case 'good': return 75;
    case 'average': return 50;
    case 'poor': return 20;
  }
}

// =====================================================
// ANÁLISE DE CAMPANHA INDIVIDUAL
// =====================================================

export function analyzeCampaign(campaign: CampaignData): CampaignAnalysisResult {
  const funnelStage = detectFunnelStage(campaign);
  const awarenessLevel = detectAwarenessLevel(campaign, funnelStage);

  const ctrRating = rateCtrByFunnel(campaign.ctr, funnelStage);
  const cpcRating = rateCpcByFunnel(campaign.cpc, funnelStage);
  const roasRating = rateRoasByFunnel(campaign.roas, funnelStage);
  const freqRating = rateFrequencyByFunnel(campaign.frequency, funnelStage);

  // Score ponderado por estágio do funil
  const weights = funnelStage === 'FUNDO'
    ? { ctr: 0.15, cpc: 0.15, roas: 0.50, freq: 0.20 }
    : funnelStage === 'MEIO'
    ? { ctr: 0.30, cpc: 0.25, roas: 0.25, freq: 0.20 }
    : { ctr: 0.35, cpc: 0.20, roas: 0.15, freq: 0.30 };

  const overallScore = Math.round(
    ratingToScore(ctrRating) * weights.ctr +
    ratingToScore(cpcRating) * weights.cpc +
    ratingToScore(roasRating) * weights.roas +
    ratingToScore(freqRating) * weights.freq
  );

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Insights por rating
  if (ctrRating === 'poor') {
    insights.push(`CTR de ${campaign.ctr.toFixed(2)}% está abaixo do mínimo para ${funnelStage}`);
    recommendations.push('Testar novos criativos com hook mais agressivo nos primeiros 3s');
  }
  if (ctrRating === 'excellent') {
    insights.push(`CTR excelente de ${campaign.ctr.toFixed(2)}% para estágio ${funnelStage}`);
  }

  if (roasRating === 'poor' && campaign.spend > 20) {
    insights.push(`ROAS de ${campaign.roas.toFixed(2)}x está abaixo do aceitável para ${funnelStage}`);
    recommendations.push(funnelStage === 'FUNDO' ? 'Revisar oferta e landing page' : 'Normal para topo — foque em métricas de awareness');
  }

  if (freqRating === 'poor') {
    insights.push(`Frequência de ${campaign.frequency.toFixed(1)} indica saturação de audiência`);
    recommendations.push('Expandir público ou renovar criativos para evitar fadiga');
  }

  // Sangria
  if (campaign.spend > 30 && campaign.purchases === 0 && funnelStage === 'FUNDO') {
    insights.push(`⚠️ Campanha de FUNDO gastou R$ ${campaign.spend.toFixed(2)} sem compras`);
    recommendations.push('Pausar imediatamente e analisar público + LP antes de reativar');
  }

  // Recomendações por consciência
  switch (awarenessLevel) {
    case 'inconsciente':
      recommendations.push('Foque em conteúdo educativo — vídeos curtos sobre o problema');
      break;
    case 'problema':
      recommendations.push('Destaque depoimentos e dados que validem a necessidade');
      break;
    case 'solucao':
      recommendations.push('Compare mecanismos — mostre por que sua solução é diferente');
      break;
    case 'produto':
      recommendations.push('Adicione prova social (reviews, cases) e elimine objeções');
      break;
    case 'totalmente_consciente':
      recommendations.push('Use urgência e escassez — oferta com deadline funciona melhor');
      break;
  }

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    awarenessLevel,
    funnelStage,
    overallScore,
    metrics: {
      ctr: { value: campaign.ctr, rating: ctrRating },
      cpc: { value: campaign.cpc, rating: cpcRating },
      roas: { value: campaign.roas, rating: roasRating },
      frequency: { value: campaign.frequency, rating: freqRating },
    },
    insights,
    recommendations,
  };
}

// =====================================================
// ANÁLISE COMPLETA DE TODAS AS CAMPANHAS
// =====================================================

export function analyzeAllCampaigns(campaigns: CampaignData[]): FullCampaignAnalysis {
  const results = campaigns.map(analyzeCampaign);

  // Sumário por funil
  const byStage = (stage: FunnelStage) => {
    const filtered = results.filter(r => r.funnelStage === stage);
    const matchingCampaigns = campaigns.filter(c => {
      const result = results.find(r => r.campaignId === c.id);
      return result?.funnelStage === stage;
    });

    return {
      count: filtered.length,
      totalSpend: matchingCampaigns.reduce((s, c) => s + c.spend, 0),
      avgCtr: matchingCampaigns.length > 0
        ? matchingCampaigns.reduce((s, c) => s + c.ctr, 0) / matchingCampaigns.length
        : 0,
    };
  };

  const overallHealthScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.overallScore, 0) / results.length)
    : 0;

  return {
    campaigns: results,
    funnelSummary: {
      topo: byStage('TOPO'),
      meio: byStage('MEIO'),
      fundo: byStage('FUNDO'),
    },
    overallHealthScore,
  };
}
