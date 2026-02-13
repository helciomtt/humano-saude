// ============================================
// ACCOUNT SYNCER WORKER
// Roda diariamente às 03:00 — sincroniza dados de contas
// ============================================

import { createServiceClient } from "@/lib/supabase"
import { UniversalPublisher } from "../core/publisher"
import type { SocialAccount, WorkerReport } from "../types"

const supabase = createServiceClient()

export class AccountSyncerWorker {
  static async run(): Promise<WorkerReport> {
    const startedAt = new Date().toISOString()
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let failureCount = 0
    let skippedCount = 0

    const { data: accounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("is_active", true)

    if (!accounts?.length) {
      return {
        job: "account-syncer",
        startedAt,
        completedAt: new Date().toISOString(),
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        errors: [],
      }
    }

    for (const rawAccount of accounts) {
      const account = rawAccount as SocialAccount
      const adapter = UniversalPublisher.getAdapter(account.network)

      if (!adapter) {
        skippedCount++
        continue
      }

      try {
        // Validar token
        const isValid = await adapter.validateToken(account)

        if (!isValid) {
          await supabase
            .from("social_accounts")
            .update({ connection_status: "expired" })
            .eq("id", account.id)
          errors.push({ id: account.id, error: "Token inválido" })
          failureCount++
          continue
        }

        // Sincronizar métricas da conta
        const metrics = await adapter.getAccountMetrics(account)

        await supabase
          .from("social_accounts")
          .update({
            followers_count: metrics.followers_count ?? account.followers_count,
            following_count: metrics.following_count ?? account.following_count,
            posts_count: metrics.posts_count ?? account.posts_count,
            connection_status: "connected",
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", account.id)

        successCount++
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro ao sincronizar"
        errors.push({ id: account.id, error: msg })
        failureCount++
      }
    }

    return {
      job: "account-syncer",
      startedAt,
      completedAt: new Date().toISOString(),
      totalProcessed: accounts.length,
      successCount,
      failureCount,
      skippedCount,
      errors,
    }
  }
}
