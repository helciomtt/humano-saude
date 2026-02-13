'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { KanbanBoard, KanbanColumnSlug, CrmCardEnriched, CrmInteracao } from '@/lib/types/corretor';
import {
  getKanbanBoard,
  moveCard,
  createCrmCard,
  getCardInteracoes,
  addInteracao,
  recalculateScore,
} from '@/app/actions/corretor-crm';

export function useKanban(corretorId: string | null) {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CrmCardEnriched | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchBoard = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const result = await getKanbanBoard(corretorId);
    if (result.success && result.data) {
      setBoard(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar pipeline');
    }
    setLoading(false);
  }, [corretorId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleMoveCard = useCallback(
    async (
      cardId: string,
      sourceColumn: KanbanColumnSlug,
      destinationColumn: KanbanColumnSlug,
      newPosition: number,
    ) => {
      if (!corretorId || !board) return;

      // Optimistic update
      setBoard((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        const sourceCards = [...(next[sourceColumn] ?? [])];
        const cardIndex = sourceCards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return prev;

        const [movedCard] = sourceCards.splice(cardIndex, 1);
        movedCard.coluna_slug = destinationColumn;
        movedCard.posicao = newPosition;

        next[sourceColumn] = sourceCards;

        const destCards = [...(next[destinationColumn] ?? [])];
        destCards.splice(newPosition, 0, movedCard);
        next[destinationColumn] = destCards;

        return next;
      });

      const result = await moveCard(cardId, destinationColumn, newPosition, corretorId, sourceColumn);
      if (!result.success) {
        toast.error('Erro ao mover card. Recarregando...');
        await fetchBoard();
      }
    },
    [corretorId, board, fetchBoard],
  );

  const handleAddCard = useCallback(
    async (titulo: string, colunaSlug: KanbanColumnSlug, leadId?: string) => {
      if (!corretorId) return;

      const result = await createCrmCard({
        corretor_id: corretorId,
        lead_id: leadId ?? null,
        coluna_slug: colunaSlug,
        titulo,
        subtitulo: null,
        valor_estimado: null,
        posicao: (board?.[colunaSlug]?.length ?? 0),
        score: 0,
        score_motivo: null,
        ultima_interacao_proposta: null,
        total_interacoes: 0,
        tags: [],
        prioridade: 'media',
        metadata: {},
      });

      if (result.success) {
        toast.success('Lead adicionado ao pipeline');
        await fetchBoard();
      } else {
        toast.error(result.error ?? 'Erro ao criar card');
      }
    },
    [corretorId, board, fetchBoard],
  );

  const openDrawer = useCallback((card: CrmCardEnriched) => {
    setSelectedCard(card);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedCard(null);
  }, []);

  // Total por coluna para Big Numbers
  const columnCounts = board
    ? Object.entries(board).reduce(
        (acc, [key, cards]) => ({ ...acc, [key]: cards.length }),
        {} as Record<string, number>,
      )
    : {};

  return {
    board,
    loading,
    selectedCard,
    drawerOpen,
    columnCounts,
    fetchBoard,
    handleMoveCard,
    handleAddCard,
    openDrawer,
    closeDrawer,
  };
}

export function useCardInteracoes(cardId: string | null) {
  const [interacoes, setInteracoes] = useState<CrmInteracao[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInteracoes = useCallback(async () => {
    if (!cardId) return;
    setLoading(true);
    const result = await getCardInteracoes(cardId);
    if (result.success && result.data) {
      setInteracoes(result.data as unknown as CrmInteracao[]);
    }
    setLoading(false);
  }, [cardId]);

  useEffect(() => {
    fetchInteracoes();
  }, [fetchInteracoes]);

  const handleAddInteracao = useCallback(
    async (data: Parameters<typeof addInteracao>[0]) => {
      const result = await addInteracao(data);
      if (result.success) {
        toast.success('Interação registrada');
        await fetchInteracoes();
      } else {
        toast.error(result.error ?? 'Erro ao registrar');
      }
    },
    [fetchInteracoes],
  );

  return { interacoes, loading, fetchInteracoes, handleAddInteracao };
}
