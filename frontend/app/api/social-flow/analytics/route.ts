// Métricas agregadas
import { NextRequest, NextResponse } from "next/server"
import { AnalyticsAggregator } from "@/lib/social-flow/core/analytics-aggregator"

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") ?? "default"
    const period = req.nextUrl.searchParams.get("period") ?? "30"
    const days = parseInt(period, 10)

    const [stats, metrics] = await Promise.all([
      AnalyticsAggregator.getDashboardStats(userId),
      AnalyticsAggregator.getMetricsByPeriod(userId, days),
    ])

    return NextResponse.json({ stats, metrics })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
