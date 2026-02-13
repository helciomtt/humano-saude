'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Sparkles,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmStats } from '@/app/actions/corretor-crm';

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'white',
  prefix,
  suffix,
  delay = 0,
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'white' | 'gold' | 'green' | 'blue' | 'red' | 'purple';
  prefix?: string;
  suffix?: string;
  delay?: number;
  highlight?: boolean;
}) {
  const colorMap = {
    white: { bg: 'bg-white/5', icon: 'text-white/60', text: 'text-white' },
    gold: { bg: 'bg-[#D4AF37]/10', icon: 'text-[#D4AF37]', text: 'text-[#D4AF37]' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', text: 'text-green-400' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', text: 'text-blue-400' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', text: 'text-red-400' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', text: 'text-purple-400' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-2xl border backdrop-blur-xl p-4 relative overflow-hidden transition-colors',
        highlight
          ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5'
          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15',
      )}
    >
      {highlight && (
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      )}
      <div className="flex items-start justify-between mb-2">
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('h-4 w-4', c.icon)} />
        </div>
      </div>
      <p className={cn('text-2xl font-bold tracking-tight', c.text)}>
        {prefix}{value}{suffix}
      </p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </motion.div>
  );
}

export default function CrmStatsCards({
  stats,
  loading,
}: {
  stats: CrmStats | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[110px] rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Total de Leads"
        value={stats.totalLeads}
        icon={Users}
        color="white"
        delay={0}
      />
      <StatCard
        label="Leads Quentes"
        value={stats.leadsHot}
        icon={Sparkles}
        color="gold"
        delay={0.05}
        highlight={stats.leadsHot > 0}
      />
      <StatCard
        label="Precisam Atenção"
        value={stats.leadsStale}
        icon={AlertTriangle}
        color="red"
        delay={0.1}
      />
      <StatCard
        label="Taxa de Conversão"
        value={stats.taxaConversao}
        icon={Target}
        color="green"
        suffix="%"
        delay={0.15}
      />
      <StatCard
        label="Pipeline"
        value={stats.valorTotalPipeline.toLocaleString('pt-BR')}
        icon={DollarSign}
        color="blue"
        prefix="R$ "
        delay={0.2}
      />
      <StatCard
        label="Interações (7d)"
        value={stats.interacoesUltimos7d}
        icon={Zap}
        color="purple"
        delay={0.25}
      />
    </div>
  );
}
