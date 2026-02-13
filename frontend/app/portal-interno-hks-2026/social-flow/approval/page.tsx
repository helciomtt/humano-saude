"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2, XCircle, Clock, MessageCircle, Eye,
  Filter, Search, ChevronDown, Send, ImageIcon, Film,
  BookOpen, User, Calendar,
} from "lucide-react"

interface PendingPost {
  id: string
  content: string
  post_type: string
  network: string
  scheduled_for: string
  status: string
  created_by?: string
  media_urls?: string[]
  created_at: string
}

type StatusFilter = "all" | "pending_approval" | "approved" | "rejected"

export default function SocialFlowApproval() {
  const [posts, setPosts] = useState<PendingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null)
  const [comment, setComment] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { loadPosts() }, [statusFilter])

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch("/api/social-flow/scheduled")
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch { /* silent */ }
    setLoading(false)
  }

  async function handleAction(postId: string, action: "approve" | "reject") {
    setActionLoading(true)
    try {
      await fetch(`/api/social-flow/scheduled`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          status: action === "approve" ? "scheduled" : "rejected",
          feedback: comment,
        }),
      })
      await loadPosts()
      setSelectedPost(null)
      setComment("")
    } catch { /* silent */ }
    setActionLoading(false)
  }

  const filtered = posts.filter((p) => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    const matchSearch = !search || p.content?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = {
    all: posts.length,
    pending: posts.filter((p) => p.status === "pending_approval").length,
    approved: posts.filter((p) => p.status === "scheduled" || p.status === "approved").length,
    rejected: posts.filter((p) => p.status === "rejected").length,
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "reel": return <Film className="h-4 w-4 text-red-400" />
      case "story": return <BookOpen className="h-4 w-4 text-green-400" />
      case "carousel": return <ImageIcon className="h-4 w-4 text-purple-400" />
      default: return <ImageIcon className="h-4 w-4 text-blue-400" />
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-xs"><Clock className="h-3 w-3" />Pendente</span>
      case "scheduled":
      case "approved":
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs"><CheckCircle2 className="h-3 w-3" />Aprovado</span>
      case "rejected":
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-xs"><XCircle className="h-3 w-3" />Rejeitado</span>
      default:
        return <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-xs">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
          Aprovação de Posts
        </h1>
        <p className="mt-1 text-gray-400">Revise e aprove publicações antes de irem ao ar</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        {[
          { label: "Pendentes", value: counts.pending, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Aprovados", value: counts.approved, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Rejeitados", value: counts.rejected, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border border-white/10 ${s.bg} p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — Post List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(["all", "pending_approval", "approved", "rejected"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f === "approved" ? "all" : f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  statusFilter === f ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
                }`}
              >
                {f === "all" ? "Todos" : f === "pending_approval" ? "Pendentes" : f === "approved" ? "Aprovados" : "Rejeitados"}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar posts..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none"
            />
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum post para revisão</p>
              </div>
            ) : (
              filtered.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedPost?.id === post.id
                      ? "border-purple-500 bg-purple-500/5"
                      : "border-white/5 hover:border-white/10 bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {typeIcon(post.post_type)}
                      <span className="text-xs text-white/40 capitalize">{post.post_type}</span>
                    </div>
                    {statusBadge(post.status)}
                  </div>
                  <p className="text-sm text-white/70 line-clamp-2 mb-2">{post.content || "Sem legenda"}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.scheduled_for || post.created_at).toLocaleDateString("pt-BR")}</span>
                    {post.created_by && <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.created_by}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — Detail Panel */}
        <div className="lg:col-span-3">
          {selectedPost ? (
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 space-y-6 sticky top-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {typeIcon(selectedPost.post_type)}
                  <span className="text-sm font-medium text-white capitalize">{selectedPost.post_type}</span>
                </div>
                {statusBadge(selectedPost.status)}
              </div>

              {/* Media Preview */}
              {selectedPost.media_urls && selectedPost.media_urls.length > 0 ? (
                <div className="grid gap-2 grid-cols-2">
                  {selectedPost.media_urls.map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-white/5 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white/10" />
                </div>
              )}

              {/* Caption */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Legenda</p>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{selectedPost.content || "Sem legenda"}</p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Rede:</span>{" "}
                  <span className="text-white capitalize">{selectedPost.network}</span>
                </div>
                <div>
                  <span className="text-gray-500">Agendado para:</span>{" "}
                  <span className="text-white">{new Date(selectedPost.scheduled_for).toLocaleString("pt-BR")}</span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Feedback (opcional)</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Deixe um comentário para o criador..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 outline-none resize-none min-h-[80px]"
                />
              </div>

              {/* Actions */}
              {selectedPost.status === "pending_approval" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(selectedPost.id, "approve")}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleAction(selectedPost.id, "reject")}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 font-semibold text-sm border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
              <Eye className="h-12 w-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Selecione um post para revisar</p>
              <p className="text-gray-500 text-xs mt-1">Clique em um post na lista ao lado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
