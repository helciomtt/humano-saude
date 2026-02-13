'use client';

import { motion } from 'framer-motion';
import {
  TrendingDown,
  ArrowRight,
  Target,
  Trophy,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmStats } from '@/app/actions/corretor-crm';

// Funil visual estilo profissional
function FunnelBar({
  label,
  value,
  maxValue,
  color,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  delay: number;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-4"
    >
      <span className="text-xs text-white/50 w-28 text-right truncate">{label}</span>
      <div className="flex-1 h-8 rounded-lg bg-white/[0.03] overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          className="h-full rounded-lg flex items-center px-3 min-w-[40px]"
          style={{ backgroundColor: color + '33' }}
        >
          <span className="text-xs font-bold" style={{ color }}>{value}</span>
        </motion.div>
      </div>
      <span className="text-[10px] text-white/30 w-12 text-right">{pct.toFixed(0)}%</span>
    </motion.div>
  );
}

// Score Distribution Chart
function ScoreChart({ data }: { data: { faixa: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const colors = ['#666', '#F59E0B', '#D4AF37', '#10B981'];

  return (
    <div className="flex items-end gap-3 h-32 px-4">
      {data.map((item, i) => {
        const height = (item.count / maxCount) * 100;
        return (
          <div key={item.faixa} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold" style={{ color: colors[i] }}>{item.count}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="w-full rounded-t-lg"
              style={{ backgroundColor: colors[i] + '40' }}
            />
            <span className="text-[9px] text-white/30 text-center whitespace-nowrap">{item.faixa}</span>
          </div>
        );
      })}
    </div>
  );
}

// Card de Conversão
function ConversionCard({
  from,
  to,
  fromCount,
  toCount,
  color,
  delay,
}: {
  from: string;
  to: string;
  fromCount: number;
  toCount: number;
  color: string;
  delay: number;
}) {
  const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(0) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
    >
      <div className="text-xs text-white/50">{from}</div>
      <ArrowRight className="h-3 w-3 text-white/20 flex-shrink-0" />
      <div className="text-xs text-white/50">{to}</div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-lg font-bold" style={{ color }}>{rate}%</span>
        <span className="text-[10px] text-white/30">{toCount}/{fromCount}</span>
      </div>
    </motion.div>
  );
}

export default function FunnelChart({
  stats,
  loading,
}: {
  stats: CrmStats | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        <div className="h-80 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
      </div>
    );
  }

  const maxFunnel = Math.max(...stats.funil.map((f) => f.total), 1);

  const convPairs = [
    { from: 'Novo Lead', to: 'Qualificado', fromKey: 'novo_lead', toKey: 'qualificado', color: '#8B5CF6' },
    { from: 'Qualificado', to: 'Proposta', fromKey: 'qualificado', toKey: 'proposta_enviada', color: '#F59E0B' },
    { from: 'Proposta', to: 'Documentação', fromKey: 'proposta_enviada', toKey: 'documentacao', color: '#06B6D4' },
    { from: 'Documentação', to: 'Fechado', fromKey: 'documentacao', toKey: 'fechado', color: '#10B981' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Funil de Vendas */}
      <div className="lg:col-span-1 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Funil de Vendas</h3>
            <p className="text-[10px] text-white/30">Distribuição por etapa</p>
          </div>
        </div>
        <div className="space-y-3">
          {stats.funil.map((item, i) => (
            <FunnelBar
              key={item.etapa}
              label={item.etapa}
              value={item.total}
              maxValue={maxFunnel}
              color={item.cor}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>

      {/* Taxas de Conversão */}
      <div className="lg:col-span-1 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Taxas de Conversão</h3>
            <p className="text-[10px] text-white/30">Entre cada etapa do funil</p>
          </div>
        </div>
        <div className="space-y-2">
          {convPairs.map((pair, i) => (
            <ConversionCard
              key={pair.fromKey}
              from={pair.from}
              to={pair.to}
              fromCount={stats.porColuna[pair.fromKey as keyof typeof stats.porColuna] ?? 0}
              toCount={stats.porColuna[pair.toKey as keyof typeof stats.porColuna] ?? 0}
              color={pair.color}
              delay={i * 0.1}
            />
          ))}

          {/* Big conversion */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs text-white/60">Conversão Geral</span>
              </div>
              <span className="text-xl font-bold text-[#D4AF37]">{stats.taxaConversao}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="lg:col-span-1 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Distribuição de Score</h3>
            <p className="text-[10px] text-white/30">Lead Scoring automático</p>
          </div>
        </div>
        <ScoreChart data={stats.scoreDistribuicao} />

        {/* Resumo abaixo */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="p-3 rounded-xl bg-white/[0.02] text-center">
            <p className="text-lg font-bold text-[#D4AF37]">
              R$ {stats.valorFechado.toLocaleString('pt-BR')}
            </p>
            <p className="text-[10px] text-white/30">Valor Fechado</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] text-center">
            <p className="text-lg font-bold text-blue-400">
              R$ {stats.valorTotalPipeline.toLocaleString('pt-BR')}
            </p>
            <p className="text-[10px] text-white/30">Pipeline Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
