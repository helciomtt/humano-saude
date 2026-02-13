'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { PageHeader } from '../../components';
import { CrmMetricsDashboard, SalesChart, ConversionFunnel } from '../components';
import { getPipelines } from '@/app/actions/crm';
import type { CrmPipeline } from '@/lib/types/crm';

export default function AnalyticsPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  useEffect(() => {
    getPipelines().then((res) => {
      if (res.success && res.data) {
        setPipelines(res.data);
        const def = res.data.find((p) => p.is_default) ?? res.data[0];
        if (def) setSelectedPipelineId(def.id);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics CRM"
        description="Métricas de desempenho e performance do pipeline"
      >
        <div className="flex items-center gap-2">
          {pipelines.length > 1 && (
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}
        </div>
      </PageHeader>

      {/* Existing CrmMetricsDashboard (StatCards + FunnelBar + Leaderboard) */}
      {selectedPipelineId && (
        <CrmMetricsDashboard pipelineId={selectedPipelineId} />
      )}

      {/* Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
              Receita Mensal
            </h3>
            <span className="text-[10px] text-white/30">Últimos 12 meses</span>
          </div>
          <SalesChart />
        </div>

        {/* Conversion Funnel Chart */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
              Funil de Conversão
            </h3>
            <span className="text-[10px] text-white/30">Deals por estágio</span>
          </div>
          <ConversionFunnel />
        </div>
      </div>
    </div>
  );
}
