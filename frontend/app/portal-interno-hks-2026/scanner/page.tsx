'use client';

import { useState } from 'react';
import ScannerDocumentos from '@/app/components/ScannerDocumentos';
import type { PDFExtraido } from '@/app/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanLine } from 'lucide-react';
import { getExtractionQuickSummary } from '@/lib/extraction-summary';

export default function ScannerDocumentosPage() {
  const [lastExtraction, setLastExtraction] = useState<PDFExtraido | null>(null);
  const extractionSummary = getExtractionQuickSummary(lastExtraction);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Scanner Inteligente</h1>
          <p className="mt-1 text-sm text-white/60">
            Fluxo operacional para proposta por categoria: Pessoa Física, Adesão e Pessoa Jurídica.
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <ScanLine className="h-3.5 w-3.5" /> Scanner ativo
        </Badge>
      </div>

      <ScannerDocumentos onDadosExtraidos={setLastExtraction} />

      <Card className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white">Último processamento</CardTitle>
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
  );
}
