"use client"

import { useState, useEffect, useRef } from "react"
import {
  ImageIcon, Film, FolderOpen, Upload, Search, Grid3x3,
  List, Trash2, Eye, X, Plus, Filter, Download,
} from "lucide-react"

interface MediaItem {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  width?: number
  height?: number
  folder?: string
  tags?: string[]
  created_at: string
}

const FOLDERS = [
  { name: "Todos", icon: Grid3x3 },
  { name: "Feed", icon: ImageIcon },
  { name: "Reels", icon: Film },
  { name: "Stories", icon: ImageIcon },
  { name: "Templates", icon: FolderOpen },
]

export default function SocialFlowLibrary() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState("Todos")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadMedia() }, [])

  async function loadMedia() {
    setLoading(true)
    try {
      const res = await fetch("/api/social-flow/media")
      const data = await res.json()
      setItems(data.items ?? [])
    } catch { /* silent */ }
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", activeFolder === "Todos" ? "" : activeFolder)
      try {
        await fetch("/api/social-flow/media", { method: "POST", body: formData })
      } catch { /* silent */ }
    }
    await loadMedia()
    setUploading(false)
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/social-flow/media?id=${id}`, { method: "DELETE" })
      setItems((prev) => prev.filter((i) => i.id !== id))
      setSelectedItem(null)
    } catch { /* silent */ }
  }

  const filtered = items.filter((i) => {
    const matchFolder = activeFolder === "Todos" || i.folder === activeFolder
    const matchSearch = !search || i.file_name.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-yellow-400" />
            Biblioteca de Mídia
          </h1>
          <p className="mt-1 text-gray-400">Organize e gerencie suas imagens e vídeos</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Upload"}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleUpload} />
      </div>

      <div className="flex gap-6">
        {/* Sidebar — Folders */}
        <div className="w-48 space-y-1">
          {FOLDERS.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveFolder(f.name)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFolder === f.name ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/60"
              }`}
            >
              <f.icon className="h-4 w-4" />
              {f.name}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 px-3 mb-2">
              {items.length} arquivo{items.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-500 px-3">
              {formatSize(items.reduce((acc, i) => acc + (i.file_size || 0), 0))} total
            </p>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar arquivos..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none"
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30"}`}>
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30"}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="h-12 w-12 text-white/10 mb-3" />
              <p className="text-white/40 text-sm">Nenhum arquivo encontrado</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10"
              >
                <Plus className="h-4 w-4" /> Fazer upload
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative rounded-xl border border-white/10 overflow-hidden bg-[#0a0a0a] hover:border-purple-500/50 transition-colors"
                >
                  <div className="aspect-square bg-white/5 overflow-hidden">
                    {item.file_type?.startsWith("video") ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-white/20" />
                      </div>
                    ) : (
                      <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-white/60 truncate">{item.file_name}</p>
                    <p className="text-[10px] text-gray-500">{formatSize(item.file_size)}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/60 backdrop-blur rounded-full p-1.5">
                      <Eye className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                    {item.file_type?.startsWith("video") ? (
                      <div className="w-full h-full flex items-center justify-center"><Film className="h-4 w-4 text-white/20" /></div>
                    ) : (
                      <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.file_name}</p>
                    <p className="text-xs text-gray-500">{formatSize(item.file_size)}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setSelectedItem(null)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl max-w-2xl w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video bg-white/5 relative flex items-center justify-center">
              {selectedItem.file_type?.startsWith("video") ? (
                <video src={selectedItem.file_url} controls className="w-full h-full object-contain" />
              ) : (
                <img src={selectedItem.file_url} alt={selectedItem.file_name} className="w-full h-full object-contain" />
              )}
              <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium text-white">{selectedItem.file_name}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{formatSize(selectedItem.file_size)}</span>
                {selectedItem.width && <span>{selectedItem.width}×{selectedItem.height}</span>}
                <span>{new Date(selectedItem.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <a href={selectedItem.file_url} download target="_blank" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10">
                  <Download className="h-4 w-4" /> Download
                </a>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
