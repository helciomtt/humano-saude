'use client';

// ─── ErrorBoundary Component ─────────────────────────────────
// Captura erros em componentes filhos e exibe fallback elegante.
// Tema: dark #050505, gold #D4AF37, glass-morphism.

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Ops! Algo deu errado
              </h3>
              <p className="text-sm text-white/40">
                Ocorreu um erro inesperado
              </p>
            </div>
          </div>

          {/* Detalhe do erro (apenas dev) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/5 border border-red-500/10 overflow-auto max-h-32">
              <p className="text-xs font-mono text-red-400/80">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/[0.05] transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
