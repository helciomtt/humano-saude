// =====================================================
// API — /api/dashboard/realtime-events
// Feed de eventos em tempo real
// =====================================================

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { fetchRealtimeEvents } from '@/lib/dashboard-queries';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const events = await fetchRealtimeEvents(supabase);

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    logger.error('❌ Realtime Events Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
