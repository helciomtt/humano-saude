// ============================================
// ANALYTICS FETCHER WORKER
// Roda a cada 1h — busca métricas de posts e contas
// ============================================

import { createServiceClient } from "@/lib/supabase"
import { UniversalPublisher } from "../core/publisher"
import type { SocialAccount, WorkerReport } from "../types"

const supabase = createServiceClient()

export class AnalyticsFetcherWorker {
  static async run(): Promise<WorkerReport> {
    const startedAt = new Date().toISOString()
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let failureCount = 0
    let skippedCount = 0

    // Buscar contas ativas
    const { data: accounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("is_active", true)
      .eq("connection_status", "connected")

    if (!accounts?.length) {
      return {
        job: "analytics-fetcher",
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
        // Buscar métricas da conta
        const accountMetrics = await adapter.getAccountMetrics(account)

        // Atualizar conta
        await supabase
          .from("social_accounts")
          .update({
            followers_count: accountMetrics.followers_count ?? account.followers_count,
            following_count: accountMetrics.following_count ?? account.following_count,
            posts_count: accountMetrics.posts_count ?? account.posts_count,
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", account.id)

        // Salvar histórico
        await supabase.from("social_account_metrics_history").insert({
          account_id: account.id,
          ...accountMetrics,
          recorded_at: new Date().toISOString(),
        })

        // Buscar métricas dos últimos 20 posts publicados
        const { data: posts } = await supabase
          .from("social_posts")
          .select("id, platform_post_id")
          .eq("account_id", account.id)
          .eq("status", "published")
          .not("platform_post_id", "is", null)
          .order("published_at", { ascending: false })
          .limit(20)

        for (const post of posts ?? []) {
          if (!post.platform_post_id) continue

          try {
            const postMetrics = await adapter.getPostMetrics(account, post.platform_post_id)

            // Upsert métricas
            await supabase
              .from("social_post_metrics")
              .upsert({
                post_id: post.id,
                ...postMetrics,
                updated_at: new Date().toISOString(),
              }, { onConflict: "post_id" })

            // Salvar histórico
            await supabase.from("social_post_metrics_history").insert({
              post_id: post.id,
              impressions: postMetrics.impressions ?? 0,
              reach: postMetrics.reach ?? 0,
              engagement: postMetrics.engagement ?? 0,
              likes: postMetrics.likes ?? 0,
              comments: postMetrics.comments ?? 0,
              shares: postMetrics.shares ?? 0,
              saves: postMetrics.saves ?? 0,
              recorded_at: new Date().toISOString(),
            })
          } catch {
            // Silenciar erros de posts individuais
          }
        }

        successCount++
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro ao buscar métricas"
        errors.push({ id: account.id, error: msg })
        failureCount++
      }
    }

    return {
      job: "analytics-fetcher",
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
