'use client';

import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmChangelogEnriched } from '@/lib/types/crm';
import { CRM_FIELD_LABELS } from '@/lib/types/crm';

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`;
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatFieldValue(field: string, value: string | null): string {
  if (!value) return '—';
  if (field === 'valor') {
    const num = parseFloat(value);
    return isNaN(num) ? value : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  if (field === 'prioridade') {
    const labels: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
    return labels[value] ?? value;
  }
  return value;
}

export default function ChangelogView({
  changelog,
  loading,
}: {
  changelog: CrmChangelogEnriched[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!changelog.length) {
    return (
      <div className="py-12 text-center text-white/20">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Nenhuma alteração registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {changelog.map((entry) => {
        const fieldLabel = CRM_FIELD_LABELS[entry.field_name] ?? entry.field_name;

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-3.5 w-3.5 text-white/30" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-white">{fieldLabel}</span>
                <span className="text-[10px] text-white/30">alterado</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <span className="text-red-400/60 line-through truncate max-w-[120px]">
                  {formatFieldValue(entry.field_name, entry.old_value)}
                </span>
                <ArrowRight className="h-3 w-3 text-white/20 flex-shrink-0" />
                <span className="text-green-400 truncate max-w-[120px]">
                  {formatFieldValue(entry.field_name, entry.new_value)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                {entry.changed_by_nome && (
                  <span className="text-[10px] text-white/20">por {entry.changed_by_nome}</span>
                )}
                {entry.changed_by_type !== 'user' && (
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded',
                    entry.changed_by_type === 'workflow' ? 'bg-purple-500/10 text-purple-400' :
                    entry.changed_by_type === 'system' ? 'bg-white/5 text-white/40' :
                    'bg-blue-500/10 text-blue-400',
                  )}>
                    {entry.changed_by_type}
                  </span>
                )}
                <span className="text-[10px] text-white/20">{formatTimestamp(entry.created_at)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
