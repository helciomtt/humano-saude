'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log estruturado (Fase 2.5)
    console.error('[PORTAL]', JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      digest: error.digest,
      module: 'portal-interno',
    }));
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>

        {/* Message */}
        <h2 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: '"Perpetua Titling MT", serif' }}>
          ALGO DEU ERRADO
        </h2>
        <p className="mb-6 text-sm text-gray-400 leading-relaxed">
          Ocorreu um erro inesperado nesta seção. Tente novamente ou volte para o dashboard.
        </p>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-left">
            <p className="text-xs font-mono text-red-300 break-all">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] px-6 py-3 text-sm font-bold text-black hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </button>
          <Link
            href="/portal-interno-hks-2026"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
