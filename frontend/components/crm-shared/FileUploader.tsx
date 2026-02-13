'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Image, File, Trash2, Download,
  Paperclip, FolderOpen, X, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmCardFile } from '@/lib/types/corretor';

const FILE_CATEGORIES = [
  { value: 'proposta', label: 'Proposta' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'documento_pessoal', label: 'Documento Pessoal' },
  { value: 'exame', label: 'Exame Médico' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'outro', label: 'Outro' },
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploader({
  files,
  onUpload,
  onDelete,
  uploading,
}: {
  files: CrmCardFile[];
  onUpload: (file: File, categoria: string) => Promise<boolean>;
  onDelete: (fileId: string) => Promise<boolean>;
  uploading: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('outro');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Arquivo ${file.name} excede 10MB`);
        continue;
      }
      await onUpload(file, selectedCategory);
    }
  }, [onUpload, selectedCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-[#D4AF37]" />
          Arquivos
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40">
            {files.length}
          </span>
        </h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/50 outline-none"
        >
          {FILE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          isDragOver
            ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
            <p className="text-xs text-white/50">Enviando...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={cn('h-8 w-8', isDragOver ? 'text-[#D4AF37]' : 'text-white/20')} />
            <p className="text-xs text-white/40">
              Arraste arquivos aqui ou <span className="text-[#D4AF37]">clique para selecionar</span>
            </p>
            <p className="text-[10px] text-white/20">Máximo 10MB por arquivo</p>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {files.map((file) => {
            const Icon = getFileIcon(file.tipo_arquivo);

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] group transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-white/40" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{file.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/20">{formatSize(file.tamanho_bytes)}</span>
                    {file.categoria && (
                      <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                        {FILE_CATEGORIES.find((c) => c.value === file.categoria)?.label ?? file.categoria}
                      </span>
                    )}
                    <span className="text-[10px] text-white/15">
                      {new Date(file.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5 text-white/40" />
                  </a>
                  <button
                    onClick={() => onDelete(file.id)}
                    className="h-7 w-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {files.length === 0 && (
          <div className="py-6 text-center text-white/20">
            <FolderOpen className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-[11px]">Nenhum arquivo</p>
          </div>
        )}
      </div>
    </div>
  );
}
