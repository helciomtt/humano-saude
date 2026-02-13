'use client';

import { useState, useEffect } from 'react';
import { Wallet, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Calendar } from 'lucide-react';
import { getFinanceiroStats, getComissoes } from '@/app/actions/comissoes';
import { getPropostaStats } from '@/app/actions/propostas';
import { getDesempenhoOperadoras } from '@/app/actions/operadoras';

export default function FinanceiroPage() {
  const [finStats, setFinStats] = useState<any>(null);
  const [propStats, setPropStats] = useState<any>(null);
  const [operadoras, setOperadoras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [finRes, propRes, opRes] = await Promise.all([
        getFinanceiroStats(),
        getPropostaStats(),
        getDesempenhoOperadoras(),
      ]);
      if (finRes.success) setFinStats(finRes.data);
      if (propRes.success) setPropStats(propRes.data);
      if (opRes.success) setOperadoras(opRes.data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          FINANCEIRO
        </h1>
        <p className="mt-2 text-gray-400">Visão financeira consolidada</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
              <DollarSign className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-white">
                R$ {(propStats?.receita_recorrente || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-400">Receita Mensal Recorrente</p>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-[#0a0a0a] p-6">
              <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
              <p className="text-3xl font-bold text-white">
                R$ {(finStats?.valor_total || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-400">Total Comissões</p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-[#0a0a0a] p-6">
              <Wallet className="h-8 w-8 text-yellow-500 mb-3" />
              <p className="text-3xl font-bold text-white">
                R$ {(finStats?.valor_pendente || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-400">A Receber</p>
            </div>
          </div>

          {/* Desempenho por Operadora */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Desempenho por Operadora</h2>
            </div>
            {operadoras.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Nenhum dado de operadora disponível</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                    <th className="px-4 py-3 font-medium">Operadora</th>
                    <th className="px-4 py-3 font-medium">Leads</th>
                    <th className="px-4 py-3 font-medium">Cotações</th>
                    <th className="px-4 py-3 font-medium">Ativas</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Ticket Médio</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {operadoras.map((op: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">{op.operadora}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{op.total_leads}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{op.total_cotacoes}</td>
                      <td className="px-4 py-3 text-sm text-green-400">{op.propostas_ativas}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">
                        {op.ticket_medio ? `R$ ${Number(op.ticket_medio).toLocaleString('pt-BR')}` : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm font-medium text-[#D4AF37]">
                        {op.receita_recorrente ? `R$ ${Number(op.receita_recorrente).toLocaleString('pt-BR')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
