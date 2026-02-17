'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  listPropostasFilaAdmin,
  updatePropostaFilaStatus,
  type PropostaFilaItem,
  type PropostaFilaStatus,
} from '@/app/actions/propostas-fila';
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

export default function PropostasFilaAdminPage() {
  const [items, setItems] = useState<PropostaFilaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, PropostaFilaStatus>>({});
  const [obsDrafts, setObsDrafts] = useState<Record<string, string>>({});

  const loadItems = useCallback(async () => {
    setLoading(true);

    const result = await listPropostasFilaAdmin();
    if (result.success && result.data) {
      setItems(result.data);
      setStatusDrafts((prev) => {
        const next: Record<string, PropostaFilaStatus> = { ...prev };
        result.data?.forEach((item) => {
          next[item.id] = item.status;
        });
        return next;
      });
      setObsDrafts((prev) => {
        const next: Record<string, string> = { ...prev };
        result.data?.forEach((item) => {
          if (next[item.id] === undefined) {
            next[item.id] = item.status_observacao || '';
          }
        });
        return next;
      });
    } else if (result.error) {
      toast.error('Não foi possível carregar a fila de propostas.', {
        description: result.error,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'todas' && item.status !== statusFilter) return false;

      if (!normalizedSearch) return true;

      const leadName = item.lead?.nome?.toLowerCase() || '';
      const leadPhone = item.lead?.whatsapp?.toLowerCase() || '';
      const corretorName = item.corretor?.nome?.toLowerCase() || '';
      const category = item.categoria?.toLowerCase() || '';

      return (
        leadName.includes(normalizedSearch) ||
        leadPhone.includes(normalizedSearch) ||
        corretorName.includes(normalizedSearch) ||
        category.includes(normalizedSearch)
      );
    });
  }, [items, search, statusFilter]);

  const handleSaveStatus = useCallback(
    async (itemId: string) => {
      const status = statusDrafts[itemId];
      if (!status) return;

      setUpdatingId(itemId);
      const result = await updatePropostaFilaStatus({
        fila_id: itemId,
        status,
        observacao: obsDrafts[itemId] || null,
      });

      if (result.success && result.data) {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? result.data || item : item)),
        );
        toast.success('Status da proposta atualizado.');
      } else {
        toast.error('Falha ao atualizar status.', {
          description: result.error || 'Erro desconhecido.',
        });
      }

      setUpdatingId(null);
    },
    [obsDrafts, statusDrafts],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Fila de propostas</h1>
          <p className="mt-1 text-sm text-white/60">
            Propostas recebidas dos corretores para envio e acompanhamento com operadora.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-black/30 text-white hover:bg-black/50"
          onClick={() => {
            void loadItems();
          }}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card data-tour="admin-fila-filtros" className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-4 w-4 text-[#D4AF37]" />
            Filtros
          </CardTitle>
          <CardDescription className="text-white/60">
            Refine por status, corretor ou lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-white/75">Buscar</Label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Lead, telefone, corretor ou categoria"
              className="border-white/20 bg-black/40 text-white placeholder:text-white/45"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-white/75">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="border-white/20 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/20 bg-[#0a0a0a] text-white">
                <SelectItem value="todas">Todas</SelectItem>
                {PROPOSTA_FILA_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PROPOSTA_FILA_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card data-tour="admin-fila-lista" className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white">Itens da fila</CardTitle>
          <CardDescription className="text-white/60">
            {filteredItems.length} proposta(s) filtrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-white/55">Carregando propostas...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-white/55">Nenhuma proposta encontrada com os filtros atuais.</p>
          ) : (
            filteredItems.map((item) => {
              const draftStatus = statusDrafts[item.id] || item.status;
              const isUpdating = updatingId === item.id;

              return (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {item.lead?.nome || 'Lead sem nome'}
                      </p>
                      <p className="text-xs text-white/50">
                        {item.lead?.whatsapp || 'Sem telefone'} · Corretor: {item.corretor?.nome || 'Não informado'}
                      </p>
                      <p className="text-xs text-white/45">
                        Categoria: {item.categoria || 'Não informada'} · Recebida em {formatDate(item.created_at)}
                      </p>
                    </div>

                    <Badge variant="outline" className={PROPOSTA_FILA_STATUS_BADGE_CLASS[item.status]}>
                      {PROPOSTA_FILA_STATUS_LABELS[item.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-white/65">Atualizar status</Label>
                      <Select
                        value={draftStatus}
                        onValueChange={(value) => {
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [item.id]: value as PropostaFilaStatus,
                          }));
                        }}
                      >
                        <SelectTrigger className="border-white/20 bg-black/40 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/20 bg-[#0a0a0a] text-white">
                          {PROPOSTA_FILA_STATUS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {PROPOSTA_FILA_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs text-white/65">Observação operacional</Label>
                      <Input
                        value={obsDrafts[item.id] || ''}
                        onChange={(event) => {
                          setObsDrafts((prev) => ({
                            ...prev,
                            [item.id]: event.target.value,
                          }));
                        }}
                        placeholder="Ex: aguardando retorno da operadora"
                        className="border-white/20 bg-black/40 text-white placeholder:text-white/45"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-white/60 md:grid-cols-4">
                    <p>Enviada: {formatDate(item.enviada_operadora_em)}</p>
                    <p>Análise: {formatDate(item.em_analise_em)}</p>
                    <p>Boleto: {formatDate(item.boleto_gerado_em)}</p>
                    <p>Implantada: {formatDate(item.implantada_em)}</p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        void handleSaveStatus(item.id);
                      }}
                      disabled={isUpdating}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isUpdating ? 'Salvando...' : 'Salvar status'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
