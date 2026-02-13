'use client';

// =====================================================
// GatewayStatsCard — Stats por Gateway
// Mercado Pago + Appmax (Cascata)
// =====================================================

import { motion } from 'framer-motion';
import { CreditCard, ArrowRight, Shield } from 'lucide-react';
import type { GatewayStats } from '@/lib/types/analytics';

interface GatewayStatsCardProps {
  stats: GatewayStats[];
  loading?: boolean;
}

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const GATEWAY_LABELS: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  appmax: 'Appmax',
  stripe: 'Stripe',
  unknown: 'Outro',
};

const GATEWAY_COLORS: Record<string, string> = {
  mercadopago: 'text-blue-400',
  appmax: 'text-purple-400',
  stripe: 'text-emerald-400',
  unknown: 'text-gray-400',
};

export default function GatewayStatsCard({ stats, loading }: GatewayStatsCardProps) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl border border-white/5 bg-[#0a0a0a]" />;
  }

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white">Gateway Stats</h3>
        </div>
        <p className="text-xs text-gray-600 py-4 text-center">Sem dados de gateway</p>
      </div>
    );
  }

  const totalFallback = stats.reduce((s, g) => s + g.fallback_count, 0);
  const totalSales = stats.reduce((s, g) => s + g.total_sales, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white">Gateway Stats</h3>
        </div>
        {totalFallback > 0 && (
          <span className="text-[10px] text-purple-400">
            🔄 {totalFallback} resgatados pela cascata ({totalSales > 0 ? Math.round((totalFallback / totalSales) * 100) : 0}%)
          </span>
        )}
      </div>

      <div className="space-y-3">
        {stats.map((gw, i) => {
          const colorClass = GATEWAY_COLORS[gw.gateway] || GATEWAY_COLORS.unknown;
          const label = GATEWAY_LABELS[gw.gateway] || gw.gateway;

          return (
            <div key={gw.gateway} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
                <span className="text-xs text-gray-500">{gw.total_sales} vendas</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-gray-500">Aprovação</p>
                  <p className={`text-sm font-bold ${gw.approval_rate >= 90 ? 'text-emerald-400' : gw.approval_rate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {gw.approval_rate}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Ticket</p>
                  <p className="text-sm font-bold text-white">R$ {gw.avg_ticket.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Receita</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(gw.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Resgate</p>
                  <p className="text-sm font-bold text-purple-400">{gw.fallback_count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stats.length >= 2 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Cascata ativa:</span>
          {stats.map((gw, i) => (
            <span key={gw.gateway} className="flex items-center gap-1">
              <span className={GATEWAY_COLORS[gw.gateway] || 'text-gray-400'}>
                {GATEWAY_LABELS[gw.gateway] || gw.gateway}
              </span>
              {i < stats.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-gray-600" />}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
