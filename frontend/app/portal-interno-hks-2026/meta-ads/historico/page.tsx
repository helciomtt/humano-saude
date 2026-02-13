'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Loader2,
  Clock,
  Rocket,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface CampaignLog {
  id: string;
  campaign_id: string;
  adset_id: string;
  ad_ids: string[];
  objective: string;
  daily_budget: number;
  target_audience: string;
  images_count: number;
  status: 'success' | 'error';
  error_message?: string;
  created_at: string;
}

interface OptimizationLog {
  id: string;
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  action_type: 'PAUSE' | 'SCALE' | 'NO_ACTION';
  reason: string;
  created_at: string;
}

export default function MetaAdsHistoricoPage() {
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [optimizationLogs, setOptimizationLogs] = useState<OptimizationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'lancamentos' | 'otimizacoes'>('lancamentos');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campRes, optRes] = await Promise.all([
        fetch('/api/ads/cockpit?period=last_30d'),
        fetch('/api/ads/cockpit?period=last_30d'),
      ]);
      const campJson = await campRes.json();

      // Fetch from Supabase directly via action
      const { supabase } = await import('@/lib/supabase');

      const [{ data: cLogs }, { data: oLogs }] = await Promise.all([
        supabase
          .from('ads_campaigns_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('optimization_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setCampaignLogs(cLogs || []);
      setOptimizationLogs(oLogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionIcon = {
    PAUSE: <XCircle className="h-4 w-4 text-red-400" />,
    SCALE: <Rocket className="h-4 w-4 text-green-400" />,
    NO_ACTION: <CheckCircle2 className="h-4 w-4 text-gray-400" />,
  };

  const actionLabel = {
    PAUSE: 'Pausado',
    SCALE: 'Escalado',
    NO_ACTION: 'Sem ação',
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          HISTÓRICO
        </h1>
        <p className="mt-2 text-gray-400">Lançamentos de campanhas e ações de otimização automática</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={tab === 'lancamentos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('lancamentos')}
        >
          <Rocket className="mr-2 h-4 w-4" />
          Lançamentos ({campaignLogs.length})
        </Button>
        <Button
          variant={tab === 'otimizacoes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('otimizacoes')}
        >
          <Clock className="mr-2 h-4 w-4" />
          Otimizações ({optimizationLogs.length})
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Lançamentos */}
      {!loading && tab === 'lancamentos' && (
        <div className="space-y-3">
          {campaignLogs.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0a0a]">
              <CardContent className="py-16 text-center">
                <Rocket className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-lg font-medium text-white">Nenhum lançamento registrado</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Quando você lançar campanhas pelo sistema, o histórico aparecerá aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            campaignLogs.map((log) => (
              <Card key={log.id} className="border-white/10 bg-[#0a0a0a]">
                <CardContent className="flex items-center gap-4 py-4">
                  {log.status === 'success' ? (
                    <CheckCircle2 className="h-8 w-8 shrink-0 text-green-400" />
                  ) : (
                    <AlertCircle className="h-8 w-8 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{log.objective}</p>
                      <Badge className={log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {log.status === 'success' ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      Público: {log.target_audience} • Budget: R$ {log.daily_budget}/dia • {log.images_count} imagens
                    </p>
                    {log.error_message && (
                      <p className="mt-1 text-xs text-red-400">{log.error_message}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Otimizações */}
      {!loading && tab === 'otimizacoes' && (
        <div className="space-y-3">
          {optimizationLogs.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0a0a]">
              <CardContent className="py-16 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-lg font-medium text-white">Nenhuma otimização registrada</h3>
                <p className="mt-2 text-sm text-gray-400">
                  As otimizações automáticas (PAUSE/SCALE) aparecerão aqui quando o CRON executar
                </p>
              </CardContent>
            </Card>
          ) : (
            optimizationLogs.map((log) => (
              <Card key={log.id} className="border-white/10 bg-[#0a0a0a]">
                <CardContent className="flex items-center gap-4 py-4">
                  {actionIcon[log.action_type]}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{log.ad_name}</p>
                      <Badge
                        className={
                          log.action_type === 'PAUSE'
                            ? 'bg-red-500/20 text-red-400'
                            : log.action_type === 'SCALE'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {actionLabel[log.action_type]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{log.reason}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
