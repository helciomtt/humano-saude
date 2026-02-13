// =====================================================
// CREATIVE ANALYZER — Análise de Criativos via OpenAI
// Analisa performance e gera recomendações para ads
// =====================================================

import OpenAI from 'openai';
import { HUMANO_SAUDE_KNOWLEDGE } from '../humano-saude-knowledge';
import { logger } from '@/lib/logger';

// =====================================================
// TIPOS INTERNOS
// =====================================================

interface AdCreativeData {
  id: string;
  name: string;
  primaryText?: string;
  headline?: string;
  description?: string;
  imageUrl?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

interface AnalysisOptions {
  includeVisual?: boolean;
  compareTopPerformers?: boolean;
  maxCreatives?: number;
}

export interface PerformanceAnalysis {
  creativeId: string;
  creativeName: string;
  qualityScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  brandAligned: boolean;
  copyAnalysis: {
    primaryText: { score: number; feedback: string };
    headline: { score: number; feedback: string };
  } | null;
  predictedCtr: string;
  overallVerdict: string;
  analyzedAt: string;
}

export interface BatchAnalysisResult {
  totalAnalyzed: number;
  analyses: PerformanceAnalysis[];
  topPerformer: PerformanceAnalysis | null;
  worstPerformer: PerformanceAnalysis | null;
  averageScore: number;
  commonWeaknesses: string[];
  commonStrengths: string[];
  errors: string[];
  analyzedAt: string;
}

// =====================================================
// OPENAI CLIENT
// =====================================================

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn('⚠️ OPENAI_API_KEY não configurada');
    return null;
  }
  return new OpenAI({ apiKey });
}

// =====================================================
// ANALISAR CRIATIVO INDIVIDUAL
// =====================================================

export async function analyzeCreative(
  creative: AdCreativeData,
  options: AnalysisOptions = {}
): Promise<PerformanceAnalysis | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const knowledge = HUMANO_SAUDE_KNOWLEDGE;

  const systemPrompt = `Você é um especialista em Meta Ads para o setor de saúde suplementar no Brasil.
A empresa é "${knowledge.companyName}" — ${knowledge.tagline}.
Proposta de valor: ${knowledge.valueProposition}

Analise o criativo de anúncio abaixo e forneça:
1. Score de qualidade (0-100)
2. Pontos fortes
3. Pontos fracos
4. Sugestões de melhoria específicas
5. Se o copy está alinhado com a marca

Responda APENAS em JSON válido com a estrutura:
{
  "qualityScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[],
  "brandAligned": boolean,
  "copyAnalysis": {
    "primaryText": { "score": number, "feedback": string },
    "headline": { "score": number, "feedback": string }
  },
  "predictedCtr": string,
  "overallVerdict": string
}`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Se incluir análise visual
  if (options.includeVisual && creative.imageUrl) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analise este criativo:
- Nome: ${creative.name}
- Texto principal: ${creative.primaryText || 'N/A'}
- Título: ${creative.headline || 'N/A'}
- Descrição: ${creative.description || 'N/A'}
- Métricas: CTR ${creative.ctr.toFixed(2)}%, CPC R$${creative.cpc.toFixed(2)}, CPA R$${creative.cpa.toFixed(2)}, ROAS ${creative.roas.toFixed(2)}x
- Gasto: R$${creative.spend.toFixed(2)}
- Impressões: ${creative.impressions.toLocaleString()}
- Conversões: ${creative.conversions}`,
        },
        {
          type: 'image_url',
          image_url: { url: creative.imageUrl, detail: 'low' },
        },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: `Analise este criativo:
- Nome: ${creative.name}
- Texto principal: ${creative.primaryText || 'N/A'}
- Título: ${creative.headline || 'N/A'}
- Descrição: ${creative.description || 'N/A'}
- Métricas: CTR ${creative.ctr.toFixed(2)}%, CPC R$${creative.cpc.toFixed(2)}, CPA R$${creative.cpa.toFixed(2)}, ROAS ${creative.roas.toFixed(2)}x
- Gasto: R$${creative.spend.toFixed(2)}
- Impressões: ${creative.impressions.toLocaleString()}
- Conversões: ${creative.conversions}`,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      creativeId: creative.id,
      creativeName: creative.name,
      qualityScore: parsed.qualityScore || 0,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
      brandAligned: parsed.brandAligned ?? true,
      copyAnalysis: parsed.copyAnalysis || null,
      predictedCtr: parsed.predictedCtr || '',
      overallVerdict: parsed.overallVerdict || '',
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('❌ Erro na análise do criativo:', error);
    return null;
  }
}

// =====================================================
// ANALISAR MÚLTIPLOS CRIATIVOS (BATCH)
// =====================================================

export async function analyzeCreatives(
  creatives: AdCreativeData[],
  options: AnalysisOptions = {}
): Promise<BatchAnalysisResult> {
  const maxCreatives = options.maxCreatives || 10;
  const toAnalyze = creatives.slice(0, maxCreatives);

  const analyses: PerformanceAnalysis[] = [];
  const errors: string[] = [];

  for (const creative of toAnalyze) {
    try {
      const analysis = await analyzeCreative(creative, options);
      if (analysis) {
        analyses.push(analysis);
      } else {
        errors.push(`Falha ao analisar: ${creative.name}`);
      }
    } catch (error) {
      errors.push(`Erro em ${creative.name}: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  // Ranking por qualityScore
  analyses.sort((a, b) => b.qualityScore - a.qualityScore);

  return {
    totalAnalyzed: analyses.length,
    analyses,
    topPerformer: analyses[0] || null,
    worstPerformer: analyses[analyses.length - 1] || null,
    averageScore:
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length
        : 0,
    commonWeaknesses: findCommonItems(analyses.map((a) => a.weaknesses)),
    commonStrengths: findCommonItems(analyses.map((a) => a.strengths)),
    errors,
    analyzedAt: new Date().toISOString(),
  };
}

// =====================================================
// COMPARAR TOP vs BOTTOM PERFORMERS
// =====================================================

export async function comparePerformance(
  creatives: AdCreativeData[]
): Promise<string | null> {
  const openai = getOpenAIClient();
  if (!openai || creatives.length < 2) return null;

  // Ordenar por conversões/gasto (eficiência)
  const sorted = [...creatives].sort((a, b) => {
    const effA = a.spend > 0 ? a.conversions / a.spend : 0;
    const effB = b.spend > 0 ? b.conversions / b.spend : 0;
    return effB - effA;
  });

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3);

  const prompt = `Compare os criativos TOP performers vs BOTTOM performers de Meta Ads para Humano Saúde (assessoria de planos de saúde).

TOP PERFORMERS:
${top3.map((c) => `- "${c.headline}" | CTR: ${c.ctr.toFixed(2)}% | CPA: R$${c.cpa.toFixed(2)} | ROAS: ${c.roas.toFixed(2)}x | Conversões: ${c.conversions}`).join('\n')}

BOTTOM PERFORMERS:
${bottom3.map((c) => `- "${c.headline}" | CTR: ${c.ctr.toFixed(2)}% | CPA: R$${c.cpa.toFixed(2)} | ROAS: ${c.roas.toFixed(2)}x | Conversões: ${c.conversions}`).join('\n')}

Identifique:
1. Padrões de sucesso nos tops
2. Erros comuns nos bottoms
3. 3 ações concretas para melhorar a performance geral
4. Sugestões de novos ângulos de copy baseados nos tops`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um estrategista de mídia paga especializado em saúde suplementar no Brasil.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    logger.error('❌ Erro na comparação:', error);
    return null;
  }
}

// =====================================================
// HELPERS
// =====================================================

function findCommonItems(arrays: string[][]): string[] {
  if (arrays.length === 0) return [];

  const frequency: Record<string, number> = {};
  for (const arr of arrays) {
    const unique = [...new Set(arr)];
    for (const item of unique) {
      frequency[item] = (frequency[item] || 0) + 1;
    }
  }

  // Retorna itens que aparecem em pelo menos 30% das análises
  const threshold = Math.max(2, Math.floor(arrays.length * 0.3));
  return Object.entries(frequency)
    .filter(([, count]) => count >= threshold)
    .sort(([, a], [, b]) => b - a)
    .map(([item]) => item)
    .slice(0, 5);
}
