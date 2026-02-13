'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Loader2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MousePointer,
  DollarSign,
  Target,
} from 'lucide-react';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  purchases: number;
  roas: number;
}

const PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_14d', label: 'Últimos 14 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
];

export default function MetaAdsCampanhasPage() {
  const [period, setPeriod] = useState('last_7d');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/metrics?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao buscar campanhas');
      setCampaigns(json.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const statusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>;
    if (s === 'PAUSED') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pausada</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CAMPANHAS
        </h1>
        <p className="mt-2 text-gray-400">Todas as campanhas da conta Meta Ads com métricas em tempo real</p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchCampaigns} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Campaigns Table */}
      {!loading && !error && (
        <Card className="border-white/10 bg-[#0a0a0a]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base text-white">
              <span>Campanhas ({campaigns.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Nenhuma campanha encontrada no período selecionado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-gray-400">
                      <th className="pb-3 pr-4">Campanha</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4 text-right">Gasto</th>
                      <th className="pb-3 pr-4 text-right">Impressões</th>
                      <th className="pb-3 pr-4 text-right">Cliques</th>
                      <th className="pb-3 pr-4 text-right">CTR</th>
                      <th className="pb-3 pr-4 text-right">CPC</th>
                      <th className="pb-3 pr-4 text-right">Leads</th>
                      <th className="pb-3 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.campaign_id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4">
                          <p className="max-w-[250px] truncate font-medium text-white">{c.campaign_name}</p>
                          <p className="text-xs text-gray-500">{c.objective}</p>
                        </td>
                        <td className="py-3 pr-4">{statusBadge(c.status)}</td>
                        <td className="py-3 pr-4 text-right text-white">R$ {c.spend?.toFixed(2) || '0.00'}</td>
                        <td className="py-3 pr-4 text-right text-gray-300">{(c.impressions || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-3 pr-4 text-right text-gray-300">{(c.clicks || 0).toLocaleString('pt-BR')}</td>
                        <td className="py-3 pr-4 text-right text-gray-300">{c.ctr?.toFixed(2) || '0.00'}%</td>
                        <td className="py-3 pr-4 text-right text-gray-300">R$ {c.cpc?.toFixed(2) || '0.00'}</td>
                        <td className="py-3 pr-4 text-right text-green-400">{c.leads || 0}</td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${c.roas >= 3 ? 'text-green-400' : c.roas >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {c.roas?.toFixed(2) || '0.00'}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Totals Summary */}
      {!loading && !error && campaigns.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Gasto Total', value: `R$ ${campaigns.reduce((s, c) => s + (c.spend || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'text-red-400' },
            { label: 'Impressões', value: campaigns.reduce((s, c) => s + (c.impressions || 0), 0).toLocaleString('pt-BR'), icon: Eye, color: 'text-blue-400' },
            { label: 'Cliques', value: campaigns.reduce((s, c) => s + (c.clicks || 0), 0).toLocaleString('pt-BR'), icon: MousePointer, color: 'text-purple-400' },
            { label: 'Leads', value: campaigns.reduce((s, c) => s + (c.leads || 0), 0).toLocaleString('pt-BR'), icon: Target, color: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
