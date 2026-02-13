'use client';

import { useState, useEffect } from 'react';
import { FileArchive, Upload, Trash2, Search, File, FileImage, FileText, Download, FolderOpen } from 'lucide-react';
import { getDocumentos, createDocumento, deleteDocumento, getDocumentoStats } from '@/app/actions/documentos';
import { toast } from 'sonner';

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [dRes, sRes] = await Promise.all([
      getDocumentos(),
      getDocumentoStats(),
    ]);
    if (dRes.success) setDocumentos(dRes.data || []);
    if (sRes.success) setStats(sRes.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    const res = await deleteDocumento(id);
    if (res.success) {
      toast.success('Documento excluído');
      load();
    } else {
      toast.error('Erro ao excluir documento');
    }
  }

  const filtered = documentos.filter((d) =>
    d.nome?.toLowerCase().includes(search.toLowerCase()) ||
    d.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  const fileIcon = (tipo: string) => {
    if (tipo?.includes('image')) return FileImage;
    if (tipo?.includes('pdf')) return FileText;
    return File;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          DOCUMENTOS
        </h1>
        <p className="mt-2 text-gray-400">Biblioteca de documentos e arquivos</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <FileArchive className="h-5 w-5 text-[#D4AF37] mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-xs text-gray-400">Total de Documentos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <FolderOpen className="h-5 w-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.categorias || 0}</p>
              <p className="text-xs text-gray-400">Categorias</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <Upload className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.tamanho_total || '0 MB'}</p>
              <p className="text-xs text-gray-400">Tamanho Total</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>

          {/* Lista */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Tamanho</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const Icon = fileIcon(doc.tipo_arquivo || '');
                    return (
                      <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[#D4AF37]" />
                            <span className="text-white">{doc.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{doc.tipo_arquivo || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{formatSize(doc.tamanho)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                            {doc.categoria || 'Geral'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded p-1 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="rounded p-1 text-gray-400 hover:text-red-400 hover:bg-white/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum documento encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
