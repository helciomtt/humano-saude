// ============================================
// PUBLISH SCHEDULER WORKER
// Roda a cada 1 min via cron — publica posts agendados
// ============================================

import { createServiceClient } from "@/lib/supabase"
import { SchedulerService } from "../core/scheduler"
import { UniversalPublisher } from "../core/publisher"
import type { SocialAccount, SocialMediaItem, WorkerReport } from "../types"

const supabase = createServiceClient()

export class PublishSchedulerWorker {
  static async run(): Promise<WorkerReport> {
    const startedAt = new Date().toISOString()
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let failureCount = 0

    const duePosts = await SchedulerService.getDuePosts()

    for (const post of duePosts) {
      try {
        // Buscar conta associada
        const { data: account } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("id", post.account_id)
          .eq("is_active", true)
          .single()

        if (!account) {
          errors.push({ id: post.id, error: "Conta não encontrada ou inativa" })
          failureCount++
          continue
        }

        // Buscar mídia do post
        const { data: mediaItems } = await supabase
          .from("social_media_items")
          .select("*")
          .eq("post_id", post.id)
          .order("sort_order")

        const result = await UniversalPublisher.publishToNetwork(
          account as SocialAccount,
          post,
          (mediaItems ?? []) as SocialMediaItem[]
        )

        if (result.success) {
          successCount++
        } else {
          errors.push({ id: post.id, error: result.error ?? "Erro desconhecido" })
          failureCount++
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro interno"
        errors.push({ id: post.id, error: msg })
        failureCount++
      }
    }

    return {
      job: "publish-scheduler",
      startedAt,
      completedAt: new Date().toISOString(),
      totalProcessed: duePosts.length,
      successCount,
      failureCount,
      skippedCount: 0,
      errors,
    }
  }
}
