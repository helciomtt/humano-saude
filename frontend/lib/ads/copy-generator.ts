// =====================================================
// COPY GENERATOR — Geração de Copy com OpenAI
// Humano Saúde — Planos de Saúde
// =====================================================

import OpenAI from 'openai';
import type { GeneratedCopy, CampaignObjectiveKey } from './types';
import { HUMANO_SAUDE_KNOWLEDGE } from '../humano-saude-knowledge';
import { logger } from '@/lib/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Delay entre chamadas para rate limiting
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =====================================================
// SYSTEM PROMPT — Copywriter de planos de saúde
// =====================================================

function buildSystemPrompt(objective: CampaignObjectiveKey, audience: string): string {
  const kb = HUMANO_SAUDE_KNOWLEDGE;

  return `Você é um Copywriter de elite especializado em Direct Response para o segmento de planos de saúde.

EMPRESA: ${kb.companyName} — ${kb.tagline}
PROPOSTA DE VALOR: ${kb.valueProposition}

PÚBLICO-ALVO: ${audience}

BENEFÍCIOS PRINCIPAIS:
${kb.benefits.map((b) => `• ${b.title}: ${b.description}`).join('\n')}

PROVA SOCIAL:
• ${kb.socialProof.clientesAtendidos}
• ${kb.socialProof.economiaGerada}
• ${kb.socialProof.satisfacao}

OPERADORAS: ${kb.operadoras.join(', ')}

TOM DE VOZ: ${kb.copyGuidelines.tone}
EVITAR: ${kb.copyGuidelines.avoidWords.join(', ')}
PREFERIR: ${kb.copyGuidelines.preferWords.join(', ')}

OBJETIVO DA CAMPANHA: ${objective}

REGRAS:
1. Primary Text: 80-150 caracteres. Direto, com gancho emocional.
2. Headline: 20-40 caracteres. Curto, impactante.
3. Gere EXATAMENTE 3 variações de primary text e 3 headlines.
4. Cada variação deve usar um ângulo diferente (dor, ganho, prova social).
5. Inclua números/dados quando possível.
6. Nunca use linguagem sensacionalista ou promessas exageradas.
7. Responda APENAS em JSON válido.

FORMATO DE RESPOSTA (JSON):
{
  "primary_texts": ["texto1", "texto2", "texto3"],
  "headlines": ["headline1", "headline2", "headline3"],
  "recommended_cta": "LEARN_MORE"
}`;
}

// =====================================================
// GERAR COPY PARA CAMPANHA
// =====================================================

export async function generateAdCopy(
  objective: CampaignObjectiveKey,
  audience: string,
  imageUrl?: string
): Promise<GeneratedCopy> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return generateFallbackCopy(objective, audience, imageUrl);
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(objective, audience) },
    ];

    // Se tem imagem, usar GPT Vision
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analise esta imagem e gere copy para um anúncio de plano de saúde com objetivo "${objective}" para o público "${audience}". Considere os elementos visuais da imagem para contextualizar a copy.`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: `Gere copy para um anúncio de plano de saúde com objetivo "${objective}" para o público "${audience}".`,
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return generateFallbackCopy(objective, audience, imageUrl);

    const parsed = JSON.parse(content) as {
      primary_texts: string[];
      headlines: string[];
      recommended_cta?: string;
    };

    return {
      primaryText: parsed.primary_texts || [],
      headlines: parsed.headlines || [],
      imageUrl: imageUrl || '',
      metadata: {
        cta: parsed.recommended_cta || 'LEARN_MORE',
        analysisType: imageUrl ? 'vision' : 'text-only',
      },
    };
  } catch (error) {
    logger.error('❌ Erro ao gerar copy:', error);
    return generateFallbackCopy(objective, audience, imageUrl);
  }
}

// =====================================================
// GERAR COPIES PARA MÚLTIPLAS IMAGENS
// =====================================================

export async function generateCopiesForImages(
  imageUrls: string[],
  objective: CampaignObjectiveKey,
  audience: string
): Promise<GeneratedCopy[]> {
  const results: GeneratedCopy[] = [];

  for (const url of imageUrls) {
    const copy = await generateAdCopy(objective, audience, url);
    results.push(copy);
    await delay(500); // Rate limiting
  }

  return results;
}

// =====================================================
// ANALISAR IMAGEM E GERAR COPY CONTEXTUALIZADA
// =====================================================

export async function analyzeImageAndGenerateCopy(
  imageUrl: string,
  objective: CampaignObjectiveKey,
  audience: string
): Promise<GeneratedCopy> {
  return generateAdCopy(objective, audience, imageUrl);
}

// =====================================================
// REFINAR COPY EXISTENTE
// =====================================================

export async function refineCopy(
  originalCopy: string,
  feedback: string,
  objective: CampaignObjectiveKey
): Promise<{ refined: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { refined: originalCopy };
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um editor de copy para anúncios de planos de saúde. Refine o texto mantendo o tom profissional e acolhedor da marca Humano Saúde. Objetivo da campanha: ${objective}.`,
        },
        {
          role: 'user',
          content: `COPY ORIGINAL:\n${originalCopy}\n\nFEEDBACK:\n${feedback}\n\nGere a versão refinada como texto simples (sem JSON).`,
        },
      ],
      temperature: 0.5,
    });

    return {
      refined: response.choices[0]?.message?.content || originalCopy,
    };
  } catch {
    return { refined: originalCopy };
  }
}

// =====================================================
// FALLBACK — Copy genérica quando API não disponível
// =====================================================

function generateFallbackCopy(
  objective: CampaignObjectiveKey,
  audience: string,
  imageUrl?: string
): GeneratedCopy {
  const kb = HUMANO_SAUDE_KNOWLEDGE;

  const copyMap: Record<CampaignObjectiveKey, { texts: string[]; headlines: string[] }> = {
    TRAFEGO: {
      texts: [
        `${audience}: compare planos de saúde de todas as operadoras em um só lugar. Assessoria sem custo.`,
        `Descubra quanto você pode economizar no plano de saúde. ${kb.socialProof.economiaGerada}.`,
        `Plano de saúde ideal para ${audience.toLowerCase()}. Cotação gratuita em minutos.`,
      ],
      headlines: [
        'Compare e Economize',
        'Assessoria Gratuita',
        'Cotação em Minutos',
      ],
    },
    CONVERSAO: {
      texts: [
        `${kb.socialProof.clientesAtendidos}. Sua empresa pode ser a próxima a economizar até 30%.`,
        `Pare de pagar caro no plano de saúde. Análise gratuita do seu contrato atual.`,
        `${kb.socialProof.satisfacao} de satisfação. Encontramos o plano certo para ${audience.toLowerCase()}.`,
      ],
      headlines: [
        'Economize até 30%',
        'Análise Gratuita',
        'Plano Ideal p/ Você',
      ],
    },
    LEADS: {
      texts: [
        `Solicite uma cotação gratuita e descubra o plano de saúde ideal para ${audience.toLowerCase()}.`,
        `Em 2 minutos, receba comparativo de todas as operadoras. Sem compromisso.`,
        `Assessoria especializada em planos de saúde. ${kb.socialProof.operadoras}.`,
      ],
      headlines: [
        'Cotação Gratuita',
        'Sem Compromisso',
        'Fale com Especialista',
      ],
    },
    ENGAJAMENTO: {
      texts: [
        `Você sabia que pode economizar até 30% no plano de saúde da sua empresa?`,
        `5 erros que empresas cometem ao contratar plano de saúde. Evite o #3.`,
        `Comparamos ${kb.operadoras.length}+ operadoras para encontrar o melhor custo-benefício.`,
      ],
      headlines: [
        'Economize Agora',
        'Evite Esses Erros',
        'Saiba Mais',
      ],
    },
    ALCANCE: {
      texts: [
        `Humano Saúde: assessoria gratuita em planos de saúde para empresas e famílias.`,
        `Todas as operadoras em um só lugar. Compare e escolha o melhor para você.`,
        `Mais de 500 empresas confiam na Humano Saúde. Conheça nosso trabalho.`,
      ],
      headlines: [
        'Humano Saúde',
        'Compare Planos',
        'Conheça-nos',
      ],
    },
  };

  const copy = copyMap[objective] || copyMap.LEADS;

  return {
    primaryText: copy.texts,
    headlines: copy.headlines,
    imageUrl: imageUrl || '',
    metadata: {
      cta: 'LEARN_MORE',
      analysisType: 'fallback',
    },
  };
}
