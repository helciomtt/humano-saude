'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { LeadListFilters, LeadListResult } from '@/app/actions/corretor-crm';
import { getLeadsList } from '@/app/actions/corretor-crm';
import type { KanbanColumnSlug, CrmCardEnriched } from '@/lib/types/corretor';

export function useCrmLeads(corretorId: string | null) {
  const [result, setResult] = useState<LeadListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadListFilters>({
    colunaSlug: 'todos',
    orderBy: 'updated_at',
    orderDir: 'desc',
    page: 1,
    perPage: 20,
  });

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeads = useCallback(async (overrides?: Partial<LeadListFilters>) => {
    if (!corretorId) return;
    setLoading(true);
    const merged = { ...filters, ...overrides };
    const res = await getLeadsList(corretorId, merged);
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      toast.error(res.error ?? 'Erro ao carregar leads');
    }
    setLoading(false);
  }, [corretorId, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateFilter = useCallback((key: keyof LeadListFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  const setSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setSort = useCallback((orderBy: LeadListFilters['orderBy'], orderDir: LeadListFilters['orderDir']) => {
    setFilters((prev) => ({ ...prev, orderBy, orderDir, page: 1 }));
  }, []);

  const setColumnFilter = useCallback((slug: KanbanColumnSlug | 'todos') => {
    setFilters((prev) => ({ ...prev, colunaSlug: slug, page: 1 }));
  }, []);

  return {
    leads: result?.leads ?? [],
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
    loading,
    filters,
    setSearch,
    setPage,
    setSort,
    setColumnFilter,
    updateFilter,
    refetch: fetchLeads,
  };
}
