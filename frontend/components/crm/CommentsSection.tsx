'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Pin, Trash2, Reply, MoreHorizontal, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmCommentEnriched, CrmCommentInsert } from '@/lib/types/crm';

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
  comment: CrmCommentEnriched;
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
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.corretor_foto ? (
            <img src={comment.corretor_foto} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
              {comment.corretor_nome.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white">{comment.corretor_nome}</span>
              <span className="text-[10px] text-white/20">{formatTimestamp(comment.created_at)}</span>
              {comment.is_pinned && <Pin className="h-2.5 w-2.5 text-[#D4AF37]" />}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onReply(comment.id)}
                className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10"
                title="Responder"
              >
                <Reply className="h-3 w-3 text-white/40" />
              </button>
              <button
                onClick={() => onTogglePin(comment.id, !comment.is_pinned)}
                className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10"
                title={comment.is_pinned ? 'Desafixar' : 'Fixar'}
              >
                <Pin className={cn('h-3 w-3', comment.is_pinned ? 'text-[#D4AF37]' : 'text-white/40')} />
              </button>
              {isOwn && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-500/10"
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3 text-red-400/60" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-white/60 mt-1 whitespace-pre-wrap">{comment.comment_text}</p>
        </div>
      </div>

      {/* Replies */}
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

export default function CommentsSection({
  comments,
  entityType,
  entityId,
  currentCorretorId,
  onAddComment,
  onDeleteComment,
  onTogglePin,
  loading,
}: {
  comments: CrmCommentEnriched[];
  entityType: CrmCommentInsert['entity_type'];
  entityId: string;
  currentCorretorId: string;
  onAddComment: (input: CrmCommentInsert) => Promise<boolean>;
  onDeleteComment: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  loading: boolean;
}) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const success = await onAddComment({
      entity_type: entityType,
      entity_id: entityId,
      corretor_id: currentCorretorId,
      comment_text: newComment.trim(),
      parent_comment_id: replyingTo,
    });

    if (success) {
      setNewComment('');
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Foca no input
    setTimeout(() => {
      document.getElementById('comment-input')?.focus();
    }, 100);
  };

  // Separar pinned e normais
  const pinnedComments = comments.filter((c) => c.is_pinned);
  const normalComments = comments.filter((c) => !c.is_pinned);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-white/40" />
        Comentários
        {comments.length > 0 && (
          <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h3>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-1 sidebar-scroll mb-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-white/20">
            <MessageSquare className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs">Nenhum comentário</p>
          </div>
        ) : (
          <>
            {/* Pinned first */}
            {pinnedComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={handleReply}
                onDelete={onDeleteComment}
                onTogglePin={onTogglePin}
                currentCorretorId={currentCorretorId}
              />
            ))}
            {pinnedComments.length > 0 && normalComments.length > 0 && (
              <div className="border-t border-white/5 my-2" />
            )}
            {normalComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={handleReply}
                onDelete={onDeleteComment}
                onTogglePin={onTogglePin}
                currentCorretorId={currentCorretorId}
              />
            ))}
          </>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-white/[0.03] text-[11px] text-white/40">
          <Reply className="h-3 w-3" />
          Respondendo comentário
          <button onClick={() => setReplyingTo(null)} className="ml-auto text-white/30 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 border-t border-white/5 pt-3">
        <textarea
          id="comment-input"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none resize-none focus:border-white/20"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          className="h-8 w-8 rounded-lg bg-[#D4AF37] flex items-center justify-center hover:bg-[#F6E05E] transition-colors disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5 text-black" />
        </button>
      </div>
    </div>
  );
}
