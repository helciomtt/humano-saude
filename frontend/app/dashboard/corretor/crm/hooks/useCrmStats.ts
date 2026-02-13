'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CrmStats } from '@/app/actions/corretor-crm';
import { getCrmStats } from '@/app/actions/corretor-crm';

export function useCrmStats(corretorId: string | null) {
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const result = await getCrmStats(corretorId);
    if (result.success && result.data) {
      setStats(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar métricas');
    }
    setLoading(false);
  }, [corretorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
