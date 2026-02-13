'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { type DateRangePreset, getDateRangeLabel } from '@/lib/consolidator';

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

const PRESETS: DateRangePreset[] = ['today', 'yesterday', '7d', '14d', '30d', 'this_month', 'custom'];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Keep dropdown open for custom date inputs
      onChange(preset);
      return;
    }
    onChange(preset);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-300 hover:border-[#D4AF37]/30 transition-colors"
      >
        <Calendar className="h-4 w-4 text-[#D4AF37]" />
        <span>{getDateRangeLabel(value)}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
            {PRESETS.filter(p => p !== 'custom').map(preset => (
              <button
                key={preset}
                onClick={() => handleSelect(preset)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  value === preset
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {getDateRangeLabel(preset)}
              </button>
            ))}

            {/* Custom range */}
            <div className="border-t border-white/10 p-3 space-y-2">
              <p className="text-xs text-gray-500 font-semibold uppercase">Personalizado</p>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#151515] px-2 py-1.5 text-xs text-white"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#151515] px-2 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (customStart && customEnd) {
                    handleSelect('custom');
                    setOpen(false);
                  }
                }}
                disabled={!customStart || !customEnd}
                className="w-full rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#D4AF37]/80 transition-colors disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
