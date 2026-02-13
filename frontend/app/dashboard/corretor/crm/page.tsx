'use client';

import { Kanban, Sparkles } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import CrmStatsCards from './components/CrmStatsCards';
import { useCorretorId } from '../hooks/useCorretorToken';
import { useCrmStats } from './hooks/useCrmStats';

export default function CrmPage() {
  const corretorId = useCorretorId();
  const { stats, loading: statsLoading } = useCrmStats(corretorId);

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Kanban className="h-6 w-6 text-[#D4AF37]" />
            Pipeline <span className="text-[#D4AF37]">CRM</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gerencie seus leads em tempo real com Lead Scoring automático
          </p>
        </div>
      </div>

      {/* KPIs */}
      <CrmStatsCards stats={stats} loading={statsLoading} />

      {/* Kanban Board */}
      <KanbanBoard corretorId={corretorId} />
    </div>
  );
}
