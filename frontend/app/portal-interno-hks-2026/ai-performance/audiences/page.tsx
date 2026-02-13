'use client';

import { useState, useEffect } from 'react';
import {
  UsersRound, Brain, Target, TrendingUp, Eye, MousePointer,
  RefreshCw, Sparkles, Layers, ShoppingCart, Heart, Megaphone,
  ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';

interface AudienceSegment {
  name: string;
  size: string;
  funnelStage: string;
  awarenessLevel: string;
  performance: { ctr: number; cpc: number; roas: number };
  recommendation: string;
}

const FUNNEL_COLORS: Record<string, string> = {
  tofu: 'bg-blue-500/20 text-blue-400',
  mofu: 'bg-purple-500/20 text-purple-400',
  bofu: 'bg-emerald-500/20 text-emerald-400',
};

const AWARENESS_LABELS: Record<string, { label: string; color: string; icon: typeof Eye }> = {
  unaware: { label: 'Inconsciente', color: 'text-gray-400', icon: Eye },
  problem_aware: { label: 'Consciente do Problema', color: 'text-orange-400', icon: Target },
  solution_aware: { label: 'Consciente da Solução', color: 'text-yellow-400', icon: Sparkles },
  product_aware: { label: 'Consciente do Produto', color: 'text-blue-400', icon: Heart },
  most_aware: { label: 'Totalmente Consciente', color: 'text-emerald-400', icon: ShoppingCart },
};

export default function AudiencesPage() {
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<{ campaigns: Array<{ name: string; funnelStage: string; awarenessLevel: string; score: number; metrics: Record<string, number> }> } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ai/campaign-insights?period=last_7d');
        const json = await res.json();
        if (json.success) setAnalysis(json.data);
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  const segments: AudienceSegment[] = [
    {
      name: 'Lookalike 1% — Compradores',
      size: '1.2M',
      funnelStage: 'tofu',
      awarenessLevel: 'unaware',
      performance: { ctr: 1.8, cpc: 0.95, roas: 2.5 },
      recommendation: 'Escalar com criativos de educação. CTR acima da média indica boa receptividade.',
    },
    {
      name: 'Retargeting — Visitou Cotação',
      size: '45K',
      funnelStage: 'mofu',
      awarenessLevel: 'solution_aware',
      performance: { ctr: 3.2, cpc: 0.65, roas: 4.8 },
      recommendation: 'Audiência quente com alto ROAS. Aumentar frequência e testar oferta direta.',
    },
    {
      name: 'Retargeting — Abandonou Checkout',
      size: '12K',
      funnelStage: 'bofu',
      awarenessLevel: 'product_aware',
      performance: { ctr: 4.1, cpc: 0.45, roas: 7.2 },
      recommendation: 'Audiência mais quente. Criar urgência com scarcity e social proof.',
    },
    {
      name: 'Interesse — Planos de Saúde',
      size: '3.5M',
      funnelStage: 'tofu',
      awarenessLevel: 'problem_aware',
      performance: { ctr: 1.2, cpc: 1.20, roas: 1.8 },
      recommendation: 'Público amplo com CPC elevado. Testar segmentações mais específicas.',
    },
    {
      name: 'Custom — Clientes Ativos',
      size: '8.5K',
      funnelStage: 'bofu',
      awarenessLevel: 'most_aware',
      performance: { ctr: 5.5, cpc: 0.30, roas: 12.0 },
      recommendation: 'Cross-sell e upsell. Melhores métricas. Usar para testemunhos e indicações.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          <UsersRound className="h-9 w-9" />
          PÚBLICOS IA
        </h1>
        <p className="mt-2 text-gray-400">Segmentação por funil × nível de consciência — Camada 4</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Funnel Matrix */}
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4" /> Matriz Funil × Consciência
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div /> {/* empty corner */}
              {['TOFU', 'MOFU', 'BOFU'].map(f => (
                <div key={f} className="rounded bg-white/5 p-2 font-bold text-gray-400">{f}</div>
              ))}
              {Object.entries(AWARENESS_LABELS).map(([key, aw]) => (
                <>
                  <div key={`label-${key}`} className={`rounded bg-white/5 p-2 ${aw.color} font-semibold text-left`}>
                    {aw.label}
                  </div>
                  {['tofu', 'mofu', 'bofu'].map(funnel => {
                    const seg = segments.find(s => s.awarenessLevel === key && s.funnelStage === funnel);
                    return (
                      <div key={`${key}-${funnel}`} className={`rounded p-2 ${seg ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-white/[0.02] text-gray-700'}`}>
                        {seg ? `${seg.name.slice(0, 20)}...` : '—'}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Audience Segments */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Brain className="h-4 w-4 text-[#D4AF37]" /> Segmentos de Audiência
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {segments.map((seg, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedSegment(expandedSegment === i ? null : i)}
                    className="w-full p-4 flex items-center justify-between hover:bg-[#151515] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <UsersRound className="h-5 w-5 text-[#D4AF37]" />
                      <div>
                        <p className="text-sm font-medium text-white">{seg.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${FUNNEL_COLORS[seg.funnelStage]}`}>
                            {seg.funnelStage.toUpperCase()}
                          </span>
                          <span className={`text-[10px] ${AWARENESS_LABELS[seg.awarenessLevel]?.color || 'text-gray-500'}`}>
                            {AWARENESS_LABELS[seg.awarenessLevel]?.label || seg.awarenessLevel}
                          </span>
                          <span className="text-[10px] text-gray-600">• {seg.size} pessoas</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <span className={`font-semibold ${seg.performance.roas >= 3 ? 'text-emerald-400' : seg.performance.roas >= 1.5 ? 'text-[#D4AF37]' : 'text-orange-400'}`}>
                          {seg.performance.roas.toFixed(1)}x ROAS
                        </span>
                      </div>
                      {expandedSegment === i ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                    </div>
                  </button>

                  {expandedSegment === i && (
                    <div className="px-4 pb-4 border-t border-white/5 bg-[#080808]">
                      <div className="grid grid-cols-3 gap-4 py-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{seg.performance.ctr}%</p>
                          <p className="text-[10px] text-gray-500 uppercase">CTR</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">R$ {seg.performance.cpc.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">CPC</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{seg.performance.roas.toFixed(1)}x</p>
                          <p className="text-[10px] text-gray-500 uppercase">ROAS</p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                        <p className="text-xs text-[#D4AF37] font-semibold mb-1">💡 Recomendação IA</p>
                        <p className="text-xs text-gray-300">{seg.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Funnel Analysis from API */}
          {analysis?.campaigns && analysis.campaigns.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#D4AF37]" /> Classificação por Campanha (AI Advisor)
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {analysis.campaigns.slice(0, 8).map((c: { name: string; funnelStage: string; awarenessLevel: string; score: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-[#151515] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[300px]">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${FUNNEL_COLORS[c.funnelStage] || 'bg-gray-500/20 text-gray-400'}`}>
                          {(c.funnelStage || 'unknown').toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {AWARENESS_LABELS[c.awarenessLevel]?.label || c.awarenessLevel}
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${c.score >= 80 ? 'text-emerald-400' : c.score >= 50 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                      {c.score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
