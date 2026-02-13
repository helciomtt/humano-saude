// =====================================================
// CAMADA 1 — Performance Intelligence Engine
// Motor principal de IA — GPT para análise completa
// Fallback automático para Camada 3 (Smart Analyzer)
// =====================================================

import type {
  PerformanceData,
  AIAnalysisResult,
  CampaignData,
} from '@/lib/types/ai-performance';
import { smartToAIFormat, generateSmartAnalysis } from '@/lib/smart-analyzer';
import type { AdsMetrics } from '@/lib/meta-marketing';
import { logger } from '@/lib/logger';

// =====================================================
// SYSTEM PROMPT — Identidade da IA para Humano Saúde
// =====================================================

const SYSTEM_PROMPT = `Você é o Performance Intelligence Engine da Humano Saúde — um Diretor de Tráfego Pago Sênior com 15 anos de experiência em health insurance digital marketing, combinado com Cientista de Dados e CRO Specialist.

## CONTEXTO DO PRODUTO
- Empresa: Humano Saúde — corretora de planos de saúde digital
- Produto: Planos de saúde (Unimed, Bradesco Saúde, SulAmérica, Amil, NotreDame, etc.)
- Ticket médio: R$ 300-800/mês (recorrente)
- Público: Pessoas físicas e PMEs buscando plano de saúde com economia
- Proposta de valor: Economia de até 40% na troca inteligente de plano
- Canal principal: Meta Ads → Landing Page → WhatsApp → Fechamento

## KPIs DE REFERÊNCIA
- CPA: Ideal < R$18, Aceitável < R$30, Crítico > R$40
- ROAS: Escalar > 3.5x, Manter > 2.5x, Pausar < 2.0x
- CTR: Excelente > 2.5%, Bom > 1.5%, Ruim < 1.0%
- CPL (Custo por Lead): Ideal < R$8, Aceitável < R$15
- LP Conversion: > 5% (PageView → Lead)
- Fechamento: > 15% (Lead → Venda)

## REGRAS DE COMPORTAMENTO
1. QUANTIFIQUE TUDO — nunca diga "melhorar CTR", diga "aumentar CTR de 1.2% para 2.0% testando hook de economia nos primeiros 3s"
2. ZERO GENÉRICO — cada insight deve ter número, campanha afetada e ação específica
3. PRIORIZE POR IMPACTO — ordene ações por R$ impactado (maior primeiro)
4. IDENTIFIQUE SANGRIAS — campanhas gastando sem compra são prioridade 1
5. SEJA DIRETO — tom clínico, sem enrolação, orientado a ação
6. ESCALA INTELIGENTE — nunca aumente budget em mais de 20% por vez
7. CONTEXTO SAZONAL — considere dia da semana, horários de pico, feriados

## FORMATO DE RESPOSTA
Retorne SEMPRE um JSON válido com a estrutura exata solicitada. Sem markdown fora do JSON.`;

// =====================================================
// HELPER — Preparar dados para o prompt
// =====================================================

export function prepareDataForAI(data: PerformanceData): string {
  const summary = {
    periodo: data.period,
    totalCampanhas: data.campaigns.length,
    campanhasAtivas: data.campaigns.filter(c => c.status === 'ACTIVE').length,
    campanhas: data.campaigns.map(c => ({
      nome: c.name,
      status: c.status,
      gasto: c.spend,
      impressoes: c.impressions,
      cliques: c.clicks,
      ctr: c.ctr,
      cpc: c.cpc,
      compras: c.purchases,
      receita: c.purchaseValue,
      roas: c.roas,
      frequencia: c.frequency,
    })),
    adSets: data.adSets.slice(0, 20).map(a => ({
      nome: a.name,
      campanha: a.campaignId,
      gasto: a.spend,
      ctr: a.ctr,
      roas: a.roas,
      frequencia: a.frequency,
    })),
    ads: data.ads.slice(0, 30).map(a => ({
      nome: a.name,
      gasto: a.spend,
      ctr: a.ctr,
      roas: a.roas,
      compras: a.purchases,
    })),
    vendasReais: data.realSales,
  };

  return JSON.stringify(summary, null, 2);
}

// =====================================================
// PROMPTS POR TIPO DE ANÁLISE
// =====================================================

type AnalysisPromptType = 'full' | 'quick' | 'creative' | 'audience' | 'funnel';

export function generateAnalysisPrompt(type: AnalysisPromptType, dataJson: string): string {
  const baseInstruction = `Analise os seguintes dados de Meta Ads da Humano Saúde:\n\n${dataJson}\n\n`;

  switch (type) {
    case 'full':
      return `${baseInstruction}
Retorne um JSON com EXATAMENTE esta estrutura:
{
  "statusConta": "SAUDÁVEL" | "ATENÇÃO" | "CRÍTICO",
  "resumoExecutivo": {
    "veredito": "string (1-2 frases diretas)",
    "eficienciaGasto": number (0-100),
    "maiorVitoria": "string",
    "maiorAmeaca": "string"
  },
  "acoesImediatas": [{ "prioridade": number, "acao": "string", "motivo": "string", "impactoEsperado": "string R$", "urgencia": "CRÍTICA|ALTA|MÉDIA|BAIXA" }],
  "rankingCriativos": {
    "vencedores": [{ "nome": "string", "roas": number, "cpa": number, "gasto": number, "motivo": "string" }],
    "perdedores": [{ "nome": "string", "roas": number, "cpa": number, "gasto": number, "motivo": "string" }]
  },
  "insightsPublicos": {
    "melhoresSegmentos": ["string"],
    "segmentosSaturados": ["string"],
    "oportunidadesInexploradas": ["string"]
  },
  "otimizacaoLP": [{ "elemento": "string", "problema": "string", "sugestao": "string", "prioridade": "string", "impactoEstimado": "string" }],
  "laboratorioTestes": {
    "proximoTeste": { "nome": "string", "hipotese": "string", "setup": "string", "orcamento": number, "duracao": "string", "criterioSucesso": "string" }
  },
  "alertas": [{ "severidade": "CRÍTICO|ATENÇÃO|INFO", "mensagem": "string", "campanhasAfetadas": ["string"], "perdaEstimada": number }],
  "metricas": { "gastoTotal": number, "receitaTotal": number, "roasGeral": number, "cpaGeral": number, "ctrMedio": number, "totalVendas": number }
}`;

    case 'quick':
      return `${baseInstruction}
Faça uma análise rápida (3 minutos de leitura) em formato Markdown:
1. Status geral da conta (1 emoji + 1 frase)
2. Top 3 ações urgentes (com números específicos)
3. Campanha destaque (a melhor)
4. Maior problema (a pior)
5. Budget ideal para amanhã

Seja direto, clínico, sem enrolação.`;

    case 'creative':
      return `${baseInstruction}Foque APENAS nos criativos (ads). Identifique padrões: quais tipos de hook, formato (video/image), e proposta funcionam melhor. Retorne ranking e sugestões de novos criativos.`;

    case 'audience':
      return `${baseInstruction}Foque APENAS em análise de públicos. Identifique segmentos saturados (frequência alta), oportunidades inexploradas, e recomendações de lookalikes. Retorne em Markdown.`;

    case 'funnel':
      return `${baseInstruction}Analise por estágio de funil (TOPO/MEIO/FUNDO). Para cada estágio: % do budget, eficiência, e recomendação de redistribuição. Retorne em Markdown.`;
  }
}

// =====================================================
// CHAMADA OPENAI
// =====================================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenAI(
  prompt: string,
  systemPrompt: string = SYSTEM_PROMPT,
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  const body: Record<string, unknown> = {
    model: 'gpt-4o',
    messages,
    temperature: 0.3,
    max_tokens: 4000,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI Error: ${response.status} — ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content ?? '';
}

// =====================================================
// FUNÇÕES EXPORTADAS
// =====================================================

/**
 * Análise completa via IA — com fallback automático para Smart Analyzer
 */
export async function runFullAIAnalysis(data: PerformanceData): Promise<AIAnalysisResult> {
  try {
    const dataJson = prepareDataForAI(data);
    const prompt = generateAnalysisPrompt('full', dataJson);
    const response = await callOpenAI(prompt, SYSTEM_PROMPT, true);
    const parsed = JSON.parse(response);

    return {
      timestamp: new Date().toISOString(),
      statusConta: parsed.statusConta ?? 'ATENÇÃO',
      resumoExecutivo: parsed.resumoExecutivo ?? { veredito: '', eficienciaGasto: 0, maiorVitoria: '', maiorAmeaca: '' },
      acoesImediatas: parsed.acoesImediatas ?? [],
      rankingCriativos: parsed.rankingCriativos ?? { vencedores: [], perdedores: [] },
      insightsPublicos: parsed.insightsPublicos ?? { melhoresSegmentos: [], segmentosSaturados: [], oportunidadesInexploradas: [] },
      otimizacaoLP: parsed.otimizacaoLP ?? [],
      laboratorioTestes: parsed.laboratorioTestes ?? { proximoTeste: { nome: '', hipotese: '', setup: '', orcamento: 0, duracao: '', criterioSucesso: '' } },
      alertas: parsed.alertas ?? [],
      metricas: parsed.metricas ?? { gastoTotal: 0, receitaTotal: 0, roasGeral: 0, cpaGeral: 0, ctrMedio: 0, totalVendas: 0 },
    };
  } catch (error) {
    logger.warn('OpenAI falhou, usando Smart Analyzer como fallback', { error: error instanceof Error ? error.message : String(error) });
    return runLocalAnalysis(data);
  }
}

/**
 * Análise rápida via IA — retorna Markdown
 */
export async function runQuickAnalysis(data: PerformanceData): Promise<string> {
  try {
    const dataJson = prepareDataForAI(data);
    const prompt = generateAnalysisPrompt('quick', dataJson);
    return await callOpenAI(prompt);
  } catch {
    return '⚠️ IA indisponível. Use a análise local (Smart Analyzer) para insights em tempo real.';
  }
}

/**
 * Chat interativo com a IA sobre campanhas
 */
export async function chatWithAI(
  message: string,
  context?: PerformanceData
): Promise<string> {
  const contextStr = context
    ? `\n\nContexto atual das campanhas:\n${prepareDataForAI(context)}`
    : '';

  const prompt = `${message}${contextStr}`;

  const chatSystemPrompt = `${SYSTEM_PROMPT}\n\nVocê está em modo CHAT. Responda de forma conversacional mas sempre com dados e ações específicas. Use Markdown para formatação.`;

  try {
    return await callOpenAI(prompt, chatSystemPrompt);
  } catch {
    return '⚠️ Não foi possível conectar à IA neste momento. Tente novamente em alguns instantes.';
  }
}

/**
 * Análise LOCAL (fallback) — usa Smart Analyzer
 * Funciona SEM OpenAI, 100% baseado em regras
 */
export function runLocalAnalysis(data: PerformanceData): AIAnalysisResult {
  const adsMetrics: AdsMetrics = {
    totalSpend: data.campaigns.reduce((s, c) => s + c.spend, 0),
    totalImpressions: data.campaigns.reduce((s, c) => s + c.impressions, 0),
    totalClicks: data.campaigns.reduce((s, c) => s + c.clicks, 0),
    totalReach: data.campaigns.reduce((s, c) => s + c.reach, 0),
    totalPurchases: data.campaigns.reduce((s, c) => s + c.purchases, 0),
    totalPurchaseValue: data.campaigns.reduce((s, c) => s + c.purchaseValue, 0),
    totalLeads: data.campaigns.reduce((s, c) => s + c.leads, 0),
    roas: 0,
    cpa: 0,
    cpl: 0,
    avgCpc: 0,
    avgCtr: 0,
    avgCpm: 0,
  };

  // Recalcular métricas derivadas
  adsMetrics.roas = adsMetrics.totalSpend > 0
    ? (data.realSales.totalRevenue || adsMetrics.totalPurchaseValue) / adsMetrics.totalSpend
    : 0;
  adsMetrics.cpa = adsMetrics.totalPurchases > 0
    ? adsMetrics.totalSpend / adsMetrics.totalPurchases
    : 0;
  adsMetrics.cpl = adsMetrics.totalLeads > 0
    ? adsMetrics.totalSpend / adsMetrics.totalLeads
    : 0;
  adsMetrics.avgCpc = adsMetrics.totalClicks > 0
    ? adsMetrics.totalSpend / adsMetrics.totalClicks
    : 0;
  adsMetrics.avgCtr = adsMetrics.totalImpressions > 0
    ? (adsMetrics.totalClicks / adsMetrics.totalImpressions) * 100
    : 0;
  adsMetrics.avgCpm = adsMetrics.totalImpressions > 0
    ? (adsMetrics.totalSpend / adsMetrics.totalImpressions) * 1000
    : 0;

  const smartResult = generateSmartAnalysis(
    adsMetrics,
    data.campaigns,
    data.realSales.totalRevenue > 0 ? data.realSales : undefined
  );

  return smartToAIFormat(smartResult, data.campaigns);
}
