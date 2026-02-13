'use client';

import { useState, useEffect } from 'react';
import {
  ImageIcon, Download, Trash2, Loader2, FolderOpen,
  Calendar, Tag, Eye, Search, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedImage {
  id: string;
  corretor_id: string;
  nome_corretor: string;
  template_id: string;
  status: string;
  imagem_url: string;
  metadata: {
    provider?: string;
    operadora?: string;
    plano?: string;
    formato?: string;
    savedAt?: string;
    persistent?: boolean;
  };
  created_at: string;
}

export default function GaleriaPage() {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [filter, setFilter] = useState<'all' | 'criativopro' | 'ia-clone' | 'template'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corretor/banners/save-image?corretorId=all');
      const data = await res.json();
      if (data.success && data.images) {
        setImages(data.images);
      }
    } catch { toast.error('Erro ao carregar galeria'); }
    finally { setLoading(false); }
  };

  const getOrigin = (img: SavedImage): string => {
    const provider = img.metadata?.provider || img.template_id || '';
    if (provider.includes('ia-clone')) return 'IA Clone';
    if (provider.includes('criativopro') || provider.includes('template-client')) return 'CriativoPRO';
    return 'Template';
  };

  const getOriginColor = (origin: string) => {
    if (origin === 'IA Clone') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (origin === 'CriativoPRO') return 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const filteredImages = images.filter(img => {
    const origin = getOrigin(img);
    if (filter === 'criativopro' && origin !== 'CriativoPRO') return false;
    if (filter === 'ia-clone' && origin !== 'IA Clone') return false;
    if (filter === 'template' && origin !== 'Template') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (img.metadata?.operadora || '').toLowerCase().includes(q) ||
        (img.metadata?.plano || '').toLowerCase().includes(q) ||
        (img.nome_corretor || '').toLowerCase().includes(q) ||
        origin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b8960c] flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Galeria de Criativos</h1>
            <p className="text-gray-500 text-xs">Todas as imagens salvas do CriativoPRO e IA Clone</p>
          </div>
          <div className="ml-auto">
            <span className="text-gray-500 text-xs">{filteredImages.length} imagens</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#111] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por operadora, plano..."
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-[#D4AF37] outline-none"
            />
          </div>
          <div className="flex gap-2">
            {([
              { key: 'all', label: 'Todos' },
              { key: 'criativopro', label: 'CriativoPRO' },
              { key: 'ia-clone', label: 'IA Clone' },
              { key: 'template', label: 'Templates' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  filter === f.key
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                    : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Imagens */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Carregando galeria...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ImageIcon className="w-16 h-16 text-gray-700 mb-4" />
          <p className="text-gray-500 text-sm font-medium">Nenhuma imagem salva</p>
          <p className="text-gray-600 text-xs mt-1">Salve banners do CriativoPRO ou IA Clone para vê-los aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((img) => {
            const origin = getOrigin(img);
            return (
              <div key={img.id} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-700 transition-colors">
                {/* Thumbnail */}
                <div
                  className="relative aspect-[9/16] cursor-pointer overflow-hidden"
                  onClick={() => setPreviewUrl(img.imagem_url)}
                >
                  <img
                    src={img.imagem_url}
                    alt={`${origin} - ${img.metadata?.operadora || 'Banner'}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Badge de origem */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getOriginColor(origin)}`}>
                    {origin}
                  </div>
                  {/* Badge de formato */}
                  {img.metadata?.formato && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-black/60 text-white/70 border border-white/10">
                      {img.metadata.formato}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-gray-500 shrink-0" />
                    <span className="text-white text-xs font-medium truncate">
                      {img.metadata?.operadora || 'Geral'}
                      {img.metadata?.plano ? ` • ${img.metadata.plano}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
                    <span className="text-gray-500 text-[10px]">{formatDate(img.created_at)}</span>
                  </div>
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = img.imagem_url;
                      a.download = `${origin.toLowerCase().replace(' ', '-')}-${img.metadata?.operadora || 'banner'}-${Date.now()}.png`;
                      a.target = '_blank';
                      a.click();
                      toast.success('Download iniciado!');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-[10px] font-medium hover:bg-[#D4AF37]/20 transition"
                  >
                    <Download className="w-3 h-3" /> Baixar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewUrl('')}>
          <div className="relative max-w-full max-h-full overflow-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl('')}
              className="sticky top-2 float-right z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold border border-white/20 hover:border-white/50 transition-all shadow-xl mr-2 mt-2">
              ✕
            </button>
            <img src={previewUrl} alt="Preview" style={{ maxHeight: '95vh', width: 'auto' }} className="rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
