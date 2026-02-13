'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Building, Globe, Bell, Shield, Palette, Mail, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSystemConfig, saveSystemConfig } from '@/app/actions/integrations';

interface Config {
  empresa_nome: string;
  empresa_cnpj: string;
  empresa_telefone: string;
  empresa_email: string;
  empresa_site: string;
  whatsapp_api_token: string;
  meta_pixel_id: string;
  google_analytics_id: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  notificar_novo_lead: boolean;
  notificar_cotacao: boolean;
  notificar_proposta: boolean;
  tema: 'dark' | 'light';
}

const DEFAULT_CONFIG: Config = {
  empresa_nome: 'Humano Saúde',
  empresa_cnpj: '',
  empresa_telefone: '',
  empresa_email: '',
  empresa_site: '',
  whatsapp_api_token: '',
  meta_pixel_id: '',
  google_analytics_id: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  notificar_novo_lead: true,
  notificar_cotacao: true,
  notificar_proposta: true,
  tema: 'dark',
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getSystemConfig();
      if (res.success && res.data) {
        setConfig({ ...DEFAULT_CONFIG, ...res.data } as Config);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await saveSystemConfig(config as unknown as Record<string, unknown>);
    setSaving(false);
    if (res.success) {
      toast.success('Configurações salvas com sucesso');
    } else {
      toast.error('Erro ao salvar configurações', { description: res.error });
    }
  }

  const tabs = [
    { key: 'empresa', label: 'Empresa', icon: Building },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
    { key: 'integracoes', label: 'APIs', icon: Globe },
    { key: 'email', label: 'Email (SMTP)', icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            CONFIGURAÇÕES
          </h1>
          <p className="mt-2 text-gray-400">Configurações gerais do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-[#D4AF37] text-black'
                : 'border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Empresa */}
      {activeTab === 'empresa' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-[#D4AF37]" /> Dados da Empresa
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'empresa_nome', label: 'Nome da Empresa', type: 'text' },
              { key: 'empresa_cnpj', label: 'CNPJ', type: 'text' },
              { key: 'empresa_telefone', label: 'Telefone', type: 'tel' },
              { key: 'empresa_email', label: 'Email', type: 'email' },
              { key: 'empresa_site', label: 'Site', type: 'url' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={(config as any)[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notificações */}
      {activeTab === 'notificacoes' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#D4AF37]" /> Notificações
          </h2>
          {[
            { key: 'notificar_novo_lead', label: 'Notificar quando novo lead for capturado' },
            { key: 'notificar_cotacao', label: 'Notificar quando cotação for gerada' },
            { key: 'notificar_proposta', label: 'Notificar quando proposta for aceita' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer">
              <span className="text-sm text-gray-300">{item.label}</span>
              <button
                onClick={() => setConfig({ ...config, [item.key]: !(config as any)[item.key] })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  (config as any)[item.key] ? 'bg-[#D4AF37]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    (config as any)[item.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      )}

      {/* APIs */}
      {activeTab === 'integracoes' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#D4AF37]" /> APIs e Integrações
          </h2>
          {[
            { key: 'whatsapp_api_token', label: 'WhatsApp API Token', placeholder: 'Token da API do WhatsApp Business' },
            { key: 'meta_pixel_id', label: 'Meta Pixel ID', placeholder: 'ID do pixel do Facebook' },
            { key: 'google_analytics_id', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
              <input
                type="text"
                value={(config as any)[field.key]}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none font-mono text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* SMTP */}
      {activeTab === 'email' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#D4AF37]" /> Configuração SMTP
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'smtp_host', label: 'Host SMTP', placeholder: 'smtp.gmail.com' },
              { key: 'smtp_port', label: 'Porta', placeholder: '587' },
              { key: 'smtp_user', label: 'Usuário', placeholder: 'email@empresa.com' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={(config as any)[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
