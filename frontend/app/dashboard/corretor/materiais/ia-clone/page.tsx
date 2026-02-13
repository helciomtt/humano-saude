'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Wand2, Download, Sparkles, Image as ImageIcon,
  ArrowRight, CheckCircle, Loader2, Eye, Zap, Lightbulb,
  Send, Paperclip, X, MessageSquare, Undo2, Save,
} from 'lucide-react';
import NextImage from 'next/image';
import { toast } from 'sonner';

/* ═══════════ TYPES ═══════════ */
interface AnalysisResult {
  headline: string;
  mensagem: string;
  cta: string;
  cores: string[];
  dicas: string[];
  layout: string;
  prompt_sugerido: string;
}

/* ═══════════ OPERADORAS ═══════════ */
const OPERADORAS = [
  { id: 'amil', nome: 'Amil' },
  { id: 'sulamerica', nome: 'SulAmérica' },
  { id: 'bradesco', nome: 'Bradesco Saúde' },
  { id: 'porto', nome: 'Porto Saúde' },
  { id: 'assim', nome: 'Assim Saúde' },
  { id: 'levesaude', nome: 'Leve Saúde' },
  { id: 'unimed', nome: 'Unimed' },
  { id: 'preventsenior', nome: 'Prevent Senior' },
  { id: 'medsenior', nome: 'MedSenior' },
];

/* ═══════════ PAGE ═══════════ */
export default function IAClonePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState('');
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cloneImageUrl, setCloneImageUrl] = useState('');
  const [previewFullUrl, setPreviewFullUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  /* Prompt editável */
  const [editablePrompt, setEditablePrompt] = useState('');

  /* Refinamento pós-geração */
  const [userIdea, setUserIdea] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  /* Anexo */
  const [attachment, setAttachment] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  /* Campos de personalização */
  const [operadora, setOperadora] = useState('amil');
  const [plano, setPlano] = useState('');
  const [preco, setPreco] = useState('');
  const [nomeCorretor, setNomeCorretor] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instrucao, setInstrucao] = useState('');
  const [ratio, setRatio] = useState<'9:16' | '4:5'>('9:16');

  /* ── Upload handler ── */
  const handleUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Envie apenas imagens'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setAnalysis(null);
      setCloneImageUrl('');
      setHistory([]);
      setEditablePrompt('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  /* ── Anexo handler ── */
  const handleAttachment = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máx. 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setAttachment(e.target?.result as string); setAttachmentName(file.name); };
    reader.readAsDataURL(file);
  };

  /* ── Analisar com IA ── */
  const analyzeImage = async () => {
    if (!uploadedImage) return;
    setAnalyzing(true);
    setAnalysis(null);
    setCloneImageUrl('');
    setEditablePrompt('');
    try {
      const res = await fetch('/api/corretor/banners/ai-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', imageBase64: uploadedImage, operadora, plano, preco, instrucao }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setEditablePrompt(data.analysis.prompt_sugerido || '');
        toast.success('✨ Análise concluída! Revise o prompt e gere.');
      } else {
        toast.error(data.error || 'Erro na análise');
      }
    } catch { toast.error('Erro de conexão'); }
    finally { setAnalyzing(false); }
  };

  /* ── Gerar versão clonada (IMAGEM REAL) ── */
  const generateClone = async () => {
    if (!uploadedImage || !analysis) return;
    setGenerating(true);
    setCloneImageUrl('');
    try {
      const payload: Record<string, unknown> = {
        action: 'generate',
        imageBase64: uploadedImage,
        analysis,
        operadora, plano, preco, nomeCorretor, whatsapp, instrucao, ratio,
        refinementPrompt: editablePrompt || undefined,
      };
      if (attachment) payload.attachmentBase64 = attachment;

      const res = await fetch('/api/corretor/banners/ai-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setCloneImageUrl(data.imageUrl);
        setHistory([data.imageUrl]);
        setAttachment('');
        setAttachmentName('');
        toast.success('🎨 Versão clonada gerada!');
      } else {
        toast.error(data.error || 'Erro ao gerar');
      }
    } catch { toast.error('Erro de conexão'); }
    finally { setGenerating(false); }
  };

  /* ── Otimizar prompt (ideia → prompt técnico) ── */
  const optimizePrompt = async () => {
    if (!userIdea.trim()) return;
    setOptimizing(true);
    try {
      const res = await fetch('/api/corretor/banners/ai-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Transforme este pedido do corretor em um prompt técnico avançado de design para IA generativa de imagem.

PEDIDO DO CORRETOR: "${userIdea.trim()}"

${attachment ? 'NOTA: O corretor anexou uma imagem (logo/foto). Instrua a IA sobre onde e como posicioná-la no banner.' : ''}

CONTEXTO:
- Tipo: Clone/melhoria de anúncio existente de plano de saúde
- Operadora: ${OPERADORAS.find(o => o.id === operadora)?.nome || 'Amil'}
- Plano: ${plano || 'genérico'}

Gere APENAS o prompt técnico de design (composição, tipografia, cores, posição, estilo), máximo 500 caracteres. Sem explicações.`,
          operadora: OPERADORAS.find(o => o.id === operadora)?.nome || 'Amil',
          plano, modalidade: 'PME',
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setRefinePrompt(data.text);
        toast.success('🧠 Prompt gerado!');
      } else { toast.error('Erro'); }
    } catch { toast.error('Erro de conexão'); }
    finally { setOptimizing(false); }
  };

  /* ── Refinar imagem existente ── */
  const refineImage = async () => {
    if (!refinePrompt.trim() || !cloneImageUrl || !uploadedImage) return;
    setRefineLoading(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'generate',
        imageBase64: uploadedImage,
        analysis,
        operadora, plano, preco, nomeCorretor, whatsapp, instrucao, ratio,
        refinementPrompt: refinePrompt.trim(),
      };
      if (attachment) payload.attachmentBase64 = attachment;

      const res = await fetch('/api/corretor/banners/ai-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setCloneImageUrl(data.imageUrl);
        setHistory(prev => [...prev, data.imageUrl]);
        setRefinePrompt('');
        setUserIdea('');
        setAttachment('');
        setAttachmentName('');
        toast.success('✨ Ajuste aplicado!');
      } else {
        toast.error(data.error || 'Erro ao refinar');
      }
    } catch { toast.error('Erro de conexão'); }
    finally { setRefineLoading(false); }
  };

  /* ── Salvar na galeria (Supabase) ── */
  const saveToGallery = async () => {
    if (!cloneImageUrl || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/corretor/banners/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cloneImageUrl,
          corretorId: 'ia-clone-user',
          nomeCorretor: nomeCorretor || 'Corretor',
          operadora,
          plano,
          formato: ratio,
          origem: 'ia-clone',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedUrl(data.imageUrl);
        toast.success('✅ Imagem salva na galeria!');
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch { toast.error('Erro de conexão'); }
    finally { setSaving(false); }
  };

  const undoImage = () => {
    if (history.length <= 1) return;
    const newH = history.slice(0, -1);
    setHistory(newH);
    setCloneImageUrl(newH[newH.length - 1]);
    toast.success('↩️ Versão anterior');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              IA Clone
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">BETA</span>
            </h1>
            <p className="text-gray-500 text-xs">Envie um anúncio → IA analisa → gera versão melhorada como IMAGEM real</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ════════ COLUNA ESQUERDA ════════ */}
        <div className="space-y-4">
          {/* Guia */}
          <div className="bg-gradient-to-r from-purple-600/10 to-transparent border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-bold text-sm">Como funciona</span>
            </div>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Envie a imagem do anúncio que quer clonar/melhorar</li>
              <li>Preencha operadora, plano e seus dados</li>
              <li>A IA analisa e gera um prompt otimizado</li>
              <li>Revise o prompt, anexe logos se quiser, e gere!</li>
              <li>Peça ajustes quantas vezes quiser</li>
            </ol>
          </div>

          {/* Upload */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#D4AF37]" />
              Imagem de Referência
            </h3>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-purple-500/5">
              {uploadedImage ? (
                <div className="space-y-2">
                  <div className="relative w-full max-w-[240px] mx-auto aspect-[9/16] rounded-lg overflow-hidden">
                    <NextImage src={uploadedImage} alt="Upload" fill className="object-contain" unoptimized />
                  </div>
                  <p className="text-gray-400 text-xs">{fileName}</p>
                  <p className="text-purple-400 text-xs">Clique para trocar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-gray-400 text-sm font-medium">Arraste ou clique para enviar</p>
                  <p className="text-gray-600 text-xs">JPG, PNG ou WebP • Máx. 10MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          </div>

          {/* Personalização */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              Personalização
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-[10px] uppercase mb-1 block">Operadora</label>
                  <select value={operadora} onChange={(e) => setOperadora(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none">
                    {OPERADORAS.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase mb-1 block">Nome do Plano</label>
                  <input value={plano} onChange={(e) => setPlano(e.target.value)} placeholder="Ex: Essencial II"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-[10px] uppercase mb-1 block">Preço a partir de</label>
                  <input value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="R$ 199,90"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase mb-1 block">Seu Nome</label>
                  <input value={nomeCorretor} onChange={(e) => setNomeCorretor(e.target.value)} placeholder="Seu nome"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1 block">WhatsApp</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(21) 99999-9999"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Formato</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setRatio('9:16')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${ratio === '9:16' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    <svg width="12" height="18" viewBox="0 0 12 18" fill="none"><rect x="0.5" y="0.5" width="11" height="17" rx="1.5" stroke="currentColor"/></svg>
                    Stories 9:16
                  </button>
                  <button type="button" onClick={() => setRatio('4:5')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${ratio === '4:5' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><rect x="0.5" y="0.5" width="13" height="15" rx="1.5" stroke="currentColor"/></svg>
                    Feed 4:5
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1 block">Instrução Adicional</label>
                <textarea value={instrucao} onChange={(e) => setInstrucao(e.target.value)} rows={2}
                  placeholder="Ex: Use cores mais vibrantes, destaque a economia..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white resize-none placeholder:text-gray-500 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Botão Analisar */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <button onClick={analyzeImage} disabled={!uploadedImage || analyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {analyzing ? 'Analisando...' : '1. Analisar Anúncio com IA'}
            </button>
          </div>
        </div>

        {/* ════════ COLUNA DIREITA — RESULTADOS ════════ */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">

          {/* Resultado da Análise */}
          {analysis && (
            <div className="bg-[#111] border border-purple-500/30 rounded-xl p-4">
              <h3 className="text-purple-400 font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Análise do Anúncio
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase">Headline</span>
                  <p className="text-white text-sm font-medium">{analysis.headline || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase">Mensagem</span>
                  <p className="text-white/80 text-xs">{analysis.mensagem || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase">CTA</span>
                  <p className="text-[#D4AF37] text-sm font-bold">{analysis.cta || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase">Layout</span>
                  <p className="text-white/60 text-xs">{analysis.layout || '—'}</p>
                </div>
                {analysis.cores.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase block mb-1">Cores Detectadas</span>
                    <div className="flex gap-2">
                      {analysis.cores.map((c, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg border border-white/20" style={{ background: c }} title={c} />
                      ))}
                    </div>
                  </div>
                )}
                {analysis.dicas.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase block mb-1">Dicas de Melhoria</span>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {analysis.dicas.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ═══ Prompt Editável + Anexo + Botão Gerar ═══ */}
              <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider">Prompt para Geração</span>
                </div>
                <textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  rows={3}
                  placeholder="O prompt foi gerado automaticamente. Edite se quiser antes de gerar..."
                  className="w-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 outline-none resize-none"
                />
                <p className="text-gray-600 text-[9px]">💡 Esse prompt será usado para gerar a imagem. Edite livremente para melhorar o resultado.</p>

                {/* Anexo */}
                {attachment && (
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden border border-purple-500/30 shrink-0">
                      <img src={attachment} alt="Anexo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-purple-300 text-[11px] font-medium truncate">{attachmentName}</p>
                      <p className="text-purple-400/50 text-[9px]">Será incorporada no banner</p>
                    </div>
                    <button onClick={() => { setAttachment(''); setAttachmentName(''); }}
                      className="p-1 hover:bg-purple-500/20 rounded-full transition" title="Remover">
                      <X className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => attachRef.current?.click()} disabled={generating}
                    className="px-3 py-3 border border-gray-700 text-gray-400 rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition disabled:opacity-40"
                    title="Anexar imagem (logo, foto)">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button onClick={generateClone} disabled={generating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#D4AF37] to-[#b8960c] text-black rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {generating ? 'Gerando Imagem...' : '2. Gerar Versão Clonada'}
                  </button>
                </div>
                <input ref={attachRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleAttachment(e.target.files[0]); e.target.value = ''; }} />
              </div>
            </div>
          )}

          {/* Comparativo */}
          {uploadedImage && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                {cloneImageUrl ? 'Original vs Clonado' : 'Imagem Original'}
              </h3>
              <div className={`grid ${cloneImageUrl ? 'grid-cols-2' : 'grid-cols-1 max-w-[300px]'} gap-3`}>
                {/* Original — clicável */}
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block mb-1">Original</span>
                  <div className={`relative rounded-lg overflow-hidden border border-gray-700 cursor-pointer group hover:border-purple-400/50 transition-colors ${ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
                    onClick={() => setPreviewFullUrl(uploadedImage)} title="🔍 Ver tamanho real">
                    <div className="absolute top-2 right-2 z-10 bg-black/60 text-white/70 text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">🔍 Ampliar</div>
                    <NextImage src={uploadedImage} alt="Original" fill className="object-contain bg-black" unoptimized />
                  </div>
                </div>
                {/* Clonado — clicável */}
                {cloneImageUrl && (
                  <div>
                    <span className="text-[#D4AF37] text-[10px] uppercase block mb-1 font-bold">✨ Versão IA ({ratio === '9:16' ? 'Stories' : 'Feed'})</span>
                    <div className={`relative rounded-lg overflow-hidden border border-[#D4AF37]/30 bg-black cursor-pointer group hover:border-[#D4AF37]/60 transition-colors ${ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
                      onClick={() => setPreviewFullUrl(cloneImageUrl)} title="🔍 Ver tamanho real">
                      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white/70 text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">🔍 Ampliar</div>
                      {(generating || refineLoading) && (
                        <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                          <span className="text-purple-300 text-xs font-medium">{refineLoading ? 'Ajustando...' : 'Gerando...'}</span>
                        </div>
                      )}
                      <img src={cloneImageUrl} alt="Clone IA" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>

              {/* ═══ Botões de ação do clone ═══ */}
              {cloneImageUrl && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => {
                      const a = document.createElement('a');
                      a.href = cloneImageUrl;
                      a.download = `clone-ia-${operadora}-${ratio.replace(':', 'x')}-${Date.now()}.png`;
                      a.click();
                      toast.success('Download iniciado!');
                    }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-xs hover:opacity-90 transition">
                      <Download className="w-3 h-3" /> Baixar
                    </button>
                    <button onClick={saveToGallery} disabled={saving || !!savedUrl}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium text-xs hover:opacity-90 transition disabled:opacity-50">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {savedUrl ? '✅ Salvo' : saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    {history.length > 1 && (
                      <button onClick={undoImage}
                        className="px-3 py-2 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:border-purple-400 transition flex items-center gap-1.5">
                        <Undo2 className="w-3 h-3" /> Desfazer
                      </button>
                    )}
                  </div>

                  {/* ═══ Refinamento pós-geração ═══ */}
                  <div className="bg-[#0a0a0a] border border-purple-500/20 rounded-lg p-3 space-y-3">
                    {/* Descreva sua ideia */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider">Pedir Ajuste</span>
                        {history.length > 1 && (
                          <span className="text-purple-400/60 text-[9px] ml-auto">Versão {history.length}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => attachRef.current?.click()} disabled={refineLoading || optimizing}
                          className="px-2.5 py-2.5 border border-gray-700 text-gray-400 rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition disabled:opacity-40 shrink-0"
                          title="Anexar imagem">
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                        <input value={userIdea} onChange={(e) => setUserIdea(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); optimizePrompt(); } }}
                          placeholder="Descreva o que quer mudar... Ex: trocar a logo, preço maior, cor de fundo azul"
                          disabled={refineLoading || optimizing}
                          className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 outline-none disabled:opacity-50 transition" />
                        <button onClick={optimizePrompt} disabled={!userIdea.trim() || optimizing || refineLoading}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#b8960c] text-black rounded-lg font-bold text-xs hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0">
                          {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          Gerar Prompt
                        </button>
                      </div>

                      {/* Anexo */}
                      {attachment && (
                        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 mt-2">
                          <div className="relative w-8 h-8 rounded-md overflow-hidden border border-purple-500/30 shrink-0">
                            <img src={attachment} alt="Anexo" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-purple-300 text-[10px] truncate flex-1">{attachmentName}</p>
                          <button onClick={() => { setAttachment(''); setAttachmentName(''); }}
                            className="p-1 hover:bg-purple-500/20 rounded-full transition">
                            <X className="w-3 h-3 text-purple-400" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['Colocar a logo que anexei', 'Preço maior e mais visível', 'Mais contraste no texto', 'Cores mais vibrantes', 'Incluir meu WhatsApp'].map((s) => (
                          <button key={s} onClick={() => setUserIdea(s)}
                            className="px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]/80 rounded-md text-[10px] hover:bg-[#D4AF37]/20 transition">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prompt otimizado → executar */}
                    {refinePrompt && (
                      <div className="border-t border-purple-500/20 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-purple-300 text-[11px] font-semibold uppercase tracking-wider">Prompt Otimizado</span>
                          <span className="text-green-400 text-[9px] bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">✓ Pronto</span>
                        </div>
                        <div className="flex gap-2">
                          <input value={refinePrompt} onChange={(e) => setRefinePrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); refineImage(); } }}
                            disabled={refineLoading}
                            className="flex-1 bg-[#1a1a1a] border border-purple-500/30 rounded-lg px-3 py-2.5 text-xs text-white focus:border-purple-500 outline-none disabled:opacity-50 transition" />
                          <button onClick={refineImage} disabled={!refinePrompt.trim() || refineLoading}
                            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-xs hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0">
                            {refineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Executar
                          </button>
                        </div>
                        <p className="text-gray-500 text-[9px] mt-1">💡 Revise se quiser, depois clique Executar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Placeholder */}
          {!uploadedImage && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-12 text-center">
              <ImageIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Envie uma imagem de anúncio para começar</p>
              <p className="text-gray-600 text-xs mt-1">A IA vai analisar e criar uma versão personalizada</p>
            </div>
          )}
        </div>
      </div>

      {/* ════════ MODAL PREVIEW TAMANHO REAL ════════ */}
      {previewFullUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewFullUrl('')}>
          <div className="relative max-w-full max-h-full overflow-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewFullUrl('')}
              className="sticky top-2 float-right z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold border border-white/20 hover:border-white/50 transition-all shadow-xl mr-2 mt-2">
              ✕
            </button>
            <img src={previewFullUrl} alt="Preview tamanho real" style={{ maxHeight: '95vh', width: 'auto' }} className="rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
