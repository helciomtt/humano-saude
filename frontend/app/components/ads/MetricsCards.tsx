'use client';

// =====================================================
// COMPONENT: MetricsCards — Big Numbers de Meta Ads
// Exibe KPIs principais em cards compactos
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  MousePointerClick,
  Eye,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Loader2,
} from 'lucide-react';

interface AdsMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalPurchases: number;
  totalPurchaseValue: number;
  totalLeads: number;
  roas: number;
  cpa: number;
  cpl: number;
  avgCpc: number;
  avgCtr: number;
  avgCpm: number;
}

interface MetricsCardsProps {
  period?: string;
  className?: string;
}

export default function MetricsCards({ period = 'last_7d', className = '' }: MetricsCardsProps) {
  const [metrics, setMetrics] = useState<AdsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ads/metrics?period=${period}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao buscar métricas');
        setMetrics(data.metrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [period]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando métricas...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className={`rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive ${className}`}>
        {error || 'Sem dados disponíveis'}
      </div>
    );
  }

  const cards = [
    {
      title: 'Investimento',
      value: `R$ ${metrics.totalSpend.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'ROAS',
      value: `${metrics.roas.toFixed(2)}x`,
      icon: TrendingUp,
      color: metrics.roas >= 3 ? 'text-green-600' : metrics.roas >= 1 ? 'text-yellow-600' : 'text-red-600',
      bg: metrics.roas >= 3 ? 'bg-green-50' : metrics.roas >= 1 ? 'bg-yellow-50' : 'bg-red-50',
    },
    {
      title: 'Leads',
      value: metrics.totalLeads.toLocaleString('pt-BR'),
      subtitle: metrics.cpl > 0 ? `CPL: R$${metrics.cpl.toFixed(2)}` : undefined,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Conversões',
      value: metrics.totalPurchases.toLocaleString('pt-BR'),
      subtitle: metrics.cpa > 0 ? `CPA: R$${metrics.cpa.toFixed(2)}` : undefined,
      icon: Target,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Cliques',
      value: metrics.totalClicks.toLocaleString('pt-BR'),
      subtitle: `CPC: R$${metrics.avgCpc.toFixed(2)}`,
      icon: MousePointerClick,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Impressões',
      value: metrics.totalImpressions >= 1000
        ? `${(metrics.totalImpressions / 1000).toFixed(1)}K`
        : metrics.totalImpressions.toLocaleString('pt-BR'),
      subtitle: `CTR: ${metrics.avgCtr.toFixed(2)}%`,
      icon: Eye,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      title: 'Alcance',
      value: metrics.totalReach >= 1000
        ? `${(metrics.totalReach / 1000).toFixed(1)}K`
        : metrics.totalReach.toLocaleString('pt-BR'),
      icon: BarChart3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Receita',
      value: `R$ ${metrics.totalPurchaseValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${className}`}>
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-md p-1.5 ${card.bg}`}>
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
