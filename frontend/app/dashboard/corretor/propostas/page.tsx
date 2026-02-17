'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScannerDocumentos from '@/app/components/ScannerDocumentos';
import { listPropostasFilaCorretor, type PropostaFilaItem } from '@/app/actions/propostas-fila';
import type { PDFExtraido } from '@/app/services/api';
import { useCorretorId } from '../hooks/useCorretorToken';
import {
  PROPOSTA_FILA_STATUS_BADGE_CLASS,
  PROPOSTA_FILA_STATUS_LABELS,
} from '@/lib/propostas-fila-status';
import { getExtractionQuickSummary } from '@/lib/extraction-summary';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

export default function CorretorPropostasPage() {
  const corretorId = useCorretorId();
  const [lastExtraction, setLastExtraction] = useState<PDFExtraido | null>(null);
  const [fila, setFila] = useState<PropostaFilaItem[]>([]);
  const [loadingFila, setLoadingFila] = useState(false);

  const loadFila = useCallback(async () => {
    if (!corretorId) return;
    setLoadingFila(true);

    const result = await listPropostasFilaCorretor();
    if (result.success && result.data) {
      setFila(result.data);
    } else if (result.error) {
      toast.error('Não foi possível carregar suas propostas.', {
        description: result.error,
      });
    }

    setLoadingFila(false);
  }, [corretorId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFila();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadFila]);

  const stats = useMemo(() => {
    const base = {
      enviada: 0,
      em_analise: 0,
      boleto_gerado: 0,
      implantada: 0,
    };

    fila.forEach((item) => {
      base[item.status] += 1;
    });

    return base;
  }, [fila]);
  const extractionSummary = getExtractionQuickSummary(lastExtraction);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#D4AF37]" />
            Propostas
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Envie com Scanner Inteligente e acompanhe o andamento até implantação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-black/30 text-white hover:bg-black/50"
            onClick={() => {
              void loadFila();
            }}
            disabled={loadingFila}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingFila ? 'animate-spin' : ''}`} />
            Atualizar status
          </Button>
          <Button asChild>
            <Link href="/dashboard/corretor/propostas/fila">
              Ver fila completa
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-white/10 bg-black/30">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Enviadas</p>
            <p className="text-2xl font-bold text-blue-200">{stats.enviada}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/30">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Em análise</p>
            <p className="text-2xl font-bold text-amber-200">{stats.em_analise}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/30">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Boleto gerado</p>
            <p className="text-2xl font-bold text-purple-200">{stats.boleto_gerado}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/30">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Implantadas</p>
            <p className="text-2xl font-bold text-green-200">{stats.implantada}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div data-tour="corretor-scanner" className="xl:col-span-2">
          <ScannerDocumentos
            onDadosExtraidos={setLastExtraction}
            corretorId={corretorId || undefined}
            registrarFilaProposta
            permitirLeadExistente
            onPropostaSalva={loadFila}
          />
        </div>

        <div data-tour="corretor-fila" className="space-y-4">
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white text-base">Últimas propostas enviadas</CardTitle>
              <CardDescription className="text-white/60">
                Status atual da sua fila operacional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {fila.length === 0 ? (
                <p className="text-sm text-white/55">Nenhuma proposta enviada ainda.</p>
              ) : (
                fila.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {item.lead?.nome || 'Lead sem nome'}
                        </p>
                        <p className="text-xs text-white/45">
                          {item.categoria || 'Categoria não informada'} · {formatDate(item.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={PROPOSTA_FILA_STATUS_BADGE_CLASS[item.status]}
                      >
                        {PROPOSTA_FILA_STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-[#D4AF37]" />
                Última extração IA
              </CardTitle>
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
    </div>
  );
}
