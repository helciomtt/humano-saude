'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Eye, MousePointer, DollarSign, Target, TrendingUp, BarChart3, Rocket, Gauge, Sparkles } from 'lucide-react';
import { getAdsCampaigns, getAdsStats, getAnaliseCampanhas } from '@/app/actions/ads';
import Link from 'next/link';

export default function MetaAdsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analise, setAnalise] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cRes, sRes, aRes] = await Promise.all([
        getAdsCampaigns(),
        getAdsStats(),
        getAnaliseCampanhas(),
      ]);
      if (cRes.success) setCampaigns(cRes.data || []);
      if (sRes.success) setStats(sRes.data);
      if (aRes.success) setAnalise(aRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const statusColor: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-gray-500/20 text-gray-400',
    draft: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          META ADS
        </h1>
        <p className="mt-2 text-gray-400">Gestão de campanhas Facebook & Instagram Ads</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link
          href="/portal-interno-hks-2026/meta-ads/cockpit"
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0a0a0a] p-4 transition-colors hover:border-[#D4AF37]/40 hover:bg-[#0a0a0a]/80"
        >
          <Gauge className="h-8 w-8 text-[#D4AF37]" />
          <div>
            <p className="text-sm font-semibold text-white">Cockpit Live</p>
            <p className="text-xs text-gray-400">Métricas em tempo real da Marketing API</p>
          </div>
        </Link>
        <Link
          href="/portal-interno-hks-2026/meta-ads/lancamento"
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0a0a0a] p-4 transition-colors hover:border-[#D4AF37]/40 hover:bg-[#0a0a0a]/80"
        >
          <Rocket className="h-8 w-8 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-white">Lançar Campanha</p>
            <p className="text-xs text-gray-400">Criar campanha completa + copy IA</p>
          </div>
        </Link>
        <Link
          href="/portal-interno-hks-2026/meta-ads/lancamento"
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0a0a0a] p-4 transition-colors hover:border-[#D4AF37]/40 hover:bg-[#0a0a0a]/80"
        >
          <Sparkles className="h-8 w-8 text-purple-400" />
          <div>
            <p className="text-sm font-semibold text-white">Copy Generator</p>
            <p className="text-xs text-gray-400">Gerar textos para anúncios com GPT-4o</p>
          </div>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Investimento', value: stats?.investimento_total ? `R$ ${stats.investimento_total.toLocaleString('pt-BR')}` : 'R$ 0', icon: DollarSign, color: 'text-red-400' },
              { label: 'Impressões', value: (stats?.impressoes_total || 0).toLocaleString('pt-BR'), icon: Eye, color: 'text-blue-400' },
              { label: 'Cliques', value: (stats?.cliques_total || 0).toLocaleString('pt-BR'), icon: MousePointer, color: 'text-purple-400' },
              { label: 'Leads Gerados', value: stats?.leads_gerados || 0, icon: Target, color: 'text-green-400' },
              { label: 'CPL Médio', value: stats?.cpl_medio ? `R$ ${stats.cpl_medio.toFixed(2)}` : '—', icon: TrendingUp, color: 'text-[#D4AF37]' },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Campanhas */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#D4AF37]" /> Campanhas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="pb-2 pr-4">Campanha</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Orçamento</th>
                    <th className="pb-2 pr-4">Gasto</th>
                    <th className="pb-2 pr-4">Impressões</th>
                    <th className="pb-2 pr-4">Cliques</th>
                    <th className="pb-2 pr-4">CTR</th>
                    <th className="pb-2 pr-4">Leads</th>
                    <th className="pb-2 pr-4">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 pr-4 text-white font-medium">{c.nome}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[c.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">R$ {(c.orcamento_diario || 0).toFixed(2)}/dia</td>
                      <td className="py-3 pr-4 text-gray-300">R$ {(c.gasto_total || 0).toLocaleString('pt-BR')}</td>
                      <td className="py-3 pr-4 text-gray-300">{(c.impressoes || 0).toLocaleString('pt-BR')}</td>
                      <td className="py-3 pr-4 text-gray-300">{(c.cliques || 0).toLocaleString('pt-BR')}</td>
                      <td className="py-3 pr-4 text-[#D4AF37]">{(c.ctr || 0).toFixed(2)}%</td>
                      <td className="py-3 pr-4 text-green-400 font-semibold">{c.leads_gerados || 0}</td>
                      <td className="py-3 pr-4 text-gray-300">{c.cpl ? `R$ ${c.cpl.toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-gray-500">Nenhuma campanha encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Análise Campanhas (View) */}
          {analise.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#D4AF37]" /> Análise de Performance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="pb-2 pr-4">Campanha</th>
                      <th className="pb-2 pr-4">Criativos</th>
                      <th className="pb-2 pr-4">Gasto</th>
                      <th className="pb-2 pr-4">Impressões</th>
                      <th className="pb-2 pr-4">CTR Médio</th>
                      <th className="pb-2 pr-4">CPL</th>
                      <th className="pb-2 pr-4">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analise.map((a: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">{a.campanha}</td>
                        <td className="py-3 pr-4 text-gray-300">{a.total_criativos}</td>
                        <td className="py-3 pr-4 text-gray-300">R$ {(a.gasto_total || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-3 pr-4 text-gray-300">{(a.total_impressoes || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-3 pr-4 text-[#D4AF37]">{(a.ctr_medio || 0).toFixed(2)}%</td>
                        <td className="py-3 pr-4 text-gray-300">{a.cpl_medio ? `R$ ${a.cpl_medio.toFixed(2)}` : '—'}</td>
                        <td className="py-3 pr-4 text-green-400 font-semibold">{(a.roas_medio || 0).toFixed(2)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
