'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function CorretorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CORRETOR]', JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      digest: error.digest,
      module: 'corretor-dashboard',
    }));
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="h-10 w-10 text-orange-400" />
        </div>

        {/* Message */}
        <h2 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: '"Perpetua Titling MT", serif' }}>
          ERRO NO PAINEL
        </h2>
        <p className="mb-6 text-sm text-gray-400 leading-relaxed">
          Ocorreu um erro ao carregar esta página. Tente novamente ou volte para o dashboard.
        </p>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-left">
            <p className="text-xs font-mono text-orange-300 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-500 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] px-6 py-3 text-sm font-bold text-black hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </button>
          <Link
            href="/dashboard/corretor"
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
