// =====================================================
// API — /api/ai/cockpit-insight
// Cockpit IA — GPT-4o briefing + local smart analysis
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedDashboardData } from '@/lib/analytics-hub';
import { generateSmartAnalysis } from '@/lib/smart-analyzer';
import { getMarketingInsights } from '@/lib/meta-marketing';
import type { PerformancePeriod, CampaignData, SmartAnalysisResult } from '@/lib/types/ai-performance';
import { DEFAULT_BENCHMARKS, formatCurrency, formatRoas } from '@/lib/consolidator';
import { logger } from '@/lib/logger';

// Cache 10 min
let cockpitCache: { data: unknown; ts: number; period: string } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

// =====================================================
// GPT-4o ANALYSIS
// =====================================================

async function generateGPTInsight(
  metrics: Record<string, unknown>,
  campaigns: CampaignData[],
  briefing: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const top5 = campaigns
      .sort((a, b) => (b.spend || 0) - (a.spend || 0))
      .slice(0, 5)
      .map(c => `- ${c.name}: Gasto R$${(c.spend || 0).toFixed(2)}, ROAS ${(c.roas || 0).toFixed(2)}x, CTR ${(c.ctr || 0).toFixed(2)}%`)
      .join('\n');

    const prompt = `Você é um analista sênior de mídia paga especializado em planos de saúde (Humano Saúde).
Analise os dados abaixo e forneça um briefing executivo em português BR.

## Métricas Consolidadas
${briefing}

## Top 5 Campanhas por Investimento
${top5}

## Benchmarks do Setor Saúde
- ROAS mínimo: ${DEFAULT_BENCHMARKS.roasMin}x | Bom: ${DEFAULT_BENCHMARKS.roasGood}x | Excelente: ${DEFAULT_BENCHMARKS.roasExcellent}x
- CTR mínimo: ${DEFAULT_BENCHMARKS.ctrMin}% | Bom: ${DEFAULT_BENCHMARKS.ctrGood}%
- CPC máximo: R$ ${DEFAULT_BENCHMARKS.cpcMax} | CPM máximo: R$ ${DEFAULT_BENCHMARKS.cpmMax}

Responda com:
1. **Diagnóstico Geral** (1 parágrafo)
2. **3 Oportunidades** de otimização imediata
3. **2 Riscos** que precisam de atenção
4. **Ação Prioritária** para esta semana

Mantenha o tom profissional e direto. Máximo 300 palavras.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    logger.error('❌ GPT Insight Error:', error);
    return null;
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'last_7d') as PerformancePeriod;
    const useAI = searchParams.get('ai') !== 'false';

    if (cockpitCache && cockpitCache.period === period && Date.now() - cockpitCache.ts < CACHE_TTL) {
      return NextResponse.json({ success: true, data: cockpitCache.data, cached: true });
    }

    // Dados unificados + Smart Analysis em paralelo
    const [dashboard, metaResult] = await Promise.all([
      getUnifiedDashboardData(period),
      getMarketingInsights(period as 'last_7d', 'campaign'),
    ]);

    const campaigns: CampaignData[] = metaResult.campaigns.map(c => ({
      id: c.campaign_id, name: c.campaign_name, status: c.status || 'ACTIVE',
      objective: c.objective, spend: c.spend, impressions: c.impressions,
      clicks: c.clicks, reach: c.reach, purchases: c.purchases,
      purchaseValue: c.purchaseValue, leads: c.leads, roas: c.roas,
      ctr: c.ctr, cpc: c.cpc,
      cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
      frequency: c.reach > 0 ? c.impressions / c.reach : 0,
    }));

    const smartAnalysis = generateSmartAnalysis(metaResult.metrics, campaigns);

    // Gerar briefing executivo local
    const briefing = buildExecutiveBriefing(dashboard, smartAnalysis);

    // GPT-4o analysis (non-blocking, optional)
    let gptInsight: string | null = null;
    if (useAI) {
      gptInsight = await generateGPTInsight(
        metaResult.metrics as unknown as Record<string, unknown>,
        campaigns,
        briefing
      );
    }

    const result = {
      dashboard,
      smartAnalysis,
      briefing,
      gptInsight,
      hasAI: !!gptInsight,
      generatedAt: new Date().toISOString(),
    };

    cockpitCache = { data: result, ts: Date.now(), period };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Cockpit Insight Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// =====================================================
// Briefing Executivo (100% local, sem AI)
// =====================================================

interface SmartResult {
  healthScore?: number;
  status?: string;
  insights?: Array<{ type: string; title: string; description: string }>;
  recommendations?: Array<{ action: string; priority: number }>;
}

interface DashboardData {
  kpis: { roasReal: number; cpaReal: number; conversaoReal: number; ltv: number };
  investment: { totalSpend: number; activeCampaigns: number };
  financial: { totalRevenue: number; totalSales: number };
  traffic: { totalUsers: number; totalSessions: number };
  integrations: { ga4: boolean; meta: boolean; gateway: boolean };
}

function buildExecutiveBriefing(dashboard: DashboardData, analysis: SmartResult) {
  const { kpis, investment, financial, traffic } = dashboard;

  const lines: string[] = [];

  // Status geral
  const score = analysis.healthScore ?? 0;
  const status = analysis.status ?? 'unknown';
  const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
  lines.push(`${emoji} **Status da Conta:** ${status.toUpperCase()} (Score: ${score}/100)`);
  lines.push('');

  // KPIs headline
  lines.push('### 📊 KPIs Cross-Source');
  if (kpis.roasReal > 0) lines.push(`- **ROAS Real:** ${kpis.roasReal.toFixed(2)}x`);
  if (kpis.cpaReal > 0) lines.push(`- **CPA Real:** R$ ${kpis.cpaReal.toFixed(2)}`);
  if (kpis.conversaoReal > 0) lines.push(`- **Conversão Real:** ${kpis.conversaoReal.toFixed(2)}%`);
  if (kpis.ltv > 0) lines.push(`- **LTV Estimado:** R$ ${kpis.ltv.toFixed(0)}`);
  lines.push('');

  // Resumo operacional
  lines.push('### 💰 Resumo Operacional');
  lines.push(`- Investimento: R$ ${investment.totalSpend.toFixed(2)} em ${investment.activeCampaigns} campanhas`);
  lines.push(`- Receita Gateway: R$ ${financial.totalRevenue.toFixed(2)} (${financial.totalSales} vendas)`);
  lines.push(`- Tráfego: ${traffic.totalUsers.toLocaleString()} usuários / ${traffic.totalSessions.toLocaleString()} sessões`);
  lines.push('');

  // Top insights
  if (analysis.insights && analysis.insights.length > 0) {
    lines.push('### 🧠 Insights Prioritários');
    analysis.insights.slice(0, 3).forEach((i: { type: string; title: string; description: string }) => {
      const icon = i.type === 'danger' ? '🔴' : i.type === 'warning' ? '🟡' : '🟢';
      lines.push(`- ${icon} **${i.title}:** ${i.description}`);
    });
    lines.push('');
  }

  // Top actions
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    lines.push('### ⚡ Ações Imediatas');
    analysis.recommendations.slice(0, 3).forEach((a: { action: string; priority: number }) => {
      lines.push(`- ${a.priority <= 1 ? '🚨' : '📌'} ${a.action}`);
    });
  }

  // Integrações ativas
  const integrations = dashboard.integrations;
  const active = [
    integrations.meta ? '✅ Meta Ads' : '❌ Meta Ads',
    integrations.ga4 ? '✅ GA4' : '❌ GA4',
    integrations.gateway ? '✅ Gateway' : '❌ Gateway',
  ];
  lines.push('');
  lines.push(`### 🔗 Integrações: ${active.join(' | ')}`);

  return lines.join('\n');
}
