'use client';

import { type ComparisonDataPoint, formatCurrency, formatNumber } from '@/lib/consolidator';

interface ComparisonChartProps {
  data: ComparisonDataPoint[];
}

export default function ComparisonChart({ data }: ComparisonChartProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center text-gray-500">
        Sem dados de comparação por período
      </div>
    );
  }

  const maxSpend = Math.max(...data.map(d => d.spend), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxVal = Math.max(maxSpend, maxRevenue);

  return (
    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
      <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">
        Investimento vs Receita
      </h3>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-xs">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-gray-400">Investimento</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#D4AF37]" />
          <span className="text-gray-400">Receita</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-400">ROAS</span>
        </span>
      </div>

      {/* Chart bars */}
      <div className="flex items-end gap-2 h-48">
        {data.map((point, i) => {
          const spendHeight = maxVal > 0 ? (point.spend / maxVal) * 100 : 0;
          const revenueHeight = maxVal > 0 ? (point.revenue / maxVal) * 100 : 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-xs whitespace-nowrap shadow-xl">
                  <p className="text-white font-semibold mb-1">{point.date}</p>
                  <p className="text-blue-400">Invest: {formatCurrency(point.spend)}</p>
                  <p className="text-[#D4AF37]">Receita: {formatCurrency(point.revenue)}</p>
                  <p className="text-green-400">ROAS: {point.roas.toFixed(2)}x</p>
                  <p className="text-gray-400">Conv: {point.conversions}</p>
                </div>
              </div>

              {/* Bars */}
              <div className="flex items-end gap-0.5 w-full">
                <div
                  className="flex-1 bg-blue-500/70 rounded-t transition-all hover:bg-blue-500"
                  style={{ height: `${Math.max(spendHeight, 2)}%` }}
                />
                <div
                  className="flex-1 bg-[#D4AF37]/70 rounded-t transition-all hover:bg-[#D4AF37]"
                  style={{ height: `${Math.max(revenueHeight, 2)}%` }}
                />
              </div>

              {/* Date label */}
              <span className="text-[9px] text-gray-600 truncate w-full text-center">
                {point.date.slice(-5)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Total Investido</p>
          <p className="text-sm font-bold text-blue-400">
            {formatCurrency(data.reduce((s, d) => s + d.spend, 0))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Receita Total</p>
          <p className="text-sm font-bold text-[#D4AF37]">
            {formatCurrency(data.reduce((s, d) => s + d.revenue, 0))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ROAS Médio</p>
          <p className="text-sm font-bold text-green-400">
            {(() => {
              const totalSpend = data.reduce((s, d) => s + d.spend, 0);
              const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
              return totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00';
            })()}x
          </p>
        </div>
      </div>
    </div>
  );
}
