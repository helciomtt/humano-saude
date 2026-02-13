'use client';

// ─── NotificationBell Component ─────────────────────────────
// Floating notification bell with badge counter, popover dropdown,
// mark-as-read, and navigation to action URLs.
// Uses CRM notification actions from crm-detail.ts.

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '@/app/actions/crm-detail';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { CrmNotification } from '@/lib/types/crm';

const PORTAL = '/portal-interno-hks-2026';

// Poll interval (30 seconds)
const POLL_INTERVAL = 30_000;

// Notification type configuration
const TIPO_CONFIG: Record<string, { emoji: string; color: string }> = {
  deal_moved: { emoji: '📦', color: 'text-blue-400' },
  deal_won: { emoji: '🏆', color: 'text-green-400' },
  deal_lost: { emoji: '❌', color: 'text-red-400' },
  deal_assigned: { emoji: '👤', color: 'text-purple-400' },
  activity_overdue: { emoji: '⏰', color: 'text-orange-400' },
  activity_assigned: { emoji: '📋', color: 'text-cyan-400' },
  comment_mention: { emoji: '💬', color: 'text-yellow-400' },
  comment_reply: { emoji: '↩️', color: 'text-yellow-300' },
  follower_update: { emoji: '👁️', color: 'text-gray-400' },
  quote_viewed: { emoji: '👀', color: 'text-blue-300' },
  quote_accepted: { emoji: '✅', color: 'text-green-400' },
  quote_declined: { emoji: '🚫', color: 'text-red-400' },
  system: { emoji: '🔔', color: 'text-[#D4AF37]' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

interface NotificationBellProps {
  corretorId: string;
  className?: string;
}

export default function NotificationBell({ corretorId, className }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!corretorId) return;

    try {
      const [notifResult, countResult] = await Promise.all([
        getNotifications(corretorId, { limit: 20 }),
        getUnreadCount(corretorId),
      ]);

      if (notifResult.success) setNotifications(notifResult.data ?? []);
      if (countResult.success) setUnreadCount(countResult.data ?? 0);
    } catch {
      // Silent fail — polling will retry
    }
  }, [corretorId]);

  // Initial load + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when popover opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Mark single as read
  async function handleMarkRead(notification: CrmNotification) {
    if (notification.is_read) return;

    const result = await markNotificationRead(notification.id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  // Mark all as read
  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);

    const result = await markAllNotificationsRead(corretorId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })),
      );
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } else {
      toast.error('Erro ao marcar notificações');
    }

    setMarkingAll(false);
  }

  // Navigate to action URL
  function handleNavigate(notification: CrmNotification) {
    handleMarkRead(notification);
    setOpen(false);

    if (notification.action_url) {
      router.push(notification.action_url);
    } else if (notification.entity_type === 'deal' && notification.entity_id) {
      router.push(`${PORTAL}/crm?deal=${notification.entity_id}`);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative flex items-center justify-center h-10 w-10 rounded-full',
            'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10',
            'transition-all duration-200 group',
            className,
          )}
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        >
          <Bell className="h-5 w-5 text-white/60 group-hover:text-white/80 transition-colors" />

          {/* Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold shadow-lg shadow-[#D4AF37]/30 animate-in zoom-in-50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 bg-[#0B1215]/98 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl shadow-black/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-white">Notificações</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Ler todas
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-10 w-10 text-white/10 mb-2" />
              <p className="text-sm text-white/40">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {notifications.map((n) => {
                const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.system;
                const hasAction = !!(n.action_url || (n.entity_type === 'deal' && n.entity_id));

                return (
                  <div
                    key={n.id}
                    className={cn(
                      'group flex items-start gap-3 px-4 py-3 transition-colors',
                      hasAction ? 'cursor-pointer hover:bg-white/[0.04]' : '',
                      !n.is_read && 'bg-[#D4AF37]/[0.03]',
                    )}
                    onClick={() => hasAction && handleNavigate(n)}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5 text-base">
                      {config.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm leading-tight',
                            n.is_read ? 'text-white/60' : 'text-white font-medium',
                          )}
                        >
                          {n.titulo}
                        </p>

                        {/* Unread dot */}
                        {!n.is_read && (
                          <span className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                        )}
                      </div>

                      {n.mensagem && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                          {n.mensagem}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/30">
                          {timeAgo(n.created_at)}
                        </span>

                        {hasAction && (
                          <ExternalLink className="h-3 w-3 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}

                        {!n.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(n);
                            }}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                            title="Marcar como lida"
                          >
                            <Check className="h-3 w-3 text-white/40" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-white/10 px-4 py-2">
            <button
              onClick={() => {
                setOpen(false);
                router.push(`${PORTAL}/notificacoes`);
              }}
              className="w-full text-center text-xs text-[#D4AF37] hover:text-[#F6E05E] transition-colors py-1"
            >
              Ver todas as notificações →
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
