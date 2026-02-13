'use client';

import { useState, useEffect } from 'react';
import { Bot, Zap, Clock, CheckCircle, Play, Pause, Settings, ArrowRight, MessageSquare, Mail, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAutomacoes, toggleAutomacao, type Automacao } from '@/app/actions/automacoes';

const actionIcons: Record<string, typeof MessageSquare> = {
  WhatsApp: MessageSquare,
  Email: Mail,
  Notificação: Bell,
  Tarefa: CheckCircle,
};

export default function AutomacaoPage() {
  const [automations, setAutomations] = useState<Automacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAutomacoes().then((data) => {
      setAutomations(data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, currentState: boolean) => {
    // Optimistic update
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ativa: !currentState } : a))
    );
    const result = await toggleAutomacao(id, !currentState);
    if (!result.success) {
      // Revert
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ativa: currentState } : a))
      );
      toast.error('Erro ao alterar automação');
    }
  };

  const activeCount = automations.filter((a) => a.ativa).length;
  const totalExecutions = automations.reduce((sum, a) => sum + a.execucoes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          AUTOMAÇÃO IA
        </h1>
        <p className="mt-2 text-gray-400">Workflows inteligentes para automatizar processos</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <Bot className="h-6 w-6 text-[#D4AF37] mb-3" />
          <p className="text-2xl font-bold text-white">{automations.length}</p>
          <p className="text-sm text-gray-400">Automações</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <Zap className="h-6 w-6 text-green-400 mb-3" />
          <p className="text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-sm text-gray-400">Ativas</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <CheckCircle className="h-6 w-6 text-blue-400 mb-3" />
          <p className="text-2xl font-bold text-white">{totalExecutions}</p>
          <p className="text-sm text-gray-400">Execuções Totais</p>
        </div>
      </div>

      {/* Automações */}
      <div className="space-y-4">
        {automations.map((auto) => (
          <div
            key={auto.id}
            className={`rounded-lg border bg-[#0a0a0a] p-6 transition-all ${
              auto.ativa ? 'border-[#D4AF37]/30' : 'border-white/10 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${auto.ativa ? 'bg-[#D4AF37]/10' : 'bg-white/5'}`}>
                  <Bot className={`h-5 w-5 ${auto.ativa ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{auto.nome}</h3>
                  <p className="text-sm text-gray-400">{auto.descricao}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(auto.id, auto.ativa)}
                className={`rounded-full p-2 transition-colors ${
                  auto.ativa ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {auto.ativa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>

            {/* Trigger → Actions Flow */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> {auto.trigger_evento}
              </div>
              <ArrowRight className="h-4 w-4 text-gray-600" />
              {auto.acoes.map((acao: string, i: number) => {
                const [type] = acao.split(':');
                const Icon = actionIcons[type.trim()] || Settings;
                return (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#D4AF37]" /> {acao}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {auto.execucoes} execuções</span>
              {auto.ultima_execucao && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Última: {auto.ultima_execucao}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
