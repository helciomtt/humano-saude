// ============================================
// ANALYTICS AGGREGATOR
// Agrega métricas de múltiplas contas/redes
// ============================================

import { createServiceClient } from "@/lib/supabase"
import type {
  PostMetrics,
  AccountMetricsHistory,
  BestTimeSlot,
  SocialPost,
} from "../types"

const supabase = createServiceClient()

export interface DashboardStats {
  totalFollowers: number
  totalPosts: number
  scheduledCount: number
  draftsCount: number
  totalReach: number
  totalImpressions: number
  totalEngagement: number
  avgEngagementRate: number
  bestTime: { day: number; hour: number; score: number } | null
  followerGrowth: number
  topPosts: Array<SocialPost & { metrics: PostMetrics }>
}

export interface PeriodComparison {
  current: number
  previous: number
  change: number
  changePercent: number
}

export class AnalyticsAggregator {
  // Dashboard stats para um usuário
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [
      accountsResult,
      scheduledResult,
      draftsResult,
      metricsResult,
      bestTimeResult,
      followerHistoryResult,
    ] = await Promise.all([
      supabase.from("social_accounts").select("*").eq("user_id", userId).eq("is_active", true),
      supabase.from("social_posts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "scheduled"),
      supabase.from("social_posts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "draft"),
      supabase.from("social_post_metrics").select("*, social_posts!inner(user_id)").eq("social_posts.user_id", userId),
      supabase.from("best_times_analysis").select("*").eq("user_id", userId).order("engagement_score", { ascending: false }).limit(1),
      supabase.from("social_account_metrics_history").select("*").order("recorded_at", { ascending: false }).limit(2),
    ])

    const accounts = accountsResult.data ?? []
    const metrics = (metricsResult.data ?? []) as PostMetrics[]
    const bestTime = bestTimeResult.data?.[0] as BestTimeSlot | undefined

    const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers_count ?? 0), 0)
    const totalPosts = accounts.reduce((sum, a) => sum + (a.posts_count ?? 0), 0)
    const totalReach = metrics.reduce((sum, m) => sum + m.reach, 0)
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0)
    const totalEngagement = metrics.reduce((sum, m) => sum + m.engagement, 0)
    const avgEngagementRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length
      : 0

    // Crescimento de seguidores (diferença entre últimas 2 leituras)
    const history = (followerHistoryResult.data ?? []) as AccountMetricsHistory[]
    const followerGrowth = history.length >= 2
      ? history[0].followers_count - history[1].followers_count
      : 0

    return {
      totalFollowers,
      totalPosts,
      scheduledCount: scheduledResult.count ?? 0,
      draftsCount: draftsResult.count ?? 0,
      totalReach,
      totalImpressions,
      totalEngagement,
      avgEngagementRate: Number(avgEngagementRate.toFixed(2)),
      bestTime: bestTime
        ? { day: bestTime.day_of_week, hour: bestTime.hour_of_day, score: bestTime.engagement_score }
        : null,
      followerGrowth,
      topPosts: [],
    }
  }

  // Métricas por período
  static async getMetricsByPeriod(
    userId: string,
    days: number
  ): Promise<{
    reach: PeriodComparison
    impressions: PeriodComparison
    engagement: PeriodComparison
    followers: PeriodComparison
  }> {
    const now = new Date()
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000)

    const { data: currentData } = await supabase
      .from("social_account_metrics_history")
      .select("*")
      .gte("recorded_at", periodStart.toISOString())
      .lte("recorded_at", now.toISOString())

    const { data: previousData } = await supabase
      .from("social_account_metrics_history")
      .select("*")
      .gte("recorded_at", previousStart.toISOString())
      .lt("recorded_at", periodStart.toISOString())

    const current = (currentData ?? []) as AccountMetricsHistory[]
    const previous = (previousData ?? []) as AccountMetricsHistory[]

    const sumField = (arr: AccountMetricsHistory[], field: keyof AccountMetricsHistory) =>
      arr.reduce((s, r) => s + (Number(r[field]) || 0), 0)

    const compare = (curVal: number, prevVal: number): PeriodComparison => ({
      current: curVal,
      previous: prevVal,
      change: curVal - prevVal,
      changePercent: prevVal > 0 ? Number((((curVal - prevVal) / prevVal) * 100).toFixed(1)) : 0,
    })

    return {
      reach: compare(sumField(current, "reach"), sumField(previous, "reach")),
      impressions: compare(sumField(current, "impressions"), sumField(previous, "impressions")),
      engagement: compare(
        sumField(current, "engagement_rate"),
        sumField(previous, "engagement_rate")
      ),
      followers: compare(
        sumField(current, "followers_count"),
        sumField(previous, "followers_count")
      ),
    }
  }

  // Top posts por engajamento
  static async getTopPosts(userId: string, limit = 10): Promise<Array<SocialPost & { metrics: PostMetrics }>> {
    const { data } = await supabase
      .from("social_posts")
      .select("*, social_post_metrics(*)")
      .eq("user_id", userId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (!data) return []

    return data
      .filter((p) => p.social_post_metrics)
      .map((p) => ({
        ...p,
        metrics: p.social_post_metrics as PostMetrics,
      }))
      .sort((a, b) => (b.metrics?.engagement_rate ?? 0) - (a.metrics?.engagement_rate ?? 0)) as Array<SocialPost & { metrics: PostMetrics }>
  }

  // Best times analysis
  static async getBestTimes(userId: string, accountId?: string): Promise<BestTimeSlot[]> {
    let query = supabase
      .from("best_times_analysis")
      .select("*")
      .eq("user_id", userId)
      .order("engagement_score", { ascending: false })

    if (accountId) {
      query = query.eq("account_id", accountId)
    }

    const { data } = await query
    return (data ?? []) as BestTimeSlot[]
  }
}
