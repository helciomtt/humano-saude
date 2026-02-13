'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, CheckCircle, Clock, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { getPropostas, getPropostaStats } from '@/app/actions/propostas';

export default function ContratosPage() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState('ativa');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cRes, sRes] = await Promise.all([
        getPropostas({ status: filter as any }),
        getPropostaStats(),
      ]);
      if (cRes.success) setContratos(cRes.data || []);
      if (sRes.success) setStats(sRes.data);
      setLoading(false);
    }
    load();
  }, [filter]);

  const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    ativa: { label: 'Ativo', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    em_analise: { label: 'Em Análise', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
    cancelada: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
    expirada: { label: 'Expirado', color: 'bg-gray-500/20 text-gray-400', icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CONTRATOS
        </h1>
        <p className="mt-2 text-gray-400">Gestão de contratos e propostas</p>
      </div>

      {loading && contratos.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <FileText className="h-5 w-5 text-[#D4AF37] mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-xs text-gray-400">Total Propostas</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.ativas || 0}</p>
              <p className="text-xs text-gray-400">Contratos Ativos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <DollarSign className="h-5 w-5 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats?.receita_recorrente ? `R$ ${stats.receita_recorrente.toLocaleString('pt-BR')}` : 'R$ 0'}
              </p>
              <p className="text-xs text-gray-400">Receita Recorrente</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <Clock className="h-5 w-5 text-yellow-400 mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.pendentes || 0}</p>
              <p className="text-xs text-gray-400">Pendentes</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-[#D4AF37] text-black'
                    : 'border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cfg.label}
              </button>
            ))}
            <button
              onClick={() => setFilter('')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === ''
                  ? 'bg-[#D4AF37] text-black'
                  : 'border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Tabela */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                    <th className="px-4 py-3">Nº Proposta</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Operadora</th>
                    <th className="px-4 py-3">Plano</th>
                    <th className="px-4 py-3">Mensalidade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Vigência</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => {
                    const cfg = statusConfig[c.status] || statusConfig.pendente;
                    return (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-[#D4AF37] font-mono">{c.numero_proposta || '—'}</td>
                        <td className="px-4 py-3 text-white font-medium">{c.nome_titular || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{c.operadora || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{c.plano || '—'}</td>
                        <td className="px-4 py-3 text-[#D4AF37] font-semibold">
                          {c.valor_mensalidade ? `R$ ${Number(c.valor_mensalidade).toLocaleString('pt-BR')}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {c.data_inicio ? new Date(c.data_inicio).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {contratos.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhum contrato encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
