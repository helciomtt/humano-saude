'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { getNotificacoes, markNotificacaoAsRead, markAllNotificacoesAsRead, getNotificacaoCount } from '@/app/actions/notifications';
import { toast } from 'sonner';

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'todas' | 'nao_lidas'>('todas');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [nRes, cRes] = await Promise.all([
      getNotificacoes(),
      getNotificacaoCount(),
    ]);
    if (nRes.success) setNotificacoes(nRes.data || []);
    if (cRes.success) setUnreadCount(cRes.count || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleMarkRead(id: string) {
    const result = await markNotificacaoAsRead(id);
    if (result.success) {
      toast.success('Notificação marcada como lida');
    } else {
      toast.error('Erro ao marcar notificação');
    }
    load();
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificacoesAsRead();
    if (result.success) {
      toast.success('Todas as notificações marcadas como lidas');
    } else {
      toast.error('Erro ao marcar notificações');
    }
    load();
  }

  const tipoConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  };

  const filtered = notificacoes.filter((n) => {
    if (filter === 'nao_lidas') return !n.lida;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            NOTIFICAÇÕES
          </h1>
          <p className="mt-2 text-gray-400">Central de notificações e alertas</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
          >
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats & Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('todas')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === 'todas'
                    ? 'bg-[#D4AF37] text-black'
                    : 'border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                Todas ({notificacoes.length})
              </button>
              <button
                onClick={() => setFilter('nao_lidas')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === 'nao_lidas'
                    ? 'bg-[#D4AF37] text-black'
                    : 'border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                Não lidas ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notificações */}
          <div className="space-y-2">
            {filtered.map((n) => {
              const config = tipoConfig[n.tipo] || tipoConfig.info;
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={`rounded-lg border p-4 transition-all ${
                    n.lida
                      ? 'border-white/5 bg-[#0a0a0a] opacity-60'
                      : 'border-[#D4AF37]/20 bg-[#0a0a0a]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${n.lida ? 'text-gray-400' : 'text-white'}`}>
                          {n.titulo}
                        </h3>
                        {!n.lida && (
                          <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{n.mensagem}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {n.created_at ? new Date(n.created_at).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                    {!n.lida && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="rounded p-1.5 text-gray-500 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
                        title="Marcar como lida"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">
                  {filter === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
