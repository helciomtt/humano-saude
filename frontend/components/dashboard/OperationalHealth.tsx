'use client';

// =====================================================
// OperationalHealth — Saúde Operacional
// Carrinhos abandonados, pagamentos falhados, chargebacks
// =====================================================

import { motion } from 'framer-motion';
import { ShoppingCart, CreditCard, AlertTriangle } from 'lucide-react';
import type { OperationalHealthData } from '@/lib/types/analytics';

interface OperationalHealthProps {
  data: OperationalHealthData;
  loading?: boolean;
}

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function OperationalHealth({ data, loading }: OperationalHealthProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-white/5 bg-[#0a0a0a]" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Carrinhos Abandonados',
      icon: ShoppingCart,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      stats: [
        { label: 'Total', value: data.abandonedCarts.count.toString() },
        { label: 'Valor', value: formatCurrency(data.abandonedCarts.totalValue) },
        { label: 'Últimas 24h', value: data.abandonedCarts.last24h.toString() },
      ],
    },
    {
      title: 'Pagamentos Falhados',
      icon: CreditCard,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      stats: [
        { label: 'Total', value: data.failedPayments.count.toString() },
        { label: 'Valor', value: formatCurrency(data.failedPayments.totalValue) },
      ],
      reasons: data.failedPayments.reasons,
    },
    {
      title: 'Chargebacks',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      stats: [
        { label: 'Total', value: data.chargebacks.count.toString() },
        { label: 'Valor', value: formatCurrency(data.chargebacks.totalValue) },
      ],
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl border ${card.border} bg-[#0a0a0a] p-4`}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <h4 className="text-xs font-semibold text-white">{card.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              {card.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {'reasons' in card && card.reasons && card.reasons.length > 0 && (
              <div className="mt-2 border-t border-white/5 pt-2">
                <p className="mb-1 text-[10px] text-gray-500">Motivos:</p>
                {card.reasons.slice(0, 3).map((r) => (
                  <div key={r.reason} className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">{r.reason}</span>
                    <span className="font-medium text-white">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
