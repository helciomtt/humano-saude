'use client';

import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, formatRoas } from '@/lib/consolidator';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'number' | 'percent' | 'roas';
  variation?: number;
  icon?: LucideIcon;
  color?: string;
  borderColor?: string;
}

export default function MetricCard({
  label,
  value,
  format = 'number',
  variation,
  icon: Icon,
  color = 'text-[#D4AF37]',
  borderColor = 'border-[#D4AF37]/20',
}: MetricCardProps) {
  const formatValue = () => {
    switch (format) {
      case 'currency': return formatCurrency(value);
      case 'percent': return formatPercent(value);
      case 'roas': return formatRoas(value);
      default: return formatNumber(value);
    }
  };

  const hasVariation = variation !== undefined && variation !== 0;
  const isPositive = (variation || 0) > 0;

  return (
    <div className={`rounded-xl border ${borderColor} bg-[#0a0a0a] p-5 transition-all hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/5`}>
      <div className="flex items-center justify-between mb-3">
        {Icon && <Icon className={`h-5 w-5 ${color}`} />}
        {hasVariation && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(variation!).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{formatValue()}</p>
      <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
