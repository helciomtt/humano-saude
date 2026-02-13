// =====================================================
// CAMADA 3 — Smart Analyzer v2 (SEM IA)
// Análise completa 100% baseada em regras locais
// Funciona offline — fallback das camadas 1 e 2
// =====================================================

import type {
  PerformanceData,
  CampaignData,
  AdSetData,
  AdData,
  AccountStatus,
  SmartAnalysisResult,
  SmartInsight,
  SmartRecommendation,
  BenchmarkComparison,
  BenchmarkRating,
  FullAnalysisResult,
  AdSetAnalysisItem,
  AdSetClassification,
  AdAnalysisItem,
  OptimizationStep,
  PerformanceMetrics,
} from '@/lib/types/ai-performance';
import type { AdsMetrics } from '@/lib/meta-marketing';

// =====================================================
// BENCHMARKS E-COMMERCE BRASIL (Planos de Saúde)
// =====================================================

const BENCHMARKS = {
  ctr: { excellent: 2.5, good: 1.5, average: 1.0, poor: 0.5 },
  cpc: { excellent: 0.80, good: 1.50, average: 2.50, poor: 4.00 },
  cpm: { excellent: 10, good: 20, average: 35, poor: 50 },
  roas: { excellent: 5.0, good: 3.0, breakeven: 2.0, poor: 1.0 },
  frequency: { ideal: 2.5, warning: 4.0, fatigue: 6.0 },
  cpa: { excellent: 12, good: 18, acceptable: 25, poor: 40 },
} as const;

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function rateCTR(ctr: number): BenchmarkRating {
  if (ctr >= BENCHMARKS.ctr.excellent) return 'excellent';
  if (ctr >= BENCHMARKS.ctr.good) return 'good';
  if (ctr >= BENCHMARKS.ctr.average) return 'average';
  return 'poor';
}

function rateCPC(cpc: number): BenchmarkRating {
  if (cpc <= BENCHMARKS.cpc.excellent) return 'excellent';
  if (cpc <= BENCHMARKS.cpc.good) return 'good';
  if (cpc <= BENCHMARKS.cpc.average) return 'average';
  return 'poor';
}

function rateCPM(cpm: number): BenchmarkRating {
  if (cpm <= BENCHMARKS.cpm.excellent) return 'excellent';
  if (cpm <= BENCHMARKS.cpm.good) return 'good';
  if (cpm <= BENCHMARKS.cpm.average) return 'average';
  return 'poor';
}

function rateROAS(roas: number): BenchmarkRating {
  if (roas >= BENCHMARKS.roas.excellent) return 'excellent';
  if (roas >= BENCHMARKS.roas.good) return 'good';
  if (roas >= BENCHMARKS.roas.breakeven) return 'average';
  return 'poor';
}

function rateCPA(cpa: number): BenchmarkRating {
  if (cpa <= BENCHMARKS.cpa.excellent) return 'excellent';
  if (cpa <= BENCHMARKS.cpa.good) return 'good';
  if (cpa <= BENCHMARKS.cpa.acceptable) return 'average';
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

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function pct(value: number): string {
  return `${value.toFixed(2)}%`;
}

// =====================================================
// HEALTH SCORE — 4 dimensões ponderadas
// =====================================================

function calculateHealthScore(metrics: PerformanceMetrics, campaigns: CampaignData[]): {
  total: number;
  breakdown: { efficiency: number; conversion: number; scale: number; health: number };
} {
  // Eficiência (25%): CTR + CPC
  const ctrScore = ratingToScore(rateCTR(metrics.ctrMedio));
  const cpcScore = metrics.gastoTotal > 0 && metrics.ctrMedio > 0
    ? ratingToScore(rateCPC(metrics.gastoTotal / (metrics.gastoTotal * metrics.ctrMedio / 100)))
    : 50;
  const efficiency = (ctrScore + cpcScore) / 2;

  // Conversão (35%): ROAS + CPA
  const roasScore = ratingToScore(rateROAS(metrics.roasGeral));
  const cpaScore = metrics.totalVendas > 0
    ? ratingToScore(rateCPA(metrics.gastoTotal / metrics.totalVendas))
    : 20;
  const conversion = (roasScore + cpaScore) / 2;

  // Escala (15%): Volume de campanhas e alcance
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const scaleScore = Math.min(100, activeCampaigns * 15 + (metrics.gastoTotal > 100 ? 25 : 0));
  const scale = scaleScore;

  // Saúde (25%): Diversificação + campanhas sem problemas
  const campaignsWithSpend = campaigns.filter(c => c.spend > 0);
  const campaignsNoPurchase = campaignsWithSpend.filter(c => c.purchases === 0 && c.spend > 30);
  const healthRatio = campaignsWithSpend.length > 0
    ? 1 - (campaignsNoPurchase.length / campaignsWithSpend.length)
    : 0.5;
  const health = Math.round(healthRatio * 100);

  const total = Math.round(
    efficiency * 0.25 +
    conversion * 0.35 +
    scale * 0.15 +
    health * 0.25
  );

  return { total, breakdown: { efficiency, conversion, scale, health } };
}

function scoreToStatus(score: number): AccountStatus {
  if (score >= 70) return 'SAUDÁVEL';
  if (score >= 45) return 'ATENÇÃO';
  return 'CRÍTICO';
}

// =====================================================
// GERAÇÃO DE INSIGHTS
// =====================================================

function generateInsights(metrics: PerformanceMetrics, campaigns: CampaignData[]): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // ROAS
  if (metrics.roasGeral >= BENCHMARKS.roas.excellent) {
    insights.push({
      type: 'success', title: 'ROAS Excelente',
      description: `ROAS de ${metrics.roasGeral.toFixed(2)}x está acima do benchmark de excelência (${BENCHMARKS.roas.excellent}x). Considere escalar o budget.`,
      metric: 'ROAS', value: metrics.roasGeral, benchmark: BENCHMARKS.roas.excellent,
    });
  } else if (metrics.roasGeral < BENCHMARKS.roas.breakeven) {
    insights.push({
      type: 'danger', title: 'ROAS Abaixo do Breakeven',
      description: `ROAS de ${metrics.roasGeral.toFixed(2)}x está abaixo do breakeven (${BENCHMARKS.roas.breakeven}x). Otimize urgentemente ou pause campanhas ruins.`,
      metric: 'ROAS', value: metrics.roasGeral, benchmark: BENCHMARKS.roas.breakeven,
    });
  }

  // Sangria — campanhas gastando sem compras
  const bleeders = campaigns.filter(c => c.spend > 30 && c.purchases === 0);
  if (bleeders.length > 0) {
    const totalWasted = bleeders.reduce((sum, c) => sum + c.spend, 0);
    insights.push({
      type: 'danger', title: `${bleeders.length} Campanha(s) Sangrando`,
      description: `${formatBRL(totalWasted)} gastos em ${bleeders.length} campanhas sem nenhuma compra. Pause ou otimize imediatamente.`,
      value: totalWasted,
    });
  }

  // CTR
  const avgCtr = metrics.ctrMedio;
  if (avgCtr < BENCHMARKS.ctr.poor) {
    insights.push({
      type: 'danger', title: 'CTR Muito Baixo',
      description: `CTR médio de ${pct(avgCtr)} está muito abaixo do mínimo aceitável (${BENCHMARKS.ctr.poor}%). Revise criativos e copy.`,
      metric: 'CTR', value: avgCtr, benchmark: BENCHMARKS.ctr.poor,
    });
  } else if (avgCtr >= BENCHMARKS.ctr.good) {
    insights.push({
      type: 'success', title: 'CTR Acima da Média',
      description: `CTR de ${pct(avgCtr)} está acima do benchmark bom (${BENCHMARKS.ctr.good}%). Criativos estão performando bem.`,
      metric: 'CTR', value: avgCtr, benchmark: BENCHMARKS.ctr.good,
    });
  }

  // Campanhas vencedoras
  const winners = campaigns.filter(c => c.roas >= BENCHMARKS.roas.good && c.spend > 20);
  if (winners.length > 0) {
    insights.push({
      type: 'success', title: `${winners.length} Campanha(s) Vencedora(s)`,
      description: `ROAS médio de ${(winners.reduce((s, c) => s + c.roas, 0) / winners.length).toFixed(2)}x. Escale com incremento de 20%.`,
      value: winners.length,
    });
  }

  // CPA
  if (metrics.totalVendas > 0) {
    const cpa = metrics.gastoTotal / metrics.totalVendas;
    if (cpa > BENCHMARKS.cpa.poor) {
      insights.push({
        type: 'danger', title: 'CPA Acima do Limite',
        description: `CPA de ${formatBRL(cpa)} está acima do limite (${formatBRL(BENCHMARKS.cpa.poor)}). Revise segmentação e criativos.`,
        metric: 'CPA', value: cpa, benchmark: BENCHMARKS.cpa.poor,
      });
    }
  }

  // Volume — poucas campanhas ativas
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  if (activeCampaigns.length < 3) {
    insights.push({
      type: 'warning', title: 'Poucas Campanhas Ativas',
      description: `Apenas ${activeCampaigns.length} campanha(s) ativa(s). Diversifique para reduzir risco e encontrar novos ângulos.`,
      value: activeCampaigns.length,
    });
  }

  return insights.sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2, success: 3 };
    return order[a.type] - order[b.type];
  });
}

// =====================================================
// GERAÇÃO DE RECOMENDAÇÕES
// =====================================================

function generateRecommendations(
  metrics: PerformanceMetrics,
  campaigns: CampaignData[],
  insights: SmartInsight[]
): SmartRecommendation[] {
  const recs: SmartRecommendation[] = [];
  let priority = 1;

  // Sangrias
  const bleeders = campaigns.filter(c => c.spend > 30 && c.purchases === 0);
  if (bleeders.length > 0) {
    recs.push({
      priority: priority++,
      action: `Pausar ${bleeders.length} campanha(s) que estão sangrando`,
      reason: `${formatBRL(bleeders.reduce((s, c) => s + c.spend, 0))} gastos sem retorno`,
      expectedImpact: 'Redução imediata de desperdício',
      category: 'budget',
    });
  }

  // Escalar vencedoras
  const winners = campaigns.filter(c => c.roas >= BENCHMARKS.roas.good && c.spend > 20);
  if (winners.length > 0) {
    recs.push({
      priority: priority++,
      action: `Aumentar budget em 20% nas ${winners.length} campanhas vencedoras`,
      reason: `ROAS médio de ${(winners.reduce((s, c) => s + c.roas, 0) / winners.length).toFixed(2)}x merece mais investimento`,
      expectedImpact: 'Aumento de receita mantendo eficiência',
      category: 'budget',
    });
  }

  // CTR baixo = problema de criativo
  if (metrics.ctrMedio < BENCHMARKS.ctr.average) {
    recs.push({
      priority: priority++,
      action: 'Testar 3-5 novos criativos com hook diferente nos primeiros 3 segundos',
      reason: `CTR de ${pct(metrics.ctrMedio)} indica que os criativos não estão capturando atenção`,
      expectedImpact: 'Melhoria de 30-50% no CTR',
      category: 'creative',
    });
  }

  // ROAS abaixo do breakeven
  if (metrics.roasGeral < BENCHMARKS.roas.breakeven && metrics.gastoTotal > 50) {
    recs.push({
      priority: priority++,
      action: 'Revisar segmentação de público e excluir audiências que não convertem',
      reason: `ROAS geral de ${metrics.roasGeral.toFixed(2)}x está abaixo do breakeven`,
      expectedImpact: 'Melhorar eficiência do gasto em 20-40%',
      category: 'audience',
    });
  }

  // Frequência alta
  const highFreqCampaigns = campaigns.filter(c => c.frequency > BENCHMARKS.frequency.warning);
  if (highFreqCampaigns.length > 0) {
    recs.push({
      priority: priority++,
      action: `Renovar criativos em ${highFreqCampaigns.length} campanha(s) com frequência alta`,
      reason: 'Fadiga de audiência detectada — público vendo anúncios repetidos',
      expectedImpact: 'Reduzir CPA e melhorar engajamento',
      category: 'creative',
    });
  }

  // Diversificação
  if (campaigns.filter(c => c.status === 'ACTIVE').length < 3) {
    recs.push({
      priority: priority++,
      action: 'Criar pelo menos 2 campanhas novas para testar diferentes ângulos',
      reason: 'Concentração de risco em poucas campanhas',
      expectedImpact: 'Descobrir novos ângulos vencedores',
      category: 'general',
    });
  }

  return recs;
}

// =====================================================
// BENCHMARK COMPARISON
// =====================================================

function compareBenchmarks(metrics: PerformanceMetrics): BenchmarkComparison {
  const avgCpc = metrics.gastoTotal > 0 && metrics.ctrMedio > 0
    ? metrics.gastoTotal / (metrics.gastoTotal * metrics.ctrMedio / 100)
    : 0;
  const avgCpm = metrics.gastoTotal > 0
    ? (metrics.gastoTotal / (metrics.gastoTotal * metrics.ctrMedio / 100 * 1000 / metrics.ctrMedio)) * 1000
    : 0;

  return {
    ctr: rateCTR(metrics.ctrMedio),
    cpc: rateCPC(avgCpc),
    cpm: rateCPM(avgCpm),
    roas: rateROAS(metrics.roasGeral),
  };
}

// =====================================================
// AD SET ANALYSIS — Scoring individual
// =====================================================

function analyzeAdSets(adSets: AdSetData[]): AdSetAnalysisItem[] {
  return adSets.map(adSet => {
    let score = 50;

    // ROAS (peso 40%)
    const roasScore = ratingToScore(rateROAS(adSet.roas));
    score = score * 0.6 + roasScore * 0.4;

    // CTR (peso 20%)
    const ctrScore = ratingToScore(rateCTR(adSet.ctr));
    score = score * 0.8 + ctrScore * 0.2;

    // CPC (peso 15%)
    const cpcScore = ratingToScore(rateCPC(adSet.cpc));
    score = score * 0.85 + cpcScore * 0.15;

    // Frequência penaliza (peso 10%)
    if (adSet.frequency > BENCHMARKS.frequency.fatigue) score -= 15;
    else if (adSet.frequency > BENCHMARKS.frequency.warning) score -= 8;

    // Spend sem compra penaliza fortemente
    if (adSet.spend > 30 && adSet.purchases === 0) score -= 20;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let classification: AdSetClassification;
    if (score >= 75) classification = 'winner';
    else if (score >= 55) classification = 'potential';
    else if (score >= 35) classification = 'underperforming';
    else classification = 'loser';

    const recommendation = classification === 'winner'
      ? 'Escalar budget em 20%. Manter criativos atuais.'
      : classification === 'potential'
      ? 'Testar 2-3 novos criativos. Manter budget.'
      : classification === 'underperforming'
      ? 'Testar novos públicos. Reduzir budget em 30%.'
      : 'Pausar imediatamente. Redirecionar budget para winners.';

    return {
      id: adSet.id,
      name: adSet.name,
      classification,
      score,
      spend: adSet.spend,
      roas: adSet.roas,
      ctr: adSet.ctr,
      cpc: adSet.cpc,
      recommendation,
    };
  }).sort((a, b) => b.score - a.score);
}

// =====================================================
// AD CREATIVE ANALYSIS
// =====================================================

function detectCreativeType(name: string): 'video' | 'image' | 'carousel' | 'unknown' {
  const lower = name.toLowerCase();
  if (lower.includes('video') || lower.includes('vid') || lower.includes('vsl') || lower.includes('reels')) return 'video';
  if (lower.includes('carousel') || lower.includes('carrossel')) return 'carousel';
  if (lower.includes('image') || lower.includes('imagem') || lower.includes('static') || lower.includes('img')) return 'image';
  return 'unknown';
}

function analyzeAds(ads: AdData[]): AdAnalysisItem[] {
  return ads.map(ad => {
    let score = 50;

    const roasScore = ratingToScore(rateROAS(ad.roas));
    score = score * 0.5 + roasScore * 0.5;

    const ctrScore = ratingToScore(rateCTR(ad.ctr));
    score = score * 0.7 + ctrScore * 0.3;

    if (ad.spend > 20 && ad.purchases === 0) score -= 15;

    score = Math.max(0, Math.min(100, Math.round(score)));

    const type = detectCreativeType(ad.name);
    const recommendation = score >= 75
      ? 'Top performer. Criar variações para testar.'
      : score >= 55
      ? 'Potencial. Testar nova copy mantendo criativo.'
      : score >= 35
      ? 'Abaixo da média. Trocar hook e CTA.'
      : 'Pausar. O criativo não está convertendo.';

    return {
      id: ad.id,
      name: ad.name,
      type,
      score,
      spend: ad.spend,
      roas: ad.roas,
      ctr: ad.ctr,
      recommendation,
    };
  }).sort((a, b) => b.score - a.score);
}

// =====================================================
// OPTIMIZATION PLAN
// =====================================================

function generateOptimizationPlan(
  metrics: PerformanceMetrics,
  adSetResults: AdSetAnalysisItem[],
  adResults: AdAnalysisItem[]
): OptimizationStep[] {
  const steps: OptimizationStep[] = [];
  let stepNum = 1;

  // Pausar losers
  const losers = adSetResults.filter(a => a.classification === 'loser');
  if (losers.length > 0) {
    steps.push({
      step: stepNum++,
      action: 'Pausar ad sets com score < 35',
      target: losers.map(l => l.name).join(', '),
      expectedResult: `Economizar ${formatBRL(losers.reduce((s, l) => s + l.spend, 0))}/dia`,
      timeline: 'Imediato',
    });
  }

  // Escalar winners
  const winners = adSetResults.filter(a => a.classification === 'winner');
  if (winners.length > 0) {
    steps.push({
      step: stepNum++,
      action: 'Aumentar budget em 20% dos winners',
      target: winners.map(w => w.name).join(', '),
      expectedResult: 'Escalar receita mantendo ROAS',
      timeline: '24h',
    });
  }

  // Testar novos criativos
  const badAds = adResults.filter(a => a.score < 40);
  if (badAds.length > 0) {
    steps.push({
      step: stepNum++,
      action: 'Substituir criativos com score < 40',
      target: `${badAds.length} anúncio(s)`,
      expectedResult: 'Melhorar CTR e conversão',
      timeline: '48h',
    });
  }

  // Otimizar audience
  if (metrics.roasGeral < BENCHMARKS.roas.breakeven) {
    steps.push({
      step: stepNum++,
      action: 'Criar lookalike 1% baseado em compradores',
      target: 'Todos os ad sets',
      expectedResult: 'Melhorar qualidade do tráfego',
      timeline: '3-5 dias',
    });
  }

  // Teste A/B
  steps.push({
    step: stepNum++,
    action: 'Criar teste A/B com novo ângulo de copy',
    target: 'Nova campanha de teste',
    expectedResult: 'Descobrir ângulos vencedores',
    timeline: '7 dias',
  });

  return steps;
}

// =====================================================
// FUNÇÕES EXPORTADAS (Públicas)
// =====================================================

/**
 * Análise rápida sem IA — baseada apenas em métricas agregadas
 */
export function generateSmartAnalysis(
  adsMetrics: AdsMetrics,
  campaigns: CampaignData[],
  realSales?: { totalRevenue: number; totalSales: number; avgTicket: number }
): SmartAnalysisResult {
  const metrics: PerformanceMetrics = {
    gastoTotal: adsMetrics.totalSpend,
    receitaTotal: realSales?.totalRevenue ?? adsMetrics.totalPurchaseValue,
    roasGeral: realSales
      ? (adsMetrics.totalSpend > 0 ? realSales.totalRevenue / adsMetrics.totalSpend : 0)
      : adsMetrics.roas,
    cpaGeral: adsMetrics.cpa,
    ctrMedio: adsMetrics.avgCtr,
    totalVendas: realSales?.totalSales ?? adsMetrics.totalPurchases,
  };

  const { total, breakdown } = calculateHealthScore(metrics, campaigns);
  const status = scoreToStatus(total);
  const insights = generateInsights(metrics, campaigns);
  const recommendations = generateRecommendations(metrics, campaigns, insights);
  const benchmarkComparison = compareBenchmarks(metrics);

  return {
    healthScore: total,
    healthBreakdown: breakdown,
    status,
    insights,
    recommendations,
    metrics,
    benchmarkComparison,
  };
}

/**
 * Análise completa sem IA — inclui ad sets e ads individuais
 */
export function generateFullAnalysis(
  adsMetrics: AdsMetrics,
  campaigns: CampaignData[],
  adSets: AdSetData[],
  ads: AdData[],
  realSales?: { totalRevenue: number; totalSales: number; avgTicket: number }
): FullAnalysisResult {
  const base = generateSmartAnalysis(adsMetrics, campaigns, realSales);
  const adSetAnalysis = analyzeAdSets(adSets);
  const adAnalysis = analyzeAds(ads);
  const optimizationPlan = generateOptimizationPlan(base.metrics, adSetAnalysis, adAnalysis);

  return {
    ...base,
    adSetAnalysis,
    adAnalysis,
    optimizationPlan,
  };
}

/**
 * Converte resultado do Smart Analyzer para formato AIAnalysisResult
 * (usado como fallback da Camada 1)
 */
export function smartToAIFormat(
  analysis: SmartAnalysisResult,
  campaigns: CampaignData[]
): import('@/lib/types/ai-performance').AIAnalysisResult {
  const winners = campaigns
    .filter(c => c.roas >= BENCHMARKS.roas.good && c.spend > 10)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

  const losers = campaigns
    .filter(c => c.spend > 20 && c.roas < BENCHMARKS.roas.breakeven)
    .sort((a, b) => a.roas - b.roas)
    .slice(0, 5);

  return {
    timestamp: new Date().toISOString(),
    statusConta: analysis.status,
    resumoExecutivo: {
      veredito: analysis.status === 'SAUDÁVEL'
        ? 'Conta performando bem. Foque em escalar as vencedoras.'
        : analysis.status === 'ATENÇÃO'
        ? 'Conta precisa de otimização. Revise campanhas com baixo ROAS.'
        : 'Conta em estado crítico. Pause sangrias e reestruture imediatamente.',
      eficienciaGasto: analysis.healthBreakdown.efficiency,
      maiorVitoria: winners[0]
        ? `${winners[0].name} com ROAS ${winners[0].roas.toFixed(2)}x`
        : 'Nenhuma campanha vencedora identificada',
      maiorAmeaca: losers[0]
        ? `${losers[0].name} gastou ${formatBRL(losers[0].spend)} com ROAS ${losers[0].roas.toFixed(2)}x`
        : 'Nenhuma ameaça crítica identificada',
    },
    acoesImediatas: analysis.recommendations.map((rec, i) => ({
      prioridade: rec.priority,
      acao: rec.action,
      motivo: rec.reason,
      impactoEsperado: rec.expectedImpact,
      urgencia: i === 0 ? 'CRÍTICA' as const : i <= 2 ? 'ALTA' as const : 'MÉDIA' as const,
    })),
    rankingCriativos: {
      vencedores: winners.map(w => ({
        nome: w.name,
        roas: w.roas,
        cpa: w.purchases > 0 ? w.spend / w.purchases : 0,
        gasto: w.spend,
        motivo: `ROAS de ${w.roas.toFixed(2)}x com CTR de ${pct(w.ctr)}`,
      })),
      perdedores: losers.map(l => ({
        nome: l.name,
        roas: l.roas,
        cpa: l.purchases > 0 ? l.spend / l.purchases : 0,
        gasto: l.spend,
        motivo: l.purchases === 0
          ? `Gastou ${formatBRL(l.spend)} sem nenhuma compra`
          : `ROAS de ${l.roas.toFixed(2)}x abaixo do breakeven`,
      })),
    },
    insightsPublicos: {
      melhoresSegmentos: ['Análise via Smart Analyzer (sem IA) — conecte a OpenAI para insights detalhados de públicos'],
      segmentosSaturados: campaigns
        .filter(c => c.frequency > BENCHMARKS.frequency.warning)
        .map(c => `${c.name} (freq: ${c.frequency.toFixed(1)})`),
      oportunidadesInexploradas: ['Lookalike 1% de compradores', 'Retargeting 3-7 dias'],
    },
    otimizacaoLP: [{
      elemento: 'Headline principal',
      problema: 'Análise automática — conecte OpenAI para sugestões detalhadas',
      sugestao: 'Testar diferentes propostas de valor no título',
      prioridade: 'média',
      impactoEstimado: '+10-20% na conversão da LP',
    }],
    laboratorioTestes: {
      proximoTeste: {
        nome: 'Teste de Criativo — Novo Hook',
        hipotese: 'Um hook mais direto nos primeiros 3 segundos aumenta CTR em 30%',
        setup: 'Duplicar melhor campanha, trocar criativo por variação com novo hook',
        orcamento: Math.round(analysis.metrics.gastoTotal * 0.1),
        duracao: '5-7 dias',
        criterioSucesso: 'CTR > 2% e CPA < R$ 20',
      },
    },
    alertas: analysis.insights
      .filter(i => i.type === 'danger' || i.type === 'warning')
      .map(i => ({
        severidade: i.type === 'danger' ? 'CRÍTICO' as const : 'ATENÇÃO' as const,
        mensagem: i.description,
        campanhasAfetadas: [],
        perdaEstimada: i.value ?? 0,
      })),
    metricas: analysis.metrics,
  };
}
