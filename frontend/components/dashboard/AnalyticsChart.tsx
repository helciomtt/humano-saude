'use client';

// =====================================================
// AnalyticsChart — Gráfico de Tráfego GA4 (Recharts)
// =====================================================

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';
import type { GA4TrafficPoint } from '@/lib/types/analytics';

interface AnalyticsChartProps {
  data: GA4TrafficPoint[];
  loading?: boolean;
  error?: string;
  title?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-semibold text-gray-300">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name === 'usuarios' ? 'Usuários' : 'Visualizações'}: {entry.value?.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsChart({ data, loading, error, title = 'Tráfego' }: AnalyticsChartProps) {
  const totalUsers = data.reduce((s, d) => s + d.usuarios, 0);
  const totalViews = data.reduce((s, d) => s + d.visualizacoes, 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
        <div className="h-6 w-32 animate-pulse rounded bg-white/5 mb-4" />
        <div className="h-48 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-[#0a0a0a] p-5">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex gap-4 text-[10px] text-gray-500">
          <span>👥 {totalUsers.toLocaleString('pt-BR')} usuários</span>
          <span>👁️ {totalViews.toLocaleString('pt-BR')} views</span>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-12 text-center text-xs text-gray-600">Sem dados de tráfego para o período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#666' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#666' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 10, color: '#999' }}
              formatter={(value: string) => value === 'usuarios' ? 'Usuários' : 'Visualizações'}
            />
            <Area
              type="monotone"
              dataKey="usuarios"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#gradUsers)"
            />
            <Area
              type="monotone"
              dataKey="visualizacoes"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
