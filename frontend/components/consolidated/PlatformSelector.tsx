'use client';

import type { Platform } from '@/lib/consolidator';

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

const PLATFORMS: Array<{ id: Platform; label: string; icon: string; color: string }> = [
  { id: 'meta', label: 'Meta Ads', icon: '📘', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { id: 'google', label: 'Google Ads', icon: '🔍', color: 'border-red-500/40 bg-red-500/10 text-red-400' },
  { id: 'ga4', label: 'GA4', icon: '📊', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
];

export default function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const toggle = (platform: Platform) => {
    if (selected.includes(platform)) {
      // Don't allow deselecting all
      if (selected.length === 1) return;
      onChange(selected.filter(p => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {PLATFORMS.map(p => {
        const isActive = selected.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              isActive
                ? p.color
                : 'border-white/10 bg-[#0a0a0a] text-gray-500 hover:border-white/20'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
