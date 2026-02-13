'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  FileText,
  CheckCircle,
  Clock,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComissoes } from '../hooks/useCorretorData';
import { GRADE_COMISSAO } from '@/lib/types/corretor';

export default function FinanceiroPanel({ corretorId }: { corretorId: string }) {
  const { comissoes, resumo, loading } = useComissoes(corretorId);
  const [filtroStatus, setFiltroStatus] = useState<string>('');

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-[#D4AF37]" />
          Painel de Produção
        </h2>
        <p className="text-sm text-white/50">Comissões e faturamento em tempo real</p>
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <span className="text-xs text-white/50">Total Recebido</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            R$ {(resumo?.total_recebido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <span className="text-xs text-white/50">Pendente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            R$ {(resumo?.total_pendente ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <span className="text-xs text-white/50">Mês Atual</span>
          </div>
          <p className="text-2xl font-bold text-[#D4AF37]">
            R$ {(resumo?.total_mes_atual ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-xs text-white/50">Propostas Ativas</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {resumo?.quantidade_propostas_ativas ?? 0}
          </p>
        </motion.div>
      </div>

      {/* Grade de Comissionamento */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-[#D4AF37]" />
          Grade de Comissionamento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GRADE_COMISSAO.map((grade) => (
            <div
              key={grade.faixa}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                borderColor: `${grade.cor}33`,
                background: `${grade.cor}0D`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: grade.cor }}
                />
                <span className="text-lg font-bold text-white">{grade.faixa}</span>
              </div>
              <p className="text-xs text-white/50">{grade.descricao}</p>
              <p className="text-sm font-medium mt-2" style={{ color: grade.cor }}>
                {grade.percentual}% do valor base
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { label: 'Todos', value: '' },
          { label: 'Pendente', value: 'pendente' },
          { label: 'Pago', value: 'paga' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroStatus(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filtroStatus === f.value
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                : 'bg-white/5 text-white/50 hover:text-white/70',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Comissões (Extrato) */}
      <div className="space-y-2">
        {comissoes
          .filter((c) => !filtroStatus || c.status === filtroStatus)
          .map((comissao, index) => (
            <motion.div
              key={comissao.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  comissao.status === 'paga' ? 'bg-green-500/10' : 'bg-yellow-500/10',
                )}>
                  {comissao.status === 'paga' ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Ref: {new Date(comissao.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-white/40">
                    {comissao.percentual}% · {comissao.forma_pagamento ?? 'A definir'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={cn(
                  'text-sm font-bold',
                  comissao.status === 'paga' ? 'text-green-400' : 'text-yellow-400',
                )}>
                  R$ {comissao.valor_comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {comissao.comprovante_url && (
                  <a
                    href={comissao.comprovante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mt-1"
                  >
                    <Download className="h-3 w-3" />
                    Comprovante
                  </a>
                )}
              </div>
            </motion.div>
          ))}

        {comissoes.length === 0 && (
          <div className="py-12 flex flex-col items-center text-white/20">
            <Receipt className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhuma comissão registrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
