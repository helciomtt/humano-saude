"use client"

import { useState, useRef, useEffect } from "react"
import {
  ImageIcon, Film, BookOpen, Sparkles, Clock, Send, Save,
  Hash, AtSign, MapPin, X, Upload, Plus, Wand2, Eye,
} from "lucide-react"
import Link from "next/link"

const P = "/portal-interno-hks-2026/social-flow"

const POST_TYPES = [
  { value: "feed", label: "Feed", icon: ImageIcon, color: "bg-blue-500" },
  { value: "reel", label: "Reel", icon: Film, color: "bg-red-500" },
  { value: "story", label: "Story", icon: BookOpen, color: "bg-green-500" },
  { value: "carousel", label: "Carousel", icon: ImageIcon, color: "bg-purple-500" },
]

export default function SocialFlowComposer() {
  const [postType, setPostType] = useState("feed")
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [tab, setTab] = useState<"compose" | "preview">("compose")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setMediaFiles((prev) => [...prev, ...files])
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function generateCaption() {
    setAiLoading(true)
    try {
      const res = await fetch("/api/social-flow/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: caption || "saúde e bem-estar", network: "instagram", postType, tone: "professional" }),
      })
      const data = await res.json()
      if (data.caption) setCaption(data.caption)
    } catch { /* silent */ }
    setAiLoading(false)
  }

  async function suggestHashtags() {
    setAiLoading(true)
    try {
      const res = await fetch("/api/social-flow/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: caption || "plano de saúde", network: "instagram", count: 15 }),
      })
      const data = await res.json()
      if (data.hashtags) setHashtags(data.hashtags.join(" "))
    } catch { /* silent */ }
    setAiLoading(false)
  }

  async function handlePublish(mode: "now" | "schedule" | "draft") {
    setPublishing(true)
    try {
      const formData = new FormData()
      formData.append("post_type", postType)
      formData.append("content", `${caption}\n\n${hashtags}`.trim())
      formData.append("network", "instagram")

      if (mode === "schedule" && scheduleDate && scheduleTime) {
        formData.append("scheduled_for", `${scheduleDate}T${scheduleTime}:00`)
      }
      if (mode === "draft") {
        formData.append("status", "draft")
      }

      mediaFiles.forEach((f) => formData.append("media", f))

      const endpoint = mode === "draft" ? "/api/social-flow/drafts" : "/api/social-flow/publish"
      await fetch(endpoint, { method: "POST", body: formData })
    } catch { /* silent */ }
    setPublishing(false)
  }

  const charCount = caption.length
  const maxChars = 2200

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-400" />
            Composer
          </h1>
          <p className="mt-1 text-gray-400">Crie e agende publicações com inteligência artificial</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("compose")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "compose" ? "bg-white/10 text-white" : "text-white/40"}`}>
            Compor
          </button>
          <button onClick={() => setTab("preview")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "preview" ? "bg-white/10 text-white" : "text-white/40"}`}>
            <Eye className="inline h-4 w-4 mr-1" /> Preview
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column — Compose */}
        <div className="lg:col-span-3 space-y-6">
          {/* Post Type Picker */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-gray-400 mb-3">Tipo de publicação</p>
            <div className="flex gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPostType(t.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    postType === t.value
                      ? `${t.color} text-white shadow-lg`
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-gray-400 mb-3">Mídia</p>
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {previews.map((src, i) => (
                  <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 text-white/40 w-full justify-center transition-colors"
            >
              <Upload className="h-5 w-5" />
              Arraste ou clique para upload
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Caption */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">Legenda</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateCaption}
                  disabled={aiLoading}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 text-xs"
                >
                  <Wand2 className="h-3 w-3" />
                  {aiLoading ? "Gerando..." : "IA Caption"}
                </button>
                <span className={`text-xs ${charCount > maxChars ? "text-red-400" : "text-gray-500"}`}>
                  {charCount}/{maxChars}
                </span>
              </div>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva sua legenda ou deixe a IA criar..."
              className="w-full bg-transparent text-white text-sm placeholder-white/20 resize-none outline-none min-h-[120px]"
            />
          </div>

          {/* Hashtags */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 flex items-center gap-1"><Hash className="h-3 w-3" /> Hashtags</p>
              <button
                onClick={suggestHashtags}
                disabled={aiLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 text-xs"
              >
                <Sparkles className="h-3 w-3" />
                {aiLoading ? "Sugerindo..." : "Sugerir"}
              </button>
            </div>
            <textarea
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#planosaude #saude #bemestar"
              className="w-full bg-transparent text-white text-sm placeholder-white/20 resize-none outline-none min-h-[60px]"
            />
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><Clock className="h-3 w-3" /> Agendar publicação</p>
            <div className="flex gap-3">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column — Preview & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* iPhone Preview */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-gray-400 mb-3">Preview do Post</p>
            <div className="mx-auto w-[260px] rounded-[24px] border-2 border-white/10 bg-black p-3">
              {/* Status bar */}
              <div className="flex justify-center mb-2"><div className="w-20 h-4 rounded-full bg-white/10" /></div>
              {/* Account header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <div>
                  <p className="text-[10px] font-semibold text-white">humanosaude</p>
                  <p className="text-[8px] text-gray-400">Patrocinado</p>
                </div>
              </div>
              {/* Image */}
              <div className="w-full aspect-square rounded-lg bg-white/5 overflow-hidden mb-2 flex items-center justify-center">
                {previews[0] ? (
                  <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-white/10" />
                )}
              </div>
              {/* Caption */}
              <div className="px-1">
                <p className="text-[9px] text-white line-clamp-3">
                  <span className="font-semibold">humanosaude </span>
                  {caption || "Sua legenda aparecerá aqui..."}
                </p>
                {hashtags && (
                  <p className="text-[9px] text-blue-400 mt-0.5 line-clamp-2">{hashtags}</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" /> Insights da IA
            </p>
            <div className="space-y-2 text-xs text-white/60">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <Clock className="h-4 w-4 text-green-400" />
                <span>Melhor horário: <strong className="text-white">18:00 - 20:00</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <Hash className="h-4 w-4 text-blue-400" />
                <span>Hashtags recomendadas: <strong className="text-white">15-20</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                <span>Formato ideal: <strong className="text-white">{postType === "reel" ? "9:16 vertical" : "1:1 quadrado"}</strong></span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => handlePublish(scheduleDate ? "schedule" : "now")}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {scheduleDate ? <Clock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {publishing ? "Processando..." : scheduleDate ? "Agendar Publicação" : "Publicar Agora"}
            </button>
            <button
              onClick={() => handlePublish("draft")}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5"
            >
              <Save className="h-4 w-4" /> Salvar Rascunho
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
