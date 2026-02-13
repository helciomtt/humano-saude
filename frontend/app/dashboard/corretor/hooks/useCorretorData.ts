'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CorretorDashboard, Renovacao } from '@/lib/types/corretor';
import type { Comissao } from '@/lib/types/database';
import {
  getCorretorDashboard,
  getComissoes,
  getComissoesResumo,
  getRenovacoes,
  getMateriais,
} from '@/app/actions/corretor-ops';

export function useCorretorDashboard(corretorId: string | null) {
  const [dashboard, setDashboard] = useState<CorretorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!corretorId) return;
    setLoading(true);
    getCorretorDashboard(corretorId)
      .then((r) => {
        if (r.success && r.data) setDashboard(r.data);
        else toast.error(r.error ?? 'Erro ao carregar dashboard');
      })
      .finally(() => setLoading(false));
  }, [corretorId]);

  return { dashboard, loading };
}

export function useComissoes(corretorId: string | null) {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<{
    total_recebido: number;
    total_pendente: number;
    total_mes_atual: number;
    quantidade_propostas_ativas: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComissoes = useCallback(async (filtros?: { mes?: string; status?: string }) => {
    if (!corretorId) return;
    setLoading(true);

    const [comissoesResult, resumoResult] = await Promise.all([
      getComissoes(corretorId, filtros),
      getComissoesResumo(corretorId),
    ]);

    if (comissoesResult.success && comissoesResult.data) {
      setComissoes(comissoesResult.data);
    }
    if (resumoResult.success && resumoResult.data) {
      setResumo(resumoResult.data);
    }

    setLoading(false);
  }, [corretorId]);

  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  return { comissoes, resumo, loading, fetchComissoes };
}

export function useRenovacoes(corretorId: string | null) {
  const [renovacoes, setRenovacoes] = useState<Renovacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!corretorId) return;
    setLoading(true);
    getRenovacoes(corretorId)
      .then((r) => {
        if (r.success && r.data) setRenovacoes(r.data);
      })
      .finally(() => setLoading(false));
  }, [corretorId]);

  // Separar por urgência
  const vencendo30d = renovacoes.filter((r) => r.dias_para_vencimento <= 30 && r.dias_para_vencimento >= 0);
  const vencendo60d = renovacoes.filter((r) => r.dias_para_vencimento > 30 && r.dias_para_vencimento <= 60);
  const vencidos = renovacoes.filter((r) => r.dias_para_vencimento < 0);

  return { renovacoes, vencendo30d, vencendo60d, vencidos, loading };
}

export function useMateriais() {
  const [materiais, setMateriais] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const fetchMateriais = useCallback(async (filtros?: {
    categoria?: string;
    operadora_id?: string;
    busca?: string;
  }) => {
    setLoading(true);
    const result = await getMateriais(filtros);
    if (result.success && result.data) {
      setMateriais(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMateriais();
  }, [fetchMateriais]);

  return { materiais, loading, fetchMateriais };
}
