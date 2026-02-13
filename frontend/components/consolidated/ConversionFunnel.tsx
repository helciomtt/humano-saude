'use client';

import { type ConversionFunnelStep, formatNumber } from '@/lib/consolidator';

interface ConversionFunnelProps {
  steps: ConversionFunnelStep[];
}

export default function ConversionFunnel({ steps }: ConversionFunnelProps) {
  if (!steps.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center text-gray-500">
        Sem dados de funil de conversão
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
      <h3 className="text-lg font-semibold text-[#D4AF37] mb-6 flex items-center gap-2">
        Funil de Conversão
      </h3>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const widthPct = Math.max(step.percentage, 5);
          const dropoff = index > 0
            ? ((steps[index - 1].value - step.value) / (steps[index - 1].value || 1) * 100).toFixed(1)
            : null;

          return (
            <div key={step.step} className="relative">
              {/* Drop-off arrow */}
              {dropoff !== null && (
                <div className="absolute -top-3 right-0 text-[10px] text-red-400/70">
                  ↓ {dropoff}% drop
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Label */}
                <div className="w-32 text-right">
                  <p className="text-sm font-medium text-gray-300">{step.label}</p>
                  <p className="text-xs text-gray-500">{step.percentage.toFixed(1)}%</p>
                </div>

                {/* Bar */}
                <div className="flex-1 h-10 bg-white/5 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: step.color,
                      opacity: 0.8,
                    }}
                  >
                    <span className="text-sm font-bold text-white drop-shadow-lg">
                      {formatNumber(step.value)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {steps.length >= 2 && (
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Taxa de conversão total
          </span>
          <span className="text-[#D4AF37] font-bold">
            {steps[steps.length - 1].value > 0 && steps[0].value > 0
              ? ((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(3)
              : '0'}%
          </span>
        </div>
      )}
    </div>
  );
}
