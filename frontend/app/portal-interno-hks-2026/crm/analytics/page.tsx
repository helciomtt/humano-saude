'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '../../components';
import { CrmMetricsDashboard } from '../components';
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
      </PageHeader>

      {selectedPipelineId && (
        <CrmMetricsDashboard pipelineId={selectedPipelineId} />
      )}
    </div>
  );
}
