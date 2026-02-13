'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Users, Target, TrendingUp } from 'lucide-react';
import { getPipeline } from '@/app/actions/clientes';
import { getPropostaStats } from '@/app/actions/propostas';
import type { PipelineCompleto, LeadStatus } from '@/lib/types/database';

const funnelStages: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'novo', label: 'Novos', color: 'bg-blue-500' },
  { status: 'contatado', label: 'Contatados', color: 'bg-yellow-500' },
  { status: 'negociacao', label: 'Negociação', color: 'bg-purple-500' },
  { status: 'proposta_enviada', label: 'Proposta', color: 'bg-orange-500' },
  { status: 'ganho', label: 'Ganhos', color: 'bg-green-500' },
];

export default function VendasPage() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pipelineRes, statsRes] = await Promise.all([
        getPipeline(),
        getPropostaStats(),
      ]);
      if (pipelineRes.success) setPipeline(pipelineRes.data);
      if (statsRes.success) setStats(statsRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const funnelData = funnelStages.map((stage) => ({
    ...stage,
    count: pipeline.filter((p) => p.lead_status === stage.status).length,
  }));

  const maxCount = Math.max(...funnelData.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          VENDAS
        </h1>
        <p className="mt-2 text-gray-400">Pipeline de vendas e funil de conversão</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
            <Target className="h-8 w-8 text-[#D4AF37] mb-3" />
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-400">Total Propostas</p>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-[#0a0a0a] p-6">
            <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
            <p className="text-3xl font-bold text-white">{stats.ativas}</p>
            <p className="text-sm text-gray-400">Contratos Ativos</p>
          </div>
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
            <DollarSign className="h-8 w-8 text-[#D4AF37] mb-3" />
            <p className="text-3xl font-bold text-white">
              R$ {(stats.receita_recorrente || 0).toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-gray-400">Receita Recorrente</p>
          </div>
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
            <Users className="h-8 w-8 text-[#D4AF37] mb-3" />
            <p className="text-3xl font-bold text-white">{stats.em_analise}</p>
            <p className="text-sm text-gray-400">Em Análise</p>
          </div>
        </div>
      )}

      {/* Funil Visual */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Funil de Vendas</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {funnelData.map((stage) => (
              <div key={stage.status} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-400 shrink-0">{stage.label}</div>
                <div className="flex-1 h-10 bg-white/5 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-lg flex items-center px-3 transition-all duration-500`}
                    style={{ width: `${Math.max((stage.count / maxCount) * 100, 5)}%` }}
                  >
                    <span className="text-sm font-bold text-white">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Table */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Pipeline Completo</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Cotações</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Propostas</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Economia</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.slice(0, 20).map((item: any) => (
                <tr key={item.lead_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{item.nome}</p>
                    <p className="text-xs text-gray-500">{item.whatsapp}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-300 capitalize">{item.lead_status?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{item.total_cotacoes}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{item.total_propostas}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-green-400">
                    {item.economia_estimada ? `R$ ${item.economia_estimada.toLocaleString('pt-BR')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
