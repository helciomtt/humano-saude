// =====================================================
// API — /api/analytics/offline (POST)
// Marca visitante como offline via navigator.sendBeacon
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = body.session_id || body.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('analytics_visits')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) {
      logger.error('❌ Offline update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('❌ Analytics Offline Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
