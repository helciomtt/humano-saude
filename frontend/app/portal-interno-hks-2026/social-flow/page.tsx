"use client"

import { useState, useEffect } from "react"
import {
  Send, Users, Calendar, FileText, Clock, Plus,
  Instagram, RefreshCw, Settings, ArrowRight,
  BarChart3, Image, Sparkles, Hash, TrendingUp,
} from "lucide-react"
import Link from "next/link"

const P = "/portal-interno-hks-2026/social-flow"

interface AccountData {
  id: string
  network: string
  username: string
  display_name: string
  profile_picture_url: string
  followers_count: number
  following_count: number
  posts_count: number
  connection_status: string
  engagement_rate: number
}

interface DashboardStats {
  totalFollowers: number
  scheduledCount: number
  draftsCount: number
  bestTime: { day: number; hour: number } | null
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function SocialFlowDashboard() {
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalFollowers: 0,
    scheduledCount: 0,
    draftsCount: 0,
    bestTime: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [accRes, statsRes] = await Promise.all([
        fetch("/api/social-flow/accounts"),
        fetch("/api/social-flow/analytics?period=30"),
      ])
      const accData = await accRes.json()
      const statsData = await statsRes.json()

      setAccounts(accData.accounts ?? [])
      if (statsData.stats) setStats(statsData.stats)
    } catch {
      // Silencioso em dev
    } finally {
      setLoading(false)
    }
  }

  const hasAccounts = accounts.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Send className="h-8 w-8 text-[#D4AF37]" />
            Social Flow
          </h1>
          <p className="mt-1 text-gray-400">Gerencie suas redes sociais com IA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
          <Link href={`${P}/settings`}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors">
              <Settings className="h-4 w-4" /> Config
            </div>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Seguidores Totais", value: stats.totalFollowers.toLocaleString("pt-BR"), icon: Users, color: "text-blue-400", border: "border-blue-500/20" },
          { label: "Posts Agendados", value: stats.scheduledCount, icon: Calendar, color: "text-[#D4AF37]", border: "border-[#D4AF37]/20" },
          { label: "Rascunhos", value: stats.draftsCount, icon: FileText, color: "text-[#F4D03F]", border: "border-[#F4D03F]/20" },
          { label: "Melhor Horário", value: stats.bestTime ? `${DAYS[stats.bestTime.day]} ${stats.bestTime.hour}h` : "—", icon: Clock, color: "text-green-400", border: "border-green-500/20" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.border} bg-[#0a0a0a] p-5`}>
            <s.icon className={`h-6 w-6 ${s.color} mb-3`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {hasAccounts ? (
        <>
          {/* Contas conectadas */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-400" /> Contas Conectadas
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {acc.profile_picture_url ? (
                      <img src={acc.profile_picture_url} alt={acc.username} className="h-10 w-10 rounded-full" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {acc.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">@{acc.username}</p>
                      <p className="text-xs text-gray-400">{acc.display_name}</p>
                    </div>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${
                      acc.connection_status === "connected" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {acc.connection_status === "connected" ? "Ativo" : "Expirado"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{(acc.followers_count / 1000).toFixed(1)}k</p>
                      <p className="text-[10px] text-gray-500">Seguidores</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{acc.posts_count}</p>
                      <p className="text-[10px] text-gray-500">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{acc.engagement_rate}%</p>
                      <p className="text-[10px] text-gray-500">Engajamento</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Criar Post com IA", icon: Sparkles, href: `${P}/composer`, color: "from-[#D4AF37] to-[#F4D03F]" },
              { label: "Calendário", icon: Calendar, href: `${P}/calendar`, color: "from-slate-600 to-slate-500" },
              { label: "Biblioteca de Mídia", icon: Image, href: `${P}/library`, color: "from-[#D4AF37]/80 to-[#F4D03F]/80" },
              { label: "Analytics", icon: BarChart3, href: `${P}/analytics`, color: "from-emerald-600 to-emerald-500" },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 hover:bg-white/5 transition-all group cursor-pointer">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white group-hover:text-white/90">{action.label}</p>
                  <ArrowRight className="h-4 w-4 text-white/30 mt-2 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <Send className="h-16 w-16 text-[#D4AF37]/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Conecte suas redes sociais</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Gerencie Instagram, Facebook e mais de um só lugar. Agende posts, gere legendas com IA e acompanhe métricas.
          </p>
          <Link href={`${P}/connect`}>
            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-slate-900 font-bold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all">
              <Plus className="h-4 w-4 inline mr-2" /> Conectar Conta
            </button>
          </Link>

          <div className="mt-8 grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
            {[
              { icon: Sparkles, label: "Legendas com IA", desc: "GPT-4 gera legendas perfeitas" },
              { icon: Calendar, label: "Agendamento", desc: "Programe posts automaticamente" },
              { icon: TrendingUp, label: "Analytics", desc: "Métricas e insights em tempo real" },
            ].map((f, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/5 p-4 text-left">
                <f.icon className="h-5 w-5 text-[#D4AF37] mb-2" />
                <p className="text-sm font-medium text-white">{f.label}</p>
                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Flow Pro upsell */}
      <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/5 to-[#F4D03F]/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Hash className="h-5 w-5 text-[#D4AF37]" /> Social Flow Pro
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Em breve: Facebook, X (Twitter), LinkedIn, YouTube, TikTok e Pinterest
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold">EM BREVE</span>
        </div>
      </div>
    </div>
  )
}
