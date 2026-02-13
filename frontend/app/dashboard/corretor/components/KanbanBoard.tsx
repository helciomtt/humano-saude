'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Clock,
  AlertTriangle,
  Star,
  MoreVertical,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  UserPlus,
  CheckCircle,
  Send,
  FileText,
  Trophy,
  XCircle,
  X,
  DollarSign,
  Building2,
  Users,
  Tag,
  Flag,
  StickyNote,
  Search,
  Filter,
  Flame,
  SlidersHorizontal,
  MapPin,
  TrendingUp,
  HeartHandshake,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmCardEnriched, KanbanColumnSlug, KanbanBoard } from '@/lib/types/corretor';
import { useKanban } from '../hooks/useKanban';
import { createLeadWithCard } from '@/app/actions/corretor-crm';
import { toast } from 'sonner';

// Official WhatsApp SVG icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// ========================================
// COLUMN CONFIG
// ========================================

const COLUMN_CONFIG: Record<KanbanColumnSlug, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  novo_lead: {
    label: 'Novo Lead',
    icon: UserPlus,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  qualificado: {
    label: 'Qualificado',
    icon: CheckCircle,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  proposta_enviada: {
    label: 'Proposta Enviada',
    icon: Send,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  documentacao: {
    label: 'Documentação',
    icon: FileText,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  fechado: {
    label: 'Fechado',
    icon: Trophy,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  perdido: {
    label: 'Perdido',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
};

// ========================================
// KANBAN CARD
// ========================================

function KanbanCard({
  card,
  onClick,
  columnSlug,
}: {
  card: CrmCardEnriched;
  onClick: () => void;
  columnSlug: KanbanColumnSlug;
}) {
  // Brilho dourado para leads quentes (interação com proposta <24h)
  const isHot = card.is_hot;
  // Badge de urgência para leads parados >48h
  const isStale = card.is_stale && card.coluna_slug !== 'fechado' && card.coluna_slug !== 'perdido';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ cardId: card.id, sourceColumn: columnSlug }),
        );
      }}
      onClick={onClick}
      className={cn(
        'group rounded-xl p-4 cursor-pointer transition-all duration-300 relative',
        'bg-white/[0.03] border backdrop-blur-sm',
        'hover:bg-white/[0.06] hover:border-white/15',
        isHot
          ? 'border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]'
          : 'border-white/[0.08]',
      )}
    >
      {/* Gold shimmer para leads quentes */}
      {isHot && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
        </div>
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-white/20 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <h4 className="text-sm font-medium text-white truncate">{card.titulo}</h4>
          </div>

          {/* Score badge */}
          {card.score > 0 && (
            <div className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
              card.score >= 70
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black'
                : card.score >= 40
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-white/10 text-white/60',
            )}>
              <Star className="h-2.5 w-2.5" />
              {card.score}
            </div>
          )}
        </div>

        {/* Subtítulo / Lead info */}
        {card.lead && (
          <p className="text-xs text-white/40 mb-3 truncate">
            {card.lead.operadora_atual && `${card.lead.operadora_atual} · `}
            {card.lead.valor_atual && `R$ ${card.lead.valor_atual.toLocaleString('pt-BR')}`}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHot && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
              <Sparkles className="h-2.5 w-2.5" />
              HOT LEAD
            </span>
          )}

          {isStale && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-2.5 w-2.5" />
              ⚠️ Reativar Contato
            </span>
          )}

          {card.valor_estimado && card.valor_estimado > 0 && (
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
              R$ {card.valor_estimado.toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-white/30">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">
              {card.hours_since_update < 1
                ? 'agora'
                : card.hours_since_update < 24
                  ? `${card.hours_since_update}h`
                  : `${Math.floor(card.hours_since_update / 24)}d`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {card.lead?.whatsapp && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://wa.me/${card.lead?.whatsapp?.replace(/\D/g, '')}`, '_blank');
                }}
                className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors"
              >
                <WhatsAppIcon className="h-3 w-3 text-green-400" />
              </button>
            )}
            {card.lead?.email && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${card.lead?.email}`, '_blank');
                }}
                className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
              >
                <Mail className="h-3 w-3 text-blue-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// KANBAN COLUMN
// ========================================

function KanbanColumn({
  slug,
  cards,
  onCardClick,
  onDrop,
  onAddCard,
}: {
  slug: KanbanColumnSlug;
  cards: CrmCardEnriched[];
  onCardClick: (card: CrmCardEnriched) => void;
  onDrop: (cardId: string, sourceColumn: KanbanColumnSlug) => void;
  onAddCard: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = COLUMN_CONFIG[slug];
  const Icon = config.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const { cardId, sourceColumn } = JSON.parse(data) as { cardId: string; sourceColumn: KanbanColumnSlug };
      onDrop(cardId, sourceColumn);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] rounded-2xl transition-all duration-200',
        'bg-white/[0.02] border backdrop-blur-sm',
        isDragOver
          ? `${config.borderColor} ${config.bgColor}`
          : 'border-white/[0.05]',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', config.bgColor)}>
            <Icon className={cn('h-3.5 w-3.5', config.color)} />
          </div>
          <span className="text-sm font-medium text-white">{config.label}</span>
          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
        <button
          onClick={onAddCard}
          className="h-7 w-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
        >
          <Plus className="h-4 w-4 text-white/40" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] sidebar-scroll">
        <AnimatePresence>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
              columnSlug={slug}
            />
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="py-8 flex flex-col items-center justify-center text-white/20">
            <Icon className="h-8 w-8 mb-2" />
            <p className="text-xs">Nenhum lead</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// NEW LEAD MODAL — Formulário completo
// ========================================

const OPERADORAS = [
  'Bradesco Saúde', 'SulAmérica', 'Amil', 'Unimed', 'NotreDame Intermédica',
  'Hapvida', 'Porto Seguro Saúde', 'Prevent Senior', 'São Cristóvão',
  'Golden Cross', 'MedSênior', 'Care Plus', 'Assim Saúde', 'Outro',
];

const TIPOS_CONTRATACAO = [
  { value: 'pme', label: 'PME (Empresarial)' },
  { value: 'adesao', label: 'Adesão' },
  { value: 'individual', label: 'Individual' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'coletivo', label: 'Coletivo por Adesão' },
];

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'media', label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'alta', label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10' },
];

type NewLeadForm = {
  nome: string;
  whatsapp: string;
  email: string;
  operadora_atual: string;
  valor_atual: string;
  tipo_contratacao: string;
  idades: string;
  observacoes: string;
  valor_estimado: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  tags: string;
  origem: string;
};

const EMPTY_FORM: NewLeadForm = {
  nome: '',
  whatsapp: '',
  email: '',
  operadora_atual: '',
  valor_atual: '',
  tipo_contratacao: '',
  idades: '',
  observacoes: '',
  valor_estimado: '',
  prioridade: 'media',
  tags: '',
  origem: 'corretor_crm',
};

const ORIGENS_LEAD = [
  { value: 'corretor_crm', label: 'Manual (CRM)' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'meta_ads', label: 'Meta Ads (Facebook/Instagram)' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'site', label: 'Website' },
  { value: 'scanner_pdf', label: 'Scanner PDF' },
  { value: 'outro', label: 'Outro' },
];

function NewLeadModal({
  isOpen,
  onClose,
  corretorId,
  colunaSlug,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  corretorId: string;
  colunaSlug: KanbanColumnSlug;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<NewLeadForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const update = (field: keyof NewLeadForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.whatsapp.trim()) { toast.error('WhatsApp é obrigatório'); return; }

    // Validar formato WhatsApp
    const phone = form.whatsapp.replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 15) {
      toast.error('WhatsApp inválido. Use formato: 11999998888');
      return;
    }

    setSaving(true);
    const result = await createLeadWithCard({
      corretor_id: corretorId,
      coluna_slug: colunaSlug,
      nome: form.nome.trim(),
      whatsapp: phone.startsWith('55') ? `+${phone}` : `+55${phone}`,
      email: form.email.trim() || null,
      operadora_atual: form.operadora_atual || null,
      valor_atual: form.valor_atual ? parseFloat(form.valor_atual) : null,
      tipo_contratacao: form.tipo_contratacao || null,
      idades: form.idades
        ? form.idades.split(',').map((a) => parseInt(a.trim(), 10)).filter((n) => !isNaN(n))
        : [],
      observacoes: form.observacoes.trim() || null,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
      prioridade: form.prioridade,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      origem: form.origem || 'corretor_crm',
    });

    setSaving(false);
    if (result.success) {
      toast.success(`Lead "${form.nome}" criado com sucesso!`);
      setForm({ ...EMPTY_FORM });
      onClose();
      onSuccess();
    } else {
      toast.error(result.error ?? 'Erro ao criar lead');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all';
  const labelClass = 'block text-xs font-medium text-white/50 mb-1.5';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-[#0A0A0A]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#D4AF37]" />
              Novo Lead
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Adicionando em <span className="text-[#D4AF37] font-medium">{COLUMN_CONFIG[colunaSlug]?.label}</span>
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seção: Dados pessoais */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[#D4AF37]/80 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Dados do Lead
            </h3>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome completo *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => update('nome', e.target.value)}
                placeholder="João da Silva"
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>WhatsApp *</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                placeholder="(11) 99999-8888"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="joao@email.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Seção: Origem */}
          <div className="space-y-1 pt-2">
            <h3 className="text-xs font-semibold text-[#D4AF37]/80 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Origem do Lead
            </h3>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Como chegou até você?</label>
              <select
                value={form.origem}
                onChange={(e) => update('origem', e.target.value)}
                className={inputClass}
              >
                {ORIGENS_LEAD.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0A0A0A]">{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção: Plano atual */}
          <div className="space-y-1 pt-2">
            <h3 className="text-xs font-semibold text-[#D4AF37]/80 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Plano Atual
            </h3>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Operadora atual</label>
              <select
                value={form.operadora_atual}
                onChange={(e) => update('operadora_atual', e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-[#0A0A0A]">Selecione...</option>
                {OPERADORAS.map((op) => (
                  <option key={op} value={op} className="bg-[#0A0A0A]">{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Valor atual (R$/mês)</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_atual}
                onChange={(e) => update('valor_atual', e.target.value)}
                placeholder="1.200,00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo de contratação</label>
              <select
                value={form.tipo_contratacao}
                onChange={(e) => update('tipo_contratacao', e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-[#0A0A0A]">Selecione...</option>
                {TIPOS_CONTRATACAO.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#0A0A0A]">{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Idades dos beneficiários</label>
              <input
                type="text"
                value={form.idades}
                onChange={(e) => update('idades', e.target.value)}
                placeholder="35, 33, 8, 5"
                className={inputClass}
              />
              <p className="text-[10px] text-white/20 mt-1">Separe por vírgula</p>
            </div>
          </div>

          {/* Seção: Negócio */}
          <div className="space-y-1 pt-2">
            <h3 className="text-xs font-semibold text-[#D4AF37]/80 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Negócio
            </h3>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor estimado do deal (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_estimado}
                onChange={(e) => update('valor_estimado', e.target.value)}
                placeholder="15.000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <div className="flex gap-2">
                {PRIORIDADES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update('prioridade', p.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                      form.prioridade === p.value
                        ? `${p.bg} ${p.color} border-current`
                        : 'border-white/5 text-white/30 hover:border-white/10',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => update('tags', e.target.value)}
                placeholder="plano-familia, urgente, indicação"
                className={inputClass}
              />
              <p className="text-[10px] text-white/20 mt-1">Separe por vírgula</p>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => update('observacoes', e.target.value)}
              placeholder="Quer migrar de plano, insatisfeito com carência..."
              rows={3}
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
                saving
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20',
              )}
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? 'Criando...' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ========================================
// KANBAN BOARD (MAIN EXPORT)
// ========================================

export default function KanbanBoard({ corretorId }: { corretorId: string }) {
  const router = useRouter();
  const {
    board,
    loading,
    handleMoveCard,
    fetchBoard,
  } = useKanban(corretorId);

  const [addingTo, setAddingTo] = useState<KanbanColumnSlug | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterHot, setFilterHot] = useState(false);
  const [filterStale, setFilterStale] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedFunnel, setSelectedFunnel] = useState('vendas');

  const navigateToLead = (card: CrmCardEnriched) => {
    router.push(`/dashboard/corretor/crm/lead/${card.id}`);
  };

  // Filter cards
  const filterCards = useCallback((cards: CrmCardEnriched[]): CrmCardEnriched[] => {
    return cards.filter((card) => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitle = card.titulo?.toLowerCase().includes(term);
        const matchName = card.lead?.nome?.toLowerCase().includes(term);
        const matchEmail = card.lead?.email?.toLowerCase().includes(term);
        const matchPhone = card.lead?.whatsapp?.includes(term);
        const matchTag = card.tags?.some((t) => t.toLowerCase().includes(term));
        if (!matchTitle && !matchName && !matchEmail && !matchPhone && !matchTag) return false;
      }
      // Priority
      if (filterPriority !== 'all' && card.prioridade !== filterPriority) return false;
      // Hot
      if (filterHot && !card.is_hot) return false;
      // Stale
      if (filterStale && !card.is_stale) return false;
      return true;
    });
  }, [searchTerm, filterPriority, filterHot, filterStale]);

  const hasActiveFilters = searchTerm || filterPriority !== 'all' || filterHot || filterStale;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPriority('all');
    setFilterHot(false);
    setFilterStale(false);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="min-w-[280px] h-96 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!board) return null;

  const columns: KanbanColumnSlug[] = [
    'novo_lead',
    'qualificado',
    'proposta_enviada',
    'documentacao',
    'fechado',
    'perdido',
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              Pipeline CRM
            </h2>
            <p className="text-sm text-white/50">Arraste os cards entre as colunas</p>
          </div>
          {/* Funnel Selector */}
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
            {[
              { value: 'vendas', label: 'Vendas', icon: TrendingUp, color: '#D4AF37' },
              { value: 'pos_venda', label: 'Pós-Venda', icon: HeartHandshake, color: '#8B5CF6' },
              { value: 'renovacao', label: 'Renovação', icon: RefreshCw, color: '#06B6D4' },
            ].map((f) => {
              const FIcon = f.icon;
              const isActive = selectedFunnel === f.value;
              return (
                <button key={f.value} onClick={() => setSelectedFunnel(f.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
                  )}
                  style={isActive ? { backgroundColor: `${f.color}18`, color: f.color, border: `1px solid ${f.color}30` } : { border: '1px solid transparent' }}>
                  <FIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
              hasActiveFilters
                ? 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]'
                : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/70',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
          </button>
          <button
            onClick={() => setAddingTo('novo_lead')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black text-sm font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl relative">
              {/* Close button */}
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-2 right-2 p-1 hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/30" />
              </button>
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, telefone, tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                />
              </div>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm cursor-pointer"
              >
                <option value="all">Todas Prioridades</option>
                <option value="urgente">🔴 Urgente</option>
                <option value="alta">🟠 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>

              {/* Hot filter */}
              <button
                onClick={() => setFilterHot(!filterHot)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                  filterHot
                    ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60',
                )}
              >
                <Flame className="w-3.5 h-3.5" />
                Hot Leads
              </button>

              {/* Stale filter */}
              <button
                onClick={() => setFilterStale(!filterStale)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                  filterStale
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60',
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Parados
              </button>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((slug) => (
          <KanbanColumn
            key={slug}
            slug={slug}
            cards={filterCards(board[slug] ?? [])}
            onCardClick={navigateToLead}
            onDrop={(cardId, sourceColumn) => {
              handleMoveCard(cardId, sourceColumn, slug, board[slug]?.length ?? 0);
            }}
            onAddCard={() => setAddingTo(slug)}
          />
        ))}
      </div>

      {/* Modal de Criação Completo */}
      <AnimatePresence>
        {addingTo && (
          <NewLeadModal
            isOpen={!!addingTo}
            onClose={() => setAddingTo(null)}
            corretorId={corretorId}
            colunaSlug={addingTo}
            onSuccess={fetchBoard}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
