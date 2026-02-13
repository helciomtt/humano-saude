'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Trash2, Clock, CheckCircle, Circle, Flag } from 'lucide-react';
import { getTarefas, updateTarefa, deleteTarefa, getTarefaStats } from '@/app/actions/tarefas';
import {
  PageHeader,
  StatsCard,
  StatsGrid,
  StatusBadge,
  PageLoading,
} from '../components';
import { TarefaDialog } from '../components/TarefaDialog';
import { toast } from 'sonner';

const STATUS_COLS = [
  { key: 'pendente', label: 'Pendente', icon: Circle, color: 'text-gray-400', border: 'border-gray-500/30' },
  { key: 'em_andamento', label: 'Em Andamento', icon: Clock, color: 'text-blue-400', border: 'border-blue-500/30' },
  { key: 'concluida', label: 'Concluída', icon: CheckCircle, color: 'text-green-400', border: 'border-green-500/30' },
];

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'text-gray-400' },
  media: { label: 'Média', color: 'text-yellow-400' },
  alta: { label: 'Alta', color: 'text-orange-400' },
  urgente: { label: 'Urgente', color: 'text-red-400' },
};

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function load() {
    const [tRes, sRes] = await Promise.all([getTarefas(), getTarefaStats()]);
    if (tRes.success) setTarefas(tRes.data || []);
    if (sRes.success) setStats(sRes.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id: string, status: string) {
    const res = await updateTarefa(id, { status: status as any });
    if (res.success) {
      toast.success('Status atualizado');
      load();
    } else {
      toast.error('Erro ao atualizar tarefa');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta tarefa?')) return;
    const res = await deleteTarefa(id);
    if (res.success) {
      toast.success('Tarefa excluída');
      load();
    } else {
      toast.error('Erro ao excluir tarefa');
    }
    load();
  }

  if (loading) return <PageLoading text="Carregando tarefas..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="TAREFAS"
        description="Gestão de tarefas e atividades"
        actionLabel="Nova Tarefa"
        onAction={() => setDialogOpen(true)}
      />

      {/* Stats */}
      <StatsGrid cols={4}>
        <StatsCard label="Total" value={stats?.total || 0} icon={CheckSquare} />
        <StatsCard label="Pendentes" value={stats?.pendentes || 0} color="text-yellow-400" />
        <StatsCard label="Em Andamento" value={stats?.em_andamento || 0} color="text-blue-400" />
        <StatsCard label="Concluídas" value={stats?.concluidas || 0} color="text-green-400" />
      </StatsGrid>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-3">
        {STATUS_COLS.map((col) => {
          const ColIcon = col.icon;
          const colTarefas = tarefas.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`rounded-lg border ${col.border} bg-[#0a0a0a] p-4`}>
              <div className="mb-4 flex items-center gap-2">
                <ColIcon className={`h-4 w-4 ${col.color}`} />
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                  {colTarefas.length}
                </span>
              </div>

              <div className="space-y-2">
                {colTarefas.map((tarefa) => {
                  const pCfg = PRIORIDADE_CONFIG[tarefa.prioridade] || PRIORIDADE_CONFIG.media;
                  return (
                    <div
                      key={tarefa.id}
                      className="rounded-lg border border-white/5 bg-[#111] p-3 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-white leading-tight">{tarefa.titulo}</p>
                        <button
                          onClick={() => handleDelete(tarefa.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {tarefa.descricao && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tarefa.descricao}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${pCfg.color}`}>
                          <Flag className="h-2.5 w-2.5" /> {pCfg.label}
                        </span>
                        {col.key !== 'concluida' && (
                          <select
                            value={tarefa.status}
                            onChange={(e) => handleStatusChange(tarefa.id, e.target.value)}
                            className="rounded border border-white/10 bg-transparent px-1.5 py-0.5 text-[10px] text-gray-400 focus:border-[#D4AF37]/50 focus:outline-none"
                          >
                            <option value="pendente" className="bg-[#0a0a0a]">Pendente</option>
                            <option value="em_andamento" className="bg-[#0a0a0a]">Em Andamento</option>
                            <option value="concluida" className="bg-[#0a0a0a]">Concluída</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTarefas.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-600">Nenhuma tarefa</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <TarefaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
      />
    </div>
  );
}
