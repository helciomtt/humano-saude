'use client';

import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nenhum item encontrado',
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-white/5 p-4">
        <Icon className="h-10 w-10 text-gray-600" />
      </div>
      <p className="text-lg font-medium text-gray-400">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
