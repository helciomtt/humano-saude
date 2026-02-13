'use client';

import { useState, useEffect } from 'react';
import { Plug, CheckCircle, XCircle, Settings, RefreshCw, Globe, Zap } from 'lucide-react';
import { getIntegrations, toggleIntegration, getWebhookLogs } from '@/app/actions/integrations';

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [iRes, wRes] = await Promise.all([
      getIntegrations(),
      getWebhookLogs(),
    ]);
    if (iRes.success) setIntegrations(iRes.data || []);
    if (wRes.success) setWebhookLogs(wRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id: string, current: boolean) {
    await toggleIntegration(id, !current);
    load();
  }

  const platformIcons: Record<string, string> = {
    whatsapp: '💬',
    meta_ads: '📢',
    google_analytics: '📊',
    meta_pixel: '🎯',
    smtp: '✉️',
    supabase: '⚡',
    voip: '📞',
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          INTEGRAÇÕES
        </h1>
        <p className="mt-2 text-gray-400">Conecte suas ferramentas e APIs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <Plug className="h-5 w-5 text-[#D4AF37] mb-2" />
              <p className="text-2xl font-bold text-white">{integrations.length}</p>
              <p className="text-xs text-gray-400">Integrações Configuradas</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">{integrations.filter((i) => i.ativo).length}</p>
              <p className="text-xs text-gray-400">Ativas</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <Globe className="h-5 w-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">{webhookLogs.length}</p>
              <p className="text-xs text-gray-400">Webhook Logs (recentes)</p>
            </div>
          </div>

          {/* Integrações */}
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.length > 0 ? (
              integrations.map((integ) => (
                <div
                  key={integ.id}
                  className={`rounded-lg border p-5 transition-all ${
                    integ.ativo ? 'border-green-500/30 bg-[#0a0a0a]' : 'border-white/10 bg-[#0a0a0a] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platformIcons[integ.plataforma] || '🔌'}</span>
                      <div>
                        <h3 className="text-base font-semibold text-white capitalize">{integ.plataforma?.replace(/_/g, ' ')}</h3>
                        <p className="text-xs text-gray-400">{integ.ativo ? 'Conectado' : 'Desconectado'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(integ.id, integ.ativo)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        integ.ativo ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          integ.ativo ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {integ.ultimo_sync && (
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Último sync: {new Date(integ.ultimo_sync).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ))
            ) : (
              /* Default cards when no integrations exist */
              [
                { name: 'WhatsApp Business', icon: '💬', desc: 'Envie e receba mensagens automaticamente' },
                { name: 'Meta Ads', icon: '📢', desc: 'Sincronize campanhas do Facebook e Instagram' },
                { name: 'Google Analytics', icon: '📊', desc: 'Rastreie visitas e comportamento do site' },
                { name: 'Meta Pixel', icon: '🎯', desc: 'Rastreie conversões de anúncios' },
                { name: 'SMTP (Email)', icon: '✉️', desc: 'Configure envio de emails transacionais' },
                { name: 'VoIP', icon: '📞', desc: 'Central de telefonia IP' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5 opacity-60">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h3 className="text-base font-semibold text-white">{item.name}</h3>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <button className="mt-3 rounded-lg border border-[#D4AF37]/30 px-3 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">
                    Configurar
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Webhook Logs */}
          {webhookLogs.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#D4AF37]" /> Webhook Logs (últimos 20)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="pb-2 pr-4">Fonte</th>
                      <th className="pb-2 pr-4">Evento</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 pr-4 text-white">{log.source}</td>
                        <td className="py-2 pr-4 text-gray-300">{log.event_type}</td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.status_code < 300
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-400 text-xs">
                          {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
