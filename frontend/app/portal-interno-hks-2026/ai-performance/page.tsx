'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Cpu, Zap, TrendingUp, TrendingDown, Gauge, Activity,
  BarChart3, Target, DollarSign, Eye, MousePointer, ShoppingCart,
  ArrowUpRight, ArrowDownRight, RefreshCw, MessageCircle, Send,
  Sparkles, AlertTriangle, CheckCircle, Info, Shield, Scale,
  UsersRound, Settings, ChevronRight, Layers, Bot, Radar
} from 'lucide-react';
import Link from 'next/link';

// =====================================================
// TYPES (local ao componente — Zero Logic in UI)
// =====================================================

interface DashboardData {
  period: { startDate: string; endDate: string; label: string };
  financial: { totalRevenue: number; totalSales: number; avgTicket: number; revenueByDay: Array<{ date: string; revenue: number; sales: number }> };
  traffic: { totalUsers: number; totalSessions: number; totalPageViews: number; avgSessionDuration: number; bounceRate: number; sources: Array<{ source: string; users: number; sessions: number; color: string }> };
  investment: { totalSpend: number; totalImpressions: number; totalClicks: number; totalReach: number; activeCampaigns: number };
  funnel: { pageViews: number; addToCart: number; checkoutInitiated: number; purchases: number; dropRates: { viewToCart: number; cartToCheckout: number; checkoutToPurchase: number } };
  kpis: { roasReal: number; cpaReal: number; conversaoReal: number; ltv: number };
  realtime: { activeUsers: number; topPages: Array<{ page: string; users: number }> } | null;
  integrations: { ga4: boolean; meta: boolean; gateway: boolean };
}

interface SmartAnalysis {
  healthScore: number;
  healthBreakdown: { efficiency: number; conversion: number; scale: number; health: number };
  status: string;
  insights: Array<{ type: string; title: string; description: string; metric?: string; value?: number; benchmark?: number }>;
  recommendations: Array<{ priority: number; action: string; reason: string; expectedImpact: string; category: string }>;
  benchmarkComparison: Record<string, string>;
}

interface CockpitData {
  dashboard: DashboardData;
  smartAnalysis: SmartAnalysis;
  briefing: string;
  generatedAt: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Period = 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d';

const P = '/portal-interno-hks-2026';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AIPerformancePage() {
  const [cockpit, setCockpit] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('last_7d');
  const [refreshing, setRefreshing] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    try {
      const res = await fetch(`/api/ai/cockpit-insight?period=${p}`);
      const json = await res.json();
      if (json.success) {
        setCockpit(json.data);
        setError(null);
      } else {
        setError(json.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData(period).finally(() => setLoading(false));
  }, [period, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(period);
    setRefreshing(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, period }),
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: json.data?.response || 'Sem resposta.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro ao processar. Tente novamente.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const d = cockpit?.dashboard;
  const a = cockpit?.smartAnalysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            <Brain className="h-9 w-9" />
            AI PERFORMANCE
          </h1>
          <p className="mt-2 text-gray-400">Motor de inteligência com 5 camadas • Análise unificada Meta + GA4 + Gateway</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as Period)}
            className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="last_7d">7 dias</option>
            <option value="last_14d">14 dias</option>
            <option value="last_30d">30 dias</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-white/10 bg-[#0a0a0a] p-2 text-gray-400 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            <Brain className="absolute inset-3 h-10 w-10 text-[#D4AF37] animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-gray-500">Carregando AI Performance Engine...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={handleRefresh} className="ml-auto text-xs text-red-300 underline hover:text-red-200">
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && d && a && (
        <>
          {/* Health Score + Status Bar */}
          <div className="grid gap-4 md:grid-cols-12">
            {/* Health Score Ring */}
            <div className="md:col-span-3 rounded-lg border border-white/10 bg-[#0a0a0a] p-5 flex flex-col items-center justify-center">
              <div className="relative h-28 w-28">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={a.healthScore >= 80 ? '#10b981' : a.healthScore >= 60 ? '#D4AF37' : a.healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(a.healthScore / 100) * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{a.healthScore}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Score</span>
                </div>
              </div>
              <div className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                a.status === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                a.status === 'good' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                a.status === 'average' ? 'bg-yellow-500/20 text-yellow-400' :
                a.status === 'poor' ? 'bg-orange-500/20 text-orange-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {a.status === 'excellent' ? '🟢 Excelente' :
                 a.status === 'good' ? '🟡 Bom' :
                 a.status === 'average' ? '🟠 Médio' :
                 a.status === 'poor' ? '🔴 Ruim' : '⚫ Crítico'}
              </div>
            </div>

            {/* Health Breakdown */}
            <div className="md:col-span-5 rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#D4AF37]" /> Diagnóstico por Dimensão
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Eficiência (CPC/CTR/CPM)', value: a.healthBreakdown.efficiency, color: 'from-blue-500 to-cyan-400' },
                  { label: 'Conversão (ROAS/CPA)', value: a.healthBreakdown.conversion, color: 'from-emerald-500 to-green-400' },
                  { label: 'Escala (Volume/Reach)', value: a.healthBreakdown.scale, color: 'from-purple-500 to-violet-400' },
                  { label: 'Saúde (Freq./Budget)', value: a.healthBreakdown.health, color: 'from-[#D4AF37] to-amber-400' },
                ].map((dim, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{dim.label}</span>
                      <span className="text-white font-semibold">{dim.value}/100</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${dim.color} rounded-full transition-all duration-700`}
                        style={{ width: `${dim.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations Status */}
            <div className="md:col-span-4 rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Radar className="h-4 w-4 text-[#D4AF37]" /> Fontes de Dados
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Meta Ads', active: d.integrations.meta, detail: `${d.investment.activeCampaigns} campanhas` },
                  { name: 'Google Analytics 4', active: d.integrations.ga4, detail: `${d.traffic.totalSessions.toLocaleString()} sessões` },
                  { name: 'Gateway Pagamento', active: d.integrations.gateway, detail: `${d.financial.totalSales} vendas` },
                ].map((src, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${src.active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                      <span className="text-sm text-white">{src.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{src.active ? src.detail : 'Não conectado'}</span>
                  </div>
                ))}
              </div>
              {d.realtime && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                  <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-semibold">{d.realtime.activeUsers} usuários ativos agora</span>
                </div>
              )}
            </div>
          </div>

          {/* Cross-Source KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'ROAS Real',
                value: d.kpis.roasReal.toFixed(2) + 'x',
                sub: 'Gateway ÷ Meta Spend',
                icon: TrendingUp,
                color: d.kpis.roasReal >= 3 ? 'text-emerald-400' : d.kpis.roasReal >= 1 ? 'text-[#D4AF37]' : 'text-red-400',
                border: d.kpis.roasReal >= 3 ? 'border-emerald-500/20' : d.kpis.roasReal >= 1 ? 'border-[#D4AF37]/20' : 'border-red-500/20',
              },
              {
                label: 'CPA Real',
                value: 'R$ ' + d.kpis.cpaReal.toFixed(2),
                sub: 'Meta Spend ÷ Gateway Sales',
                icon: Target,
                color: d.kpis.cpaReal > 0 && d.kpis.cpaReal <= 15 ? 'text-emerald-400' : d.kpis.cpaReal <= 30 ? 'text-[#D4AF37]' : 'text-red-400',
                border: d.kpis.cpaReal > 0 && d.kpis.cpaReal <= 15 ? 'border-emerald-500/20' : 'border-[#D4AF37]/20',
              },
              {
                label: 'Conversão Real',
                value: d.kpis.conversaoReal.toFixed(2) + '%',
                sub: 'Gateway Sales ÷ GA4 Users',
                icon: ShoppingCart,
                color: d.kpis.conversaoReal >= 3 ? 'text-emerald-400' : d.kpis.conversaoReal >= 1 ? 'text-[#D4AF37]' : 'text-orange-400',
                border: d.kpis.conversaoReal >= 3 ? 'border-emerald-500/20' : 'border-[#D4AF37]/20',
              },
              {
                label: 'LTV Estimado',
                value: 'R$ ' + d.kpis.ltv.toFixed(0),
                sub: 'Ticket × 12 meses',
                icon: DollarSign,
                color: 'text-[#D4AF37]',
                border: 'border-[#D4AF37]/20',
              },
            ].map((kpi, i) => (
              <div key={i} className={`rounded-lg border ${kpi.border} bg-[#0a0a0a] p-5 transition-all hover:bg-[#0f0f0f]`}>
                <div className="flex items-center justify-between mb-3">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">{kpi.label}</span>
                </div>
                <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-gray-600 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Investment vs Revenue Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {[
              { label: 'Investimento', value: `R$ ${d.investment.totalSpend.toFixed(0)}`, icon: DollarSign, color: 'text-red-400' },
              { label: 'Receita', value: `R$ ${d.financial.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Impressões', value: d.investment.totalImpressions.toLocaleString(), icon: Eye, color: 'text-blue-400' },
              { label: 'Cliques', value: d.investment.totalClicks.toLocaleString(), icon: MousePointer, color: 'text-cyan-400' },
              { label: 'Alcance', value: d.investment.totalReach.toLocaleString(), icon: UsersRound, color: 'text-purple-400' },
              { label: 'Vendas', value: String(d.financial.totalSales), icon: ShoppingCart, color: 'text-emerald-400' },
            ].map((m, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 text-center">
                <m.icon className={`h-4 w-4 ${m.color} mx-auto mb-2`} />
                <p className="text-lg font-bold text-white">{m.value}</p>
                <p className="text-[10px] text-gray-500 uppercase">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#D4AF37]" /> Funil de Conversão
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Page Views', value: d.funnel.pageViews, color: 'from-blue-500 to-blue-400', width: '100%' },
                { label: 'Add to Cart', value: d.funnel.addToCart, color: 'from-purple-500 to-purple-400', width: d.funnel.pageViews > 0 ? `${(d.funnel.addToCart / d.funnel.pageViews) * 100}%` : '0%' },
                { label: 'Checkout', value: d.funnel.checkoutInitiated, color: 'from-[#D4AF37] to-amber-400', width: d.funnel.pageViews > 0 ? `${(d.funnel.checkoutInitiated / d.funnel.pageViews) * 100}%` : '0%' },
                { label: 'Compras', value: d.funnel.purchases, color: 'from-emerald-500 to-emerald-400', width: d.funnel.pageViews > 0 ? `${(d.funnel.purchases / d.funnel.pageViews) * 100}%` : '0%' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-white">{step.value.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 uppercase mb-2">{step.label}</p>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mx-auto" style={{ width: step.width, minWidth: '20%' }}>
                    <div className={`h-full bg-gradient-to-r ${step.color} rounded-full`} style={{ width: '100%' }} />
                  </div>
                  {i < 3 && (
                    <p className="text-[9px] text-gray-600 mt-1">
                      Drop: {(Object.values(d.funnel.dropRates)[i] * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Insights + Recommendations */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Insights */}
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Insights Inteligentes
                </h3>
              </div>
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                {a.insights.length === 0 ? (
                  <div className="p-8 text-center text-gray-600 text-sm">Nenhum insight disponível ainda</div>
                ) : (
                  a.insights.map((insight, i) => (
                    <div key={i} className="p-4 hover:bg-[#151515] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${
                          insight.type === 'danger' ? 'text-red-400' :
                          insight.type === 'warning' ? 'text-yellow-400' :
                          insight.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {insight.type === 'danger' ? <AlertTriangle className="h-4 w-4" /> :
                           insight.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                           insight.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                           <Info className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{insight.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{insight.description}</p>
                          {insight.value !== undefined && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-600">Atual: {typeof insight.value === 'number' ? insight.value.toFixed(2) : insight.value}</span>
                              {insight.benchmark !== undefined && (
                                <span className="text-xs text-gray-600">| Benchmark: {insight.benchmark.toFixed(2)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Ações Recomendadas
                </h3>
              </div>
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                {a.recommendations.length === 0 ? (
                  <div className="p-8 text-center text-gray-600 text-sm">Sem recomendações no momento</div>
                ) : (
                  a.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 hover:bg-[#151515] transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          rec.priority <= 1 ? 'bg-red-500/20 text-red-400' :
                          rec.priority <= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          P{rec.priority}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{rec.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{rec.reason}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {rec.expectedImpact}
                            </span>
                            <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Navigation — Subpages */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Escala Automática', desc: 'Budget dinâmico com IA', icon: Scale, href: `${P}/ai-performance/escala-automatica`, color: 'from-purple-500 to-violet-400' },
              { label: 'Públicos IA', desc: 'Segmentação inteligente', icon: UsersRound, href: `${P}/ai-performance/audiences`, color: 'from-blue-500 to-cyan-400' },
              { label: 'Regras & Alertas', desc: 'Automação Camada 5', icon: Shield, href: `${P}/ai-performance/rules`, color: 'from-[#D4AF37] to-amber-400' },
              { label: 'Configurações', desc: 'APIs, tokens, modelos', icon: Settings, href: `${P}/ai-performance/settings`, color: 'from-gray-400 to-gray-300' },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="group rounded-lg border border-white/10 bg-[#0a0a0a] p-4 transition-all hover:border-[#D4AF37]/40 hover:bg-[#0f0f0f]">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-[#D4AF37] transition-colors" />
                </div>
                <p className="text-sm font-semibold text-white mt-3">{item.label}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>

          {/* 5 Layers Status */}
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a]">
            <div className="border-b border-[#D4AF37]/20 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Motor de IA — 5 Camadas
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {[
                { n: 1, label: 'AI Engine', desc: 'GPT-4o + Fallback', icon: Bot, status: 'ativo' },
                { n: 2, label: 'AI Advisor', desc: 'Análise por campanha', icon: MessageCircle, status: 'ativo' },
                { n: 3, label: 'Smart Analyzer', desc: '100% local, sem AI', icon: Gauge, status: 'ativo' },
                { n: 4, label: 'Campaign Analyzer', desc: 'Funil × Consciência', icon: BarChart3, status: 'ativo' },
                { n: 5, label: 'Ads Auditor', desc: 'Cron cada 30min', icon: Shield, status: 'ativo' },
              ].map((layer) => (
                <div key={layer.n} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <layer.icon className="h-4 w-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#D4AF37]">CAMADA {layer.n}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{layer.label}</p>
                  <p className="text-[10px] text-gray-500">{layer.desc}</p>
                  <div className="mt-2 inline-flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400">{layer.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat Toggle */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#151515] transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Pergunte à IA</p>
                  <p className="text-[10px] text-gray-500">Chat direto com o motor GPT-4o sobre suas campanhas</p>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${chatOpen ? 'rotate-90' : ''}`} />
            </button>

            {chatOpen && (
              <div className="border-t border-white/10">
                {/* Chat Messages */}
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-xs text-gray-600 py-4">
                      Pergunte qualquer coisa sobre suas campanhas, métricas ou estratégias.
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                          : 'bg-white/5 text-gray-300'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div className="border-t border-white/10 p-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChat()}
                    placeholder="Ex: Qual campanha tem melhor ROAS? Como reduzir o CPA?"
                    className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <button
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#bf953f] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {cockpit?.generatedAt && (
            <p className="text-center text-[10px] text-gray-600">
              Gerado em {new Date(cockpit.generatedAt).toLocaleString('pt-BR')} • Período: {d.period.label}
            </p>
          )}
        </>
      )}
    </div>
  );
}
