'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { getComissoes, getFinanceiroStats } from '@/app/actions/comissoes';
import { getPropostaStats } from '@/app/actions/propostas';

export default function FaturamentoPage() {
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [finStats, setFinStats] = useState<any>(null);
  const [propStats, setPropStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [comRes, finRes, propRes] = await Promise.all([
        getComissoes({ limit: 20 }),
        getFinanceiroStats(),
        getPropostaStats(),
      ]);
      if (comRes.success) setComissoes(comRes.data);
      if (finRes.success) setFinStats(finRes.data);
      if (propRes.success) setPropStats(propRes.data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          FATURAMENTO
        </h1>
        <p className="mt-2 text-gray-400">Receitas, comissões e faturamento mensal</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
              <CreditCard className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-white">
                R$ {(propStats?.receita_recorrente || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-400">Receita Recorrente</p>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-[#0a0a0a] p-6">
              <DollarSign className="h-8 w-8 text-green-500 mb-3" />
              <p className="text-3xl font-bold text-white">
                R$ {(finStats?.valor_pago || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-400">Comissões Pagas</p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-[#0a0a0a] p-6">
              <Clock className="h-8 w-8 text-yellow-500 mb-3" />
              <p className="text-3xl font-bold text-white">
                R$ {(finStats?.valor_pendente || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-400">Comissões Pendentes</p>
            </div>
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
              <TrendingUp className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-white">{propStats?.ativas || 0}</p>
              <p className="text-sm text-gray-400">Contratos Ativos</p>
            </div>
          </div>

          {/* Comissões Table */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Últimas Comissões</h2>
            </div>
            {comissoes.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma comissão registrada</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                    <th className="px-4 py-3 font-medium">Proposta</th>
                    <th className="px-4 py-3 font-medium">Mês Ref.</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoes.map((c: any) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-white">
                        {c.propostas?.numero_proposta || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {c.mes_referencia ? new Date(c.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#D4AF37]">
                        R$ {(c.valor_comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          c.status === 'paga' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {c.status === 'paga' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {c.status === 'paga' ? 'Paga' : 'Pendente'}
                        </span>
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
