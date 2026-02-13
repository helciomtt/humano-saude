'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, XCircle, Sparkles, Loader2 } from 'lucide-react';

interface PDFExtraido {
  idades: number[];
  operadora: string | null;
  valor_atual: number | null;
  tipo_plano: string | null;
  nome_beneficiarios: string[];
  observacoes: string | null;
  confianca: string;
  texto_extraido_preview: string | null;
  total_caracteres: number;
}

interface ScannerPDFProps {
  onDadosExtraidos: (dados: PDFExtraido) => void;
}

export default function ScannerPDF({ onDadosExtraidos }: ScannerPDFProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [resultado, setResultado] = useState<PDFExtraido | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validarArquivo = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'Apenas arquivos PDF são aceitos';
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo: 10MB';
    }
    
    return null;
  };

  const processarPDF = async (file: File) => {
    const erroValidacao = validarArquivo(file);
    if (erroValidacao) {
      setError(erroValidacao);
      return;
    }

    setFile(file);
    setError('');
    setSuccess(false);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao processar PDF');
      }

      const dados: PDFExtraido = await response.json();
      setResultado(dados);
      setSuccess(true);
      
      // Notificar componente pai com dados extraídos
      onDadosExtraidos(dados);

    } catch (err: any) {
      setError(err.message || 'Erro ao processar PDF');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processarPDF(droppedFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processarPDF(selectedFile);
    }
  };

  const resetar = () => {
    setFile(null);
    setResultado(null);
    setError('');
    setSuccess(false);
    setProgress(0);
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Scanner de PDF com IA
        </CardTitle>
        <CardDescription>
          Faça upload de uma apólice ou proposta para extrair dados automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload */}
        {!file && !isProcessing && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              hover:border-primary hover:bg-primary/5 cursor-pointer
            `}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="pdf-upload"
            />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Arraste e solte seu PDF aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou clique para selecionar
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo: 10MB • Apenas PDF
              </p>
            </div>
          </div>
        )}

        {/* Processando */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Processando com IA...
                </p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Sucesso */}
        {success && resultado && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-semibold">✓ Dados extraídos com sucesso!</p>
                <div className="text-sm space-y-1">
                  <p>• {resultado.idades.length} beneficiário(s) encontrado(s)</p>
                  {resultado.operadora && <p>• Operadora: {resultado.operadora}</p>}
                  {resultado.valor_atual && (
                    <p>• Valor atual: R$ {resultado.valor_atual.toFixed(2)}</p>
                  )}
                  {resultado.tipo_plano && <p>• Tipo: {resultado.tipo_plano}</p>}
                </div>
                <p className="text-xs mt-2 italic">
                  O formulário foi preenchido automaticamente
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botão Resetar */}
        {(file || error) && !isProcessing && (
          <Button
            onClick={resetar}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Fazer novo upload
          </Button>
        )}

        {/* Informações Adicionais */}
        {resultado && resultado.observacoes && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p className="font-semibold mb-1">Observações:</p>
            <p>{resultado.observacoes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
