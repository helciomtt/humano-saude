// =====================================================
// instrumentation.ts — Next.js Instrumentation Hook
// Roda UMA VEZ no startup do servidor.
// Valida variáveis de ambiente antes de servir requests.
// =====================================================

export async function register() {
  // Só rodar no Node.js runtime (não no Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getEnvResult } = await import('./lib/env');
    getEnvResult();
  }
}
