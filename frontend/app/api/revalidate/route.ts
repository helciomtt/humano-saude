import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'revalidate' });

/**
 * POST /api/revalidate
 * Revalida cache por path.
 * Protegido por CRON_SECRET.
 *
 * Body: { "path": "/economizar" } ou { "path": "/", "type": "layout" }
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { path, type } = body as { path?: string; type?: 'layout' | 'page' };

    if (!path) {
      return NextResponse.json({ error: 'Forneça "path"' }, { status: 400 });
    }

    revalidatePath(path, type);
    log.info('Cache revalidado', { path, type });

    return NextResponse.json({ revalidated: true, path, type });
  } catch (err) {
    log.error('Erro ao revalidar cache', err);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
