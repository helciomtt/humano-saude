// =====================================================
// API — /api/admin/dashboard
// Dashboard principal de vendas
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  fetchDashboardMetrics,
  fetchOperationalHealth,
  fetchSalesByDay,
  fetchFunnelData,
  getDateRangeForPeriod,
} from '@/lib/dashboard-queries';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    // Determinar período
    const days = searchParams.get('days');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const period = searchParams.get('period');

    let startIso: string;
    let endIso: string;

    if (startParam && endParam) {
      startIso = new Date(startParam).toISOString();
      endIso = new Date(endParam).toISOString();
    } else if (days) {
      const range = getDateRangeForPeriod(`${days}d`);
      startIso = range.startIso;
      endIso = range.endIso;
    } else {
      const range = getDateRangeForPeriod(period || '30d');
      startIso = range.startIso;
      endIso = range.endIso;
    }

    const options = { startIso, endIso };

    // Buscar tudo em paralelo
    const [metrics, operationalHealth, chartData, funnelData] = await Promise.all([
      fetchDashboardMetrics(supabase, options),
      fetchOperationalHealth(supabase, options),
      fetchSalesByDay(supabase, startIso, endIso),
      fetchFunnelData(supabase),
    ]);

    return NextResponse.json({
      success: true,
      data: { metrics, chartData, funnelData, operationalHealth },
    });
  } catch (error) {
    logger.error('Admin Dashboard Error', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
