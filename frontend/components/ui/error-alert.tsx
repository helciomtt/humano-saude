import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── ErrorAlert Component ────────────────────────────────────
// Alerta de erro inline reutilizável. Tema dark/gold.

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  retry?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = 'Erro',
  message,
  onDismiss,
  retry,
  className,
}: ErrorAlertProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-red-400 mb-1">{title}</h4>
          <p className="text-sm text-white/50">{message}</p>

          {retry && (
            <button
              onClick={retry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/[0.05] hover:text-white/80 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Tentar Novamente
            </button>
          )}
        </div>

        {/* Fechar */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
