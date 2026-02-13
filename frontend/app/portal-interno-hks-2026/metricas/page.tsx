'use client';

import { useState, useEffect } from 'react';
import { LineChart, TrendingUp, Users, Target, Eye, MousePointer, Clock } from 'lucide-react';
import { getAnalyticsStats } from '@/app/actions/analytics';
import { getAdsStats } from '@/app/actions/ads';
import { getCotacaoStats } from '@/app/actions/cotacoes';

export default function MetricasPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [ads, setAds] = useState<any>(null);
  const [cotacoes, setCotacoes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [aRes, adsRes, cRes] = await Promise.all([
        getAnalyticsStats(30),
        getAdsStats(),
        getCotacaoStats(),
      ]);
      if (aRes.success) setAnalytics(aRes.data);
      if (adsRes.success) setAds(adsRes.data);
      if (cRes.success) setCotacoes(cRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const metrics = [
    { label: 'Visitas (30d)', value: analytics?.total_visitas || 0, icon: Eye, color: 'text-blue-400' },
    { label: 'Page Views', value: analytics?.page_views || 0, icon: MousePointer, color: 'text-purple-400' },
    { label: 'Sessões Únicas', value: analytics?.sessoes_unicas || 0, icon: Users, color: 'text-green-400' },
    { label: 'Duração Média', value: `${analytics?.duracao_media || 0}s`, icon: Clock, color: 'text-yellow-400' },
    { label: 'Leads via Ads', value: ads?.leads_gerados || 0, icon: Target, color: 'text-[#D4AF37]' },
    { label: 'CPL Médio', value: ads?.cpl_medio ? `R$ ${ads.cpl_medio}` : '—', icon: TrendingUp, color: 'text-orange-400' },
    { label: 'CTR Ads', value: ads?.ctr_medio ? `${ads.ctr_medio}%` : '—', icon: MousePointer, color: 'text-pink-400' },
    { label: 'Conv. Cotações', value: `${cotacoes?.taxa_conversao || 0}%`, icon: Target, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          MÉTRICAS
        </h1>
        <p className="mt-2 text-gray-400">KPIs e indicadores de performance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
                <m.icon className={`h-6 w-6 ${m.color} mb-3`} />
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-sm text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Top Páginas */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Top Páginas (30 dias)</h2>
            <div className="space-y-3">
              {(analytics?.top_paginas || []).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 text-center text-sm font-bold text-[#D4AF37]">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white truncate">{p.pagina}</span>
                      <span className="text-sm text-gray-400 ml-2">{p.views} views</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full"
                        style={{
                          width: `${(p.views / (analytics?.top_paginas?.[0]?.views || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!analytics?.top_paginas || analytics.top_paginas.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-8">Nenhum dado disponível</p>
              )}
            </div>
          </div>

          {/* Dispositivos */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dispositivos</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(analytics?.dispositivos || {}).map(([device, count]) => (
                <div key={device} className="rounded-lg border border-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-white">{count as number}</p>
                  <p className="text-sm text-gray-400 capitalize">{device}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
