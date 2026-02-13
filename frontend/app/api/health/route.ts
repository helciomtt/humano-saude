import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const PYTHON_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * GET /api/health
 * Health check consolidado de todos os serviços
 */
export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // 1. Supabase
  const supaStart = Date.now();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('insurance_leads').select('id').limit(1);
    checks.supabase = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - supaStart,
      ...(error ? { error: error.message } : {}),
    };
  } catch (err) {
    checks.supabase = {
      status: 'down',
      latency: Date.now() - supaStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // 2. Python Backend
  const pyStart = Date.now();
  try {
    const resp = await fetch(`${PYTHON_API}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json();
    checks.python_backend = {
      status: data.status === 'healthy' ? 'healthy' : 'degraded',
      latency: Date.now() - pyStart,
    };
  } catch (err) {
    checks.python_backend = {
      status: 'down',
      latency: Date.now() - pyStart,
      error: err instanceof Error ? err.message : 'Unreachable',
    };
  }

  // 3. Resend (Email)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resendStart = Date.now();
    try {
      const resp = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${resendKey}` },
        signal: AbortSignal.timeout(5000),
      });
      checks.resend = {
        status: resp.ok ? 'healthy' : 'degraded',
        latency: Date.now() - resendStart,
        ...(!resp.ok ? { error: `HTTP ${resp.status}` } : {}),
      };
    } catch (err) {
      checks.resend = {
        status: 'down',
        latency: Date.now() - resendStart,
        error: err instanceof Error ? err.message : 'Unreachable',
      };
    }
  } else {
    checks.resend = { status: 'unconfigured' };
  }

  // 4. Meta Ads API
  const metaToken = process.env.META_ACCESS_TOKEN;
  if (metaToken) {
    const metaStart = Date.now();
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${metaToken}`,
        { signal: AbortSignal.timeout(5000) },
      );
      checks.meta_ads = {
        status: resp.ok ? 'healthy' : 'degraded',
        latency: Date.now() - metaStart,
        ...(!resp.ok ? { error: `HTTP ${resp.status}` } : {}),
      };
    } catch (err) {
      checks.meta_ads = {
        status: 'down',
        latency: Date.now() - metaStart,
        error: err instanceof Error ? err.message : 'Unreachable',
      };
    }
  } else {
    checks.meta_ads = { status: 'unconfigured' };
  }

  // 5. Next.js (always healthy if we got here)
  checks.nextjs = { status: 'healthy', latency: 0 };

  // Overall status (unconfigured services don't affect overall)
  const configuredChecks = Object.values(checks).filter(
    (c) => c.status !== 'unconfigured',
  );
  const allHealthy = configuredChecks.every((c) => c.status === 'healthy');
  const anyDown = configuredChecks.some((c) => c.status === 'down');

  const overall = allHealthy ? 'healthy' : anyDown ? 'degraded' : 'partial';

  return NextResponse.json({
    status: overall,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    timestamp: new Date().toISOString(),
    services: checks,
  });
}
