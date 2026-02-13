'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Pin, Trash2, Reply, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmCardComment, CrmCardCommentInsert } from '@/lib/types/corretor';

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`;
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  onTogglePin,
  currentCorretorId,
  depth = 0,
}: {
  comment: CrmCardComment;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  currentCorretorId: string;
  depth?: number;
}) {
  const isOwn = comment.corretor_id === currentCorretorId;

  return (
    <div className={cn('group', depth > 0 && 'ml-8 border-l border-white/5 pl-3')}>
      <div className={cn(
        'flex gap-3 p-3 rounded-lg transition-colors',
        comment.is_pinned ? 'bg-[#D4AF37]/5 border border-[#D4AF37]/10' : 'hover:bg-white/[0.03]',
      )}>
        <div className="flex-shrink-0">
          {comment.corretor_foto ? (
            <img src={comment.corretor_foto} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
              {(comment.corretor_nome ?? 'D').charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white">{comment.corretor_nome ?? 'Desconhecido'}</span>
              <span className="text-[10px] text-white/20">{formatTimestamp(comment.created_at)}</span>
              {comment.is_pinned && <Pin className="h-2.5 w-2.5 text-[#D4AF37]" />}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onReply(comment.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10" title="Responder">
                <Reply className="h-3 w-3 text-white/40" />
              </button>
              <button onClick={() => onTogglePin(comment.id, !comment.is_pinned)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10" title={comment.is_pinned ? 'Desafixar' : 'Fixar'}>
                <Pin className={cn('h-3 w-3', comment.is_pinned ? 'text-[#D4AF37]' : 'text-white/40')} />
              </button>
              {isOwn && (
                <button onClick={() => onDelete(comment.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-500/10" title="Excluir">
                  <Trash2 className="h-3 w-3 text-red-400/60" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-white/60 mt-1 whitespace-pre-wrap">{comment.texto}</p>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              currentCorretorId={currentCorretorId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CardComments({
  comments,
  cardId,
  corretorId,
  onAddComment,
  onDeleteComment,
  onTogglePin,
}: {
  comments: CrmCardComment[];
  cardId: string;
  corretorId: string;
  onAddComment: (input: CrmCardCommentInsert) => Promise<boolean>;
  onDeleteComment: (id: string) => Promise<boolean>;
  onTogglePin: (id: string, pinned: boolean) => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const success = await onAddComment({
      card_id: cardId,
      corretor_id: corretorId,
      texto: text.trim(),
      is_pinned: false,
      parent_id: replyingTo,
      metadata: {},
    });
    if (success) {
      setText('');
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const pinnedComments = comments.filter((c) => c.is_pinned);
  const normalComments = comments.filter((c) => !c.is_pinned);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
        Comentários
        {comments.length > 0 && (
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40">
            {comments.length}
          </span>
        )}
      </h3>

      {/* Comments list */}
      <div className="space-y-1">
        {pinnedComments.map((c) => (
          <CommentItem key={c.id} comment={c} onReply={(id) => { setReplyingTo(id); }} onDelete={onDeleteComment} onTogglePin={onTogglePin} currentCorretorId={corretorId} />
        ))}
        {normalComments.map((c) => (
          <CommentItem key={c.id} comment={c} onReply={(id) => { setReplyingTo(id); }} onDelete={onDeleteComment} onTogglePin={onTogglePin} currentCorretorId={corretorId} />
        ))}
        {comments.length === 0 && (
          <div className="py-6 text-center text-white/20">
            <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-[11px]">Nenhum comentário</p>
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 text-xs text-[#D4AF37] bg-[#D4AF37]/5 px-3 py-1.5 rounded-lg">
          <Reply className="h-3 w-3" />
          Respondendo a um comentário
          <button onClick={() => setReplyingTo(null)} className="ml-auto text-white/40 hover:text-white">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escrever comentário..."
          rows={2}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/30 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="h-10 w-10 rounded-xl bg-[#D4AF37] flex items-center justify-center hover:bg-[#F6E05E] transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send className="h-4 w-4 text-black" />
        </button>
      </div>
    </div>
  );
}
