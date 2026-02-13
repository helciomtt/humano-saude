'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Shield, Building2, Users, DollarSign,
  MoreHorizontal, Trash2, Power, Copy, ExternalLink,
  Search, Filter, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '../components';
import { toast } from 'sonner';
import {
  getPlanos,
  togglePlanoAtivo,
  deletePlano,
  getPlanosStats,
  type PlanoComPrecos,
} from '@/app/actions/planos';

// ========================================
// OPERADORA BADGES
// ========================================

const operadoraColors: Record<string, { text: string; bg: string; border: string }> = {
  amil:           { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  sulamerica:     { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  bradesco:       { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  porto:          { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  assim:          { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  levesaude:      { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  unimed:         { text: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
  preventsenior:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  medsenior:      { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

function OperadoraBadge({ id, nome }: { id: string; nome: string }) {
  const c = operadoraColors[id] ?? { text: 'text-white/50', bg: 'bg-white/5', border: 'border-white/10' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border', c.text, c.bg, c.border)}>
      <Heart className="h-3 w-3" />
      {nome}
    </span>
  );
}

// ========================================
// MODALIDADE BADGE
// ========================================

const modalidadeConfig: Record<string, { label: string; color: string; bg: string }> = {
  PME:    { label: 'PME',    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  PF:     { label: 'PF',     color: 'text-green-400',  bg: 'bg-green-500/10' },
  Adesao: { label: 'Adesão', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

// ========================================
// EXPANDABLE ROW
// ========================================

function PrecosFaixaPanel({ precos }: { precos: PlanoComPrecos['precos_faixa'] }) {
  if (!precos?.length) {
    return <p className="text-xs text-white/20 p-4">Sem preços cadastrados</p>;
  }

  const sorted = [...precos].sort((a, b) => a.faixa_ordem - b.faixa_ordem);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Preços por Faixa Etária</p>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {sorted.map((p) => (
            <div key={p.id} className="text-center rounded-lg bg-white/[0.03] border border-white/5 p-2">
              <p className="text-[10px] text-white/40">{p.faixa_etaria}</p>
              <p className="text-xs font-semibold text-white mt-0.5">
                {formatCurrency(Number(p.valor))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// STATS CARDS
// ========================================

function StatsGrid({ stats }: { stats: { total: number; ativos: number; pme: number; pf: number; adesao: number; operadoras: number } | null }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total de Planos', value: stats.total.toString(), icon: Shield, color: 'gold' },
    { label: 'PME', value: stats.pme.toString(), icon: Building2, color: 'blue' },
    { label: 'PF / Individual', value: stats.pf.toString(), icon: Users, color: 'green' },
    { label: 'Adesão', value: stats.adesao.toString(), icon: Star, color: 'purple' },
    { label: 'Operadoras', value: stats.operadoras.toString(), icon: Heart, color: 'cyan' },
    { label: 'Ativos', value: stats.ativos.toString(), icon: Power, color: 'emerald' },
  ];

  const colorMap: Record<string, { text: string; bg: string }> = {
    gold:    { text: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    blue:    { text: 'text-blue-400',   bg: 'bg-blue-500/10' },
    green:   { text: 'text-green-400',  bg: 'bg-green-500/10' },
    purple:  { text: 'text-purple-400', bg: 'bg-purple-500/10' },
    cyan:    { text: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
    emerald: { text: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => {
        const clr = colorMap[c.color] ?? colorMap.gold;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 p-5"
          >
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', clr.bg)}>
              <c.icon className={cn('h-5 w-5', clr.text)} />
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-white/40 mt-1">{c.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function PlanosPage() {
  const [planos, setPlanos] = useState<PlanoComPrecos[]>([]);
  const [stats, setStats] = useState<{ total: number; ativos: number; pme: number; pf: number; adesao: number; operadoras: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterModalidade, setFilterModalidade] = useState<string>('');
  const [filterOperadora, setFilterOperadora] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [planosRes, statsRes] = await Promise.all([
      getPlanos({
        modalidade: filterModalidade || undefined,
        operadora_id: filterOperadora || undefined,
      }),
      getPlanosStats(),
    ]);
    if (planosRes.success && planosRes.data) setPlanos(planosRes.data);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    setLoading(false);
  }, [filterModalidade, filterOperadora]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Client-side search filter
  const filtered = planos.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.plano_nome.toLowerCase().includes(s) ||
      p.operadora_nome.toLowerCase().includes(s) ||
      (p.notas ?? '').toLowerCase().includes(s)
    );
  });

  // Unique operadoras for filter
  const operadoras = Array.from(new Set(planos.map((p) => p.operadora_id))).map((id) => ({
    id,
    nome: planos.find((p) => p.operadora_id === id)?.operadora_nome ?? id,
  }));

  const handleToggleAtivo = async (id: string, current: boolean) => {
    const res = await togglePlanoAtivo(id, !current);
    if (res.success) {
      toast.success(current ? 'Plano desativado' : 'Plano ativado');
      fetchData();
    } else {
      toast.error(res.error ?? 'Erro');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este plano permanentemente?')) return;
    const res = await deletePlano(id);
    if (res.success) {
      toast.success('Plano removido');
      fetchData();
    } else {
      toast.error(res.error ?? 'Erro ao remover');
    }
  };

  const getPrecoMinMax = (precos: PlanoComPrecos['precos_faixa']) => {
    if (!precos?.length) return { min: 0, max: 0 };
    const vals = precos.map((p) => Number(p.valor)).filter((v) => v > 0);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="TABELA DE PREÇOS"
        description="Catálogo de planos das operadoras parceiras"
      >
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Atualizar
        </button>
      </PageHeader>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            placeholder="Buscar planos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>

        {/* Modalidade filter */}
        <select
          value={filterModalidade}
          onChange={(e) => setFilterModalidade(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
        >
          <option value="">Todas Modalidades</option>
          <option value="PME">PME</option>
          <option value="PF">PF / Individual</option>
          <option value="Adesao">Adesão</option>
        </select>

        {/* Operadora filter */}
        <select
          value={filterOperadora}
          onChange={(e) => setFilterOperadora(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
        >
          <option value="">Todas Operadoras</option>
          {operadoras.map((op) => (
            <option key={op.id} value={op.id}>{op.nome}</option>
          ))}
        </select>

        <span className="text-xs text-white/30 ml-auto">
          {filtered.length} plano{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.01]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1.5fr_80px_100px_100px_140px_60px] gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/5">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Operadora</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Plano</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Tipo</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Acomodação</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Vidas</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Preço (Min–Max)</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider text-center">Ações</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <RefreshCw className="h-5 w-5 text-[#D4AF37] animate-spin mx-auto mb-2" />
            <p className="text-xs text-white/30">Carregando planos...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">Nenhum plano encontrado</p>
            <p className="text-xs text-white/15 mt-1">Ajuste os filtros ou importe novas tabelas</p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((plano) => {
          const { min, max } = getPrecoMinMax(plano.precos_faixa);
          const isExpanded = expandedId === plano.id;
          const mod = modalidadeConfig[plano.modalidade] ?? { label: plano.modalidade, color: 'text-white/50', bg: 'bg-white/5' };

          return (
            <div key={plano.id} className="border-b border-white/[0.03] last:border-0">
              {/* Row */}
              <div
                className="grid grid-cols-[1fr_1.5fr_80px_100px_100px_140px_60px] gap-4 px-6 py-3.5 items-center hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : plano.id)}
              >
                <OperadoraBadge id={plano.operadora_id} nome={plano.operadora_nome} />

                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-white/30 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{plano.plano_nome}</p>
                    {plano.coparticipacao && (
                      <p className="text-[10px] text-white/30">Copart. {plano.coparticipacao_pct ?? '?'}%</p>
                    )}
                  </div>
                </div>

                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', mod.color, mod.bg)}>
                  {mod.label}
                </span>

                <span className="text-xs text-white/50 capitalize">{plano.acomodacao}</span>

                <span className="text-xs text-white/40">
                  {plano.vidas_min ?? '?'}–{plano.vidas_max ?? '?'}
                </span>

                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-[#D4AF37]/50" />
                  <span className="text-xs text-white/60">
                    {min > 0 ? `${formatCurrency(min)} – ${formatCurrency(max)}` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleAtivo(plano.id, plano.ativo); }}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      plano.ativo
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-white/20 hover:bg-white/5',
                    )}
                    title={plano.ativo ? 'Desativar' : 'Ativar'}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(plano.id); }}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded precos panel */}
              <AnimatePresence>
                {isExpanded && <PrecosFaixaPanel precos={plano.precos_faixa} />}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
