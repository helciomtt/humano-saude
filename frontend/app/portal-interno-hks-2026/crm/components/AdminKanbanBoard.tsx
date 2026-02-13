'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, GripVertical, Clock, AlertTriangle, Star, Phone, Mail,
  Sparkles, UserPlus, CheckCircle, Send, FileText, Trophy, XCircle,
  MessageSquare, Building2, User, MoreHorizontal, DollarSign,
  ArrowRight, Calendar, Filter, Search, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmDealEnriched, CrmStageWithMetrics, AdminKanbanBoard, CrmPipeline } from '@/lib/types/crm';
import type { CrmDealPriority } from '@/lib/types/crm';

// ========================================
// ICONS POR STAGE (mapeamento dinâmico)
// ========================================

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus, CheckCircle, Send, MessageSquare, FileText, Trophy, XCircle,
  Circle: ({ className }: { className?: string }) => (
    <div className={cn('rounded-full bg-current h-3 w-3', className)} />
  ),
};

function getStageIcon(iconName: string | null): React.ComponentType<{ className?: string }> {
  return (iconName && STAGE_ICONS[iconName]) || STAGE_ICONS.Circle;
}

// ========================================
// PRIORITY CONFIG
// ========================================

const PRIORITY_CONFIG: Record<CrmDealPriority, { label: string; color: string; dot: string }> = {
  baixa: { label: 'Baixa', color: 'text-white/40', dot: 'bg-white/20' },
  media: { label: 'Média', color: 'text-blue-400', dot: 'bg-blue-400' },
  alta: { label: 'Alta', color: 'text-orange-400', dot: 'bg-orange-400' },
  urgente: { label: 'Urgente', color: 'text-red-400', dot: 'bg-red-400' },
};

// ========================================
// DEAL CARD
// ========================================

function DealCard({
  deal,
  onClick,
  stageId,
}: {
  deal: CrmDealEnriched;
  onClick: () => void;
  stageId: string;
}) {
  const priority = PRIORITY_CONFIG[deal.prioridade];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => {
        const evt = e as unknown as React.DragEvent;
        evt.dataTransfer?.setData(
          'application/json',
          JSON.stringify({ dealId: deal.id, sourceStageId: stageId }),
        );
      }}
      onClick={onClick}
      className={cn(
        'group rounded-xl p-4 cursor-pointer transition-all duration-300 relative',
        'bg-white/[0.03] border backdrop-blur-sm',
        'hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg',
        deal.is_hot
          ? 'border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
          : 'border-white/[0.08]',
      )}
    >
      {/* Gold shimmer HOT */}
      {deal.is_hot && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
        </div>
      )}

      <div className="relative space-y-3">
        {/* Header: Titulo + Score */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-white/20 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-white truncate">{deal.titulo}</h4>
              {deal.contact && (
                <p className="text-xs text-white/40 truncate flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {deal.contact.nome} {deal.contact.sobrenome ?? ''}
                </p>
              )}
            </div>
          </div>

          {deal.score > 0 && (
            <div className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0',
              deal.score >= 70
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black'
                : deal.score >= 40
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-white/10 text-white/60',
            )}>
              <Star className="h-2.5 w-2.5" />
              {deal.score}
            </div>
          )}
        </div>

        {/* Company */}
        {deal.company && (
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{deal.company.nome}</span>
          </div>
        )}

        {/* Valor + Prioridade */}
        <div className="flex items-center gap-2 flex-wrap">
          {deal.valor != null && deal.valor > 0 && (
            <span className="flex items-center gap-1 text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full font-medium">
              <DollarSign className="h-3 w-3" />
              R$ {deal.valor.toLocaleString('pt-BR')}
            </span>
          )}

          {deal.valor_recorrente != null && deal.valor_recorrente > 0 && (
            <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              R$ {deal.valor_recorrente.toLocaleString('pt-BR')}/mês
            </span>
          )}

          <span className={cn('flex items-center gap-1 text-[10px]', priority.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
            {priority.label}
          </span>
        </div>

        {/* Badges: HOT, STALE */}
        <div className="flex items-center gap-2 flex-wrap">
          {deal.is_hot && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
              <Sparkles className="h-2.5 w-2.5" />
              HOT
            </span>
          )}
          {deal.is_stale && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-2.5 w-2.5" />
              Sem atividade
            </span>
          )}
          {deal.data_previsao_fechamento && (
            <span className="flex items-center gap-1 text-[10px] text-white/30">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(deal.data_previsao_fechamento).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        {/* Footer: Owner + Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            {deal.owner && (
              <div className="flex items-center gap-1.5">
                {deal.owner.foto_url ? (
                  <img src={deal.owner.foto_url} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <User className="h-3 w-3 text-[#D4AF37]" />
                  </div>
                )}
                <span className="text-[10px] text-white/40 truncate max-w-[80px]">{deal.owner.nome}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {deal.contact?.whatsapp && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://wa.me/${deal.contact?.whatsapp?.replace(/\D/g, '')}`, '_blank');
                }}
                className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors"
              >
                <Phone className="h-3 w-3 text-green-400" />
              </button>
            )}
            {deal.contact?.email && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${deal.contact?.email}`, '_blank');
                }}
                className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
              >
                <Mail className="h-3 w-3 text-blue-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// STAGE COLUMN
// ========================================

function StageColumn({
  stage,
  deals,
  onDealClick,
  onDrop,
  onAddDeal,
}: {
  stage: CrmStageWithMetrics;
  deals: CrmDealEnriched[];
  onDealClick: (deal: CrmDealEnriched) => void;
  onDrop: (dealId: string, sourceStageId: string) => void;
  onAddDeal: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = getStageIcon(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/json');
    if (raw) {
      const { dealId, sourceStageId } = JSON.parse(raw) as { dealId: string; sourceStageId: string };
      onDrop(dealId, sourceStageId);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col min-w-[300px] max-w-[340px] rounded-2xl transition-all duration-200',
        'bg-white/[0.02] border backdrop-blur-sm',
        isDragOver ? 'border-white/20 bg-white/[0.04]' : 'border-white/[0.05]',
      )}
      style={isDragOver ? { borderColor: `${stage.cor}40` } : {}}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stage.cor}20` }}>
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.cor }} />
            </div>
            <span className="text-sm font-medium text-white">{stage.nome}</span>
            <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
              {stage.total_deals}
            </span>
          </div>
          <button
            onClick={onAddDeal}
            className="h-7 w-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <Plus className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* Stage Metrics */}
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span>R$ {(stage.valor_total ?? 0).toLocaleString('pt-BR')}</span>
          <span>·</span>
          <span>{stage.probabilidade}% prob.</span>
          {stage.deals_hot > 0 && (
            <>
              <span>·</span>
              <span className="text-[#D4AF37]">🔥 {stage.deals_hot}</span>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] sidebar-scroll">
        <AnimatePresence>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
              stageId={stage.id}
            />
          ))}
        </AnimatePresence>

        {deals.length === 0 && (
          <div className="py-8 flex flex-col items-center justify-center text-white/20">
            <Icon className="h-8 w-8 mb-2" />
            <p className="text-xs">Nenhum deal</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// ADMIN KANBAN BOARD (MAIN EXPORT)
// ========================================

export default function AdminKanbanBoard({
  board,
  loading,
  pipelines,
  activePipelineId,
  onPipelineChange,
  onMoveDeal,
  onDealClick,
  onAddDeal,
  corretorId,
}: {
  board: AdminKanbanBoard | null;
  loading: boolean;
  pipelines: CrmPipeline[];
  activePipelineId: string;
  onPipelineChange: (id: string) => void;
  onMoveDeal: (dealId: string, sourceStageId: string, destStageId: string, pos: number, corretorId: string) => void;
  onDealClick: (deal: CrmDealEnriched) => void;
  onAddDeal: (stageId: string) => void;
  corretorId: string;
}) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="min-w-[300px] h-[500px] rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="space-y-4">
      {/* Pipeline Selector */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-3">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => onPipelineChange(p.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                p.id === activePipelineId
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20',
              )}
            >
              {p.nome}
            </button>
          ))}
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={board.dealsByStage[stage.id] ?? []}
            onDealClick={onDealClick}
            onDrop={(dealId, sourceStageId) => {
              onMoveDeal(
                dealId,
                sourceStageId,
                stage.id,
                board.dealsByStage[stage.id]?.length ?? 0,
                corretorId,
              );
            }}
            onAddDeal={() => onAddDeal(stage.id)}
          />
        ))}
      </div>

      {/* Forecast Bar */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Forecast do Pipeline</h3>
          <span className="text-sm font-bold text-[#D4AF37]">
            R$ {board.stages.reduce((acc, s) => acc + (s.valor_total * s.probabilidade / 100), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
          {board.stages
            .filter((s) => !s.is_lost && s.total_deals > 0)
            .map((s) => {
              const totalValue = board.stages.reduce((acc, st) => acc + (st.is_lost ? 0 : st.valor_total), 0);
              const pct = totalValue > 0 ? (s.valor_total / totalValue) * 100 : 0;
              return (
                <div
                  key={s.id}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: s.cor }}
                  title={`${s.nome}: R$ ${s.valor_total.toLocaleString('pt-BR')} (${s.probabilidade}%)`}
                />
              );
            })}
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {board.stages.filter((s) => !s.is_lost).map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-[10px] text-white/40">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor }} />
              {s.nome}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
