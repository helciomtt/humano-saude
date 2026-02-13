'use client';

import { motion } from 'framer-motion';
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  RefreshCw,
  Phone,
  ArrowRight,
  CheckCircle,
  Building2,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRenovacoes } from '../hooks/useCorretorData';
import type { Renovacao } from '@/lib/types/corretor';

function UrgencyBadge({ dias }: { dias: number }) {
  if (dias < 0) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        <AlertTriangle className="h-2.5 w-2.5" />
        Vencido há {Math.abs(dias)}d
      </span>
    );
  }
  if (dias <= 30) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
        <AlertTriangle className="h-2.5 w-2.5" />
        {dias}d restantes
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
      <Clock className="h-2.5 w-2.5" />
      {dias}d restantes
    </span>
  );
}

function RenovacaoCard({
  renovacao,
  onIniciarRenovacao,
  index,
}: {
  renovacao: Renovacao;
  onIniciarRenovacao: (r: Renovacao) => void;
  index: number;
}) {
  const isUrgent = renovacao.dias_para_vencimento <= 30;
  const isOverdue = renovacao.dias_para_vencimento < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'p-4 rounded-2xl border backdrop-blur-sm transition-all hover:border-white/15',
        isOverdue
          ? 'bg-red-500/5 border-red-500/20'
          : isUrgent
            ? 'bg-yellow-500/5 border-yellow-500/20'
            : 'bg-white/[0.03] border-white/[0.08]',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{renovacao.nome_cliente}</h4>
          <div className="flex items-center gap-2 mt-1">
            {renovacao.operadora_nome && (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Building2 className="h-3 w-3" />
                {renovacao.operadora_nome}
              </span>
            )}
          </div>
        </div>
        <UrgencyBadge dias={renovacao.dias_para_vencimento} />
      </div>

      <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
        <span className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {new Date(renovacao.data_vencimento).toLocaleDateString('pt-BR')}
        </span>
        {renovacao.valor_atual && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            R$ {renovacao.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[10px] font-medium px-2 py-0.5 rounded-full',
          renovacao.status === 'pendente' ? 'bg-yellow-500/10 text-yellow-400' :
          renovacao.status === 'contato_feito' ? 'bg-blue-500/10 text-blue-400' :
          renovacao.status === 'negociando' ? 'bg-purple-500/10 text-purple-400' :
          'bg-white/5 text-white/40',
        )}>
          {renovacao.status.replace('_', ' ').toUpperCase()}
        </span>

        <button
          onClick={() => onIniciarRenovacao(renovacao)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black text-xs font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          Iniciar Renovação
        </button>
      </div>
    </motion.div>
  );
}

export default function RenovacoesPanel({ corretorId }: { corretorId: string }) {
  const { renovacoes, vencendo30d, vencendo60d, vencidos, loading } = useRenovacoes(corretorId);

  const handleIniciarRenovacao = (renovacao: Renovacao) => {
    // Redirecionar para simulador com dados pré-preenchidos
    const params = new URLSearchParams({
      nome: renovacao.nome_cliente,
      operadora: renovacao.operadora_nome ?? '',
      valor: String(renovacao.valor_atual ?? ''),
      renovacao_id: renovacao.id,
    });
    window.open(`/dashboard/corretor/crm?renovacao=true&${params.toString()}`, '_self');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[#D4AF37]" />
          Calendário de Renovações
        </h2>
        <p className="text-sm text-white/50">Contratos próximos do vencimento — Gold Mine 💰</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">Vencidos</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{vencidos.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">30 dias</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{vencendo30d.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">60 dias</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{vencendo60d.length}</p>
        </div>
      </div>

      {/* Vencidos */}
      {vencidos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Contratos Vencidos
          </h3>
          <div className="space-y-3">
            {vencidos.map((r, i) => (
              <RenovacaoCard key={r.id} renovacao={r} onIniciarRenovacao={handleIniciarRenovacao} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Vencendo 30d */}
      {vencendo30d.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Vencendo em até 30 dias
          </h3>
          <div className="space-y-3">
            {vencendo30d.map((r, i) => (
              <RenovacaoCard key={r.id} renovacao={r} onIniciarRenovacao={handleIniciarRenovacao} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Vencendo 60d */}
      {vencendo60d.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Vencendo em até 60 dias
          </h3>
          <div className="space-y-3">
            {vencendo60d.map((r, i) => (
              <RenovacaoCard key={r.id} renovacao={r} onIniciarRenovacao={handleIniciarRenovacao} index={i} />
            ))}
          </div>
        </div>
      )}

      {renovacoes.length === 0 && (
        <div className="py-16 flex flex-col items-center text-white/20">
          <CheckCircle className="h-10 w-10 mb-3" />
          <p className="text-sm">Nenhuma renovação pendente</p>
          <p className="text-xs mt-1">Todos os contratos estão em dia 🎉</p>
        </div>
      )}
    </div>
  );
}
