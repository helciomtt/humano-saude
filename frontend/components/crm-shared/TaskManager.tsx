'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, CheckCircle, Clock, AlertTriangle, Calendar,
  Phone, Mail, MessageSquare, FileText, Send, Flag,
  Trash2, MoreHorizontal, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmTask, CrmTaskInsert, CrmTaskUpdate, CrmTaskStatus, CrmTaskPriority } from '@/lib/types/corretor';
import type { CrmInteracaoTipo } from '@/lib/types/corretor';

const STATUS_CONFIG: Record<CrmTaskStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendente: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
  em_andamento: { label: 'Em andamento', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
  concluida: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'text-white/30', bg: 'bg-white/5', icon: AlertTriangle },
};

const PRIORITY_CONFIG: Record<CrmTaskPriority, { label: string; color: string; dot: string }> = {
  baixa: { label: 'Baixa', color: 'text-white/40', dot: 'bg-white/20' },
  media: { label: 'Média', color: 'text-blue-400', dot: 'bg-blue-400' },
  alta: { label: 'Alta', color: 'text-orange-400', dot: 'bg-orange-400' },
  urgente: { label: 'Urgente', color: 'text-red-400', dot: 'bg-red-400' },
};

const TIPO_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  tarefa: { icon: CheckCircle, label: 'Tarefa' },
  ligacao: { icon: Phone, label: 'Ligação' },
  email: { icon: Mail, label: 'Email' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp' },
  reuniao: { icon: Calendar, label: 'Reunião' },
  follow_up: { icon: Clock, label: 'Follow-up' },
  proposta_enviada: { icon: Send, label: 'Enviar Proposta' },
  documento_enviado: { icon: FileText, label: 'Enviar Documento' },
};

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isOverdue(d: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function TaskManager({
  tasks,
  cardId,
  corretorId,
  onCreateTask,
  onUpdateTask,
  onCompleteTask,
  onDeleteTask,
}: {
  tasks: CrmTask[];
  cardId: string;
  corretorId: string;
  onCreateTask: (input: CrmTaskInsert) => Promise<boolean>;
  onUpdateTask: (taskId: string, updates: CrmTaskUpdate) => Promise<boolean>;
  onCompleteTask: (taskId: string) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<CrmInteracaoTipo>('tarefa');
  const [prioridade, setPrioridade] = useState<CrmTaskPriority>('media');
  const [dataVencimento, setDataVencimento] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSubmitting(true);
    const success = await onCreateTask({
      card_id: cardId,
      corretor_id: corretorId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      tipo,
      status: 'pendente',
      prioridade,
      data_vencimento: dataVencimento ? new Date(dataVencimento).toISOString() : null,
      data_conclusao: null,
      lembrete_em: null,
      metadata: {},
    });
    if (success) {
      setTitulo('');
      setDescricao('');
      setDataVencimento('');
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return t.status === 'pendente' || t.status === 'em_andamento';
    if (filter === 'completed') return t.status === 'concluida' || t.status === 'cancelada';
    return true;
  });

  const overdue = tasks.filter((t) => t.status === 'pendente' && isOverdue(t.data_vencimento));
  const pending = tasks.filter((t) => t.status === 'pendente' || t.status === 'em_andamento');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#D4AF37]" />
            Tarefas
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40">
              {pending.length} pendente{pending.length !== 1 ? 's' : ''}
            </span>
          </h3>
          {overdue.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              <AlertTriangle className="h-2.5 w-2.5" />
              {overdue.length} atrasada{overdue.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-[#D4AF37] hover:text-[#F6E05E] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1">
        {([['all', 'Todas'], ['pending', 'Pendentes'], ['completed', 'Concluídas']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* New Task Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Título da tarefa..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none border-b border-white/10 pb-2"
              autoFocus
            />

            <textarea
              placeholder="Descrição (opcional)..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full bg-transparent text-xs text-white/60 placeholder:text-white/20 outline-none resize-none"
            />

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tipo */}
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as CrmInteracaoTipo)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 outline-none"
              >
                {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {/* Prioridade */}
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as CrmTaskPriority)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 outline-none"
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {/* Data Vencimento */}
              <input
                type="datetime-local"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-white/50 hover:text-white">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!titulo.trim() || submitting}
                className="px-4 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-medium hover:bg-[#F6E05E] transition-colors disabled:opacity-40"
              >
                {submitting ? 'Criando...' : 'Criar Tarefa'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-white/20">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma tarefa {filter !== 'all' ? 'nesta categoria' : ''}</p>
            </div>
          ) : (
            filtered.map((task) => {
              const status = STATUS_CONFIG[task.status];
              const priority = PRIORITY_CONFIG[task.prioridade];
              const tipoConf = TIPO_CONFIG[task.tipo] ?? TIPO_CONFIG.tarefa;
              const TipoIcon = tipoConf.icon;
              const overdue = task.status === 'pendente' && isOverdue(task.data_vencimento);

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl transition-all group',
                    'bg-white/[0.02] border hover:bg-white/[0.04]',
                    overdue ? 'border-red-500/30' : 'border-white/[0.06]',
                    task.status === 'concluida' && 'opacity-60',
                  )}
                >
                  {/* Complete checkbox */}
                  <button
                    onClick={() => {
                      if (task.status !== 'concluida') onCompleteTask(task.id);
                    }}
                    className={cn(
                      'h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                      task.status === 'concluida'
                        ? 'bg-green-500/20 border-green-500/40'
                        : 'border-white/20 hover:border-[#D4AF37]/60',
                    )}
                  >
                    {task.status === 'concluida' && <CheckCircle className="h-3 w-3 text-green-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TipoIcon className="h-3 w-3 text-white/30 flex-shrink-0" />
                      <span className={cn(
                        'text-xs font-medium',
                        task.status === 'concluida' ? 'text-white/40 line-through' : 'text-white',
                      )}>
                        {task.titulo}
                      </span>
                      <span className={cn('flex items-center gap-0.5 text-[9px]', priority.color)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
                        {priority.label}
                      </span>
                    </div>

                    {task.descricao && (
                      <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">{task.descricao}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5">
                      {task.data_vencimento && (
                        <span className={cn(
                          'flex items-center gap-1 text-[10px]',
                          overdue ? 'text-red-400' : 'text-white/30',
                        )}>
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(task.data_vencimento)}
                        </span>
                      )}
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', status.bg, status.color)}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
