'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanColumnSlug } from '@/lib/types/corretor';
import type { LeadListFilters } from '@/app/actions/corretor-crm';

const COLUMN_OPTIONS: { value: KanbanColumnSlug | 'todos'; label: string; color: string }[] = [
  { value: 'todos', label: 'Todos', color: 'text-white/60' },
  { value: 'novo_lead', label: 'Novo Lead', color: 'text-blue-400' },
  { value: 'qualificado', label: 'Qualificado', color: 'text-purple-400' },
  { value: 'proposta_enviada', label: 'Proposta Enviada', color: 'text-yellow-400' },
  { value: 'documentacao', label: 'Documentação', color: 'text-cyan-400' },
  { value: 'fechado', label: 'Fechado', color: 'text-green-400' },
  { value: 'perdido', label: 'Perdido', color: 'text-red-400' },
];

const PRIORIDADE_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'urgente', label: '🔴 Urgente' },
  { value: 'alta', label: '🟠 Alta' },
  { value: 'media', label: '🟡 Média' },
  { value: 'baixa', label: '🟢 Baixa' },
];

export default function CrmFilters({
  filters,
  onSearch,
  onColumnFilter,
  onPrioridadeFilter,
  onSort,
  counts,
}: {
  filters: LeadListFilters;
  onSearch: (value: string) => void;
  onColumnFilter: (slug: KanbanColumnSlug | 'todos') => void;
  onPrioridadeFilter: (value: string) => void;
  onSort: (orderBy: LeadListFilters['orderBy'], orderDir: LeadListFilters['orderDir']) => void;
  counts?: Record<string, number>;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const activeFilters = [
    filters.colunaSlug !== 'todos' ? filters.colunaSlug : null,
    filters.prioridade ? filters.prioridade : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Barra principal */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nome do lead..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/30 transition-colors"
          />
          {searchValue && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
            </button>
          )}
        </div>

        {/* Filtros avançados toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
            showAdvanced || activeFilters > 0
              ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
              : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilters > 0 && (
            <span className="h-5 w-5 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>

        {/* Ordenação */}
        <div className="relative">
          <select
            value={`${filters.orderBy}_${filters.orderDir}`}
            onChange={(e) => {
              const [orderBy, orderDir] = e.target.value.split('_') as [LeadListFilters['orderBy'], LeadListFilters['orderDir']];
              onSort(orderBy, orderDir);
            }}
            className="appearance-none bg-white/[0.03] border border-white/[0.08] text-white/60 text-sm rounded-xl px-4 py-2.5 pr-8 outline-none focus:border-[#D4AF37]/30 cursor-pointer"
          >
            <option value="updated_at_desc">Mais Recentes</option>
            <option value="updated_at_asc">Mais Antigos</option>
            <option value="score_desc">Maior Score</option>
            <option value="score_asc">Menor Score</option>
            <option value="valor_estimado_desc">Maior Valor</option>
            <option value="created_at_desc">Data Criação</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Filtros avançados */}
      {showAdvanced && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {/* Coluna/Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLUMN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onColumnFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  filters.colunaSlug === opt.value
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-transparent text-white/40 hover:text-white/60',
                )}
              >
                <span className={cn(filters.colunaSlug === opt.value && opt.color)}>
                  {opt.label}
                </span>
                {counts && counts[opt.value] !== undefined && (
                  <span className="ml-1 text-[10px] text-white/30">
                    {counts[opt.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Prioridade */}
          <div className="flex items-center gap-1.5">
            {PRIORIDADE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPrioridadeFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  (filters.prioridade ?? '') === opt.value
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-transparent text-white/40 hover:text-white/60',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Clear */}
          {activeFilters > 0 && (
            <>
              <div className="h-6 w-px bg-white/10" />
              <button
                onClick={() => {
                  onColumnFilter('todos');
                  onPrioridadeFilter('');
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Limpar filtros
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
