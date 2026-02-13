'use client';

import { TrendingUp, RefreshCw } from 'lucide-react';
import { useCorretorId } from '../../hooks/useCorretorToken';
import { useCrmStats } from '../hooks/useCrmStats';
import CrmStatsCards from '../components/CrmStatsCards';
import FunnelChart from '../components/FunnelChart';

// ========================================
// PAGE
// ========================================

export default function CorretorAnalyticsPage() {
  const corretorId = useCorretorId();
  const { stats, loading: statsLoading, refetch: refetchStats } = useCrmStats(corretorId);

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
            Analytics <span className="text-[#D4AF37]">CRM</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Performance, funil e métricas do seu pipeline
          </p>
        </div>
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 text-sm hover:bg-white/[0.06] transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* CRM Stats Cards */}
      <CrmStatsCards stats={stats} loading={statsLoading} />

      {/* Funnel Chart */}
      <FunnelChart stats={stats} loading={statsLoading} />
    </div>
  );
}
