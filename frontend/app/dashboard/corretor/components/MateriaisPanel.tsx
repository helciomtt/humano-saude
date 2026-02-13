'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  FileText,
  Download,
  Search,
  Star,
  Filter,
  Grid,
  List,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMateriais } from '../hooks/useCorretorData';
import type { MaterialCategoria } from '@/lib/types/corretor';

const CATEGORIAS: { value: MaterialCategoria | ''; label: string; icon: string }[] = [
  { value: '', label: 'Todos', icon: '📁' },
  { value: 'pme', label: 'PME', icon: '🏢' },
  { value: 'adesao', label: 'Adesão', icon: '🤝' },
  { value: 'individual', label: 'Individual', icon: '👤' },
  { value: 'geral', label: 'Geral', icon: '📋' },
];

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  xlsx: '📊',
  docx: '📝',
  pptx: '📊',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MateriaisPanel() {
  const { materiais, loading, fetchMateriais } = useMateriais();
  const [categoria, setCategoria] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleFilterChange = (cat: string) => {
    setCategoria(cat);
    fetchMateriais({ categoria: cat || undefined, busca: busca || undefined });
  };

  const handleSearch = (term: string) => {
    setBusca(term);
    fetchMateriais({ categoria: categoria || undefined, busca: term || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-[#D4AF37]" />
          Material de Vendas
        </h2>
        <p className="text-sm text-white/50">PDFs de operadoras organizados por categoria</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar material..."
            value={busca}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/30"
          />
        </div>

        <div className="flex gap-1">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleFilterChange(cat.value)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                categoria === cat.value
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-white/5 text-white/50 hover:text-white/70 border border-transparent',
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
              viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50',
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
              viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50',
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className={cn(
          viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2',
        )}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materiais.map((material, index) => (
            <motion.a
              key={String(material.id)}
              href={String(material.url)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group relative p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all overflow-hidden"
            >
              {Boolean(material.destaque) ? (
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
              ) : null}

              {/* Thumbnail ou ícone */}
              <div className="h-24 rounded-xl bg-white/5 flex items-center justify-center mb-3 overflow-hidden">
                {material.thumbnail_url ? (
                  <img
                    src={String(material.thumbnail_url)}
                    alt={String(material.nome)}
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-3xl">
                    {FILE_ICONS[String(material.tipo_arquivo).toLowerCase()] ?? '📄'}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-medium text-white truncate group-hover:text-[#D4AF37] transition-colors">
                {String(material.nome)}
              </h4>

              <div className="flex items-center gap-2 mt-2">
                {material.operadora ? (
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full truncate">
                    {String((material.operadora as Record<string, unknown>)?.nome ?? '')}
                  </span>
                ) : null}
                <span className="text-[10px] text-white/30 uppercase">
                  {String(material.tipo_arquivo)}
                </span>
                {material.tamanho_bytes ? (
                  <span className="text-[10px] text-white/20">
                    {formatFileSize(Number(material.tamanho_bytes))}
                  </span>
                ) : null}
              </div>

              {/* Download overlay */}
              <div className="absolute inset-0 bg-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-sm font-medium">
                  <Download className="h-4 w-4" />
                  Abrir
                </div>
              </div>

              {Boolean(material.destaque) ? (
                <Star className="absolute top-3 right-3 h-4 w-4 text-[#D4AF37] fill-[#D4AF37]" />
              ) : null}
            </motion.a>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {materiais.map((material, index) => (
            <motion.a
              key={String(material.id)}
              href={String(material.url)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/30 transition-all group"
            >
              <span className="text-xl flex-shrink-0">
                {FILE_ICONS[String(material.tipo_arquivo).toLowerCase()] ?? '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-[#D4AF37] transition-colors">
                  {String(material.nome)}
                </p>
                <p className="text-xs text-white/30">
                  {String(material.categoria)} · {String(material.tipo_arquivo).toUpperCase()} · {formatFileSize(Number(material.tamanho_bytes))}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-[#D4AF37] transition-colors" />
            </motion.a>
          ))}
        </div>
      )}

      {materiais.length === 0 && !loading && (
        <div className="py-16 flex flex-col items-center text-white/20">
          <FolderOpen className="h-10 w-10 mb-3" />
          <p className="text-sm">Nenhum material encontrado</p>
        </div>
      )}
    </div>
  );
}
