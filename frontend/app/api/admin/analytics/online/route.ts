// =====================================================
// API — /api/admin/analytics/online
// Visitantes online (SQL View)
// =====================================================

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { fetchVisitorsOnline } from '@/lib/dashboard-queries';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const data = await fetchVisitorsOnline(supabase);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('❌ Analytics Online Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
