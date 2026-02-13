// =====================================================
// 📦 CACHE CONFIG — Fase 3.2
// Estratégias de cache centralizadas.
// Aplicar em API routes via headers ou `revalidate`.
// =====================================================

/** Durações em segundos */
export const CACHE_TTL = {
  /** 24h — dados que mudam raramente (operadoras, tabelas de preço) */
  STATIC: 86_400,
  /** 5min — métricas e analytics */
  METRICS: 300,
  /** 1min — dados do usuário autenticado */
  USER_DATA: 60,
  /** 0 — sempre fresco (leads, cotações, mutations) */
  REALTIME: 0,
} as const;

/**
 * Gera o header Cache-Control para respostas públicas.
 * Ideal para dados que qualquer visitante pode ver (operadoras, páginas públicas).
 *
 * stale-while-revalidate = 2× ttl → serve stale enquanto revalida em background.
 */
export function publicCache(ttl: number): Record<string, string> {
  return {
    'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
  };
}

/**
 * Gera o header Cache-Control para respostas privadas (autenticado).
 * `Vary: Cookie` garante que cada usuário tem seu próprio cache.
 */
export function privateCache(ttl: number): Record<string, string> {
  return {
    'Cache-Control': `private, max-age=${ttl}`,
    Vary: 'Cookie',
  };
}

/** Sem cache — mutations, dados real-time */
export function noCache(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };
}
