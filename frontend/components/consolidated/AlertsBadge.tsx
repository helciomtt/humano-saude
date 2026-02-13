'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown, X } from 'lucide-react';
import type { CockpitAlert } from '@/lib/consolidator';

interface AlertsBadgeProps {
  alerts: CockpitAlert[];
}

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const ALERT_COLORS: Record<string, string> = {
  danger: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
};

const BADGE_COLORS: Record<string, string> = {
  danger: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  success: 'bg-green-500',
};

export default function AlertsBadge({ alerts }: AlertsBadgeProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter(a => !dismissed.has(a.id));
  const dangerCount = activeAlerts.filter(a => a.type === 'danger').length;
  const warningCount = activeAlerts.filter(a => a.type === 'warning').length;

  const badgeColor = dangerCount > 0 ? 'bg-red-500' : warningCount > 0 ? 'bg-yellow-500' : 'bg-green-500';

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  return (
    <div className="relative">
      {/* Badge trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-300 hover:border-[#D4AF37]/30 transition-colors"
      >
        <Bell className="h-4 w-4" />
        <span>Alertas</span>
        {activeAlerts.length > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${badgeColor}`}>
            {activeAlerts.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-96 max-h-[400px] overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 py-3">
              <h4 className="text-sm font-semibold text-[#D4AF37]">
                Alertas ({activeAlerts.length})
              </h4>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tudo em ordem! Nenhum alerta ativo.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {activeAlerts.map(alert => {
                  const Icon = ALERT_ICONS[alert.type] || Info;
                  return (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 px-4 py-3 border-l-2 ${ALERT_COLORS[alert.type]}`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs opacity-70 mt-0.5">{alert.message}</p>
                      </div>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="flex-shrink-0 text-gray-600 hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
