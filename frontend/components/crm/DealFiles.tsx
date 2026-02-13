'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Image, File, Trash2, ExternalLink,
  Download, Paperclip, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmAttachmentEnriched } from '@/lib/types/crm';
import { deleteAttachment } from '@/app/actions/crm-detail';

// ========================================
// HELPERS
// ========================================

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4 text-white/30" />;
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileText className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-white/30" />;
}

function timeAgo(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`;
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ========================================
// DEAL FILES COMPONENT
// ========================================

export default function DealFiles({
  dealId,
  initialFiles,
  corretorId,
  onUploadComplete,
}: {
  dealId: string;
  initialFiles?: CrmAttachmentEnriched[];
  corretorId?: string;
  onUploadComplete?: () => void;
}) {
  const [files, setFiles] = useState<CrmAttachmentEnriched[]>(initialFiles ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload handler ──
  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);

    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', 'deal');
        formData.append('entity_id', dealId);

        const res = await fetch('/api/crm/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setFiles((prev) => [
              ...prev,
              { ...json.data, uploaded_by_nome: null } as CrmAttachmentEnriched,
            ]);
          }
        }
      } catch {
        // silently skip failed uploads
      }
    }

    setIsUploading(false);
    onUploadComplete?.();
  }, [dealId]);

  // ── Delete handler ──
  const handleDelete = useCallback(async (id: string) => {
    // Optimistic
    setFiles((prev) => prev.filter((f) => f.id !== id));
    await deleteAttachment(id);
  }, []);

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Arquivos & Documentos
          </h3>
          <span className="text-[10px] text-white/30">({files.length})</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
          isDragOver
            ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5'
            : 'border-white/[0.06] hover:border-white/10 bg-white/[0.01]',
          isUploading && 'opacity-50 pointer-events-none',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        {isUploading ? (
          <Loader2 className="h-6 w-6 mx-auto mb-2 text-[#D4AF37] animate-spin" />
        ) : (
          <Upload className="h-6 w-6 mx-auto mb-2 text-white/20" />
        )}
        <p className="text-[11px] text-white/40 font-medium">
          {isDragOver ? 'Solte os arquivos aqui' : 'Arraste ou clique para enviar'}
        </p>
        <p className="text-[9px] text-white/20 mt-1">
          PDF, DOC, XLS, imagens (máx 10MB)
        </p>
      </div>

      {/* Files list */}
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03]
                       border border-white/[0.04] hover:border-white/[0.08] group transition-colors"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {getFileIcon(file.mime_type)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <a
                href={file.file_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-white hover:text-[#D4AF37] truncate block transition-colors"
              >
                {file.file_name}
              </a>
              <div className="flex items-center gap-1.5 text-[9px] text-white/20">
                <span>{formatFileSize(file.file_size_bytes)}</span>
                <span>·</span>
                <span>{timeAgo(file.created_at)}</span>
                {file.uploaded_by_nome && (
                  <>
                    <span>·</span>
                    <span>{file.uploaded_by_nome}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {file.file_url && (
                <>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white/[0.05] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 text-white/30 hover:text-white/60" />
                  </a>
                  <a
                    href={file.file_url}
                    download
                    className="p-1 rounded hover:bg-white/[0.05] transition-colors"
                  >
                    <Download className="h-3 w-3 text-white/30 hover:text-white/60" />
                  </a>
                </>
              )}
              <button
                onClick={() => handleDelete(file.id)}
                className="p-1 rounded hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3 w-3 text-red-400/50 hover:text-red-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <div className="py-3 text-center">
          <p className="text-[10px] text-white/20">Nenhum arquivo anexado</p>
        </div>
      )}
    </div>
  );
}
