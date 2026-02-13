'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Video,
  Star,
  TrendingUp,
  Eye,
  MousePointer,
} from 'lucide-react';
import { getAdsCreatives } from '@/app/actions/ads';

export default function MetaAdsCriativosPage() {
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdsCreatives();
      if (res.success) {
        setCreatives(res.data || []);
      } else {
        setError(res.error || 'Erro ao buscar criativos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CRIATIVOS
        </h1>
        <p className="mt-2 text-gray-400">Gestão e análise de criativos de anúncios</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={fetchCreatives} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
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
        <>
          {creatives.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0a0a]">
              <CardContent className="py-16 text-center">
                <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-lg font-medium text-white">Nenhum criativo cadastrado</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Os criativos serão registrados aqui quando você lançar campanhas pelo sistema
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creatives.map((creative) => (
                <Card key={creative.id} className="border-white/10 bg-[#0a0a0a] overflow-hidden">
                  {/* Preview */}
                  {creative.image_url ? (
                    <div className="relative h-48 bg-gray-900">
                      <img
                        src={creative.image_url}
                        alt={creative.name}
                        className="h-full w-full object-cover"
                      />
                      {creative.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Video className="h-10 w-10 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gray-900">
                      <ImageIcon className="h-10 w-10 text-gray-600" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm text-white">
                      <span className="truncate">{creative.name}</span>
                      <Badge
                        className={
                          creative.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {creative.status === 'active' ? 'Ativo' : creative.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Copy */}
                    {creative.primary_text && (
                      <p className="line-clamp-2 text-xs text-gray-400">{creative.primary_text}</p>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <Eye className="mx-auto mb-1 h-3.5 w-3.5 text-blue-400" />
                        <p className="text-xs font-medium text-white">{(creative.impressions || 0).toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-gray-500">Impressões</p>
                      </div>
                      <div className="text-center">
                        <MousePointer className="mx-auto mb-1 h-3.5 w-3.5 text-purple-400" />
                        <p className="text-xs font-medium text-white">{(creative.clicks || 0).toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-gray-500">Cliques</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="mx-auto mb-1 h-3.5 w-3.5 text-green-400" />
                        <p className="text-xs font-medium text-white">{creative.ctr?.toFixed(2) || '0.00'}%</p>
                        <p className="text-[10px] text-gray-500">CTR</p>
                      </div>
                    </div>

                    {/* AI Score */}
                    {creative.ai_score != null && (
                      <div className="flex items-center gap-2 rounded-md bg-[#D4AF37]/10 p-2">
                        <Star className="h-4 w-4 text-[#D4AF37]" />
                        <span className="text-xs text-[#D4AF37]">Score IA: {creative.ai_score}/1.00</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
