// ============================================
// SCHEDULER SERVICE
// Gerencia agendamento e fila de publicação
// ============================================

import { createServiceClient } from "@/lib/supabase"
import type { SocialPost, ScheduleResult } from "../types"
import { logger } from '@/lib/logger';

const supabase = createServiceClient()

export class SchedulerService {
  // Agenda um post para publicação futura
  static async schedulePost(
    postId: string,
    scheduledFor: Date | string
  ): Promise<ScheduleResult> {
    const scheduledDate = scheduledFor instanceof Date ? scheduledFor : new Date(scheduledFor)

    if (scheduledDate <= new Date()) {
      return { success: false, postId, scheduledFor: scheduledDate.toISOString() }
    }

    const { error } = await supabase
      .from("social_posts")
      .update({
        status: "scheduled",
        scheduled_for: scheduledDate.toISOString(),
        auto_publish: true,
      })
      .eq("id", postId)

    return {
      success: !error,
      postId,
      scheduledFor: scheduledDate.toISOString(),
    }
  }

  // Busca posts prontos para publicar (usada pelo cron worker)
  static async getDuePosts(): Promise<SocialPost[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .eq("auto_publish", true)
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(50)

    if (error) {
      logger.error("[SchedulerService] Erro ao buscar posts agendados:", error)
      return []
    }

    return (data ?? []) as SocialPost[]
  }

  // Cancelar agendamento → volta para rascunho
  static async unschedulePost(postId: string): Promise<boolean> {
    const { error } = await supabase
      .from("social_posts")
      .update({
        status: "draft",
        scheduled_for: null,
        auto_publish: false,
      })
      .eq("id", postId)

    return !error
  }

  // Reagendar
  static async reschedulePost(
    postId: string,
    newDate: Date | string
  ): Promise<ScheduleResult> {
    return this.schedulePost(postId, newDate)
  }

  // Posts agendados de um usuário
  static async getScheduledPosts(userId: string): Promise<SocialPost[]> {
    const { data } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .order("scheduled_for", { ascending: true })

    return (data ?? []) as SocialPost[]
  }

  // Contagem para dashboard
  static async getScheduledCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from("social_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "scheduled")

    return count ?? 0
  }

  // Busca posts por range de data (para calendário)
  static async getPostsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<SocialPost[]> {
    const { data } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", userId)
      .or(`scheduled_for.gte.${startDate},published_at.gte.${startDate}`)
      .or(`scheduled_for.lte.${endDate},published_at.lte.${endDate}`)
      .in("status", ["scheduled", "published", "publishing", "failed"])
      .order("scheduled_for", { ascending: true })

    return (data ?? []) as SocialPost[]
  }
}
