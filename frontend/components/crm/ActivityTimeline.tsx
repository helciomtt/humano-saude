'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Mail, Calendar, FileText, Send, MessageSquare,
  Clock, CheckCircle, XCircle, Building2, ArrowRight,
  Sparkles, Plus, Filter, Pin, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmActivityEnriched, CrmActivityType, CrmActivityInsert } from '@/lib/types/crm';

// ========================================
// CONFIG
// ========================================

const ACTIVITY_CONFIG: Record<CrmActivityType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}> = {
  ligacao: { icon: Phone, label: 'Ligação', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  email: { icon: Mail, label: 'Email', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  reuniao: { icon: Calendar, label: 'Reunião', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  nota: { icon: FileText, label: 'Nota', color: 'text-white/60', bgColor: 'bg-white/5' },
  tarefa: { icon: CheckCircle, label: 'Tarefa', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  proposta_enviada: { icon: Send, label: 'Proposta Enviada', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  proposta_aceita: { icon: CheckCircle, label: 'Proposta Aceita', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  proposta_recusada: { icon: XCircle, label: 'Proposta Recusada', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  documento_enviado: { icon: FileText, label: 'Doc. Enviado', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  documento_recebido: { icon: FileText, label: 'Doc. Recebido', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  visita: { icon: Building2, label: 'Visita', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  follow_up: { icon: Clock, label: 'Follow-up', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  stage_change: { icon: ArrowRight, label: 'Mudança de Etapa', color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10' },
  sistema: { icon: Sparkles, label: 'Sistema', color: 'text-white/40', bgColor: 'bg-white/5' },
};

const USER_ACTIVITY_TYPES: CrmActivityType[] = [
  'nota', 'ligacao', 'whatsapp', 'email', 'reuniao',
  'proposta_enviada', 'tarefa', 'documento_enviado', 'follow_up', 'visita',
];

// ========================================
// HELPERS
// ========================================

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`;
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ========================================
// ACTIVITY TIMELINE
// ========================================

export default function ActivityTimeline({
  activities,
  dealId,
  contactId,
  companyId,
  corretorId,
  onAddActivity,
  loading,
}: {
  activities: CrmActivityEnriched[];
  dealId?: string;
  contactId?: string | null;
  companyId?: string | null;
  corretorId?: string | null;
  onAddActivity: (input: CrmActivityInsert) => Promise<boolean>;
  loading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [noteType, setNoteType] = useState<CrmActivityType>('nota');
  const [noteText, setNoteText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CrmActivityType | 'all'>('all');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);

    const isTask = noteType === 'tarefa' || noteType === 'follow_up';
    const success = await onAddActivity({
      deal_id: dealId ?? null,
      contact_id: contactId ?? null,
      company_id: companyId ?? null,
      owner_corretor_id: corretorId ?? null,
      tipo: noteType,
      assunto: ACTIVITY_CONFIG[noteType].label,
      descricao: noteText.trim(),
      concluida: false,
      data_vencimento: isTask && dueDate ? new Date(dueDate).toISOString() : null,
      data_conclusao: null,
      duracao_minutos: null,
      anexo_url: null,
      anexo_tipo: null,
      resultado: null,
      metadata: {},
    });

    if (success) {
      setNoteText('');
      setDueDate('');
      setShowForm(false);
    }
    setSubmitting(false);
  };

  // Filtrar atividades
  const filtered = activities.filter((a) => {
    if (filterType !== 'all' && a.tipo !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.assunto?.toLowerCase().includes(q) ||
        a.descricao?.toLowerCase().includes(q) ||
        a.owner_nome?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isTask = noteType === 'tarefa' || noteType === 'follow_up';

  return (
    <div className="flex flex-col h-full">
      {/* Header com filtros */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Atividades</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-[#D4AF37] hover:text-[#F6E05E] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Buscar atividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as CrmActivityType | 'all')}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 outline-none appearance-none cursor-pointer"
        >
          <option value="all">Todos</option>
          {USER_ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{ACTIVITY_CONFIG[t].label}</option>
          ))}
        </select>
      </div>

      {/* New Activity Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3 overflow-hidden mb-4"
          >
            {/* Type Selector */}
            <div className="flex flex-wrap gap-1.5">
              {USER_ACTIVITY_TYPES.map((t) => {
                const cfg = ACTIVITY_CONFIG[t];
                const Icon = cfg.icon;
                return (
                  <button
                    key={t}
                    onClick={() => setNoteType(t)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                      noteType === t
                        ? `${cfg.bgColor} ${cfg.color} border border-current/20`
                        : 'bg-white/5 text-white/40 hover:bg-white/10',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <textarea
              placeholder="Descreva a atividade..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none border border-white/10 rounded-lg p-3"
            />

            {/* Due date para tarefas */}
            {isTask && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-white/40" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-transparent text-xs text-white border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setNoteText(''); }}
                className="px-3 py-1.5 text-xs text-white/50 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!noteText.trim() || submitting}
                className="px-4 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-medium hover:bg-[#F6E05E] transition-colors disabled:opacity-40"
              >
                {submitting ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto space-y-1 sidebar-scroll">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-white/20">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">
              {searchQuery || filterType !== 'all' ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade registrada'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/5" />
            {filtered.map((activity) => {
              const cfg = ACTIVITY_CONFIG[activity.tipo] ?? ACTIVITY_CONFIG.sistema;
              const Icon = cfg.icon;
              const isOverdue = !activity.concluida && activity.data_vencimento &&
                new Date(activity.data_vencimento) < new Date();

              return (
                <div key={activity.id} className="relative flex gap-3 pb-4 group">
                  <div className={cn(
                    'relative z-10 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    cfg.bgColor,
                    isOverdue && 'ring-2 ring-red-500/50',
                  )}>
                    <Icon className={cn('h-4 w-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {activity.assunto ?? cfg.label}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                            VENCIDA
                          </span>
                        )}
                        {activity.concluida && (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-white/30">
                        {formatTimestamp(activity.created_at)}
                      </span>
                    </div>
                    {activity.descricao && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-3">{activity.descricao}</p>
                    )}
                    {activity.resultado && (
                      <span className="text-[10px] text-white/30 mt-1 inline-flex items-center gap-1">
                        → {activity.resultado}
                      </span>
                    )}
                    {activity.owner_nome && (
                      <span className="text-[10px] text-white/20 mt-1 block">
                        por {activity.owner_nome}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
