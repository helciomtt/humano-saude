"use client"

import { useState } from "react"
import {
  Instagram, Facebook, Twitter, Linkedin, Youtube,
  ArrowRight, Check, Shield, Zap, BarChart3, Clock,
  ExternalLink, AlertCircle,
} from "lucide-react"

const P = "/portal-interno-hks-2026/social-flow"

const NETWORKS = [
  {
    id: "instagram",
    name: "Instagram Business",
    icon: Instagram,
    color: "from-purple-600 via-pink-500 to-orange-400",
    available: true,
    description: "Publique posts, reels, stories e carousels automaticamente",
    prerequisites: [
      "Conta Instagram Business ou Creator",
      "Página do Facebook vinculada",
      "Permissões de administrador na página",
    ],
    permissions: [
      "instagram_basic — Perfil e mídia",
      "instagram_content_publish — Publicar conteúdo",
      "instagram_manage_insights — Métricas",
      "pages_show_list — Listar páginas",
      "pages_read_engagement — Interações",
    ],
  },
  {
    id: "facebook",
    name: "Facebook Page",
    icon: Facebook,
    color: "from-blue-600 to-blue-500",
    available: false,
    description: "Gerencie posts na sua página do Facebook",
    prerequisites: ["Página do Facebook", "Permissões de administrador"],
    permissions: [],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "from-gray-600 to-gray-500",
    available: false,
    description: "Publique tweets e threads automaticamente",
    prerequisites: ["Conta X verificada", "API Developer access"],
    permissions: [],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "from-blue-700 to-blue-600",
    available: false,
    description: "Publique no seu perfil ou empresa no LinkedIn",
    prerequisites: ["Conta LinkedIn", "Página de empresa (opcional)"],
    permissions: [],
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "from-red-600 to-red-500",
    available: false,
    description: "Agende e publique vídeos no YouTube",
    prerequisites: ["Canal do YouTube", "YouTube Data API v3"],
    permissions: [],
  },
]

export default function SocialFlowConnect() {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  async function handleConnect(networkId: string) {
    setConnecting(true)
    try {
      const res = await fetch(`/api/social-flow/connect?network=${networkId}`)
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch { /* silent */ }
    setConnecting(false)
  }

  const selected = NETWORKS.find((n) => n.id === selectedNetwork)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-400" />
          Conectar Rede Social
        </h1>
        <p className="mt-1 text-gray-400">Conecte suas contas para publicar e analisar automaticamente</p>
      </div>

      {/* Network Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {NETWORKS.map((network) => (
          <button
            key={network.id}
            onClick={() => setSelectedNetwork(network.id)}
            disabled={!network.available}
            className={`relative text-left p-6 rounded-xl border transition-all ${
              selectedNetwork === network.id
                ? "border-purple-500 bg-purple-500/5"
                : network.available
                ? "border-white/10 bg-[#0a0a0a] hover:border-white/20"
                : "border-white/5 bg-[#0a0a0a] opacity-40 cursor-not-allowed"
            }`}
          >
            {!network.available && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-500">
                Em breve
              </span>
            )}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${network.color} flex items-center justify-center mb-3`}>
              <network.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">{network.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{network.description}</p>
            {selectedNetwork === network.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected Network Details */}
      {selected && selected.available && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${selected.color} flex items-center justify-center`}>
              <selected.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
              <p className="text-xs text-gray-400">Configuração de conexão</p>
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              Pré-requisitos
            </h4>
            <div className="space-y-2">
              {selected.prerequisites.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  {req}
                </div>
              ))}
            </div>
          </div>

          {/* Permissions */}
          {selected.permissions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Permissões Solicitadas
              </h4>
              <div className="space-y-2">
                {selected.permissions.map((perm, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <Shield className="h-4 w-4 text-blue-400/50 flex-shrink-0 mt-0.5" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              O que você poderá fazer
            </h4>
            <div className="grid gap-2 grid-cols-2">
              {[
                { icon: Zap, text: "Publicação automática" },
                { icon: Clock, text: "Agendamento inteligente" },
                { icon: BarChart3, text: "Analytics detalhado" },
                { icon: Shield, text: "Workflow de aprovação" },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm text-white/60">
                  <feat.icon className="h-4 w-4 text-purple-400" />
                  {feat.text}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => handleConnect(selected.id)}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {connecting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <selected.icon className="h-5 w-5" />
                Conectar {selected.name}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            Conexão segura via OAuth 2.0 — seus dados nunca são armazenados localmente
          </p>
        </div>
      )}
    </div>
  )
}
