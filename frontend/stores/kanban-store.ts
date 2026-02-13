import { create } from 'zustand';
import type {
  CrmDealEnriched,
  CrmStageWithMetrics,
  CrmPipeline,
  AdminKanbanBoard,
  CrmDealPriority,
} from '@/lib/types/crm';

// ========================================
// KANBAN STORE — Estado global do Kanban CRM
// ========================================

interface KanbanFilters {
  search: string;
  prioridade: CrmDealPriority | null;
  owner_corretor_id: string | null;
  is_hot: boolean | null;
  is_stale: boolean | null;
  tags: string[];
}

interface KanbanState {
  // Dados
  board: AdminKanbanBoard | null;
  pipelines: CrmPipeline[];
  activePipelineId: string | null;

  // UI
  selectedDealId: string | null;
  selectedDeal: CrmDealEnriched | null;
  isLoading: boolean;
  isDragging: boolean;
  draggedDealId: string | null;
  filters: KanbanFilters;

  // Actions — Data
  setBoard: (board: AdminKanbanBoard | null) => void;
  setPipelines: (pipelines: CrmPipeline[]) => void;
  setActivePipelineId: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Actions — UI
  setSelectedDealId: (id: string | null) => void;
  setSelectedDeal: (deal: CrmDealEnriched | null) => void;
  setDragging: (dragging: boolean, dealId?: string | null) => void;
  setFilters: (filters: Partial<KanbanFilters>) => void;
  resetFilters: () => void;

  // Actions — Optimistic Updates
  moveDealOptimistic: (
    dealId: string,
    sourceStageId: string,
    destStageId: string,
    newPosition: number,
  ) => void;
  updateDealOptimistic: (dealId: string, updates: Partial<CrmDealEnriched>) => void;
  removeDealOptimistic: (dealId: string) => void;
  addDealOptimistic: (stageId: string, deal: CrmDealEnriched) => void;

  // Actions — Computed
  getDealsByStage: (stageId: string) => CrmDealEnriched[];
  getFilteredDealsByStage: (stageId: string) => CrmDealEnriched[];
  getStageMetrics: (stageId: string) => { count: number; valor_total: number };
}

const DEFAULT_FILTERS: KanbanFilters = {
  search: '',
  prioridade: null,
  owner_corretor_id: null,
  is_hot: null,
  is_stale: null,
  tags: [],
};

export const useKanbanStore = create<KanbanState>((set, get) => ({
  // Estado inicial
  board: null,
  pipelines: [],
  activePipelineId: null,
  selectedDealId: null,
  selectedDeal: null,
  isLoading: false,
  isDragging: false,
  draggedDealId: null,
  filters: { ...DEFAULT_FILTERS },

  // Setters simples
  setBoard: (board) => set({ board }),
  setPipelines: (pipelines) => set({ pipelines }),
  setActivePipelineId: (id) => set({ activePipelineId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSelectedDealId: (id) => set({ selectedDealId: id }),
  setSelectedDeal: (deal) => set({ selectedDeal: deal, selectedDealId: deal?.id ?? null }),
  setDragging: (dragging, dealId) => set({ isDragging: dragging, draggedDealId: dealId ?? null }),

  // Filtros
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // Optimistic — Mover deal entre stages
  moveDealOptimistic: (dealId, sourceStageId, destStageId, newPosition) =>
    set((state) => {
      if (!state.board) return state;

      const newDealsByStage = { ...state.board.dealsByStage };
      const sourceDeals = [...(newDealsByStage[sourceStageId] ?? [])];
      const destDeals = sourceStageId === destStageId
        ? sourceDeals
        : [...(newDealsByStage[destStageId] ?? [])];

      // Remover do source
      const dealIndex = sourceDeals.findIndex((d) => d.id === dealId);
      if (dealIndex === -1) return state;
      const [deal] = sourceDeals.splice(dealIndex, 1);

      // Atualizar deal
      const movedDeal: CrmDealEnriched = {
        ...deal,
        stage_id: destStageId,
        posicao: newPosition,
      };

      // Inserir no destino
      if (sourceStageId === destStageId) {
        sourceDeals.splice(newPosition, 0, movedDeal);
        newDealsByStage[sourceStageId] = sourceDeals;
      } else {
        destDeals.splice(newPosition, 0, movedDeal);
        newDealsByStage[sourceStageId] = sourceDeals;
        newDealsByStage[destStageId] = destDeals;
      }

      return {
        board: { ...state.board, dealsByStage: newDealsByStage },
      };
    }),

  // Optimistic — Atualizar deal in-place
  updateDealOptimistic: (dealId, updates) =>
    set((state) => {
      if (!state.board) return state;

      const newDealsByStage = { ...state.board.dealsByStage };
      for (const stageId of Object.keys(newDealsByStage)) {
        newDealsByStage[stageId] = newDealsByStage[stageId].map((d) =>
          d.id === dealId ? { ...d, ...updates } : d
        );
      }

      return {
        board: { ...state.board, dealsByStage: newDealsByStage },
        // Atualizar deal selecionado se for o mesmo
        selectedDeal:
          state.selectedDeal?.id === dealId
            ? { ...state.selectedDeal, ...updates }
            : state.selectedDeal,
      };
    }),

  // Optimistic — Remover deal
  removeDealOptimistic: (dealId) =>
    set((state) => {
      if (!state.board) return state;

      const newDealsByStage = { ...state.board.dealsByStage };
      for (const stageId of Object.keys(newDealsByStage)) {
        newDealsByStage[stageId] = newDealsByStage[stageId].filter((d) => d.id !== dealId);
      }

      return {
        board: { ...state.board, dealsByStage: newDealsByStage },
        selectedDealId: state.selectedDealId === dealId ? null : state.selectedDealId,
        selectedDeal: state.selectedDeal?.id === dealId ? null : state.selectedDeal,
      };
    }),

  // Optimistic — Adicionar deal
  addDealOptimistic: (stageId, deal) =>
    set((state) => {
      if (!state.board) return state;

      const newDealsByStage = { ...state.board.dealsByStage };
      newDealsByStage[stageId] = [...(newDealsByStage[stageId] ?? []), deal];

      return {
        board: { ...state.board, dealsByStage: newDealsByStage },
      };
    }),

  // Computed — Deals por stage (sem filtro)
  getDealsByStage: (stageId) => {
    const { board } = get();
    if (!board) return [];
    return (board.dealsByStage[stageId] ?? []).sort((a, b) => a.posicao - b.posicao);
  },

  // Computed — Deals por stage (com filtro)
  getFilteredDealsByStage: (stageId) => {
    const { board, filters } = get();
    if (!board) return [];

    let deals = (board.dealsByStage[stageId] ?? []).sort((a, b) => a.posicao - b.posicao);

    if (filters.search) {
      const s = filters.search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.titulo.toLowerCase().includes(s) ||
          d.contact?.nome?.toLowerCase().includes(s) ||
          d.company?.nome?.toLowerCase().includes(s),
      );
    }

    if (filters.prioridade) {
      deals = deals.filter((d) => d.prioridade === filters.prioridade);
    }

    if (filters.owner_corretor_id) {
      deals = deals.filter((d) => d.owner_corretor_id === filters.owner_corretor_id);
    }

    if (filters.is_hot === true) {
      deals = deals.filter((d) => d.is_hot);
    }

    if (filters.is_stale === true) {
      deals = deals.filter((d) => d.is_stale);
    }

    if (filters.tags.length > 0) {
      deals = deals.filter((d) =>
        filters.tags.some((tag) => d.tags?.includes(tag)),
      );
    }

    return deals;
  },

  // Computed — Métricas por stage
  getStageMetrics: (stageId) => {
    const deals = get().getFilteredDealsByStage(stageId);
    return {
      count: deals.length,
      valor_total: deals.reduce((sum, d) => sum + (d.valor ?? 0), 0),
    };
  },
}));
