import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Configuração do Upstash Redis ──────────────────────────
// Se UPSTASH_REDIS_REST_URL não estiver configurada, rate limiting fica desabilitado
// (para não quebrar dev local sem Redis)

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

// ─── Limitadores pré-configurados ───────────────────────────

/**
 * Rate limiter para login: 5 tentativas por minuto por IP.
 * Previne brute-force em credenciais.
 */
export const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:login',
      analytics: true,
    })
  : null;

/**
 * Rate limiter para leads/formulários públicos: 10 requests por minuto por IP.
 * Previne spam de cadastro.
 */
export const leadsLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:leads',
      analytics: true,
    })
  : null;

/**
 * Rate limiter genérico para APIs: 30 requests por minuto por IP.
 */
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'rl:api',
      analytics: true,
    })
  : null;

// ─── Helper para extrair IP ─────────────────────────────────

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ─── Aplicar rate limiting em API Route ─────────────────────

/**
 * Verifica rate limit e retorna null se permitido,
 * ou NextResponse 429 se excedido.
 *
 * Uso em API Route:
 * ```ts
 * const blocked = await checkRateLimit(request, loginLimiter);
 * if (blocked) return blocked;
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: Ratelimit | null,
): Promise<NextResponse | null> {
  // Se não há limiter (Redis não configurado), permitir tudo
  if (!limiter) return null;

  const ip = getClientIp(request);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: 'Muitas requisições. Tente novamente em instantes.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return null;
}
