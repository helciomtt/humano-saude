'use client';

import {
  Phone, Mail, Calendar, MessageSquare, FileText,
  Send, ClipboardList, MapPin, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type QuickAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
  onClick: () => void;
  disabled?: boolean;
};

export default function QuickActions({
  whatsapp,
  email,
  phone,
  onLogCall,
  onAddNote,
  onCreateTask,
  onScheduleMeeting,
  onSendProposal,
}: {
  whatsapp?: string | null;
  email?: string | null;
  phone?: string | null;
  onLogCall: () => void;
  onAddNote: () => void;
  onCreateTask: () => void;
  onScheduleMeeting: () => void;
  onSendProposal: () => void;
}) {
  const actions: QuickAction[] = [
    {
      icon: MessageSquare,
      label: 'WhatsApp',
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15',
      onClick: () => {
        if (whatsapp) window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank');
      },
      disabled: !whatsapp,
    },
    {
      icon: Phone,
      label: 'Ligação',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15',
      onClick: onLogCall,
    },
    {
      icon: Mail,
      label: 'Email',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15',
      onClick: () => {
        if (email) window.open(`mailto:${email}`, '_blank');
      },
      disabled: !email,
    },
    {
      icon: FileText,
      label: 'Nota',
      color: 'text-white/60',
      bg: 'bg-white/5 border-white/10 hover:bg-white/10',
      onClick: onAddNote,
    },
    {
      icon: ClipboardList,
      label: 'Tarefa',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15',
      onClick: onCreateTask,
    },
    {
      icon: Calendar,
      label: 'Reunião',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15',
      onClick: onScheduleMeeting,
    },
    {
      icon: Send,
      label: 'Proposta',
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20 hover:bg-[#D4AF37]/15',
      onClick: onSendProposal,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.label}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all',
              action.bg,
              action.color,
              action.disabled && 'opacity-30 cursor-not-allowed',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
