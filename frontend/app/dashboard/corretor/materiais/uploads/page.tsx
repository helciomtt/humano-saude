'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  FolderOpen,
  Cloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  File,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCorretorId } from '../../hooks/useCorretorToken';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CorretorUpload {
  id: string;
  corretor_id: string;
  nome: string;
  file_path: string;
  file_url: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  pasta: string;
  created_at: string;
}

const PASTAS = [
  { value: 'geral', label: 'Geral', icon: '📁' },
  { value: 'propostas', label: 'Propostas', icon: '📋' },
  { value: 'documentos', label: 'Documentos', icon: '📄' },
  { value: 'criativos', label: 'Criativos', icon: '🎨' },
];

const FILE_ICONS: Record<string, typeof FileText> = {
  'image/png': ImageIcon,
  'image/jpeg': ImageIcon,
  'image/jpg': ImageIcon,
  'image/webp': ImageIcon,
  'application/pdf': FileText,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? '';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UploadsPage() {
  const corretorId = useCorretorId();

  const [uploads, setUploads] = useState<CorretorUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pasta, setPasta] = useState('geral');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Fetch uploads ---------- */
  const fetchUploads = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/corretor/uploads?corretorId=${corretorId}`);
      const data = await res.json();
      if (res.ok) {
        setUploads(data.uploads ?? []);
      } else {
        toast.error(data.error ?? 'Erro ao carregar uploads');
      }
    } catch {
      toast.error('Falha na conexão');
    } finally {
      setLoading(false);
    }
  }, [corretorId]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  /* ---------- Upload file ---------- */
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !corretorId) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede 10MB — ignorado`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('corretorId', corretorId);
      formData.append('pasta', pasta);

      try {
        const res = await fetch('/api/corretor/uploads', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          toast.error(`Erro: ${data.error ?? file.name}`);
        }
      } catch {
        toast.error(`Falha ao enviar ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''}`);
      await fetchUploads();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (id: string) => {
    if (!corretorId) return;
    setDeletingId(id);

    try {
      const res = await fetch('/api/corretor/uploads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, corretorId }),
      });

      if (res.ok) {
        setUploads((prev) => prev.filter((u) => u.id !== id));
        toast.success('Arquivo removido');
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Erro ao remover');
      }
    } catch {
      toast.error('Falha na conexão');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Drag & Drop ---------- */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  /* ---------- Filtered uploads ---------- */
  const [filterPasta, setFilterPasta] = useState<string>('');
  const filtered = filterPasta
    ? uploads.filter((u) => u.pasta === filterPasta)
    : uploads;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#D4AF37]" />
          Meus Uploads
        </h2>
        <p className="text-sm text-white/50">
          Envie e gerencie seus próprios arquivos — propostas, documentos e criativos
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer',
          'flex flex-col items-center justify-center text-center min-h-[180px]',
          dragOver
            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.docx,.pptx"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin mb-3" />
            <p className="text-sm text-white/60">Enviando arquivo(s)...</p>
          </>
        ) : (
          <>
            <Cloud className={cn('h-10 w-10 mb-3 transition-colors', dragOver ? 'text-[#D4AF37]' : 'text-white/20')} />
            <p className="text-sm text-white/60">
              <span className="text-[#D4AF37] font-medium">Clique para selecionar</span> ou arraste arquivos aqui
            </p>
            <p className="text-xs text-white/30 mt-1">PDF, imagens, planilhas e documentos — máx 10MB</p>
          </>
        )}

        {/* Pasta selector inside dropzone */}
        <div className="flex gap-2 mt-4">
          {PASTAS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPasta(p.value);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                pasta === p.value
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent',
              )}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40 font-medium">Filtrar:</span>
        <button
          onClick={() => setFilterPasta('')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            !filterPasta
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
              : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent',
          )}
        >
          Todos ({uploads.length})
        </button>
        {PASTAS.map((p) => {
          const count = uploads.filter((u) => u.pasta === p.value).length;
          return (
            <button
              key={p.value}
              onClick={() => setFilterPasta(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterPasta === p.value
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent',
              )}
            >
              {p.icon} {p.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Files grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-white/20">
          <FolderOpen className="h-10 w-10 mb-3" />
          <p className="text-sm">Nenhum arquivo enviado</p>
          <p className="text-xs mt-1">Arraste arquivos ou clique na área acima</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((upload, index) => {
              const IconComp = FILE_ICONS[upload.tipo_arquivo] ?? File;
              const isImage = upload.tipo_arquivo.startsWith('image/');

              return (
                <motion.div
                  key={upload.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/20 transition-all overflow-hidden"
                >
                  {/* Preview */}
                  <div className="h-28 bg-white/[0.02] flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <img
                        src={upload.file_url}
                        alt={upload.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <IconComp className="h-10 w-10 text-white/15" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium text-white truncate" title={upload.nome}>
                      {upload.nome}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                      <span className="uppercase font-medium text-white/40">
                        {getExtension(upload.nome)}
                      </span>
                      <span>·</span>
                      <span>{formatFileSize(upload.tamanho_bytes)}</span>
                      <span>·</span>
                      <span>{formatDate(upload.created_at)}</span>
                    </div>
                    <span className="inline-block mt-1 text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full">
                      {PASTAS.find((p) => p.value === upload.pasta)?.icon ?? '📁'}{' '}
                      {PASTAS.find((p) => p.value === upload.pasta)?.label ?? upload.pasta}
                    </span>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-[#D4AF37] transition-colors"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(upload.id)}
                      disabled={deletingId === upload.id}
                      className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remover"
                    >
                      {deletingId === upload.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
