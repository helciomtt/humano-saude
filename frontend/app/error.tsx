'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Logo from './components/Logo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro capturado:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="h-16" />
        </div>

        {/* Erro */}
        <div className="mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Algo deu errado
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-slate-900 font-bold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar Novamente
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-slate-800 text-white font-bold rounded-lg border border-slate-700 hover:bg-slate-700 transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar para Home
          </Link>
        </div>
      </div>
    </div>
  );
}
