'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  DollarSign,
  Calendar,
  ArrowDownToLine,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRelatoriosComissao } from '@/app/actions/corretor-financeiro';
import type { RelatorioComissao } from '@/app/actions/corretor-financeiro';
import { useComissoes } from '../hooks/useCorretorData';

export default function ComissoesPanel({ corretorId }: { corretorId: string }) {
  const [relatorios, setRelatorios] = useState<RelatorioComissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { resumo } = useComissoes(corretorId);

  const totalPages = Math.ceil(total / perPage);

  const fetchRelatorios = useCallback(async () => {
    setLoading(true);
    const result = await getRelatoriosComissao(corretorId, { page, perPage });
    if (result.success) {
      setRelatorios(result.data ?? []);
      setTotal(result.total ?? 0);
    }
    setLoading(false);
  }, [corretorId, page, perPage]);

  useEffect(() => {
    fetchRelatorios();
  }, [fetchRelatorios]);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Receipt className="h-5 w-5 text-[#D4AF37]" />
          Comissões
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Relatórios de comissão e transferências
        </p>
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            </div>
            <span className="text-[11px] text-white/40">Total Recebido</span>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(resumo?.total_recebido ?? 0)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <span className="text-[11px] text-white/40">Pendente</span>
          </div>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(resumo?.total_pendente ?? 0)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-[#D4AF37]" />
            </div>
            <span className="text-[11px] text-white/40">Mês Atual</span>
          </div>
          <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(resumo?.total_mes_atual ?? 0)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-[11px] text-white/40">Relatórios</span>
          </div>
          <p className="text-xl font-bold text-blue-400">{total}</p>
        </motion.div>
      </div>

      {/* Tabela de Relatórios */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Relatório</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Geração</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden md:table-cell">Previsão</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden md:table-cell">Pagamento</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden lg:table-cell">Tipo</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Valor líquido</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37] mx-auto" />
                  </td>
                </tr>
              ) : relatorios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/30">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Nenhum relatório de comissão</p>
                    <p className="text-xs mt-1">Seus relatórios aparecerão aqui conforme as produções forem comissionadas</p>
                  </td>
                </tr>
              ) : (
                relatorios.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                    className={cn(
                      'border-b border-white/[0.04] cursor-pointer transition-all',
                      selectedId === r.id
                        ? 'bg-[#D4AF37]/5'
                        : 'hover:bg-white/[0.02]',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.pdf_url && (
                          <a
                            href={r.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {r.status === 'pago' && (
                          <FileText className="h-3.5 w-3.5 text-green-400" />
                        )}
                        <span className="font-mono text-xs text-blue-400 hover:underline">
                          {r.numero_relatorio}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60">{formatDate(r.data_geracao)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/60">{formatDate(r.data_previsao)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/60">{formatDate(r.data_pagamento)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/50">{r.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        'text-sm font-bold',
                        r.status === 'pago' ? 'text-green-400' : 'text-white',
                      )}>
                        {formatCurrency(r.valor_liquido)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(1)} disabled={page === 1} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-all">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-all">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-xs font-semibold transition-all',
                      p === page
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white',
                    )}
                  >
                    {p}
                  </button>
                );
              })}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-all">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-all">
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
              >
                {[10, 25, 50].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <span className="text-xs text-white/40">itens por página</span>
              <span className="text-xs text-white/40">{(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} de {total} itens</span>
            </div>
          </div>
        )}
      </div>

      {/* Detalhes do relatório selecionado */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl"
          >
            {(() => {
              const rel = relatorios.find((r) => r.id === selectedId);
              if (!rel) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#D4AF37]" />
                      Relatório #{rel.numero_relatorio}
                    </h3>
                    {rel.pdf_url && (
                      <a
                        href={rel.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar PDF
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">Geração</p>
                      <p className="text-sm text-white font-medium">{formatDate(rel.data_geracao)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">Previsão</p>
                      <p className="text-sm text-white font-medium">{formatDate(rel.data_previsao)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">Pagamento</p>
                      <p className="text-sm text-white font-medium">{formatDate(rel.data_pagamento)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">Tipo</p>
                      <p className="text-sm text-white font-medium">{rel.tipo}</p>
                    </div>
                  </div>

                  <div className="flex gap-6 pt-3 border-t border-white/[0.06]">
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">Valor Bruto</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(rel.valor_bruto)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">Valor Líquido</p>
                      <p className="text-lg font-bold text-green-400">{formatCurrency(rel.valor_liquido)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
