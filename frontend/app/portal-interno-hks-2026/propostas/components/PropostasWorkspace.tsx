'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScannerDocumentos from '@/app/components/ScannerDocumentos';
import type { PDFExtraido } from '@/app/services/api';
import { CheckCircle2, ClipboardList, ListChecks, ScanLine } from 'lucide-react';
import { getExtractionQuickSummary } from '@/lib/extraction-summary';

type ProposalMode = 'ia' | 'manual';

interface PropostasWorkspaceProps {
  initialMode?: ProposalMode;
}

export default function PropostasWorkspace({ initialMode = 'ia' }: PropostasWorkspaceProps) {
  const [mode, setMode] = useState<ProposalMode>(initialMode);
  const [lastExtraction, setLastExtraction] = useState<PDFExtraido | null>(null);
  const extractionSummary = getExtractionQuickSummary(lastExtraction);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Geração de Propostas</h1>
          <p className="mt-1 text-sm text-white/60">
            Escolha o fluxo por IA ou manual para montar a proposta completa.
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Fluxo operacional
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className={mode === 'ia' ? 'border-[#D4AF37]/35 bg-[#D4AF37]/5' : 'border-white/10 bg-black/30'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ScanLine className="h-5 w-5 text-[#D4AF37]" />
              Scanner Inteligente
            </CardTitle>
            <CardDescription className="text-white/65">
              Processa documentos com IA e preenche os indícios automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#D4AF37] text-white hover:bg-[#E8C25B]">
              <Link href="/portal-interno-hks-2026/propostas/ia" onClick={() => setMode('ia')}>
                Usar fluxo IA
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={mode === 'manual' ? 'border-[#D4AF37]/35 bg-[#D4AF37]/5' : 'border-white/10 bg-black/30'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ClipboardList className="h-5 w-5 text-[#D4AF37]" />
              Manual (um a um)
            </CardTitle>
            <CardDescription className="text-white/65">
              Digite os dados e anexe documento por documento, beneficiário por beneficiário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#D4AF37] text-white hover:bg-[#E8C25B]">
              <Link href="/portal-interno-hks-2026/propostas/manual" onClick={() => setMode('manual')}>
                Usar fluxo manual
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ListChecks className="h-5 w-5 text-[#D4AF37]" />
              Fila de propostas
            </CardTitle>
            <CardDescription className="text-white/65">
              Acompanhe propostas enviadas por corretores e atualize o andamento operacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-[#D4AF37]/35 bg-black/40 text-white hover:bg-black/60 hover:text-white">
              <Link href="/portal-interno-hks-2026/propostas/fila">
                Abrir fila operacional
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {mode === 'manual' && (
        <Card className="border-white/10 bg-black/30">
          <CardContent className="p-4 text-sm text-white/80">
            <p className="font-medium text-white">Modo manual ativo</p>
            <p className="mt-1">
              Preencha os campos obrigatórios e anexe cada documento no checklist. O sistema permite validação
              um a um por modalidade e beneficiário.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScannerDocumentos key={mode} onDadosExtraidos={setLastExtraction} />
        </div>

        <Card className="h-fit border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="text-white">Última extração</CardTitle>
            <CardDescription className="text-white/60">
              Resumo do último documento processado no fluxo atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/80">
            <p>
              <span className="text-white/50">{extractionSummary.entityLabel}:</span> {extractionSummary.entityValue}
            </p>
            <p>
              <span className="text-white/50">{extractionSummary.peopleLabel}:</span> {extractionSummary.peopleValue}
            </p>
            <p>
              <span className="text-white/50">{extractionSummary.ageLabel}:</span> {extractionSummary.ageValue}
            </p>
            <p>
              <span className="text-white/50">Documento:</span> {extractionSummary.documentValue}
            </p>
            <p>
              <span className="text-white/50">Confiança:</span> {extractionSummary.confidenceValue}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
