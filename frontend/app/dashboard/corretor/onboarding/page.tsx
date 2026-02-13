'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Shield,
  X,
  Landmark,
  User,
  Video,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { validarDocumento } from '@/lib/validations';
import Image from 'next/image';

// ─── Constantes ────────────────────────────────────────────
const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '077', nome: 'Banco Inter' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '290', nome: 'PagSeguro' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '422', nome: 'Safra' },
  { codigo: '070', nome: 'BRB' },
  { codigo: '000', nome: 'Outro' },
];

const TIPOS_CHAVE_PIX = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave Aleatória' },
];

interface DocFile {
  file: File | null;
  preview: string;
  status: 'empty' | 'selected' | 'uploading' | 'uploaded' | 'error';
  errorMsg?: string;
}

// ─── FileUploadCard ────────────────────────────────────────
function FileUploadCard({
  label,
  description,
  icon: Icon,
  required,
  docFile,
  onFileSelect,
  onRemove,
  validating = false,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  docFile: DocFile;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  validating?: boolean;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-xl border-2 border-dashed p-4 sm:p-5 md:p-6 transition-all',
        docFile.status === 'selected' || docFile.status === 'uploaded'
          ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
          : docFile.status === 'error'
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20',
      )}
    >
      {docFile.status === 'empty' && !validating ? (
        <label className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer">
          <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-white/5 flex items-center justify-center">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white/30" />
          </div>
          <div className="text-center">
            <p className="text-sm sm:text-base md:text-lg text-white font-medium">
              {label} {required && <span className="text-red-400">*</span>}
            </p>
            <p className="text-xs sm:text-sm md:text-base text-white/40 mt-0.5">{description}</p>
            <p className="text-[11px] sm:text-xs md:text-sm text-white/25 mt-1">
              Arraste ou clique para enviar · PDF, JPG ou PNG até 10MB
            </p>
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
        </label>
      ) : validating || docFile.status === 'uploading' ? (
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4AF37] animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-white font-medium truncate">
              {validating ? 'Verificando documento...' : 'Enviando...'}
            </p>
            <p className="text-xs sm:text-sm text-[#D4AF37]/60">
              {validating ? 'Validando se o documento corresponde ao tipo selecionado' : 'Aguarde...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
            {docFile.status === 'error' ? (
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
            ) : (
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-white font-medium truncate">
              {docFile.file?.name ?? label}
            </p>
            <p className="text-xs sm:text-sm text-white/40">
              {docFile.status === 'error'
                  ? docFile.errorMsg ?? 'Erro no upload'
                  : `${((docFile.file?.size ?? 0) / 1024).toFixed(0)} KB`}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SelfieCaptureCard ─────────────────────────────────────
function SelfieCaptureCard({
  docFile,
  onFileSelect,
  onRemove,
}: {
  docFile: DocFile;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  // Quando a câmera fica ativa, conectar o stream ao video element
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        setCameraError('Erro ao iniciar o vídeo da câmera.');
      });
    }
  }, [cameraActive]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Espelhar a imagem (selfie)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onFileSelect(file);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9,
    );
  };

  // Se já tem foto capturada
  if (docFile.status === 'selected' || docFile.status === 'uploaded') {
    return (
      <div className="relative rounded-xl border-2 border-dashed border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 sm:p-5 md:p-6 transition-all">
        <div className="flex items-center gap-3 sm:gap-4">
          {docFile.preview ? (
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
              <img
                src={docFile.preview}
                alt="Selfie"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-white font-medium truncate">
              {docFile.file?.name ?? 'Selfie com documento'}
            </p>
            <p className="text-xs sm:text-sm text-white/40">
              {`${((docFile.file?.size ?? 0) / 1024).toFixed(0)} KB`}
            </p>
          </div>
          <button
            onClick={() => { onRemove(); stopCamera(); }}
            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Câmera ativa — exibir preview de vídeo
  if (cameraActive) {
    return (
      <div className="relative rounded-xl border-2 border-dashed border-[#D4AF37]/30 bg-black/40 p-3 sm:p-4 md:p-6 transition-all">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm sm:text-base text-white font-medium">
            Selfie com documento <span className="text-white/40 font-normal text-xs">(opcional)</span>
          </p>
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-all"
            >
              <Camera className="h-4 w-4" />
              Capturar
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado inicial — opções de câmera ou upload
  return (
    <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 p-4 sm:p-5 md:p-6 transition-all">
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-white/5 flex items-center justify-center">
          <Camera className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white/30" />
        </div>
        <div className="text-center">
          <p className="text-sm sm:text-base md:text-lg text-white font-medium">
            Selfie com documento <span className="text-white/40 font-normal text-xs">(opcional)</span>
          </p>
          <p className="text-xs sm:text-sm md:text-base text-white/40 mt-0.5">Opcional — acelera a verificação</p>
        </div>

        {cameraError && (
          <p className="text-xs text-red-400 text-center">{cameraError}</p>
        )}

        <div className="flex items-center gap-3">
          {/* Botão Tirar Foto */}
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/20 transition-all"
          >
            <Video className="h-4 w-4" />
            Tirar foto
          </button>

          {/* Botão Enviar arquivo */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 cursor-pointer transition-all">
            <ImageIcon className="h-4 w-4" />
            Enviar arquivo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
              }}
            />
          </label>
        </div>
        <p className="text-[11px] sm:text-xs text-white/25">
          Use a câmera ou envie uma foto · JPG ou PNG até 10MB
        </p>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────
export default function OnboardingCorretorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const tipoPessoa = searchParams.get('tipo') ?? 'pf';

  const [etapa, setEtapa] = useState<'documentos' | 'bancario' | 'completo'>('documentos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Documentos ──────────────────────────────────────────
  const [docCnh, setDocCnh] = useState<DocFile>({ file: null, preview: '', status: 'empty' });
  const [docRgFrente, setDocRgFrente] = useState<DocFile>({ file: null, preview: '', status: 'empty' });
  const [docRgVerso, setDocRgVerso] = useState<DocFile>({ file: null, preview: '', status: 'empty' });
  const [docSelfie, setDocSelfie] = useState<DocFile>({ file: null, preview: '', status: 'empty' });
  // PJ docs
  const [docContratoSocial, setDocContratoSocial] = useState<DocFile>({ file: null, preview: '', status: 'empty' });
  const [docCartaoCnpj, setDocCartaoCnpj] = useState<DocFile>({ file: null, preview: '', status: 'empty' });

  const [tipoDocIdentidade, setTipoDocIdentidade] = useState<'cnh' | 'rg'>('cnh');

  // ─── Dados Bancários ─────────────────────────────────────
  const [bancoSelecionado, setBancoSelecionado] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [tipoConta, setTipoConta] = useState<'corrente' | 'poupanca'>('corrente');
  const [titularNome, setTitularNome] = useState('');
  const [titularDocumento, setTitularDocumento] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('');
  const [chavePix, setChavePix] = useState('');

  // ─── Handlers ────────────────────────────────────────────
  const [validandoDoc, setValidandoDoc] = useState<string | null>(null);

  // Converter File para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Validar documento via IA
  const validarDocumentoIA = async (file: File, tipoEsperado: string): Promise<{ valid: boolean; message: string }> => {
    try {
      // Só validar imagens (não PDFs)
      if (!file.type.startsWith('image/')) {
        return { valid: true, message: 'PDF aceito — verificação manual' };
      }
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/auth/corretor/validar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, tipoEsperado }),
      });
      const data = await res.json();
      return { valid: data.valid, message: data.message };
    } catch {
      // Em caso de erro de rede, aceitar
      return { valid: true, message: 'Validação indisponível' };
    }
  };

  const handleFileSelect = (
    setter: React.Dispatch<React.SetStateAction<DocFile>>,
    tipoDocValidacao?: 'cnh' | 'rg_frente' | 'rg_verso',
  ) => async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setter({ file: null, preview: '', status: 'error', errorMsg: 'Arquivo muito grande (máx. 10MB)' });
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setter({ file: null, preview: '', status: 'error', errorMsg: 'Formato não aceito' });
      return;
    }

    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    // Se tem tipo de documento para validar, fazer validação via IA
    if (tipoDocValidacao && file.type.startsWith('image/')) {
      setter({ file, preview, status: 'uploading', errorMsg: undefined });
      setValidandoDoc(tipoDocValidacao);
      
      const result = await validarDocumentoIA(file, tipoDocValidacao);
      setValidandoDoc(null);
      
      if (!result.valid) {
        setter({ file: null, preview: '', status: 'error', errorMsg: result.message || 'Este documento não corresponde ao tipo selecionado. Envie o documento correto.' });
        return;
      }
    }

    setter({ file, preview, status: 'selected' });
  };

  const resetFile = (setter: React.Dispatch<React.SetStateAction<DocFile>>) => () => {
    setter({ file: null, preview: '', status: 'empty' });
  };

  // ─── Validação de Documentos ─────────────────────────────
  const docsValidos = (): boolean => {
    if (tipoDocIdentidade === 'cnh') {
      if (docCnh.status !== 'selected' && docCnh.status !== 'uploaded') return false;
    } else {
      if (docRgFrente.status !== 'selected' && docRgFrente.status !== 'uploaded') return false;
      if (docRgVerso.status !== 'selected' && docRgVerso.status !== 'uploaded') return false;
    }
    if (tipoPessoa === 'pj') {
      if (docContratoSocial.status !== 'selected' && docContratoSocial.status !== 'uploaded') return false;
    }
    return true;
  };

  // ─── Validação de Dados Bancários ────────────────────────
  const dadosBancariosValidos = (): boolean => {
    if (!bancoSelecionado) return false;
    if (!agencia.trim()) return false;
    if (!conta.trim()) return false;
    if (!titularNome.trim()) return false;
    if (!titularDocumento.trim()) return false;
    // Validar CPF/CNPJ do titular
    if (!validarDocumento(titularDocumento.trim())) return false;
    return true;
  };

  // ─── Submit Documentos ───────────────────────────────────
  const handleSubmitDocs = async () => {
    if (!docsValidos()) {
      setError('Envie todos os documentos obrigatórios');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('token', token ?? '');
      formData.append('etapa', 'documentos');
      formData.append('tipo_doc_identidade', tipoDocIdentidade);

      if (tipoDocIdentidade === 'cnh' && docCnh.file) {
        formData.append('cnh', docCnh.file);
      } else {
        if (docRgFrente.file) formData.append('rg_frente', docRgFrente.file);
        if (docRgVerso.file) formData.append('rg_verso', docRgVerso.file);
      }
      if (docSelfie.file) formData.append('selfie', docSelfie.file);
      if (tipoPessoa === 'pj') {
        if (docContratoSocial.file) formData.append('contrato_social', docContratoSocial.file);
        if (docCartaoCnpj.file) formData.append('cartao_cnpj', docCartaoCnpj.file);
      }

      const res = await fetch('/api/auth/corretor/onboarding', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar documentos');
        return;
      }

      setEtapa('bancario');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit Dados Bancários ──────────────────────────────
  const handleSubmitBancario = async () => {
    if (!bancoSelecionado || !agencia.trim() || !conta.trim() || !titularNome.trim() || !titularDocumento.trim()) {
      setError('Preencha todos os dados bancários obrigatórios');
      return;
    }
    if (!validarDocumento(titularDocumento.trim())) {
      setError('CPF/CNPJ do titular inválido. Verifique os números digitados.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const banco = BANCOS.find((b) => b.codigo === bancoSelecionado);

      const res = await fetch('/api/auth/corretor/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          etapa: 'bancario',
          banco_codigo: bancoSelecionado,
          banco_nome: banco?.nome ?? 'Outro',
          agencia: agencia.trim(),
          conta: conta.trim(),
          tipo_conta: tipoConta,
          titular_nome: titularNome.trim(),
          titular_documento: titularDocumento.trim(),
          tipo_chave_pix: tipoChavePix || null,
          chave_pix: chavePix.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar dados bancários');
        return;
      }

      setEtapa('completo');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Tela de Conclusão ───────────────────────────────────
  if (etapa === 'completo') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative text-center max-w-md sm:max-w-lg w-full"
        >
          <div className="h-20 w-20 sm:h-24 sm:w-24 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" />
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3">
            Onboarding Completo! 🎉
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/50 leading-relaxed mb-6">
            Seus documentos e dados bancários foram enviados com sucesso.
            Nossa equipe irá verificar as informações e liberar seu acesso completo em breve.
          </p>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-[#D4AF37] mt-0.5 shrink-0" />
              <p className="text-sm sm:text-base text-[#D4AF37]/80 text-left">
                A verificação dos documentos pode levar até 48h úteis. Você receberá um e-mail
                quando seu acesso estiver completamente liberado.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/corretor/login')}
            className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
          >
            Ir para o Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Etapas Labels ───────────────────────────────────────
  const etapas = [
    { key: 'documentos', label: 'Documentos', icon: FileText },
    { key: 'bancario', label: 'Dados Bancários', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <div className="mx-auto mb-3 sm:mb-4 w-32 sm:w-40 md:w-48 h-auto">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={192}
              height={64}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
            Onboarding do <span className="text-[#D4AF37]">Corretor</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/40 mt-1 sm:mt-2">
            Complete seu cadastro para ativar sua conta
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6 md:mb-8">
          {etapas.map((e, index) => {
            const EtapaIcon = e.icon;
            const isCurrent = etapa === e.key;
            const isPast = etapa === 'bancario' && e.key === 'documentos';
            return (
              <div key={e.key} className="flex items-center gap-2 sm:gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all',
                    isCurrent
                      ? 'bg-[#D4AF37] text-black'
                      : isPast
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-white/30',
                  )}>
                    {isPast ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : <EtapaIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                  </div>
                  <span className={cn(
                    'text-[10px] sm:text-xs md:text-sm mt-1 font-medium',
                    isCurrent ? 'text-[#D4AF37]' : isPast ? 'text-green-400/60' : 'text-white/20',
                  )}>
                    {e.label}
                  </span>
                </div>
                {index < etapas.length - 1 && (
                  <div className={cn(
                    'w-10 sm:w-14 md:w-20 h-px mb-5',
                    isPast ? 'bg-green-500/30' : 'bg-white/10',
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {/* ──── Etapa 1: Documentos ──── */}
            {etapa === 'documentos' && (
              <motion.div
                key="documentos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white flex items-center gap-2">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
                  Envio de Documentos
                </h3>

                <p className="text-xs sm:text-sm md:text-base text-white/50">
                  Envie os documentos abaixo para verificação. Aceitos: JPG, PNG ou PDF (até 10MB cada).
                </p>

                {/* Tipo de documento de identidade */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">
                    Documento de Identidade *
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <button
                      type="button"
                      onClick={() => setTipoDocIdentidade('cnh')}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all',
                        tipoDocIdentidade === 'cnh'
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                          : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                      )}
                    >
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      CNH
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDocIdentidade('rg')}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all',
                        tipoDocIdentidade === 'rg'
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                          : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                      )}
                    >
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      RG (Frente + Verso)
                    </button>
                  </div>

                  {tipoDocIdentidade === 'cnh' ? (
                    <FileUploadCard
                      label="CNH (Carteira Nacional de Habilitação)"
                      description="Foto legível de frente e verso"
                      icon={FileText}
                      required
                      docFile={docCnh}
                      onFileSelect={handleFileSelect(setDocCnh, 'cnh')}
                      onRemove={resetFile(setDocCnh)}
                      validating={validandoDoc === 'cnh'}
                    />
                  ) : (
                    <div className="space-y-3">
                      <FileUploadCard
                        label="RG — Frente"
                        description="Foto legível da frente do RG"
                        icon={FileText}
                        required
                        docFile={docRgFrente}
                        onFileSelect={handleFileSelect(setDocRgFrente, 'rg_frente')}
                        onRemove={resetFile(setDocRgFrente)}
                        validating={validandoDoc === 'rg_frente'}
                      />
                      <FileUploadCard
                        label="RG — Verso"
                        description="Foto legível do verso do RG"
                        icon={FileText}
                        required
                        docFile={docRgVerso}
                        onFileSelect={handleFileSelect(setDocRgVerso, 'rg_verso')}
                        onRemove={resetFile(setDocRgVerso)}
                        validating={validandoDoc === 'rg_verso'}
                      />
                    </div>
                  )}
                </div>

                {/* Selfie (opcional) — com câmera */}
                <SelfieCaptureCard
                  docFile={docSelfie}
                  onFileSelect={handleFileSelect(setDocSelfie)}
                  onRemove={resetFile(setDocSelfie)}
                />

                {/* Documentos PJ */}
                {tipoPessoa === 'pj' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="h-px bg-white/[0.08]" />
                    <h4 className="text-sm sm:text-base md:text-lg text-white font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
                      Documentos da Empresa (PJ)
                    </h4>

                    <FileUploadCard
                      label="Contrato Social / Estatuto"
                      description="Última alteração contratual"
                      icon={Building2}
                      required
                      docFile={docContratoSocial}
                      onFileSelect={handleFileSelect(setDocContratoSocial)}
                      onRemove={resetFile(setDocContratoSocial)}
                    />

                    <FileUploadCard
                      label="Cartão CNPJ"
                      description="Comprovante de inscrição e situação cadastral"
                      icon={FileText}
                      required={false}
                      docFile={docCartaoCnpj}
                      onFileSelect={handleFileSelect(setDocCartaoCnpj)}
                      onRemove={resetFile(setDocCartaoCnpj)}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ──── Etapa 2: Dados Bancários ──── */}
            {etapa === 'bancario' && (
              <motion.div
                key="bancario"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white flex items-center gap-2">
                  <Landmark className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
                  Dados Bancários para Recebimento
                </h3>

                <p className="text-xs sm:text-sm md:text-base text-white/50">
                  Informe sua conta bancária para recebimento de comissões.
                </p>

                {/* Banco */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">
                    Banco *
                  </label>
                  <select
                    value={bancoSelecionado}
                    onChange={(e) => setBancoSelecionado(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg text-white outline-none focus:border-[#D4AF37]/40 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0B1215]">Selecione o banco</option>
                    {BANCOS.map((b) => (
                      <option key={b.codigo} value={b.codigo} className="bg-[#0B1215]">
                        {b.codigo} — {b.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agência + Conta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Agência *</label>
                    <input
                      type="text"
                      value={agencia}
                      onChange={(e) => setAgencia(e.target.value)}
                      placeholder="0001"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Conta *</label>
                    <input
                      type="text"
                      value={conta}
                      onChange={(e) => setConta(e.target.value)}
                      placeholder="12345-6"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Tipo Conta */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">Tipo de Conta *</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoConta('corrente')}
                      className={cn(
                        'py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all',
                        tipoConta === 'corrente'
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                          : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                      )}
                    >
                      Conta Corrente
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoConta('poupanca')}
                      className={cn(
                        'py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all',
                        tipoConta === 'poupanca'
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                          : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                      )}
                    >
                      Poupança
                    </button>
                  </div>
                </div>

                {/* Titular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Nome do Titular *</label>
                    <input
                      type="text"
                      value={titularNome}
                      onChange={(e) => setTitularNome(e.target.value)}
                      placeholder="Nome completo do titular"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">CPF/CNPJ do Titular *</label>
                    <input
                      type="text"
                      value={titularDocumento}
                      onChange={(e) => setTitularDocumento(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                </div>

                {/* PIX (opcional) */}
                <div className="bg-white/[0.02] rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
                    PIX <span className="text-white/30 text-xs sm:text-sm font-normal">(opcional)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIPOS_CHAVE_PIX.map((tipo) => (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => setTipoChavePix(tipoChavePix === tipo.value ? '' : tipo.value)}
                        className={cn(
                          'px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all',
                          tipoChavePix === tipo.value
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                            : 'bg-white/5 text-white/50 border border-transparent hover:border-white/10',
                        )}
                      >
                        {tipo.label}
                      </button>
                    ))}
                  </div>

                  {tipoChavePix && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <input
                        type="text"
                        value={chavePix}
                        onChange={(e) => setChavePix(e.target.value)}
                        placeholder={
                          tipoChavePix === 'cpf' ? '000.000.000-00' :
                          tipoChavePix === 'cnpj' ? '00.000.000/0000-00' :
                          tipoChavePix === 'email' ? 'seuemail@email.com' :
                          tipoChavePix === 'telefone' ? '(21) 99999-9999' :
                          'Cole a chave aleatória'
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs sm:text-sm md:text-base text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 sm:px-4 sm:py-3 mt-4"
            >
              {error}
            </motion.p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5 sm:mt-6 md:mt-8">
            <button
              onClick={() => {
                setError('');
                if (etapa === 'documentos') router.push('/dashboard/corretor/login');
                else setEtapa('documentos');
              }}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-xl text-sm sm:text-base md:text-lg text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Voltar
            </button>

            <button
              onClick={etapa === 'documentos' ? handleSubmitDocs : handleSubmitBancario}
              disabled={loading || (etapa === 'documentos' ? !docsValidos() : !dadosBancariosValidos())}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-xl text-sm sm:text-base md:text-lg font-semibold transition-all',
                loading || (etapa === 'documentos' ? !docsValidos() : !dadosBancariosValidos())
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20',
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Enviando...
                </>
              ) : etapa === 'documentos' ? (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              ) : (
                'Finalizar Onboarding'
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] sm:text-xs md:text-sm text-white/20 text-center mt-4 sm:mt-6">
          © {new Date().getFullYear()} Humano Saúde · Todos os direitos reservados
        </p>
      </motion.div>
    </div>
  );
}
