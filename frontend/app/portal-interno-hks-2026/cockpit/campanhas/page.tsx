'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, MousePointerClick, Eye, Users, Pause, Play, BarChart3 } from 'lucide-react';
import { getAdsCampaigns, getAdsCreatives, getAdsStats } from '@/app/actions/ads';
import type { AdsCampaign, AdsCreative } from '@/lib/types/database';

export default function CockpitCampanhasPage() {
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([]);
  const [creatives, setCreatives] = useState<AdsCreative[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cRes, crRes, sRes] = await Promise.all([
        getAdsCampaigns(filter ? { status: filter } : undefined),
        getAdsCreatives({ limit: 10 }),
        getAdsStats(),
      ]);
      if (cRes.success) setCampaigns(cRes.data as AdsCampaign[]);
      if (crRes.success) setCreatives(crRes.data as AdsCreative[]);
      if (sRes.success) setStats(sRes.data);
      setLoading(false);
    }
    load();
  }, [filter]);

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CAMPANHAS
        </h1>
        <p className="mt-2 text-gray-400">Gestão detalhada de campanhas Meta Ads</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Campanhas Ativas', value: stats?.campanhas_ativas || 0, icon: Target, color: 'text-green-400', border: 'border-green-500/20' },
              { label: 'Investimento Total', value: stats?.investimento_total ? fmt(stats.investimento_total) : 'R$ 0', icon: DollarSign, color: 'text-[#D4AF37]', border: 'border-[#D4AF37]/20' },
              { label: 'Leads Gerados', value: stats?.leads_gerados || 0, icon: Users, color: 'text-blue-400', border: 'border-blue-500/20' },
              { label: 'CPL Médio', value: stats?.cpl_medio ? fmt(stats.cpl_medio) : '—', icon: TrendingUp, color: 'text-purple-400', border: 'border-purple-500/20' },
            ].map((item, i) => (
              <div key={i} className={`rounded-lg border ${item.border} bg-[#0a0a0a] p-5`}>
                <item.icon className={`h-6 w-6 ${item.color} mb-3`} />
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a]">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 p-4">
              <h2 className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Todas as Campanhas
              </h2>
              <select
                value={filter}
                onChange={(e) => { setLoading(true); setFilter(e.target.value); }}
                className="rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white"
              >
                <option value="">Todos os status</option>
                <option value="ACTIVE">Ativas</option>
                <option value="PAUSED">Pausadas</option>
                <option value="ARCHIVED">Arquivadas</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#D4AF37]/10 bg-[#151515]">
                  <tr>
                    {['Campanha', 'Status', 'Budget', 'Investido', 'Impressões', 'Cliques', 'CTR', 'Leads', 'CPL'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#D4AF37]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">Nenhuma campanha encontrada</td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-[#151515] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.objective}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            c.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                            c.status === 'PAUSED' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {c.status === 'ACTIVE' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                            {c.status === 'ACTIVE' ? 'Ativa' : c.status === 'PAUSED' ? 'Pausada' : 'Arquivada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">
                          {c.daily_budget ? `${fmt(c.daily_budget)}/dia` : c.lifetime_budget ? fmt(c.lifetime_budget) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-white font-medium">{fmt(c.spend)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">{c.impressions.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">{c.clicks.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">{c.ctr ? `${c.ctr.toFixed(2)}%` : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[#D4AF37]">{c.leads_generated}</td>
                        <td className="px-4 py-3 text-right text-sm text-white">{c.cpl ? fmt(c.cpl) : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#D4AF37]" /> Criativos Recentes
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {creatives.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">Nenhum criativo encontrado</div>
              ) : (
                creatives.map((cr) => (
                  <div key={cr.id} className="flex items-center justify-between p-4 hover:bg-[#151515] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{cr.name}</p>
                      <p className="text-xs text-gray-500">{cr.type} • {cr.call_to_action || 'Sem CTA'}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-400"><Eye className="inline h-3 w-3 mr-1" />{cr.impressions.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-400"><MousePointerClick className="inline h-3 w-3 mr-1" />{cr.clicks.toLocaleString('pt-BR')}</span>
                      <span className="text-white font-medium">{fmt(cr.spend)}</span>
                      {cr.ai_score !== null && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          cr.ai_score >= 8 ? 'bg-green-500/20 text-green-400' :
                          cr.ai_score >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          IA: {cr.ai_score}/10
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
