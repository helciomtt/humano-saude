'use client';

// =====================================================
// ConversionFunnel — Funil de Conversão Visual
// =====================================================

import { motion } from 'framer-motion';
import { Users, Eye, ShoppingCart, CreditCard } from 'lucide-react';
import type { FunnelData } from '@/lib/types/analytics';

interface ConversionFunnelProps {
  data: FunnelData;
  loading?: boolean;
}

export default function ConversionFunnel({ data, loading }: ConversionFunnelProps) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl border border-white/5 bg-[#0a0a0a]" />;
  }

  const maxVal = Math.max(data.visitors, 1);
  const globalRate = data.visitors > 0
    ? ((data.purchased / data.visitors) * 100).toFixed(2)
    : '0.00';

  const steps = [
    { label: 'Visitantes Únicos', value: data.visitors, icon: Users, color: 'bg-blue-500' },
    { label: 'Interessados', value: data.interested, icon: Eye, color: 'bg-purple-500' },
    { label: 'Checkouts Iniciados', value: data.checkoutStarted, icon: ShoppingCart, color: 'bg-amber-500' },
    { label: 'Vendas Concluídas', value: data.purchased, icon: CreditCard, color: 'bg-emerald-500' },
  ];

  const rateColor = parseFloat(globalRate) >= 2 ? 'text-emerald-400' : parseFloat(globalRate) >= 1 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Funil de Conversão</h3>
        <span className={`text-xs font-bold ${rateColor}`}>
          Taxa Global: {globalRate}%
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const widthPercent = maxVal > 0 ? Math.max((step.value / maxVal) * 100, 4) : 4;
          const dropOff = i > 0 && steps[i - 1].value > 0
            ? (((steps[i - 1].value - step.value) / steps[i - 1].value) * 100).toFixed(1)
            : null;
          const Icon = step.icon;

          return (
            <div key={step.label}>
              {dropOff && (
                <div className="mb-1 text-right text-[10px] text-red-400/60">
                  ↓ {dropOff}% drop-off
                </div>
              )}
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                <div className="flex-1">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-xs text-gray-400">{step.label}</span>
                    <span className="text-sm font-bold text-white">
                      {step.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      className={`h-full rounded-full ${step.color}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
