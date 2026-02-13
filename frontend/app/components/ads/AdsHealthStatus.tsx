'use client';

// =====================================================
// COMPONENT: AdsHealthStatus — Status de Conexão Meta
// Badge visual de status da integração
// =====================================================

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  meta: {
    configured: boolean;
    connected: boolean;
    adAccountId: string | null;
    pageId: string | null;
    pixelConfigured: boolean;
    error?: string;
  };
  environment: {
    accessToken: boolean;
    adAccountId: boolean;
    pageId: boolean;
    pixelId: boolean;
    pageAccessToken: boolean;
    openaiKey: boolean;
  };
  timestamp: string;
}

interface AdsHealthStatusProps {
  compact?: boolean;
  className?: string;
}

export default function AdsHealthStatus({ compact = false, className = '' }: AdsHealthStatusProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ads/health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Verificando conexão...</span>
      </div>
    );
  }

  // Modo compacto: apenas badge
  if (compact) {
    const status = health?.status || 'error';
    return (
      <Badge
        variant={status === 'ok' ? 'default' : status === 'degraded' ? 'secondary' : 'destructive'}
        className={`gap-1 ${className}`}
      >
        {status === 'ok' && <CheckCircle2 className="h-3 w-3" />}
        {status === 'degraded' && <AlertTriangle className="h-3 w-3" />}
        {status === 'error' && <XCircle className="h-3 w-3" />}
        Meta Ads: {status === 'ok' ? 'Conectado' : status === 'degraded' ? 'Degradado' : 'Desconectado'}
      </Badge>
    );
  }

  // Modo completo: card detalhado
  const statusIcon = {
    ok: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    degraded: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
  };

  const envItems = health?.environment
    ? [
        { label: 'Access Token', ok: health.environment.accessToken },
        { label: 'Ad Account ID', ok: health.environment.adAccountId },
        { label: 'Page ID', ok: health.environment.pageId },
        { label: 'Pixel ID', ok: health.environment.pixelId },
        { label: 'Page Access Token', ok: health.environment.pageAccessToken },
        { label: 'OpenAI API Key', ok: health.environment.openaiKey },
      ]
    : [];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {statusIcon[health?.status || 'error']}
          Status Meta Ads
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Conexão */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Conexão API</span>
          <Badge variant={health?.meta.connected ? 'default' : 'destructive'}>
            {health?.meta.connected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {/* Account */}
        {health?.meta.adAccountId && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conta</span>
            <span className="font-mono text-xs">{health.meta.adAccountId}</span>
          </div>
        )}

        {/* Error */}
        {health?.meta.error && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {health.meta.error}
          </div>
        )}

        {/* Environment vars */}
        <div className="space-y-1 border-t pt-2">
          <p className="text-xs font-medium text-muted-foreground">Variáveis de Ambiente</p>
          <div className="grid grid-cols-2 gap-1">
            {envItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1 text-xs">
                {item.ok ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400" />
                )}
                <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
