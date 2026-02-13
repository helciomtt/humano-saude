"use client"

import { useState, useEffect } from "react"
import {
  Settings, Instagram, Facebook, Twitter, Linkedin, Youtube,
  Trash2, RefreshCw, Shield, Bell, Globe, Clock, AlertTriangle,
  Check, X, ExternalLink,
} from "lucide-react"
import Link from "next/link"

const P = "/portal-interno-hks-2026/social-flow"

interface ConnectedAccount {
  id: string
  platform: string
  account_name: string
  account_username: string
  profile_picture_url?: string
  is_active: boolean
  token_expires_at: string
  permissions: string[]
  created_at: string
}

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
}

export default function SocialFlowSettings() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [timezone, setTimezone] = useState("America/Sao_Paulo")
  const [notifications, setNotifications] = useState({
    publish_success: true,
    publish_fail: true,
    approval_request: true,
    weekly_report: false,
    token_expiry: true,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { loadAccounts() }, [])

  async function loadAccounts() {
    setLoading(true)
    try {
      const res = await fetch("/api/social-flow/accounts")
      const data = await res.json()
      setAccounts(data.accounts ?? [])
    } catch { /* silent */ }
    setLoading(false)
  }

  async function disconnectAccount(id: string) {
    try {
      await fetch(`/api/social-flow/accounts?id=${id}`, { method: "DELETE" })
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      setDeleteConfirm(null)
    } catch { /* silent */ }
  }

  function getDaysUntilExpiry(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-gray-400" />
          Configurações
        </h1>
        <p className="mt-1 text-gray-400">Gerencie suas contas conectadas, permissões e preferências</p>
      </div>

      {/* Connected Accounts */}
      <section className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Contas Conectadas
          </h2>
          <Link href={`${P}/connect`}>
            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
              + Conectar
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <Instagram className="h-10 w-10 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhuma conta conectada</p>
            <Link href={`${P}/connect`}>
              <button className="mt-3 px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10">
                Conectar conta
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const Icon = PLATFORM_ICONS[account.platform] ?? Globe
              const daysLeft = getDaysUntilExpiry(account.token_expires_at)
              const expiringSoon = daysLeft <= 7

              return (
                <div key={account.id} className="flex items-center gap-4 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  {account.profile_picture_url ? (
                    <img src={account.profile_picture_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{account.account_name}</p>
                    <p className="text-xs text-gray-500">@{account.account_username} · {account.platform}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {expiringSoon && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        {daysLeft <= 0 ? "Expirado" : `${daysLeft}d`}
                      </span>
                    )}

                    <span className={`w-2 h-2 rounded-full ${account.is_active ? "bg-green-400" : "bg-red-400"}`} />

                    {deleteConfirm === account.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => disconnectAccount(account.id)} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded bg-white/5 text-white/40 hover:bg-white/10">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(account.id)} className="p-1.5 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-yellow-400" />
          Notificações
        </h2>
        <div className="space-y-3">
          {[
            { key: "publish_success", label: "Publicação realizada com sucesso" },
            { key: "publish_fail", label: "Falha na publicação" },
            { key: "approval_request", label: "Solicitação de aprovação" },
            { key: "weekly_report", label: "Relatório semanal" },
            { key: "token_expiry", label: "Token prestes a expirar" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-white/70">{item.label}</span>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  notifications[item.key as keyof typeof notifications] ? "bg-purple-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Timezone */}
      <section className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          Fuso Horário
        </h2>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none w-full max-w-sm"
        >
          <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
          <option value="America/Manaus">Manaus (GMT-4)</option>
          <option value="America/Belem">Belém (GMT-3)</option>
          <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
          <option value="America/Recife">Recife (GMT-3)</option>
        </select>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </h2>
        <p className="text-sm text-gray-400 mb-4">Ações irreversíveis. Tenha cuidado.</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
            <div>
              <p className="text-sm text-white/70">Desconectar todas as contas</p>
              <p className="text-xs text-gray-500">Remove todas as contas vinculadas ao Social Flow</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10">
              Desconectar
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
            <div>
              <p className="text-sm text-white/70">Excluir todos os dados</p>
              <p className="text-xs text-gray-500">Remove permanentemente todos os posts, métricas e configurações</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10">
              Excluir Tudo
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
