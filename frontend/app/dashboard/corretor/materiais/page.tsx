'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, Palette } from 'lucide-react';
import MateriaisPanel from '../components/MateriaisPanel';
import BannerGenerator from '../components/BannerGenerator';
import { useCorretorId } from '../hooks/useCorretorToken';

const TABS = [
  { id: 'materiais', label: 'Materiais', icon: FolderOpen },
  { id: 'banners', label: 'CriativoPRO', icon: Palette },
] as const;

type Tab = (typeof TABS)[number]['id'];

export default function MateriaisPage() {
  const [tab, setTab] = useState<Tab>('materiais');

  const corretorId = useCorretorId();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'text-white/50 hover:text-white/70',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'materiais' ? (
        <MateriaisPanel />
      ) : (
        <BannerGenerator corretorId={corretorId} />
      )}
    </div>
  );
}
