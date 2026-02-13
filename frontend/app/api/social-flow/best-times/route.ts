// Melhores horários para publicar
import { NextRequest, NextResponse } from "next/server"
import { AnalyticsAggregator } from "@/lib/social-flow/core/analytics-aggregator"

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") ?? "default"
    const accountId = req.nextUrl.searchParams.get("account_id") ?? undefined
    const bestTimes = await AnalyticsAggregator.getBestTimes(userId, accountId)
    return NextResponse.json({ bestTimes })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
