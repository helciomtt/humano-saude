'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';

// ============================================
// TIPOS
// ============================================

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  hidden?: 'md' | 'lg' | 'xl';
  width?: string;
  render: (row: T) => React.ReactNode;
}

type SortDir = 'asc' | 'desc';

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  actions?: (row: T) => React.ReactNode;
}

// ============================================
// LOADING SKELETON
// ============================================

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-white/5">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ============================================
// COMPONENTE
// ============================================

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowKey,
  onRowClick,
  pageSize = 20,
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  // Columns count (including actions)
  const colCount = columns.length + (actions ? 1 : 0);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const hiddenClass = (h?: string) => {
    if (h === 'md') return 'hidden md:table-cell';
    if (h === 'lg') return 'hidden lg:table-cell';
    if (h === 'xl') return 'hidden xl:table-cell';
    return '';
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
      {loading ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-sm text-gray-400">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${hiddenClass(col.hidden)}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-medium w-12" />}
            </tr>
          </thead>
          <tbody>
            <TableSkeleton cols={colCount} />
          </tbody>
        </table>
      ) : data.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-sm text-gray-400 bg-white/[0.02]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-medium ${hiddenClass(col.hidden)} ${
                        col.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : ''
                      }`}
                      style={col.width ? { width: col.width } : undefined}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {col.sortable && (
                          <span className="text-gray-600">
                            {sortKey === col.key ? (
                              sortDir === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  {actions && <th className="px-4 py-3 font-medium w-12" />}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 text-sm ${hiddenClass(col.hidden)}`}>
                        {col.render(row)}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-sm">{actions(row)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <p className="text-xs text-gray-500">
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} de{' '}
                {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = page < 3 ? i : page - 2 + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-[#D4AF37] text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
