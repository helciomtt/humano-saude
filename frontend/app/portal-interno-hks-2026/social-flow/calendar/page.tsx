"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, Plus, Eye, Edit2, Send,
} from "lucide-react"
import Link from "next/link"
import { getPostTypeColor, getPostTypeLabel, getStatusLabel } from "@/lib/social-flow/config"

const P = "/portal-interno-hks-2026/social-flow"
const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface CalendarPost {
  id: string
  post_type: string
  content: string
  status: string
  scheduled_for: string
  published_at: string
  network: string
}

type ViewMode = "month" | "week" | "day"

export default function SocialFlowCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [view, setView] = useState<ViewMode>("month")
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)

  useEffect(() => {
    loadPosts()
  }, [currentDate])

  async function loadPosts() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0).toISOString()

    try {
      const res = await fetch(`/api/social-flow/scheduled`)
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      // silent
    }
  }

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    }
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    // Preencher até 42 (6 semanas)
    while (days.length < 42) {
      days.push({ date: new Date(year, month + 1, days.length - daysInMonth - firstDay + 1), isCurrentMonth: false })
    }

    return days
  }, [currentDate])

  const getPostsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return posts.filter((p) => {
      const pDate = (p.scheduled_for ?? p.published_at)?.split("T")[0]
      return pDate === dateStr
    })
  }

  const today = new Date()
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const stats = {
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    feed: posts.filter((p) => p.post_type === "feed").length,
    reels: posts.filter((p) => p.post_type === "reel").length,
    stories: posts.filter((p) => p.post_type === "story").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-400" />
            Calendário Editorial
          </h1>
          <p className="mt-1 text-gray-400">Visualize e gerencie seus posts agendados</p>
        </div>
        <Link href={`${P}/composer`}>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium">
            <Plus className="h-4 w-4" /> Novo Post
          </button>
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-white/5">
            <ChevronLeft className="h-5 w-5 text-white/60" />
          </button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
            {MONTHS_PT[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-white/5">
            <ChevronRight className="h-5 w-5 text-white/60" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg bg-white/5 text-sm text-white/60 hover:bg-white/10">Hoje</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Feed</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Reel</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Story</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Carousel</span>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs ${view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
              >
                {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {DAYS_PT.map((day) => (
            <div key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-400">{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }, i) => {
            const dayPosts = getPostsForDay(date)
            return (
              <div
                key={i}
                className={`min-h-[100px] border-r border-b border-white/5 p-2 transition-colors ${
                  !isCurrentMonth ? "opacity-30" : "hover:bg-white/5"
                } ${isToday(date) ? "bg-purple-500/10" : ""}`}
              >
                <p className={`text-sm font-medium mb-1 ${isToday(date) ? "text-purple-400" : "text-white/60"}`}>
                  {date.getDate()}
                </p>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate ${getPostTypeColor(post.post_type)} text-white`}
                    >
                      {new Date(post.scheduled_for).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" "}{getPostTypeLabel(post.post_type)}
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-[10px] text-gray-500 pl-1">+{dayPosts.length - 3} mais</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Agendados", value: stats.scheduled, color: "text-purple-400" },
          { label: "Feed", value: stats.feed, color: "text-blue-400" },
          { label: "Reels", value: stats.reels, color: "text-red-400" },
          { label: "Stories", value: stats.stories, color: "text-green-400" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Post preview modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setSelectedPost(null)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPostTypeColor(selectedPost.post_type)} text-white`}>
                {getPostTypeLabel(selectedPost.post_type)}
              </span>
              <span className="text-xs text-gray-400">{getStatusLabel(selectedPost.status)}</span>
            </div>
            <p className="text-sm text-white/80 mb-4 line-clamp-4">{selectedPost.content ?? "Sem legenda"}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <Clock className="h-3 w-3" />
              {new Date(selectedPost.scheduled_for).toLocaleString("pt-BR")}
            </div>
            <div className="flex gap-2">
              <Link href={`${P}/composer?edit=${selectedPost.id}`} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm">
                  <Edit2 className="h-4 w-4" /> Editar
                </button>
              </Link>
              <button onClick={() => setSelectedPost(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
