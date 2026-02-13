'use client';

import { useState, useEffect } from 'react';
import {
  Link2, CheckCircle, XCircle, AlertCircle, RefreshCw,
  ExternalLink, Settings, Plug2,
} from 'lucide-react';
import type { PlatformAccount } from '@/lib/consolidator';

const PLATFORM_INFO: Record<string, { icon: string; color: string; bgColor: string; description: string; docs: string }> = {
  meta: {
    icon: '📘',
    color: 'text-blue-400',
    bgColor: 'border-blue-500/30 bg-blue-500/5',
    description: 'Conecte sua conta Meta Business para acessar dados de campanhas do Facebook e Instagram Ads.',
    docs: 'https://developers.facebook.com/docs/marketing-apis/',
  },
  google: {
    icon: '🔍',
    color: 'text-red-400',
    bgColor: 'border-red-500/30 bg-red-500/5',
    description: 'Conecte o Google Ads para consolidar dados de campanhas de Search, Display e YouTube.',
    docs: 'https://developers.google.com/google-ads/api/docs/start',
  },
  ga4: {
    icon: '📊',
    color: 'text-orange-400',
    bgColor: 'border-orange-500/30 bg-orange-500/5',
    description: 'Conecte o Google Analytics 4 para dados de tráfego, sessões e comportamento do usuário.',
    docs: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
  },
};

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  active: { icon: CheckCircle, color: 'text-green-400', label: 'Conectado' },
  expired: { icon: XCircle, color: 'text-gray-500', label: 'Desconectado' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Erro' },
};

export default function ConnectPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/consolidated/accounts');
      const json = await res.json();
      if (json.success) setAccounts(json.accounts);
    } catch (e) {
      console.error('Accounts fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: string) => {
    const accountId = formData[`${platform}-accountId`];
    const accessToken = formData[`${platform}-token`];

    if (!accountId) return;

    setSaving(platform);
    try {
      const res = await fetch('/api/consolidated/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, accountId, accessToken }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchAccounts();
        setFormData(prev => ({ ...prev, [`${platform}-accountId`]: '', [`${platform}-token`]: '' }));
      }
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CONECTAR PLATAFORMAS
        </h1>
        <p className="mt-2 text-gray-400">
          Gerencie as integrações com plataformas de anúncios e analytics
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-green-500/20 bg-[#0a0a0a] p-5 text-center">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {accounts.filter(a => a.isConnected).length}
          </p>
          <p className="text-xs text-gray-500">Conectadas</p>
        </div>
        <div className="rounded-xl border border-gray-500/20 bg-[#0a0a0a] p-5 text-center">
          <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {accounts.filter(a => !a.isConnected).length}
          </p>
          <p className="text-xs text-gray-500">Pendentes</p>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-5 text-center">
          <Plug2 className="h-8 w-8 text-[#D4AF37] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{accounts.length}</p>
          <p className="text-xs text-gray-500">Total de Plataformas</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {accounts.map(account => {
            const info = PLATFORM_INFO[account.platform] || PLATFORM_INFO.meta;
            const status = STATUS_ICONS[account.status] || STATUS_ICONS.expired;
            const StatusIcon = status.icon;

            return (
              <div
                key={account.id}
                className={`rounded-xl border ${info.bgColor} p-6 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                      <p className="text-sm text-gray-400">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                  </div>
                </div>

                {/* Connection info */}
                {account.isConnected && (
                  <div className="mb-4 rounded-lg border border-white/5 bg-[#0a0a0a] p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Account ID</p>
                      <p className="text-sm text-white font-mono">{account.accountId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Último Sync</p>
                      <p className="text-sm text-white">
                        {account.lastSync ? new Date(account.lastSync).toLocaleString('pt-BR') : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Configuration form */}
                {!account.isConnected && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {account.platform === 'ga4' ? 'Property ID' : 'Account ID'}
                      </label>
                      <input
                        type="text"
                        value={formData[`${account.platform}-accountId`] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`${account.platform}-accountId`]: e.target.value }))}
                        placeholder={account.platform === 'meta' ? 'Ex: 123456789' : account.platform === 'ga4' ? 'Ex: 123456789' : 'Ex: 123-456-7890'}
                        className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-600"
                      />
                    </div>
                    {account.platform === 'meta' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Access Token (opcional)</label>
                        <input
                          type="password"
                          value={formData[`${account.platform}-token`] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`${account.platform}-token`]: e.target.value }))}
                          placeholder="Token de acesso Meta Business"
                          className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-600"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSave(account.platform)}
                        disabled={saving === account.platform || !formData[`${account.platform}-accountId`]}
                        className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#D4AF37]/80 transition-colors disabled:opacity-40 flex items-center gap-2"
                      >
                        {saving === account.platform ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                        Conectar
                      </button>
                      <a
                        href={info.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-[#D4AF37] transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Documentação
                      </a>
                    </div>
                  </div>
                )}

                {/* Reconnect for connected accounts */}
                {account.isConnected && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={fetchAccounts}
                      className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Sincronizar
                    </button>
                    <a
                      href={info.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-[#D4AF37] transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Docs
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
        <h3 className="text-sm font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" /> Como configurar
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div>
            <p className="font-medium text-white">📘 Meta Ads</p>
            <p>Configure as variáveis <code className="text-[#D4AF37]">META_ACCESS_TOKEN</code>, <code className="text-[#D4AF37]">META_AD_ACCOUNT_ID</code> e <code className="text-[#D4AF37]">META_PAGE_ID</code> no Vercel ou .env.local</p>
          </div>
          <div>
            <p className="font-medium text-white">🔍 Google Ads</p>
            <p>Configure <code className="text-[#D4AF37]">GOOGLE_ADS_CLIENT_ID</code>, <code className="text-[#D4AF37]">GOOGLE_ADS_REFRESH_TOKEN</code> e <code className="text-[#D4AF37]">GOOGLE_ADS_CUSTOMER_ID</code></p>
          </div>
          <div>
            <p className="font-medium text-white">📊 GA4</p>
            <p>Configure <code className="text-[#D4AF37]">GA4_PROPERTY_ID</code> ou salve na tabela <code className="text-[#D4AF37]">integration_settings</code> do Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
}
