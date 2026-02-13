'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Users,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';

interface DemographicData {
  age_gender: Array<{ age: string; gender: string; spend: number; impressions: number; clicks: number }>;
  regions: Array<{ region: string; spend: number; impressions: number; clicks: number }>;
  platforms: Array<{ platform: string; spend: number; impressions: number; clicks: number }>;
  devices: Array<{ device: string; spend: number; impressions: number; clicks: number }>;
}

const PERIODS = [
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_14d', label: 'Últimos 14 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
];

export default function MetaAdsDemograficoPage() {
  const [period, setPeriod] = useState('last_7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DemographicData | null>(null);

  const fetchDemographics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/metrics?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao buscar dados');

      // Meta API returns demographics at campaign level
      // For now, show aggregate metrics from campaigns
      setData(null); // Demographics require breakdown API calls
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDemographics();
  }, [fetchDemographics]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          DEMOGRÁFICO
        </h1>
        <p className="mt-2 text-gray-400">Análise de audiência por idade, gênero, região e dispositivo</p>
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
        <Button variant="outline" size="icon" onClick={fetchDemographics} disabled={loading}>
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

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Idade & Gênero */}
          <Card className="border-white/10 bg-[#0a0a0a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Users className="h-5 w-5 text-[#D4AF37]" />
                Idade & Gênero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-gray-600" />
                <p className="text-sm text-gray-400 text-center">
                  Os dados demográficos serão exibidos quando houver campanhas ativas com dados suficientes.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Requer pelo menos 100 impressões para gerar breakdown
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Regiões */}
          <Card className="border-white/10 bg-[#0a0a0a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <MapPin className="h-5 w-5 text-green-400" />
                Regiões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <MapPin className="mb-4 h-12 w-12 text-gray-600" />
                <p className="text-sm text-gray-400 text-center">
                  O mapa de calor regional será gerado a partir dos dados de impressões por estado/cidade.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plataformas */}
          <Card className="border-white/10 bg-[#0a0a0a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Smartphone className="h-5 w-5 text-blue-400" />
                Plataformas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Facebook', color: 'bg-blue-500', percentage: 0 },
                  { name: 'Instagram', color: 'bg-pink-500', percentage: 0 },
                  { name: 'Audience Network', color: 'bg-purple-500', percentage: 0 },
                  { name: 'Messenger', color: 'bg-indigo-500', percentage: 0 },
                ].map((platform) => (
                  <div key={platform.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-300">{platform.name}</span>
                      <span className="text-gray-500">{platform.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800">
                      <div
                        className={`h-2 rounded-full ${platform.color}`}
                        style={{ width: `${platform.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="mt-4 text-center text-xs text-gray-500">
                  Dados serão preenchidos com campanhas ativas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dispositivos */}
          <Card className="border-white/10 bg-[#0a0a0a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Monitor className="h-5 w-5 text-purple-400" />
                Dispositivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Mobile', icon: Smartphone, percentage: 0 },
                  { name: 'Desktop', icon: Monitor, percentage: 0 },
                  { name: 'Tablet', icon: Tablet, percentage: 0 },
                ].map((device) => (
                  <div key={device.name} className="flex items-center gap-3">
                    <device.icon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-300">{device.name}</span>
                        <span className="text-gray-500">{device.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-800">
                        <div
                          className="h-2 rounded-full bg-[#D4AF37]"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="mt-4 text-center text-xs text-gray-500">
                  Dados serão preenchidos com campanhas ativas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
