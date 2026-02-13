// =====================================================
// CAMADA 2 — AI Campaign Advisor
// Análise de campanhas com Chat interativo (GPT)
// Fallback para regras locais se OpenAI cair
// =====================================================

import type {
  AdvisorAnalysisResult,
  CampaignInsightAI,
  CampaignData,
  PerformanceMetrics,
} from '@/lib/types/ai-performance';
import type { AdsMetrics } from '@/lib/meta-marketing';
import { logger } from '@/lib/logger';

// =====================================================
// CACHE EM MEMÓRIA (6h TTL)
// =====================================================

const cache = new Map<string, { data: AdvisorAnalysisResult; expiry: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

function getCached(key: string): AdvisorAnalysisResult | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: AdvisorAnalysisResult): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// =====================================================
// SYSTEM PROMPT PARA ADVISOR
// =====================================================

const ADVISOR_PROMPT = `Você é o AI Campaign Advisor da Humano Saúde — especialista em otimização de campanhas de Meta Ads para corretoras de planos de saúde.

## REGRAS
1. Analise cada campanha individualmente E o conjunto
2. Identifique padrões de performance e anomalias
3. Priorize ações por impacto financeiro (R$)
4. Seja específico — cite nomes de campanhas, valores exatos
5. Considere o contexto de planos de saúde (ticket recorrente, LTV alto)

## BENCHMARKS SAÚDE BR
- CTR bom: > 1.5% | CPA aceitável: < R$30 | ROAS escalar: > 3x
- CPL ideal: < R$8 | Frequência máxima: 3x/semana

Retorne SEMPRE JSON válido com esta estrutura:
{
  "summary": "string (2-3 frases resumo)",
  "insights": [{ "type": "success|warning|danger|info", "title": "string", "description": "string", "metric": "string", "impact": "HIGH|MEDIUM|LOW" }],
  "recommendations": ["string (ação específica)"],
  "healthScore": number (0-100)
}`;

// =====================================================
// CHAMADA OPENAI
// =====================================================

async function callAdvisorAI(prompt: string, systemPrompt: string = ADVISOR_PROMPT): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const result = await response.json();
  return result.choices?.[0]?.message?.content ?? '{}';
}

// =====================================================
// FUNÇÕES EXPORTADAS
// =====================================================

/**
 * Análise completa de todas as campanhas via GPT
 */
export async function analyzeCampaigns(
  metrics: AdsMetrics,
  campaigns: CampaignData[],
  period: string = 'last_7d'
): Promise<AdvisorAnalysisResult> {
  const cacheKey = `ai-analysis-${period}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const dataStr = JSON.stringify({
    metricas_gerais: {
      gasto: metrics.totalSpend,
      impressoes: metrics.totalImpressions,
      cliques: metrics.totalClicks,
      compras: metrics.totalPurchases,
      receita: metrics.totalPurchaseValue,
      leads: metrics.totalLeads,
      roas: metrics.roas,
      cpa: metrics.cpa,
      ctr: metrics.avgCtr,
    },
    campanhas: campaigns.slice(0, 20).map(c => ({
      nome: c.name,
      status: c.status,
      gasto: c.spend,
      impressoes: c.impressions,
      cliques: c.clicks,
      compras: c.purchases,
      receita: c.purchaseValue,
      roas: c.roas,
      ctr: c.ctr,
      cpc: c.cpc,
      frequencia: c.frequency,
    })),
    periodo: period,
  }, null, 2);

  try {
    const response = await callAdvisorAI(`Analise estas campanhas de Meta Ads:\n\n${dataStr}`);
    const parsed = JSON.parse(response);

    const result: AdvisorAnalysisResult = {
      summary: parsed.summary ?? 'Análise indisponível',
      insights: (parsed.insights ?? []).map((i: Record<string, string>) => ({
        type: i.type ?? 'info',
        title: i.title ?? '',
        description: i.description ?? '',
        metric: i.metric,
        impact: i.impact as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      })),
      recommendations: parsed.recommendations ?? [],
      healthScore: parsed.healthScore ?? 50,
      generatedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.warn('AI Advisor falhou, usando fallback local', { error: error instanceof Error ? error.message : String(error) });
    return generateFallbackAnalysis(metrics, campaigns);
  }
}

/**
 * Análise de uma campanha individual
 */
export async function analyzeSingleCampaign(campaign: CampaignData): Promise<string> {
  const prompt = `Dê 3 dicas rápidas e específicas para esta campanha:
Nome: ${campaign.name}
Gasto: R$ ${campaign.spend.toFixed(2)}
CTR: ${campaign.ctr.toFixed(2)}%
ROAS: ${campaign.roas.toFixed(2)}x
CPA: ${campaign.purchases > 0 ? (campaign.spend / campaign.purchases).toFixed(2) : 'N/A'}
Compras: ${campaign.purchases}
Frequência: ${campaign.frequency.toFixed(1)}

Retorne JSON: { "tips": ["string", "string", "string"] }`;

  try {
    const response = await callAdvisorAI(prompt);
    const parsed = JSON.parse(response);
    return (parsed.tips ?? []).join('\n• ');
  } catch {
    return 'IA indisponível — analise manualmente CTR, ROAS e frequência.';
  }
}

/**
 * Chat interativo sobre campanhas com histórico
 */
export async function chatAboutCampaigns(
  question: string,
  metrics: AdsMetrics,
  campaigns: CampaignData[],
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '⚠️ IA não configurada. Configure OPENAI_API_KEY nas variáveis de ambiente.';

  const context = `Dados atuais:\nGasto: R$ ${metrics.totalSpend.toFixed(2)} | ROAS: ${metrics.roas.toFixed(2)}x | CPA: R$ ${metrics.cpa.toFixed(2)} | CTR: ${metrics.avgCtr.toFixed(2)}%\nCampanhas: ${campaigns.length} (${campaigns.filter(c => c.status === 'ACTIVE').length} ativas)`;

  const messages = [
    { role: 'system' as const, content: `${ADVISOR_PROMPT}\n\nModo CHAT — responda em Markdown conversacional.\n\n${context}` },
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: question },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const result = await response.json();
    return result.choices?.[0]?.message?.content ?? 'Sem resposta da IA.';
  } catch {
    return '⚠️ Não foi possível conectar à IA. Tente novamente.';
  }
}

/**
 * Fallback LOCAL — análise por regras quando OpenAI está indisponível
 */
export function generateFallbackAnalysis(
  metrics: AdsMetrics,
  campaigns: CampaignData[]
): AdvisorAnalysisResult {
  const insights: CampaignInsightAI[] = [];
  let healthScore = 60;

  // ROAS geral
  if (metrics.roas >= 3) {
    insights.push({ type: 'success', title: 'ROAS Forte', description: `ROAS de ${metrics.roas.toFixed(2)}x — acima do target de escalada.`, impact: 'HIGH' });
    healthScore += 15;
  } else if (metrics.roas < 2) {
    insights.push({ type: 'danger', title: 'ROAS Abaixo do Breakeven', description: `ROAS de ${metrics.roas.toFixed(2)}x — otimize ou pause campanhas ruins.`, impact: 'HIGH' });
    healthScore -= 20;
  }

  // Sangrias
  const bleeders = campaigns.filter(c => c.spend > 30 && c.purchases === 0);
  if (bleeders.length > 0) {
    insights.push({
      type: 'danger',
      title: `${bleeders.length} Campanha(s) Sangrando`,
      description: `R$ ${bleeders.reduce((s, c) => s + c.spend, 0).toFixed(2)} gastos sem retorno.`,
      impact: 'HIGH',
    });
    healthScore -= 15;
  }

  // CTR
  if (metrics.avgCtr < 1.0) {
    insights.push({ type: 'warning', title: 'CTR Baixo', description: `CTR de ${metrics.avgCtr.toFixed(2)}% — revise criativos.`, impact: 'MEDIUM' });
    healthScore -= 5;
  }

  // Winners
  const winners = campaigns.filter(c => c.roas >= 3 && c.spend > 20);
  if (winners.length > 0) {
    insights.push({ type: 'success', title: `${winners.length} Vencedora(s)`, description: `Escale com +20% de budget.`, impact: 'HIGH' });
    healthScore += 10;
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  const recommendations: string[] = [];
  if (bleeders.length > 0) recommendations.push(`Pausar ${bleeders.length} campanhas sem compras`);
  if (winners.length > 0) recommendations.push(`Escalar ${winners.length} campanhas com ROAS > 3x`);
  if (metrics.avgCtr < 1.5) recommendations.push('Testar 3-5 novos criativos com hooks diferentes');
  recommendations.push('Criar lookalike 1% baseado em compradores dos últimos 30 dias');

  return {
    summary: `Conta com ${campaigns.length} campanhas. ROAS geral: ${metrics.roas.toFixed(2)}x. ${bleeders.length > 0 ? `⚠️ ${bleeders.length} sangria(s) detectada(s).` : 'Sem sangrias detectadas.'}`,
    insights,
    recommendations,
    healthScore,
    generatedAt: new Date().toISOString(),
  };
}
