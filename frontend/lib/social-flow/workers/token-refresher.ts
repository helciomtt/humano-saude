// ============================================
// TOKEN REFRESHER WORKER
// Roda a cada 6h — renova tokens prestes a expirar
// ============================================

import { createServiceClient } from "@/lib/supabase"
import { UniversalPublisher } from "../core/publisher"
import type { SocialAccount, WorkerReport } from "../types"

const supabase = createServiceClient()

export class TokenRefresherWorker {
  static async run(): Promise<WorkerReport> {
    const startedAt = new Date().toISOString()
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let failureCount = 0
    let skippedCount = 0

    // Buscar contas com token expirando em 7 dias
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: accounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("is_active", true)
      .lt("token_expires_at", sevenDaysFromNow)
      .not("token_expires_at", "is", null)

    if (!accounts?.length) {
      return {
        job: "token-refresher",
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
        const result = await adapter.refreshToken(account)

        await supabase
          .from("social_accounts")
          .update({
            access_token: result.access_token,
            token_expires_at: result.expires_at,
            connection_status: "connected",
            last_error: null,
            last_error_at: null,
          })
          .eq("id", account.id)

        successCount++
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro ao renovar token"
        errors.push({ id: account.id, error: msg })

        // Marcar conta como expirada se token totalmente inválido
        await supabase
          .from("social_accounts")
          .update({
            connection_status: "expired",
            last_error: msg,
            last_error_at: new Date().toISOString(),
          })
          .eq("id", account.id)

        failureCount++
      }
    }

    return {
      job: "token-refresher",
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
