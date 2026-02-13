'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, MessageSquare, Building2, Star, Calendar,
  Trash2, Edit2, MoreHorizontal, UserPlus, Search, Filter,
  ArrowUpRight, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '../../components/DataTable';
import { SearchInput, FilterSelect } from '../../components';
import type { CrmContactEnriched, CrmContactFilters, CrmLifecycleStage } from '@/lib/types/crm';
import { CRM_LIFECYCLE_STAGES } from '@/lib/types/crm';

// ========================================
// LIFECYCLE BADGE
// ========================================

const lifecycleConfig: Record<string, { label: string; color: string; bg: string }> = {
  lead: { label: 'Lead', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  mql: { label: 'MQL', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  sql: { label: 'SQL', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  oportunidade: { label: 'Oportunidade', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  cliente: { label: 'Cliente', color: 'text-green-400', bg: 'bg-green-500/10' },
  churned: { label: 'Churned', color: 'text-red-400', bg: 'bg-red-500/10' },
  evangelista: { label: 'Evangelista', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
};

function LifecycleBadge({ stage }: { stage: string }) {
  const cfg = lifecycleConfig[stage] ?? { label: stage, color: 'text-white/50', bg: 'bg-white/5' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}

// ========================================
// CONTACTS TABLE
// ========================================

export default function ContactsTable({
  contacts,
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
  contacts: CrmContactEnriched[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  filters: CrmContactFilters;
  onFilterChange: (f: Partial<CrmContactFilters>) => void;
  onPageChange: (p: number) => void;
  onRowClick: (c: CrmContactEnriched) => void;
  onDelete?: (id: string) => void;
}) {
  const columns: Column<CrmContactEnriched>[] = [
    {
      key: 'nome',
      header: 'Contato',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37] text-xs font-bold uppercase">
            {c.nome?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm text-white font-medium">{c.nome} {c.sobrenome ?? ''}</p>
            {c.cargo && <p className="text-[10px] text-white/30">{c.cargo}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      hidden: 'md',
      render: (c) => (
        <span className="text-sm text-white/60">{c.email ?? '—'}</span>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      hidden: 'lg',
      render: (c) => (
        <span className="text-sm text-white/60">{c.telefone ?? c.whatsapp ?? '—'}</span>
      ),
    },
    {
      key: 'lifecycle_stage',
      header: 'Estágio',
      sortable: true,
      render: (c) => <LifecycleBadge stage={c.lifecycle_stage ?? 'lead'} />,
    },
    {
      key: 'scoring',
      header: 'Score',
      sortable: true,
      hidden: 'md',
      render: (c) => (
        <div className="flex items-center gap-1">
          <Star className={cn('h-3 w-3', (c.score ?? 0) >= 70 ? 'text-[#D4AF37]' : 'text-white/20')} />
          <span className="text-sm text-white/60">{c.score ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Empresa',
      hidden: 'lg',
      render: (c) => (
        <span className="text-sm text-white/40">{c.company_nome ?? '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      hidden: 'xl',
      render: (c) => (
        <span className="text-sm text-white/40">
          {new Date(c.created_at).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  const lifecycleOptions = CRM_LIFECYCLE_STAGES.map((s) => ({
    value: s,
    label: lifecycleConfig[s]?.label ?? s,
  }));

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar contatos..."
          value={filters.search ?? ''}
          onChange={(v) => onFilterChange({ search: v || undefined })}
        />
        <FilterSelect
          placeholder="Estágio"
          value={filters.lifecycle_stage ?? ''}
          onChange={(v) => onFilterChange({ lifecycle_stage: (v || undefined) as CrmLifecycleStage | undefined })}
          options={lifecycleOptions}
        />
      </div>

      {/* Table */}
      <DataTable<CrmContactEnriched>
        data={contacts}
        columns={columns}
        loading={loading}
        rowKey={(c) => c.id}
        onRowClick={onRowClick}
        emptyTitle="Nenhum contato encontrado"
        emptyDescription="Adicione seu primeiro contato para começar"
        actions={onDelete ? (c) => (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : undefined}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">{total} contatos</span>
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
