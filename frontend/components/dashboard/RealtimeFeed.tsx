'use client';

// =====================================================
// RealtimeFeed — Feed de eventos em tempo real
// Auto-refresh: 15 segundos
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ShoppingCart, AlertCircle, Eye, Pause, Play } from 'lucide-react';
import type { RealtimeEvent, RealtimeEventType } from '@/lib/types/analytics';

const EVENT_CONFIG: Record<RealtimeEventType, { icon: typeof ShoppingBag; color: string; bg: string }> = {
  sale: { icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  cart_abandoned: { icon: ShoppingCart, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  payment_failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  visit: { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function RealtimeFeed() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/realtime-events');
      const json = await res.json();
      if (json.success && json.data) {
        setEvents(json.data);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    if (!live) return;
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents, live]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
        <div className="h-6 w-32 animate-pulse rounded bg-white/5 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5 mb-2" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Atividade Recente</h3>
        <button
          onClick={() => setLive(!live)}
          className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:text-white"
        >
          {live ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {live ? 'Pausar' : 'Retomar'}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-thin">
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const config = EVENT_CONFIG[event.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
              >
                <div className={`rounded-lg p-1.5 ${config.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{event.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{event.detail}</p>
                </div>
                {event.amount !== undefined && event.amount > 0 && (
                  <span className={`text-xs font-semibold ${config.color}`}>
                    R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
                <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(event.timestamp)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {events.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-600">Nenhuma atividade recente</p>
        )}
      </div>
    </motion.div>
  );
}
