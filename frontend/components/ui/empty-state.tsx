import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── EmptyState Component ────────────────────────────────────
// Estado vazio reutilizável. Tema dark #050505, gold #D4AF37.

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      {/* Ícone */}
      <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-5 mb-5">
        <Icon className="h-8 w-8 text-white/20" />
      </div>

      {/* Texto */}
      <h3 className="text-lg font-semibold text-white/80 mb-2">{title}</h3>
      <p className="text-sm text-white/40 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {/* Ação principal */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-colors shadow-lg shadow-[#D4AF37]/10"
        >
          {action.label}
        </button>
      )}

      {/* Conteúdo extra */}
      {children}
    </div>
  );
}
