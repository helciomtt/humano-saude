'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  listPropostasFilaCorretor,
  type PropostaFilaItem,
  type PropostaFilaStatus,
} from '@/app/actions/propostas-fila';
import { useCorretorId } from '../../hooks/useCorretorToken';
import {
  PROPOSTA_FILA_STATUS,
  PROPOSTA_FILA_STATUS_BADGE_CLASS,
  PROPOSTA_FILA_STATUS_LABELS,
} from '@/lib/propostas-fila-status';

type StatusFilter = PropostaFilaStatus | 'todas';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

export default function CorretorPropostasFilaPage() {
  const corretorId = useCorretorId();
  const [items, setItems] = useState<PropostaFilaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');

  const load = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const result = await listPropostasFilaCorretor();
    if (result.success && result.data) {
      setItems(result.data);
    } else if (result.error) {
      toast.error('Não foi possível carregar a fila.', { description: result.error });
    }
    setLoading(false);
  }, [corretorId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'todas') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[#D4AF37]" />
            Fila de propostas
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Acompanhe cada proposta enviada e o avanço operacional.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-black/30 text-white hover:bg-black/50"
          onClick={() => {
            void load();
          }}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setStatusFilter('todas')}
          className={
            statusFilter === 'todas'
              ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F8D970]'
              : 'border-white/20 bg-black/30 text-white hover:bg-black/50'
          }
        >
          Todas
        </Button>
        {PROPOSTA_FILA_STATUS.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setStatusFilter(status)}
            className={
              statusFilter === status
                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F8D970]'
                : 'border-white/20 bg-black/30 text-white hover:bg-black/50'
            }
          >
            {PROPOSTA_FILA_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      <Card className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white">Propostas recebidas</CardTitle>
          <CardDescription className="text-white/60">
            {filteredItems.length} proposta(s) exibida(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-white/55">Carregando...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-white/55">Nenhuma proposta encontrada para este filtro.</p>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.lead?.nome || 'Lead sem nome'}</p>
                    <p className="text-xs text-white/45">
                      {item.lead?.whatsapp || 'Sem telefone'} · {item.categoria || 'Categoria não informada'}
                    </p>
                  </div>
                  <Badge variant="outline" className={PROPOSTA_FILA_STATUS_BADGE_CLASS[item.status]}>
                    {PROPOSTA_FILA_STATUS_LABELS[item.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs text-white/65 md:grid-cols-2">
                  <p>
                    <span className="text-white/45">Criada em:</span> {formatDate(item.created_at)}
                  </p>
                  <p>
                    <span className="text-white/45">Atualizada em:</span> {formatDate(item.updated_at)}
                  </p>
                  <p>
                    <span className="text-white/45">Enviada:</span> {formatDate(item.enviada_operadora_em)}
                  </p>
                  <p>
                    <span className="text-white/45">Em análise:</span> {formatDate(item.em_analise_em)}
                  </p>
                  <p>
                    <span className="text-white/45">Boleto:</span> {formatDate(item.boleto_gerado_em)}
                  </p>
                  <p>
                    <span className="text-white/45">Implantação:</span> {formatDate(item.implantada_em)}
                  </p>
                </div>

                {item.status_observacao && (
                  <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/75">
                    <span className="text-white/50">Observação:</span> {item.status_observacao}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
