'use client';

import {
  DollarSign, Trash2, Star, Sparkles, AlertTriangle,
  Calendar, User, Building2, Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '../../components/DataTable';
import { SearchInput, FilterSelect } from '../../components';
import type { CrmDealEnriched, CrmDealFilters, CrmDealPriority } from '@/lib/types/crm';

// ========================================
// HELPERS
// ========================================

function fmt(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10' },
  alta: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  media: { label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  baixa: { label: 'Baixa', color: 'text-green-400', bg: 'bg-green-500/10' },
};

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] ?? { label: priority, color: 'text-white/50', bg: 'bg-white/5' };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', cfg.color, cfg.bg)}>
      <Flag className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ========================================
// DEALS TABLE
// ========================================

export default function DealsTable({
  deals,
  loading,
  total,
  page,
  perPage,
  filters,
  onFilterChange,
  onPageChange,
  onRowClick,
  onDelete,
}: {
  deals: CrmDealEnriched[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  filters: CrmDealFilters;
  onFilterChange: (f: Partial<CrmDealFilters>) => void;
  onPageChange: (p: number) => void;
  onRowClick: (d: CrmDealEnriched) => void;
  onDelete?: (id: string) => void;
}) {
  const columns: Column<CrmDealEnriched>[] = [
    {
      key: 'titulo',
      header: 'Deal',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-white font-medium truncate">{d.titulo}</p>
              {d.is_hot && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
                  <Sparkles className="h-2 w-2" /> HOT
                </span>
              )}
              {d.is_stale && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-2 w-2" /> PARADO
                </span>
              )}
            </div>
            {d.stage_nome && (
              <span
                className="text-[10px] font-medium"
                style={{ color: d.stage_cor ?? '#6B7280' }}
              >
                {d.stage_nome}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      sortable: true,
      render: (d) => (
        <span className="text-sm text-[#D4AF37] font-semibold">{fmt(d.valor)}</span>
      ),
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      sortable: true,
      hidden: 'md',
      render: (d) => <PriorityBadge priority={d.prioridade} />,
    },
    {
      key: 'contact',
      header: 'Contato',
      hidden: 'md',
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-white/20" />
          <span className="text-sm text-white/60 truncate">
            {d.contact ? `${d.contact.nome} ${d.contact.sobrenome ?? ''}` : '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Empresa',
      hidden: 'lg',
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-white/20" />
          <span className="text-sm text-white/40 truncate">{d.company?.nome ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      hidden: 'lg',
      render: (d) => (
        <div className="flex items-center gap-1">
          <Star className={cn('h-3 w-3', d.score >= 70 ? 'text-[#D4AF37]' : 'text-white/20')} />
          <span className="text-sm text-white/60">{d.score}</span>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Responsável',
      hidden: 'xl',
      render: (d) => <span className="text-sm text-white/40">{d.owner?.nome ?? '—'}</span>,
    },
    {
      key: 'data_previsao_fechamento',
      header: 'Previsão',
      sortable: true,
      hidden: 'xl',
      render: (d) => (
        <span className="text-sm text-white/40">
          {d.data_previsao_fechamento ? new Date(d.data_previsao_fechamento).toLocaleDateString('pt-BR') : '—'}
        </span>
      ),
    },
  ];

  const priorityOptions = [
    { value: 'urgente', label: 'Urgente' },
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Média' },
    { value: 'baixa', label: 'Baixa' },
  ];

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar deals..."
          value={filters.search ?? ''}
          onChange={(v) => onFilterChange({ search: v || undefined })}
        />
        <FilterSelect
          placeholder="Prioridade"
          value={filters.prioridade ?? ''}
          onChange={(v) => onFilterChange({ prioridade: (v || undefined) as CrmDealPriority | undefined })}
          options={priorityOptions}
        />
      </div>

      {/* Table */}
      <DataTable<CrmDealEnriched>
        data={deals}
        columns={columns}
        loading={loading}
        rowKey={(d) => d.id}
        onRowClick={onRowClick}
        emptyTitle="Nenhum deal encontrado"
        emptyDescription="Crie seu primeiro deal para começar"
        actions={onDelete ? (d) => (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(d.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : undefined}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">{total} deals</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-xs text-white/40">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
