'use client';

import { useState, useCallback } from 'react';
import { Plus, LayoutGrid, List, BarChart3 } from 'lucide-react';
import { PageHeader } from '../components';
import { AdminKanbanBoard, DealDrawer, CrmMetricsDashboard, DealsTable } from './components';
import { useAdminKanban, useDealDrawer, useDealsList } from './hooks/useCrm';
import { createDeal } from '@/app/actions/crm';
import { toast } from 'sonner';
import type { CrmDealInsert, CrmDealEnriched, CrmDealFilters } from '@/lib/types/crm';

// ========================================
// VIEW SWITCHER
// ========================================

type CrmView = 'kanban' | 'list' | 'analytics';

function ViewSwitcher({ view, onChange }: { view: CrmView; onChange: (v: CrmView) => void }) {
  const views: { key: CrmView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: 'kanban', icon: LayoutGrid, label: 'Kanban' },
    { key: 'list', icon: List, label: 'Lista' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="flex items-center rounded-xl bg-white/5 p-1">
      {views.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            view === key
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ========================================
// CRM PAGE
// ========================================

export default function CrmPage() {
  const [view, setView] = useState<CrmView>('kanban');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Kanban state
  const kanban = useAdminKanban();

  // Deal drawer state
  const drawer = useDealDrawer(selectedDealId);

  // Drawer open/close
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDealClick = useCallback((deal: CrmDealEnriched) => {
    setSelectedDealId(deal.id);
    setDrawerOpen(true);
  }, []);
  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedDealId(null);
  }, []);

  // Deal list state (for list view)
  const dealsList = useDealsList();

  // New deal handler
  const handleNewDeal = useCallback(async () => {
    if (!kanban.pipelines.length || !kanban.board) return;

    const firstStage = kanban.board.stages[0];
    if (!firstStage) {
      toast.error('Nenhuma etapa encontrada no pipeline');
      return;
    }

    const input: CrmDealInsert = {
      pipeline_id: kanban.board.pipeline.id,
      stage_id: firstStage.id,
      contact_id: null,
      company_id: null,
      owner_corretor_id: null,
      crm_card_id: null,
      lead_id: null,
      titulo: 'Novo Deal',
      valor: null,
      valor_recorrente: null,
      moeda: 'BRL',
      data_previsao_fechamento: null,
      data_ganho: null,
      data_perda: null,
      probabilidade: firstStage.probabilidade ?? null,
      posicao: 0,
      motivo_perda: null,
      motivo_perda_detalhe: null,
      score: 0,
      prioridade: 'media',
      is_hot: false,
      is_stale: false,
      dias_no_stage: 0,
      tags: [],
      custom_fields: {},
      metadata: {},
    };

    const res = await createDeal(input);
    if (res.success) {
      toast.success('Deal criado!');
      kanban.fetchBoard();
    } else {
      toast.error(res.error ?? 'Erro ao criar deal');
    }
  }, [kanban]);

  // Partial filter updater for DealsTable compatibility
  const handleFilterChange = useCallback((partial: Partial<CrmDealFilters>) => {
    for (const [key, value] of Object.entries(partial)) {
      dealsList.updateFilter(key as keyof CrmDealFilters, value);
    }
  }, [dealsList]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Pipeline de negócios e gestão de deals"
        actionLabel="Novo Deal"
        onAction={handleNewDeal}
      >
        <ViewSwitcher view={view} onChange={setView} />
      </PageHeader>

      {/* Kanban View */}
      {view === 'kanban' && (
        <AdminKanbanBoard
          board={kanban.board}
          pipelines={kanban.pipelines}
          activePipelineId={kanban.activePipelineId}
          loading={kanban.loading}
          onPipelineChange={kanban.setActivePipelineId}
          onMoveDeal={kanban.handleMoveDeal}
          onDealClick={handleDealClick}
          onAddDeal={() => handleNewDeal()}
          corretorId=""
        />
      )}

      {/* List View */}
      {view === 'list' && dealsList.result && (
        <DealsTable
          deals={dealsList.result.data}
          loading={dealsList.loading}
          total={dealsList.result.total}
          page={dealsList.result.page}
          perPage={dealsList.result.perPage}
          filters={dealsList.filters}
          onFilterChange={handleFilterChange}
          onPageChange={(p) => dealsList.updateFilter('page', p)}
          onRowClick={(d) => handleDealClick(d)}
        />
      )}

      {/* Analytics View */}
      {view === 'analytics' && (
        <CrmMetricsDashboard pipelineId={kanban.activePipelineId || undefined} />
      )}

      {/* Deal Drawer */}
      <DealDrawer
        deal={drawer.deal}
        activities={drawer.activities}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onAddActivity={drawer.addActivity}
        loading={drawer.loading}
      />
    </div>
  );
}
