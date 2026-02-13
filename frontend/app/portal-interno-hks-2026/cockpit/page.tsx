'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Gauge, TrendingUp, DollarSign, MousePointerClick, Eye, Users,
  Target, Activity, Zap, BarChart3, BrainCircuit, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers,
} from 'lucide-react';
import {
  type CockpitCampaign,
  type ConsolidatedMetrics,
  type FunnelData,
  type ConversionFunnelStep,
  type CockpitAlert,
  type DateRangePreset,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
  DEFAULT_BENCHMARKS,
} from '@/lib/consolidator';
import { MetricCard, CampaignsTable, ConversionFunnel, AlertsBadge } from '@/components/consolidated';

const PERIOD_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: '30d', label: '30 dias' },
];

const FUNNEL_STAGE_COLORS: Record<string, string> = {
  topo: 'bg-blue-500',
  meio: 'bg-purple-500',
  fundo: 'bg-[#D4AF37]',
  retargeting: 'bg-green-500',
  indefinido: 'bg-gray-500',
};

interface CockpitData {
  metrics: ConsolidatedMetrics;
  campaigns: CockpitCampaign[];
  funnel: FunnelData[];
  conversionFunnel: ConversionFunnelStep[];
  alerts: CockpitAlert[];
  config: { metaConfigured: boolean };
  demo?: boolean;
}

interface AIInsight {
  briefing: string;
  gptInsight: string | null;
  hasAI: boolean;
  smartAnalysis?: {
    healthScore: number;
    status: string;
  };
}

export default function CockpitPage() {
  const [period, setPeriod] = useState<DateRangePreset>('7d');
  const [data, setData] = useState<CockpitData | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const metaPreset = period === '7d' ? 'last_7d' : period === '14d' ? 'last_14d' : period === '30d' ? 'last_30d' : period;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/cockpit?period=${metaPreset}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error('Cockpit fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [metaPreset]);

  const fetchAI = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai/cockpit-insight?period=${metaPreset}`);
      const json = await res.json();
      if (json.success) setAiInsight(json.data);
    } catch (e) {
      console.error('AI insight error:', e);
    } finally {
      setAiLoading(false);
    }
  }, [metaPreset]);

  useEffect(() => {
    fetchData();
    fetchAI();
  }, [fetchData, fetchAI]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            COCKPIT DE CAMPANHAS
          </h1>
          <p className="mt-2 text-gray-400">
            Drill-down completo Meta Ads — Métricas, Funil e IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AlertsBadge alerts={data?.alerts || []} />
          <button
            onClick={() => { fetchData(); fetchAI(); }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-300 hover:border-[#D4AF37]/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              period === opt.value
                ? 'bg-[#D4AF37] text-black'
                : 'border border-white/10 bg-[#0a0a0a] text-gray-400 hover:border-[#D4AF37]/30 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards Row */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Investimento" value={data.metrics.totalSpend} format="currency" icon={DollarSign} color="text-blue-400" borderColor="border-blue-500/20" />
            <MetricCard label="Receita" value={data.metrics.totalRevenue} format="currency" icon={TrendingUp} color="text-green-400" borderColor="border-green-500/20" />
            <MetricCard label="ROAS" value={data.metrics.roas} format="roas" icon={Target} color="text-[#D4AF37]" borderColor="border-[#D4AF37]/20" />
            <MetricCard label="Conversões" value={data.metrics.totalConversions} icon={Zap} color="text-purple-400" borderColor="border-purple-500/20" />
            <MetricCard label="CPA" value={data.metrics.cpa} format="currency" icon={DollarSign} color="text-cyan-400" borderColor="border-cyan-500/20" />
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
            <MetricCard label="Impressões" value={data.metrics.totalImpressions} icon={Eye} />
            <MetricCard label="Cliques" value={data.metrics.totalClicks} icon={MousePointerClick} />
            <MetricCard label="CTR" value={data.metrics.ctr} format="percent" icon={Activity} />
            <MetricCard label="CPC" value={data.metrics.cpc} format="currency" icon={DollarSign} />
            <MetricCard label="CPM" value={data.metrics.cpm} format="currency" icon={BarChart3} />
            <MetricCard label="Leads" value={data.metrics.totalLeads} icon={Users} />
          </div>

          {/* Funnel + Consciousness */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Traffic Funnel */}
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
              <h2 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5" /> Funil de Tráfego
              </h2>
              {data.funnel.length > 0 ? (
                <div className="space-y-3">
                  {data.funnel.map(f => {
                    const maxSpend = Math.max(...data.funnel.map(ff => ff.spend), 1);
                    const widthPct = Math.max((f.spend / maxSpend) * 100, 8);
                    return (
                      <div key={f.stage}>
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="text-gray-300">{f.label}</span>
                          <span className="text-white font-semibold">
                            {f.count} camp. • {formatCurrency(f.spend)}
                          </span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${FUNNEL_STAGE_COLORS[f.stage] || 'bg-gray-500'}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                          <span>{f.conversions} conv.</span>
                          <span>ROAS {f.roas.toFixed(2)}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-8 text-center">Sem dados de funil</p>
              )}
            </div>

            {/* Conversion Funnel */}
            <ConversionFunnel steps={data.conversionFunnel} />
          </div>

          {/* AI Insight Panel */}
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" /> Análise IA
              </h2>
              {aiInsight?.smartAnalysis && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  (aiInsight.smartAnalysis.healthScore || 0) >= 80 ? 'bg-green-500/20 text-green-400' :
                  (aiInsight.smartAnalysis.healthScore || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  Score: {aiInsight.smartAnalysis.healthScore}/100
                </span>
              )}
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                <span className="text-sm">Gerando análise com IA...</span>
              </div>
            ) : aiInsight ? (
              <div className="space-y-4">
                {aiInsight.gptInsight && (
                  <div className="rounded-lg border border-[#D4AF37]/10 bg-[#D4AF37]/5 p-4">
                    <p className="text-xs text-[#D4AF37] font-semibold mb-2">🤖 GPT-4o Analysis</p>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {aiInsight.gptInsight}
                    </div>
                  </div>
                )}
                {aiInsight.briefing && (
                  <div className="rounded-lg border border-white/5 bg-[#151515] p-4">
                    <p className="text-xs text-gray-500 font-semibold mb-2">📊 Briefing Executivo</p>
                    <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                      {aiInsight.briefing}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Análise IA indisponível</p>
            )}
          </div>

          {/* Campaigns Table */}
          <div>
            <h2 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Campanhas ({data.campaigns.length})
            </h2>
            <CampaignsTable campaigns={data.campaigns} maxRows={10} />
          </div>

          {/* Config status */}
          {data.demo && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
              <p className="text-sm text-yellow-400">
                ⚠️ Meta Ads não configurado. Conecte sua conta em{' '}
                <a href="/portal-interno-hks-2026/cockpit/consolidado/connect" className="underline font-semibold">
                  Configurações → Connect
                </a>
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Erro ao carregar dados do cockpit
        </div>
      )}
    </div>
  );
}
