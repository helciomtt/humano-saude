import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Loading Spinner ─────────────────────────────────────────

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({ size = 'md', text, fullScreen = false, className }: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn(sizes[size], 'animate-spin text-[#D4AF37]')} />
      {text && <p className="text-sm text-white/50">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// ─── Loading Card (placeholder para seções) ──────────────────

export function LoadingCard({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 flex items-center justify-center min-h-[200px]">
      <Loading text={text} />
    </div>
  );
}

// ─── Loading Table (skeleton de linhas) ──────────────────────

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="h-10 bg-white/[0.05] rounded-lg animate-pulse" />
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-14 bg-white/[0.03] rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Loading Inline (para botões e campos) ───────────────────

export function LoadingInline({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-4 w-4 animate-spin text-[#D4AF37]', className)} />
  );
}

// ─── Loading Page (placeholder fullpage dentro do layout) ────

export function LoadingPage({ text = 'Carregando página...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading size="lg" text={text} />
    </div>
  );
}
