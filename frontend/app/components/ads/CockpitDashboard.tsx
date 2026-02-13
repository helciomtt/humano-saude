'use client';

// =====================================================
// COMPONENT: CockpitDashboard — Painel Completo Meta Ads
// Combina MetricsCards + Campanhas Ativas + Alertas
// =====================================================

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
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import MetricsCards from './MetricsCards';
import AdsHealthStatus from './AdsHealthStatus';

interface CockpitData {
  success: boolean;
  period: string;
  metrics: {
    totalSpend: number;
    roas: number;
    cpa: number;
    totalLeads: number;
    totalPurchases: number;
  };
  activeCampaigns: {
    total: number;
    list: Array<{ id: string; name: string; status: string }>;
  };
  campaignInsights: Array<{
    campaign_id: string;
    campaign_name: string;
    spend: number;
    roas: number;
    ctr: number;
    purchases: number;
    leads: number;
  }>;
  alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string }>;
  config: {
    pixelConfigured: boolean;
    pageConfigured: boolean;
    instagramConfigured: boolean;
  };
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

export default function CockpitDashboard() {
  const [period, setPeriod] = useState('last_7d');
  const [data, setData] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCockpit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/cockpit?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao buscar cockpit');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchCockpit();
  }, [fetchCockpit]);

  const alertIcon = {
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <AlertTriangle className="h-4 w-4 text-red-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cockpit Meta Ads</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral da performance de campanhas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchCockpit} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Health Status (compact) */}
      <AdsHealthStatus compact />

      {/* Métricas */}
      <MetricsCards period={period} />

      {/* Alertas */}
      {data?.alerts && data.alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md p-2 text-sm ${
                  alert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950'
                    : alert.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-950'
                      : 'bg-blue-50 dark:bg-blue-950'
                }`}
              >
                {alertIcon[alert.type]}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Campanhas ativas + Top performers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Campanhas ativas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              Campanhas Ativas
              {data?.activeCampaigns && (
                <Badge variant="secondary">{data.activeCampaigns.total}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : data?.activeCampaigns?.list?.length ? (
              <div className="space-y-2">
                {data.activeCampaigns.list.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span className="truncate font-medium">{c.name}</span>
                    <Badge variant="default" className="ml-2 shrink-0">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Ativa
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma campanha ativa
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : data?.campaignInsights?.length ? (
              <div className="space-y-2">
                {data.campaignInsights.slice(0, 8).map((c) => (
                  <div key={c.campaign_id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.campaign_name}</p>
                      <p className="text-xs text-muted-foreground">
                        R${c.spend.toFixed(2)} • CTR {c.ctr.toFixed(2)}%
                      </p>
                    </div>
                    <div className="ml-2 flex items-center gap-1 text-xs">
                      {c.roas >= 3 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      ) : c.roas >= 1 ? (
                        <Minus className="h-3.5 w-3.5 text-yellow-500" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className="font-medium">{c.roas.toFixed(2)}x</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sem dados de performance
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Erro geral */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
