"use client"

import { useState, useEffect } from "react"
import {
  BarChart3, TrendingUp, TrendingDown, Eye, Heart, MessageCircle,
  Share2, Users, ImageIcon, Film, BookOpen, ArrowUpRight,
  Calendar, Clock,
} from "lucide-react"

interface DashboardStats {
  total_posts: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_reach: number
  total_impressions: number
  avg_engagement_rate: number
}

interface PeriodComparison {
  current: DashboardStats
  previous: DashboardStats
  change: Record<string, number>
}

interface TopPost {
  id: string
  content: string
  post_type: string
  published_at: string
  likes: number
  comments: number
  shares: number
  reach: number
  engagement_rate: number
}

type Period = "7d" | "30d" | "90d"

export default function SocialFlowAnalytics() {
  const [period, setPeriod] = useState<Period>("30d")
  const [stats, setStats] = useState<PeriodComparison | null>(null)
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAnalytics() }, [period])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/social-flow/analytics?period=${period}`)
      const data = await res.json()
      setStats(data.comparison ?? null)
      setTopPosts(data.topPosts ?? [])
    } catch { /* silent */ }
    setLoading(false)
  }

  const kpis = stats
    ? [
        { label: "Alcance", value: stats.current.total_reach, change: stats.change.total_reach, icon: Eye, color: "text-blue-400" },
        { label: "Impressões", value: stats.current.total_impressions, change: stats.change.total_impressions, icon: BarChart3, color: "text-purple-400" },
        { label: "Curtidas", value: stats.current.total_likes, change: stats.change.total_likes, icon: Heart, color: "text-red-400" },
        { label: "Comentários", value: stats.current.total_comments, change: stats.change.total_comments, icon: MessageCircle, color: "text-green-400" },
        { label: "Compartilhamentos", value: stats.current.total_shares, change: stats.change.total_shares, icon: Share2, color: "text-cyan-400" },
        { label: "Engajamento", value: Number((stats.current.avg_engagement_rate * 100).toFixed(2)), change: stats.change.avg_engagement_rate, icon: TrendingUp, color: "text-yellow-400", suffix: "%" },
        { label: "Posts", value: stats.current.total_posts, change: stats.change.total_posts, icon: ImageIcon, color: "text-pink-400" },
        { label: "Seguidores", value: 0, change: 0, icon: Users, color: "text-white" },
      ]
    : []

  function formatNumber(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-green-400" />
            Analytics
          </h1>
          <p className="mt-1 text-gray-400">Métricas e performance das suas redes sociais</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm ${period === p ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  {kpi.change !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs ${kpi.change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {kpi.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(kpi.change).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(kpi.value)}{kpi.suffix ?? ""}
                </p>
                <p className="text-xs text-gray-400">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Engagement by Type */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="text-sm font-medium text-white mb-4">Engajamento por Tipo</h3>
              <div className="space-y-4">
                {[
                  { type: "Feed", icon: ImageIcon, color: "bg-blue-500", percentage: 45 },
                  { type: "Reels", icon: Film, color: "bg-red-500", percentage: 35 },
                  { type: "Stories", icon: BookOpen, color: "bg-green-500", percentage: 15 },
                  { type: "Carousel", icon: ImageIcon, color: "bg-purple-500", percentage: 5 },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-white/40 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{item.type}</span>
                        <span className="text-white">{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Times */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                Melhores Horários
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] text-gray-500 mb-2">{day}</p>
                    <div className="space-y-1">
                      {[9, 12, 15, 18, 21].map((hour) => {
                        const intensity = Math.random()
                        return (
                          <div
                            key={hour}
                            className="w-full aspect-square rounded"
                            style={{
                              backgroundColor: `rgba(168, 85, 247, ${0.1 + intensity * 0.7})`,
                            }}
                            title={`${day} ${hour}h — ${(intensity * 5).toFixed(1)}% engajamento`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
                <span>Menor</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                    <div key={v} className="w-3 h-3 rounded" style={{ backgroundColor: `rgba(168, 85, 247, ${v})` }} />
                  ))}
                </div>
                <span>Maior</span>
              </div>
            </div>
          </div>

          {/* Top Posts */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            <h3 className="text-sm font-medium text-white mb-4">Top Posts do Período</h3>
            {topPosts.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum post publicado neste período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPosts.slice(0, 5).map((post, i) => (
                  <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-lg font-bold text-white/20 w-6 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{post.content}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{new Date(post.published_at).toLocaleDateString("pt-BR")}</span>
                        <span className="capitalize">{post.post_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-red-400"><Heart className="h-3 w-3" />{formatNumber(post.likes)}</span>
                      <span className="flex items-center gap-1 text-blue-400"><MessageCircle className="h-3 w-3" />{formatNumber(post.comments)}</span>
                      <span className="flex items-center gap-1 text-green-400"><Eye className="h-3 w-3" />{formatNumber(post.reach)}</span>
                      <span className="text-yellow-400 font-medium">{(post.engagement_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
