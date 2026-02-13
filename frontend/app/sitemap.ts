import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const BASE_URL = 'https://humanosaude.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Rotas estáticas ────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/economizar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/seja-corretor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // ─── Rotas dinâmicas: /economizar/[slug] ────────────
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServiceClient();
    const { data: corretores, error } = await supabase
      .from('corretores')
      .select('slug, updated_at')
      .eq('ativo', true)
      .not('slug', 'is', null);

    if (error) {
      logger.warn('Sitemap: erro ao buscar corretores', {
        error: error.message,
      });
    }

    if (corretores && corretores.length > 0) {
      dynamicRoutes = corretores
        .filter((c) => c.slug)
        .map((corretor) => ({
          url: `${BASE_URL}/economizar/${corretor.slug}`,
          lastModified: corretor.updated_at
            ? new Date(corretor.updated_at)
            : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));

      logger.info('Sitemap: corretores indexados', {
        count: dynamicRoutes.length,
      });
    }
  } catch (err) {
    logger.error('Sitemap: falha ao gerar rotas dinâmicas', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}
