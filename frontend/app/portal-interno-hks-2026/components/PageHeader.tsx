'use client';

import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: React.ComponentType<{ className?: string }>;
  onAction?: () => void;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  onAction,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1
            className="text-4xl font-bold text-[#D4AF37]"
            style={{ fontFamily: 'Perpetua Titling MT, serif' }}
          >
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-[#D4AF37]/20 px-2.5 py-0.5 text-xs font-semibold text-[#D4AF37]">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-2 text-gray-400">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] transition-colors"
          >
            <ActionIcon className="h-4 w-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
