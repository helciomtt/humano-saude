'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, FileText } from 'lucide-react';
import { getAnalyticsStats } from '@/app/actions/analytics';
import { getPropostaStats } from '@/app/actions/propostas';
import { getCotacaoStats } from '@/app/actions/cotacoes';

export default function RelatoriosPage() {
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);
  const [propStats, setPropStats] = useState<any>(null);
  const [cotStats, setCotStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [aRes, pRes, cRes] = await Promise.all([
        getAnalyticsStats(30),
        getPropostaStats(),
        getCotacaoStats(),
      ]);
      if (aRes.success) setAnalyticsStats(aRes.data);
      if (pRes.success) setPropStats(pRes.data);
      if (cRes.success) setCotStats(cRes.data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            RELATÓRIOS
          </h1>
          <p className="mt-2 text-gray-400">Relatórios gerenciais consolidados</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Relatório de Leads & Cotações */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4AF37]" />
              Leads & Cotações
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Total Cotações</span>
                <span className="text-white font-medium">{cotStats?.total || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Aceitas</span>
                <span className="text-green-400 font-medium">{cotStats?.aceitas || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Taxa de Conversão</span>
                <span className="text-[#D4AF37] font-medium">{cotStats?.taxa_conversao || 0}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Valor Total Cotado</span>
                <span className="text-white font-medium">R$ {(cotStats?.valor_total || 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Relatório Financeiro */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
              Financeiro
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Contratos Ativos</span>
                <span className="text-white font-medium">{propStats?.ativas || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Receita Recorrente</span>
                <span className="text-green-400 font-medium">R$ {(propStats?.receita_recorrente || 0).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Comissões Totais</span>
                <span className="text-[#D4AF37] font-medium">R$ {(propStats?.comissoes_totais || 0).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Em Análise</span>
                <span className="text-yellow-400 font-medium">{propStats?.em_analise || 0}</span>
              </div>
            </div>
          </div>

          {/* Relatório de Tráfego */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#D4AF37]" />
              Tráfego (30 dias)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Total Visitas</span>
                <span className="text-white font-medium">{analyticsStats?.total_visitas || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Sessões Únicas</span>
                <span className="text-white font-medium">{analyticsStats?.sessoes_unicas || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Page Views</span>
                <span className="text-white font-medium">{analyticsStats?.page_views || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Duração Média</span>
                <span className="text-white font-medium">{analyticsStats?.duracao_media || 0}s</span>
              </div>
            </div>
          </div>

          {/* Top Fontes */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
              Top Fontes de Tráfego
            </h3>
            <div className="space-y-3">
              {(analyticsStats?.top_fontes || []).map((f: any, i: number) => (
                <div key={i} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 capitalize">{f.fonte}</span>
                  <span className="text-white font-medium">{f.count}</span>
                </div>
              ))}
              {(!analyticsStats?.top_fontes || analyticsStats.top_fontes.length === 0) && (
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
