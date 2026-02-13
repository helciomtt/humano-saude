// Cron endpoint — Vercel Cron Jobs
import { NextRequest, NextResponse } from "next/server"
import { PublishSchedulerWorker } from "@/lib/social-flow/workers/publish-scheduler"
import { AnalyticsFetcherWorker } from "@/lib/social-flow/workers/analytics-fetcher"
import { TokenRefresherWorker } from "@/lib/social-flow/workers/token-refresher"
import { AccountSyncerWorker } from "@/lib/social-flow/workers/account-syncer"

// Registrar adapter do Instagram no startup
import { UniversalPublisher } from "@/lib/social-flow/core/publisher"
import { InstagramAdapter } from "@/lib/social-flow/networks/instagram/api"
UniversalPublisher.registerAdapter(new InstagramAdapter())

export async function GET(req: NextRequest) {
  // Verificar cron secret
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const job = req.nextUrl.searchParams.get("job")

  try {
    switch (job) {
      case "publish": {
        const report = await PublishSchedulerWorker.run()
        return NextResponse.json(report)
      }
      case "analytics": {
        const report = await AnalyticsFetcherWorker.run()
        return NextResponse.json(report)
      }
      case "tokens": {
        const report = await TokenRefresherWorker.run()
        return NextResponse.json(report)
      }
      case "sync": {
        const report = await AccountSyncerWorker.run()
        return NextResponse.json(report)
      }
      default:
        return NextResponse.json({ error: `Job "${job}" não reconhecido` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro no cron job" },
      { status: 500 }
    )
  }
}
