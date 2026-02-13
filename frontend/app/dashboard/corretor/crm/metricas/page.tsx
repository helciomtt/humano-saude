'use client';

import { TrendingUp, RefreshCw } from 'lucide-react';
import { useCorretorId } from '../../hooks/useCorretorToken';
import { useCrmStats } from '../hooks/useCrmStats';
import CrmStatsCards from '../components/CrmStatsCards';
import FunnelChart from '../components/FunnelChart';

export default function MetricasPage() {
  const corretorId = useCorretorId();
  const { stats, loading, refetch } = useCrmStats(corretorId);

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
            Métricas <span className="text-[#D4AF37]">CRM</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Funil de vendas, conversão e performance do pipeline
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 text-sm hover:bg-white/[0.06] hover:text-white transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <CrmStatsCards stats={stats} loading={loading} />

      {/* Funil + Conversão + Score */}
      <FunnelChart stats={stats} loading={loading} />

      {/* Insights */}
      {stats && !loading && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            💡 Insights Automáticos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.leadsStale > 0 && (
              <InsightCard
                type="warning"
                title={`${stats.leadsStale} lead${stats.leadsStale > 1 ? 's' : ''} parado${stats.leadsStale > 1 ? 's' : ''}`}
                description="Leads sem interação há mais de 48h. Reative o contato para não perder a oportunidade."
              />
            )}
            {stats.leadsHot > 0 && (
              <InsightCard
                type="success"
                title={`${stats.leadsHot} lead${stats.leadsHot > 1 ? 's' : ''} quente${stats.leadsHot > 1 ? 's' : ''}`}
                description="Leads com interação recente em proposta. Priorize o follow-up!"
              />
            )}
            {stats.taxaConversao < 20 && stats.totalLeads > 5 && (
              <InsightCard
                type="info"
                title="Taxa de conversão baixa"
                description="Considere revisar sua abordagem de qualificação ou oferecer condições especiais."
              />
            )}
            {stats.taxaConversao >= 30 && (
              <InsightCard
                type="success"
                title="Ótima conversão!"
                description={`Sua taxa de ${stats.taxaConversao}% está acima da média. Continue assim!`}
              />
            )}
            {(stats.porColuna.novo_lead ?? 0) > 10 && (
              <InsightCard
                type="warning"
                title="Muitos leads não qualificados"
                description="Você tem leads parados na primeira etapa. Qualifique-os para mover o pipeline."
              />
            )}
            {stats.interacoesUltimos7d === 0 && stats.totalLeads > 0 && (
              <InsightCard
                type="danger"
                title="Sem interações recentes"
                description="Nenhuma interação registrada nos últimos 7 dias. Seu pipeline pode esfriar."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  type,
  title,
  description,
}: {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
}) {
  const styles = {
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    danger: 'border-red-500/20 bg-red-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    danger: '🔴',
    info: 'ℹ️',
  };

  return (
    <div className={`p-4 rounded-xl border ${styles[type]}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm">{icons[type]}</span>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-white/40 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
