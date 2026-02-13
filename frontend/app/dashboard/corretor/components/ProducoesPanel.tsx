'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
  Loader2,
  Package,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProducoes, getParcelasProducao } from '@/app/actions/corretor-financeiro';
import type { Producao, ParcelaComissao } from '@/app/actions/corretor-financeiro';

// =============================================
// PRODUÇÕES PANEL
// =============================================

export default function ProducoesPanel({ corretorId }: { corretorId: string }) {
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalValor, setTotalValor] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  // Seleção e parcelas
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parcelas, setParcelas] = useState<ParcelaComissao[]>([]);
  const [loadingParcelas, setLoadingParcelas] = useState(false);
  const [tabParcelas, setTabParcelas] = useState<'parcelas' | 'beneficiarios'>('parcelas');

  const totalPages = Math.ceil(total / perPage);

  const fetchProducoes = useCallback(async () => {
    setLoading(true);
    const result = await getProducoes(corretorId, {
      busca: busca || undefined,
      modalidade: filtroModalidade || undefined,
      status: filtroStatus || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      page,
      perPage,
    });
    if (result.success) {
      setProducoes(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalValor(result.totalValor ?? 0);
    }
    setLoading(false);
  }, [corretorId, busca, filtroModalidade, filtroStatus, dataInicio, dataFim, page, perPage]);

  useEffect(() => {
    fetchProducoes();
  }, [fetchProducoes]);

  // Carregar parcelas ao selecionar produção
  useEffect(() => {
    if (!selectedId) {
      setParcelas([]);
      return;
    }
    setLoadingParcelas(true);
    getParcelasProducao(selectedId).then((r) => {
      if (r.success) setParcelas(r.data ?? []);
      setLoadingParcelas(false);
    });
  }, [selectedId]);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatCurrency = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const limparFiltros = () => {
    setBusca('');
    setFiltroModalidade('');
    setFiltroStatus('');
    setDataInicio('');
    setDataFim('');
    setPage(1);
  };

  const modalidades = ['Individual', 'Familiar', 'PME', 'Adesão', 'Individual Odonto'];
  const statusOptions = ['Implantada', 'Em análise', 'Cancelada', 'Suspensa'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-[#D4AF37]" />
            Produções
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Contratos vendidos e implantados
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm">
          <Download className="h-4 w-4" />
          Relatório de produção
        </button>
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-[11px] text-white/40">Total Contratos</span>
          </div>
          <p className="text-xl font-bold text-white">{total}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-[#D4AF37]" />
            </div>
            <span className="text-[11px] text-white/40">Valor Total</span>
          </div>
          <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(totalValor)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            </div>
            <span className="text-[11px] text-white/40">Implantadas</span>
          </div>
          <p className="text-xl font-bold text-green-400">{producoes.filter(p => p.status === 'Implantada').length}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-white/40">Ticket Médio</span>
          </div>
          <p className="text-xl font-bold text-purple-400">{total > 0 ? formatCurrency(totalValor / total) : 'R$ 0,00'}</p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </div>

          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all',
              showFiltros
                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20',
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          {(busca || filtroModalidade || filtroStatus || dataInicio || dataFim) && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>

        {/* Filtros expandidos */}
        <AnimatePresence>
          {showFiltros && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
                <div>
                  <label className="text-[11px] text-white/40 mb-1 block">Modalidade</label>
                  <select
                    value={filtroModalidade}
                    onChange={(e) => { setFiltroModalidade(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value="">Todas</option>
                    {modalidades.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-white/40 mb-1 block">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => { setFiltroStatus(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value="">Todos</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-white/40 mb-1 block">Data início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-white/40 mb-1 block">Data fim</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabela de Produções */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Proposta</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden lg:table-cell">Cód. Emp.</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden md:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden lg:table-cell">Produção</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden xl:table-cell">Vigência</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden xl:table-cell">Implantação</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Segurado</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden md:table-cell">SubProduto</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden lg:table-cell">Modalidade</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Valor</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37] mx-auto" />
                  </td>
                </tr>
              ) : producoes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-white/30">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Nenhuma produção encontrada</p>
                  </td>
                </tr>
              ) : (
                producoes.map((p, idx) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                    className={cn(
                      'border-b border-white/[0.04] cursor-pointer transition-all',
                      selectedId === p.id
                        ? 'bg-[#D4AF37]/5 border-l-2 border-l-[#D4AF37]'
                        : 'hover:bg-white/[0.02]',
                      idx === 0 && 'bg-[#D4AF37]/[0.03]',
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-white/80">{p.numero_proposta || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/50">{p.codigo_empresa || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/60">{formatDate(p.data_cadastro)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/60">{formatDate(p.data_producao)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-white/60">{formatDate(p.data_vigencia)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-white/60">{formatDate(p.data_implantacao)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white font-medium truncate block max-w-[200px]">{p.nome_segurado}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/60 truncate block max-w-[180px]">{p.subproduto || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        p.modalidade === 'PME' ? 'bg-blue-500/10 text-blue-400' :
                        p.modalidade === 'Individual' ? 'bg-green-500/10 text-green-400' :
                        p.modalidade === 'Familiar' ? 'bg-purple-500/10 text-purple-400' :
                        p.modalidade === 'Individual Odonto' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-white/5 text-white/50',
                      )}>
                        {p.modalidade || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-white">{formatCurrency(p.valor_mensalidade)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        p.status === 'Implantada' ? 'bg-green-500/10 text-green-400' :
                        p.status === 'Em análise' ? 'bg-yellow-500/10 text-yellow-400' :
                        p.status === 'Cancelada' ? 'bg-red-500/10 text-red-400' :
                        'bg-white/5 text-white/50',
                      )}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total row */}
            {producoes.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/[0.08]">
                  <td colSpan={9} className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-[#D4AF37]">
                      {formatCurrency(producoes.reduce((acc, p) => acc + Number(p.valor_mensalidade), 0))}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Paginação */}
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

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-all">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-all">
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
      </div>

      {/* Parcelas da produção selecionada */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl"
          >
            {/* Tabs */}
            <div className="flex border-b border-white/[0.08]">
              <button
                onClick={() => setTabParcelas('parcelas')}
                className={cn(
                  'px-5 py-3 text-sm font-medium transition-all border-b-2',
                  tabParcelas === 'parcelas'
                    ? 'text-[#D4AF37] border-[#D4AF37]'
                    : 'text-white/40 border-transparent hover:text-white/60',
                )}
              >
                Parcelas
              </button>
              <button
                onClick={() => setTabParcelas('beneficiarios')}
                className={cn(
                  'px-5 py-3 text-sm font-medium transition-all border-b-2',
                  tabParcelas === 'beneficiarios'
                    ? 'text-[#D4AF37] border-[#D4AF37]'
                    : 'text-white/40 border-transparent hover:text-white/60',
                )}
              >
                Beneficiários
              </button>
            </div>

            {tabParcelas === 'parcelas' ? (
              <div className="overflow-x-auto">
                {loadingParcelas ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37] mx-auto" />
                  </div>
                ) : parcelas.length === 0 ? (
                  <div className="py-12 text-center text-white/30 text-sm">
                    Nenhuma parcela registrada para esta produção
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Parcela</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Valor</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Taxa</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Venc.</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Comissão</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Cód. Comissão</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Pgto. Comissão</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-white/40 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelas.map((parcela) => (
                        <tr key={parcela.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 text-xs text-white/70">{parcela.numero_parcela}</td>
                          <td className="px-4 py-2.5 text-xs text-white">{formatCurrency(parcela.valor_parcela)}</td>
                          <td className="px-4 py-2.5 text-xs text-white/50">{formatCurrency(parcela.taxa)}</td>
                          <td className="px-4 py-2.5 text-xs text-white/60">{formatDate(parcela.data_vencimento)}</td>
                          <td className="px-4 py-2.5 text-xs text-white/60">{parcela.percentual_comissao}%</td>
                          <td className="px-4 py-2.5 text-xs text-white/50">{parcela.codigo_comissao || '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-white/50">{parcela.data_pagamento_comissao ? formatDate(parcela.data_pagamento_comissao) : '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              parcela.status_comissao === 'paga' ? 'bg-green-500/10 text-green-400' :
                              parcela.status_comissao === 'atrasada' ? 'bg-red-500/10 text-red-400' :
                              'bg-yellow-500/10 text-yellow-400',
                            )}>
                              {parcela.status_comissao === 'paga' ? 'Paga' : parcela.status_comissao === 'atrasada' ? 'Atrasada' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-white/30 text-sm">
                Dados de beneficiários não disponíveis
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
