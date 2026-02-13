// =====================================================
// PROMPT GENERATOR — Sistema de 2 Camadas
// Camada 1: Objetivo do usuário → Prompt profissional
// Humano Saúde
// =====================================================

import OpenAI from 'openai';
import type { FunnelStage, CopyAngle, PromptGeneratorResult } from './types';
import { HUMANO_SAUDE_KNOWLEDGE } from '../humano-saude-knowledge';
import { logger } from '@/lib/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// =====================================================
// DETECÇÃO AUTOMÁTICA DE FUNIL
// =====================================================

const FUNNEL_KEYWORDS: Record<FunnelStage, string[]> = {
  FUNDO: [
    'vender', 'converter', 'fechar', 'comprar', 'assinar', 'contratar',
    'remarketing', 'carrinho', 'checkout', 'pagamento', 'pedido',
    'cotação', 'proposta', 'último', 'urgente',
  ],
  MEIO: [
    'engajar', 'interesse', 'consideração', 'comparar', 'avaliar',
    'detalhes', 'benefícios', 'diferencial', 'vídeo', 'conteúdo',
    'educação', 'nutrir', 'webinar',
  ],
  TOPO: [
    'alcance', 'tráfego', 'visibilidade', 'awareness', 'conhecer',
    'descobrir', 'branding', 'marca', 'público frio', 'novo público',
  ],
};

export function detectFunnelFromObjective(objective: string): FunnelStage {
  const lower = objective.toLowerCase();

  for (const [stage, keywords] of Object.entries(FUNNEL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return stage as FunnelStage;
    }
  }

  // Default: MEIO (equilíbrio)
  return 'MEIO';
}

// =====================================================
// GERAR PROMPT PROFISSIONAL DE COPYWRITING
// =====================================================

export async function generateCopywritingPrompt(
  userObjective: string
): Promise<PromptGeneratorResult> {
  const kb = HUMANO_SAUDE_KNOWLEDGE;
  const detectedFunnel = detectFunnelFromObjective(userObjective);

  // Se não tem OpenAI, retorna análise sem prompt IA
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackPrompt(userObjective, detectedFunnel);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um Diretor de Copy de uma agência de performance. Sua função é analisar o objetivo do anunciante e gerar um PROMPT PROFISSIONAL DE COPYWRITING que será usado por outra IA para criar anúncios.

CONTEXTO DO PRODUTO:
- Empresa: ${kb.companyName}
- Segmento: Assessoria de planos de saúde
- Proposta: ${kb.valueProposition}
- Público: Empresas PME, famílias, autônomos buscando planos de saúde
- Diferencial: Assessoria gratuita, comparação de 15+ operadoras

Responda APENAS em JSON com o formato:
{
  "professionalPrompt": "O prompt profissional completo para gerar copy",
  "analysis": {
    "funnelStage": "TOPO|MEIO|FUNDO",
    "intent": "awareness|consideration|conversion|remarketing",
    "copyAngle": "pain|gain|urgency|social_proof|curiosity",
    "targetAudience": "descrição do público",
    "ctaStyle": "baixa_friccao|urgente|educacional"
  }
}`,
        },
        {
          role: 'user',
          content: `OBJETIVO DO ANUNCIANTE: "${userObjective}"\n\nFUNIL DETECTADO: ${detectedFunnel}\n\nGere o prompt profissional.`,
        },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return buildFallbackPrompt(userObjective, detectedFunnel);

    const parsed = JSON.parse(content) as PromptGeneratorResult;

    // Garantir que o funil detectado está correto
    if (!parsed.analysis.funnelStage) {
      parsed.analysis.funnelStage = detectedFunnel;
    }

    return parsed;
  } catch (error) {
    logger.error('❌ Erro no prompt generator:', error);
    return buildFallbackPrompt(userObjective, detectedFunnel);
  }
}

// =====================================================
// FALLBACK
// =====================================================

function buildFallbackPrompt(
  userObjective: string,
  funnelStage: FunnelStage
): PromptGeneratorResult {
  const kb = HUMANO_SAUDE_KNOWLEDGE;

  const angleMap: Record<FunnelStage, CopyAngle> = {
    TOPO: 'curiosity',
    MEIO: 'gain',
    FUNDO: 'urgency',
  };

  const intentMap: Record<FunnelStage, 'awareness' | 'consideration' | 'conversion'> = {
    TOPO: 'awareness',
    MEIO: 'consideration',
    FUNDO: 'conversion',
  };

  const ctaMap: Record<FunnelStage, 'baixa_friccao' | 'urgente' | 'educacional'> = {
    TOPO: 'educacional',
    MEIO: 'baixa_friccao',
    FUNDO: 'urgente',
  };

  return {
    professionalPrompt: `Copywriter de elite, gere anúncios para ${kb.companyName} — assessoria gratuita em planos de saúde. Funil: ${funnelStage}. Objetivo: ${userObjective}. Ângulo: ${angleMap[funnelStage]}. Tom profissional e acolhedor. Inclua números de prova social (${kb.socialProof.clientesAtendidos}, ${kb.socialProof.satisfacao}).`,
    analysis: {
      funnelStage,
      intent: intentMap[funnelStage],
      copyAngle: angleMap[funnelStage],
      targetAudience: 'Empresas e famílias buscando planos de saúde',
      ctaStyle: ctaMap[funnelStage],
    },
  };
}
