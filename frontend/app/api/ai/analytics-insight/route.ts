// =====================================================
// API — /api/ai/analytics-insight
// Analytics Hub + AI — Unified dashboard data
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedDashboardData } from '@/lib/analytics-hub';
import type { PerformancePeriod } from '@/lib/types/ai-performance';
import { logger } from '@/lib/logger';

// Cache simples em memória (5 min)
let insightCache: { data: unknown; ts: number; period: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'last_7d') as PerformancePeriod;

    // Retorna cache se válido
    if (insightCache && insightCache.period === period && Date.now() - insightCache.ts < CACHE_TTL) {
      return NextResponse.json({ success: true, data: insightCache.data, cached: true });
    }

    const dashboard = await getUnifiedDashboardData(period);

    insightCache = { data: dashboard, ts: Date.now(), period };

    return NextResponse.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error('❌ Analytics Insight Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, period } = body;

    if (!question) {
      return NextResponse.json({ success: false, error: 'Pergunta é obrigatória' }, { status: 400 });
    }

    const dashboard = await getUnifiedDashboardData((period || 'last_7d') as PerformancePeriod);

    // Gera insight contextual via OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          response: `📊 Dados disponíveis: Spend R$${dashboard.investment?.totalSpend?.toFixed(2) || 'N/A'}, ` +
            `GA4 Sessions ${dashboard.traffic?.totalSessions || 'N/A'}, ` +
            `Gateway Sales ${dashboard.financial?.totalSales || 'N/A'}. ` +
            `Configure OPENAI_API_KEY para análise inteligente.`,
        },
      });
    }

    const context = JSON.stringify({
      investment: dashboard.investment,
      traffic: { sessions: dashboard.traffic?.totalSessions, users: dashboard.traffic?.totalUsers },
      financial: dashboard.financial,
      kpis: dashboard.kpis,
    });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content: `Você é um analista de dados da Humano Saúde. Responda perguntas sobre performance usando os dados fornecidos. Formato: markdown conciso com insights acionáveis.`,
          },
          { role: 'user', content: `Dados atuais:\n${context}\n\nPergunta: ${question}` },
        ],
      }),
    });

    const json = await res.json();
    const response = json.choices?.[0]?.message?.content || 'Sem resposta disponível.';

    return NextResponse.json({ success: true, data: { response } });
  } catch (error) {
    logger.error('❌ Analytics Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar pergunta' },
      { status: 500 }
    );
  }
}
