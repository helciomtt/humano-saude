'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, Eye, MousePointerClick, Users,
  Target, Zap, Download, RefreshCw, Layers, BrainCircuit, Link2,
} from 'lucide-react';
import {
  type CockpitCampaign,
  type ConsolidatedMetrics,
  type FunnelData,
  type ConversionFunnelStep,
  type CockpitAlert,
  type ComparisonDataPoint,
  type Platform,
  type DateRangePreset,
  formatCurrency,
  formatNumber,
  campaignsToCSV,
} from '@/lib/consolidator';
import {
  MetricCard,
  CampaignsTable,
  ConversionFunnel,
  ComparisonChart,
  AlertsBadge,
  DateRangePicker,
  PlatformSelector,
} from '@/components/consolidated';

interface ConsolidatedData {
  metrics: ConsolidatedMetrics;
  campaigns: CockpitCampaign[];
  funnel: FunnelData[];
  conversionFunnel: ConversionFunnelStep[];
  alerts: CockpitAlert[];
  comparison: ComparisonDataPoint[];
  traffic: { users: number; sessions: number; bounceRate: number };
  revenue: { revenue: number; sales: number };
  integrations: { meta: boolean; google: boolean; ga4: boolean };
}

export default function ConsolidadoPage() {
  const [period, setPeriod] = useState<DateRangePreset>('7d');
  const [platforms, setPlatforms] = useState<Platform[]>(['meta']);
  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [loading, setLoading] = useState(true);

  const apiPeriod = period === '7d' ? 'last_7d' : period === '14d' ? 'last_14d' : period === '30d' ? 'last_30d' : period;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/consolidated/metrics?period=${apiPeriod}&platforms=${platforms.join(',')}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error('Consolidated fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [apiPeriod, platforms]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCSVExport = () => {
    if (!data?.campaigns.length) return;
    const csv = campaignsToCSV(data.campaigns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campanhas_consolidado_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            DASHBOARD CONSOLIDADO
          </h1>
          <p className="mt-2 text-gray-400">
            Visão multi-plataforma — Meta Ads, Google Ads, GA4
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AlertsBadge alerts={data?.alerts || []} />
          <button
            onClick={handleCSVExport}
            disabled={!data?.campaigns.length}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-300 hover:border-[#D4AF37]/30 transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-300 hover:border-[#D4AF37]/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toolbar: Date + Platform */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PlatformSelector selected={platforms} onChange={setPlatforms} />
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Integration Status */}
      {data?.integrations && (
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">Integrações:</span>
          <span className={data.integrations.meta ? 'text-green-400' : 'text-gray-600'}>
            {data.integrations.meta ? '✅' : '❌'} Meta Ads
          </span>
          <span className={data.integrations.google ? 'text-green-400' : 'text-gray-600'}>
            {data.integrations.google ? '✅' : '❌'} Google Ads
          </span>
          <span className={data.integrations.ga4 ? 'text-green-400' : 'text-gray-600'}>
            {data.integrations.ga4 ? '✅' : '❌'} GA4
          </span>
          <a
            href="/portal-interno-hks-2026/cockpit/consolidado/connect"
            className="flex items-center gap-1 text-[#D4AF37] hover:underline"
          >
            <Link2 className="h-3 w-3" /> Conectar
          </a>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Investimento Total" value={data.metrics.totalSpend} format="currency" icon={DollarSign} color="text-blue-400" borderColor="border-blue-500/20" />
            <MetricCard label="Receita" value={data.metrics.totalRevenue} format="currency" icon={TrendingUp} color="text-green-400" borderColor="border-green-500/20" />
            <MetricCard label="ROAS" value={data.metrics.roas} format="roas" icon={Target} color="text-[#D4AF37]" borderColor="border-[#D4AF37]/20" />
            <MetricCard label="Conversões" value={data.metrics.totalConversions} icon={Zap} color="text-purple-400" borderColor="border-purple-500/20" />
            <MetricCard label="Campanhas Ativas" value={data.metrics.activeCampaigns} icon={BarChart3} color="text-cyan-400" borderColor="border-cyan-500/20" />
          </div>

          {/* Secondary metrics */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
            <MetricCard label="Impressões" value={data.metrics.totalImpressions} icon={Eye} />
            <MetricCard label="Cliques" value={data.metrics.totalClicks} icon={MousePointerClick} />
            <MetricCard label="CTR" value={data.metrics.ctr} format="percent" />
            <MetricCard label="CPC" value={data.metrics.cpc} format="currency" />
            <MetricCard label="CPM" value={data.metrics.cpm} format="currency" />
            <MetricCard label="Leads" value={data.metrics.totalLeads} icon={Users} />
          </div>

          {/* Traffic stats from GA4 */}
          {data.traffic && (data.traffic.users > 0 || data.traffic.sessions > 0) && (
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Usuários (GA4)" value={data.traffic.users} icon={Users} color="text-orange-400" borderColor="border-orange-500/20" />
              <MetricCard label="Sessões (GA4)" value={data.traffic.sessions} icon={Layers} color="text-orange-400" borderColor="border-orange-500/20" />
              <MetricCard label="Bounce Rate" value={data.traffic.bounceRate} format="percent" icon={TrendingUp} color="text-orange-400" borderColor="border-orange-500/20" />
            </div>
          )}

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ConversionFunnel steps={data.conversionFunnel} />
            <ComparisonChart data={data.comparison} />
          </div>

          {/* Funnel Breakdown */}
          {data.funnel.length > 0 && (
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
              <h2 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5" /> Distribuição por Funil
              </h2>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {data.funnel.map(f => (
                  <div key={f.stage} className="rounded-lg border border-white/10 bg-[#151515] p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: f.color }} />
                      <span className="text-sm font-medium text-white">{f.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{f.count}</p>
                    <p className="text-xs text-gray-500">campanhas</p>
                    <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Invest</p>
                        <p className="text-white font-semibold">{formatCurrency(f.spend)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ROAS</p>
                        <p className={`font-semibold ${f.roas >= 2 ? 'text-green-400' : f.roas >= 1 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                          {f.roas.toFixed(2)}x
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns Table */}
          <div>
            <h2 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Todas as Campanhas ({data.campaigns.length})
            </h2>
            <CampaignsTable campaigns={data.campaigns} maxRows={15} />
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Erro ao carregar dados consolidados
        </div>
      )}
    </div>
  );
}
