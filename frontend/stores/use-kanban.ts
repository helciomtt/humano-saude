'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useKanbanStore } from '@/stores/kanban-store';
import {
  getPipelines,
  getAdminKanbanBoard,
  moveDeal,
  createDeal,
  deleteDeal,
  markDealWon,
  markDealLost,
} from '@/app/actions/crm';
import type { CrmDealInsert, CrmDealEnriched } from '@/lib/types/crm';

// ========================================
// useKanbanWithStore — Integra o Zustand store com server actions
// ========================================

export function useKanbanWithStore(initialPipelineId?: string) {
  const store = useKanbanStore();

  // Carregar pipelines na montagem
  useEffect(() => {
    (async () => {
      const res = await getPipelines();
      if (res.success && res.data) {
        store.setPipelines(res.data);
        if (!initialPipelineId && res.data.length > 0) {
          const defaultPipeline = res.data.find((p) => p.is_default) ?? res.data[0];
          store.setActivePipelineId(defaultPipeline.id);
        } else if (initialPipelineId) {
          store.setActivePipelineId(initialPipelineId);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPipelineId]);

  // Carregar board quando pipeline muda
  const fetchBoard = useCallback(async () => {
    const pipelineId = store.activePipelineId;
    if (!pipelineId) return;
    store.setLoading(true);
    const res = await getAdminKanbanBoard(pipelineId);
    if (res.success && res.data) {
      store.setBoard(res.data);
    } else {
      toast.error(res.error ?? 'Erro ao carregar pipeline');
    }
    store.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.activePipelineId]);

  useEffect(() => {
    if (store.activePipelineId) fetchBoard();
  }, [store.activePipelineId, fetchBoard]);

  // Move deal com optimistic update
  const handleMoveDeal = useCallback(async (
    dealId: string,
    sourceStageId: string,
    destStageId: string,
    newPosition: number,
    corretorId: string,
  ) => {
    // Optimistic update via store
    store.moveDealOptimistic(dealId, sourceStageId, destStageId, newPosition);

    const res = await moveDeal(dealId, destStageId, newPosition, corretorId);
    if (!res.success) {
      toast.error('Erro ao mover deal. Recarregando...');
      await fetchBoard();
    } else if (res.data?.is_won) {
      toast.success('🏆 Deal fechado como ganho!');
    } else if (res.data?.is_lost) {
      toast.info('Deal marcado como perdido');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBoard]);

  // Criar deal
  const handleCreateDeal = useCallback(async (input: CrmDealInsert) => {
    const res = await createDeal(input);
    if (res.success && res.data) {
      toast.success('Deal criado!');
      await fetchBoard(); // Refresh para pegar o deal completo
      return res.data;
    } else {
      toast.error(res.error ?? 'Erro ao criar deal');
      return null;
    }
  }, [fetchBoard]);

  // Deletar deal com optimistic
  const handleDeleteDeal = useCallback(async (dealId: string) => {
    store.removeDealOptimistic(dealId);
    const res = await deleteDeal(dealId);
    if (!res.success) {
      toast.error('Erro ao excluir deal');
      await fetchBoard();
    } else {
      toast.success('Deal excluído');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBoard]);

  // Ganhar deal
  const handleWinDeal = useCallback(async (dealId: string, corretorId: string) => {
    const res = await markDealWon(dealId, corretorId);
    if (res.success) {
      toast.success('🏆 Deal ganho!');
      await fetchBoard();
    } else {
      toast.error(res.error ?? 'Erro ao ganhar deal');
    }
  }, [fetchBoard]);

  // Perder deal
  const handleLoseDeal = useCallback(async (
    dealId: string,
    motivo: string,
    detalhe: string | null,
    corretorId: string,
  ) => {
    const res = await markDealLost(dealId, motivo, detalhe, corretorId);
    if (res.success) {
      toast.info('Deal marcado como perdido');
      await fetchBoard();
    } else {
      toast.error(res.error ?? 'Erro ao perder deal');
    }
  }, [fetchBoard]);

  // Selecionar deal
  const handleDealClick = useCallback((deal: CrmDealEnriched) => {
    store.setSelectedDeal(deal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseDetail = useCallback(() => {
    store.setSelectedDeal(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    ...store,
    // Actions
    fetchBoard,
    handleMoveDeal,
    handleCreateDeal,
    handleDeleteDeal,
    handleWinDeal,
    handleLoseDeal,
    handleDealClick,
    handleCloseDetail,
  };
}
