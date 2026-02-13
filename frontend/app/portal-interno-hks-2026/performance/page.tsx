'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getClienteStats } from '@/app/actions/clientes';
import { getCotacaoStats } from '@/app/actions/cotacoes';
import { getPropostaStats } from '@/app/actions/propostas';

export default function PerformancePage() {
  const [clienteStats, setClienteStats] = useState<any>(null);
  const [cotacaoStats, setCotacaoStats] = useState<any>(null);
  const [propostaStats, setPropostaStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, cot, p] = await Promise.all([
        getClienteStats(),
        getCotacaoStats(),
        getPropostaStats(),
      ]);
      if (c.success) setClienteStats(c.data);
      if (cot.success) setCotacaoStats(cot.data);
      if (p.success) setPropostaStats(p.data);
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    {
      title: 'Total Leads',
      value: clienteStats?.total_leads || 0,
      sub: `${clienteStats?.novos_hoje || 0} hoje`,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Cotações Geradas',
      value: cotacaoStats?.total || 0,
      sub: `${cotacaoStats?.aceitas || 0} aceitas`,
      icon: Target,
      color: 'text-purple-400',
    },
    {
      title: 'Propostas Ativas',
      value: propostaStats?.ativas || 0,
      sub: `${propostaStats?.pendentes || 0} pendentes`,
      icon: Award,
      color: 'text-green-400',
    },
    {
      title: 'Taxa de Conversão',
      value: `${cotacaoStats?.taxa_conversao || 0}%`,
      sub: 'Cotações → Propostas',
      icon: TrendingUp,
      color: 'text-[#D4AF37]',
    },
  ];

  const kpis = [
    { label: 'Leads Novos (Mês)', value: clienteStats?.novos_mes || 0, trend: 'up' },
    { label: 'Leads Convertidos (Mês)', value: clienteStats?.convertidos_mes || 0, trend: 'up' },
    { label: 'Leads Perdidos (Mês)', value: clienteStats?.perdidos_mes || 0, trend: 'down' },
    { label: 'Ticket Médio', value: cotacaoStats?.ticket_medio ? `R$ ${cotacaoStats.ticket_medio.toLocaleString('pt-BR')}` : '—', trend: 'up' },
    { label: 'Economia Média', value: cotacaoStats?.economia_media ? `R$ ${cotacaoStats.economia_media.toLocaleString('pt-BR')}` : '—', trend: 'up' },
    { label: 'Receita Recorrente', value: propostaStats?.receita_recorrente ? `R$ ${propostaStats.receita_recorrente.toLocaleString('pt-BR')}` : '—', trend: 'up' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          PERFORMANCE
        </h1>
        <p className="mt-2 text-gray-400">Indicadores de desempenho da equipe</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
                <div className="flex items-center justify-between mb-3">
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-sm text-gray-400">{c.title}</p>
                <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">KPIs Mensais</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {kpis.map((kpi, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111] p-4">
                  <div>
                    <p className="text-sm text-gray-400">{kpi.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
                  </div>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Summary */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Resumo do Pipeline</h2>
            <div className="space-y-3">
              {[
                { label: 'Novos', count: clienteStats?.por_status?.novo || 0, color: 'bg-blue-500' },
                { label: 'Contatados', count: clienteStats?.por_status?.contatado || 0, color: 'bg-cyan-500' },
                { label: 'Negociando', count: clienteStats?.por_status?.negociando || 0, color: 'bg-yellow-500' },
                { label: 'Cotação Enviada', count: clienteStats?.por_status?.cotacao_enviada || 0, color: 'bg-orange-500' },
                { label: 'Convertidos', count: clienteStats?.por_status?.convertido || 0, color: 'bg-green-500' },
                { label: 'Perdidos', count: clienteStats?.por_status?.perdido || 0, color: 'bg-red-500' },
              ].map((item) => {
                const total = clienteStats?.total_leads || 1;
                const pct = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-300">{item.label}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm text-gray-400">{item.count}</div>
                    <div className="w-12 text-right text-sm text-[#D4AF37]">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
