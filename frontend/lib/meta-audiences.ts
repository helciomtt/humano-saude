// =====================================================
// META AUDIENCES — Fábrica de Públicos Humano Saúde
// Criação e gestão de audiências via Marketing API
// =====================================================

import { INTEREST_MAPPINGS } from './ads/types';
import type { FacebookTargeting } from './ads/types';
import { logger } from '@/lib/logger';

const META_API_VERSION = 'v21.0';

// =====================================================
// TIPOS
// =====================================================

export interface AudienceTemplate {
  name: string;
  description: string;
  type: 'saved' | 'custom' | 'lookalike';
  funnelStage: 'TOPO' | 'MEIO' | 'FUNDO';
  targeting: FacebookTargeting;
  estimatedReach?: string;
}

export interface CustomAudiencePayload {
  name: string;
  description?: string;
  subtype:
    | 'WEBSITE'
    | 'ENGAGEMENT'
    | 'CUSTOM'
    | 'LOOKALIKE'
    | 'VIDEO';
  rule?: Record<string, unknown>;
  retention_days?: number;
  pixel_id?: string;
  prefill?: boolean;
  customer_file_source?: string;
}

export interface LookalikePayload {
  name: string;
  origin_audience_id: string;
  lookalike_spec: {
    country: string;
    ratio: number; // 0.01 a 0.20
    type: string;
  };
}

// =====================================================
// CREDENCIAIS
// =====================================================

function getCredentials() {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';
  const adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID || '';
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
  return { accessToken, adAccountId, pixelId };
}

// =====================================================
// TEMPLATES PRÉ-DEFINIDOS — Humano Saúde
// =====================================================

export const AUDIENCE_TEMPLATES: AudienceTemplate[] = [
  // ─── TOPO DE FUNIL ───
  {
    name: 'HSA - TOPO - Donos PME',
    description: 'Proprietários de pequenas e médias empresas interessados em benefícios corporativos',
    type: 'saved',
    funnelStage: 'TOPO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 30,
      age_max: 55,
      interests: [
        ...INTEREST_MAPPINGS['Empresas PME'],
        ...INTEREST_MAPPINGS['RH / Benefícios'],
      ],
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'video_feeds', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '500K - 2M',
  },
  {
    name: 'HSA - TOPO - Famílias',
    description: 'Famílias buscando plano de saúde acessível',
    type: 'saved',
    funnelStage: 'TOPO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 50,
      interests: [
        ...INTEREST_MAPPINGS['Plano Familiar'],
        ...INTEREST_MAPPINGS['Saúde'],
      ],
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '1M - 5M',
  },
  {
    name: 'HSA - TOPO - Profissionais Autônomos',
    description: 'MEI e profissionais liberais buscando plano individual ou por adesão',
    type: 'saved',
    funnelStage: 'TOPO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 55,
      interests: [
        ...INTEREST_MAPPINGS['Profissionais Autônomos'],
        ...INTEREST_MAPPINGS['Saúde'],
      ],
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '800K - 3M',
  },
  {
    name: 'HSA - TOPO - Médicos e Dentistas',
    description: 'Profissionais da saúde que podem se beneficiar de planos especiais',
    type: 'saved',
    funnelStage: 'TOPO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 55,
      interests: [
        ...INTEREST_MAPPINGS['Médicos e Dentistas'],
        ...INTEREST_MAPPINGS['Saúde'],
      ],
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '200K - 800K',
  },

  // ─── MEIO DE FUNIL ───
  {
    name: 'HSA - MEIO - Visitantes Site 30d',
    description: 'Retargeting de visitantes do site nos últimos 30 dias',
    type: 'custom',
    funnelStage: 'MEIO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 55,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '1K - 50K',
  },
  {
    name: 'HSA - MEIO - Engajamento IG 90d',
    description: 'Pessoas que interagiram com o perfil do Instagram nos últimos 90 dias',
    type: 'custom',
    funnelStage: 'MEIO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 55,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '5K - 100K',
  },

  // ─── FUNDO DE FUNIL ───
  {
    name: 'HSA - FUNDO - Cotação Abandonada',
    description: 'Visitantes que iniciaram cotação mas não finalizaram (7 dias)',
    type: 'custom',
    funnelStage: 'FUNDO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 55,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story', 'instream_video'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '500 - 10K',
  },
  {
    name: 'HSA - FUNDO - Lookalike Clientes',
    description: 'Lookalike 1% baseado em clientes existentes',
    type: 'lookalike',
    funnelStage: 'FUNDO',
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 25,
      age_max: 55,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    estimatedReach: '1M - 3M',
  },
];

// =====================================================
// CRIAR CUSTOM AUDIENCE
// =====================================================

export async function createCustomAudience(
  payload: CustomAudiencePayload
): Promise<{ id: string; name: string } | null> {
  const { accessToken, adAccountId, pixelId } = getCredentials();
  if (!accessToken || !adAccountId) return null;

  try {
    const body: Record<string, unknown> = {
      name: payload.name,
      description: payload.description || '',
      subtype: payload.subtype,
      customer_file_source: payload.customer_file_source || 'USER_PROVIDED_ONLY',
    };

    if (payload.subtype === 'WEBSITE' && pixelId) {
      body.rule = payload.rule || {
        inclusions: {
          operator: 'or',
          rules: [
            {
              event_sources: [{ id: pixelId, type: 'pixel' }],
              retention_seconds: (payload.retention_days || 30) * 86400,
            },
          ],
        },
      };
      body.prefill = payload.prefill ?? true;
    }

    if (payload.subtype === 'ENGAGEMENT') {
      body.rule = payload.rule;
    }

    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/customaudiences`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, access_token: accessToken }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      logger.error('❌ Erro ao criar Custom Audience:', data.error?.message);
      return null;
    }

    return { id: data.id, name: payload.name };
  } catch (error) {
    logger.error('❌ Erro ao criar Custom Audience:', error);
    return null;
  }
}

// =====================================================
// CRIAR WEBSITE CUSTOM AUDIENCE (atalho)
// =====================================================

export async function createWebsiteAudience(
  name: string,
  retentionDays: number = 30,
  urlContains?: string
): Promise<{ id: string; name: string } | null> {
  const { pixelId } = getCredentials();
  if (!pixelId) return null;

  const rule: Record<string, unknown> = {
    inclusions: {
      operator: 'or',
      rules: [
        {
          event_sources: [{ id: pixelId, type: 'pixel' }],
          retention_seconds: retentionDays * 86400,
          ...(urlContains
            ? {
                filter: {
                  operator: 'and',
                  filters: [
                    {
                      field: 'url',
                      operator: 'i_contains',
                      value: urlContains,
                    },
                  ],
                },
              }
            : {}),
        },
      ],
    },
  };

  return createCustomAudience({
    name,
    description: `Visitantes do site (${retentionDays}d)${urlContains ? ` - URL contém: ${urlContains}` : ''}`,
    subtype: 'WEBSITE',
    rule,
    retention_days: retentionDays,
    prefill: true,
  });
}

// =====================================================
// CRIAR LOOKALIKE AUDIENCE
// =====================================================

export async function createLookalikeAudience(
  originAudienceId: string,
  name: string,
  ratio: number = 0.01 // 1%
): Promise<{ id: string; name: string } | null> {
  const { accessToken, adAccountId } = getCredentials();
  if (!accessToken || !adAccountId) return null;

  try {
    const body = {
      name,
      origin_audience_id: originAudienceId,
      lookalike_spec: JSON.stringify({
        country: 'BR',
        ratio: Math.min(Math.max(ratio, 0.01), 0.20),
        type: 'similarity',
      }),
      access_token: accessToken,
    };

    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/customaudiences`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      logger.error('❌ Erro ao criar Lookalike:', data.error?.message);
      return null;
    }

    return { id: data.id, name };
  } catch (error) {
    logger.error('❌ Erro ao criar Lookalike:', error);
    return null;
  }
}

// =====================================================
// LISTAR CUSTOM AUDIENCES
// =====================================================

export async function listCustomAudiences(): Promise<
  Array<{
    id: string;
    name: string;
    subtype: string;
    approximate_count: number;
    delivery_status: string;
  }>
> {
  const { accessToken, adAccountId } = getCredentials();
  if (!accessToken || !adAccountId) return [];

  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,delivery_status&limit=200&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      logger.error('❌ Erro ao listar audiences:', data.error?.message);
      return [];
    }

    return (data.data || []).map(
      (a: Record<string, unknown>) => ({
        id: a.id as string,
        name: a.name as string,
        subtype: a.subtype as string,
        approximate_count: (a.approximate_count_lower_bound as number) || 0,
        delivery_status: ((a.delivery_status as Record<string, string>)?.status) || 'unknown',
      })
    );
  } catch (error) {
    logger.error('❌ Erro ao listar audiences:', error);
    return [];
  }
}

// =====================================================
// CRIAR AUDIÊNCIAS PADRÃO (SETUP INICIAL)
// =====================================================

export async function createDefaultAudiences(): Promise<{
  created: string[];
  errors: string[];
}> {
  const results = { created: [] as string[], errors: [] as string[] };
  const { pixelId } = getCredentials();

  if (!pixelId) {
    results.errors.push('Pixel ID não configurado');
    return results;
  }

  // Website Audiences
  const websiteAudiences = [
    { name: 'HSA - Visitantes 7d', days: 7 },
    { name: 'HSA - Visitantes 30d', days: 30 },
    { name: 'HSA - Visitantes 90d', days: 90 },
    { name: 'HSA - Cotação Iniciada 14d', days: 14, url: 'cotacao' },
    { name: 'HSA - Obrigado 30d', days: 30, url: 'obrigado' },
  ];

  for (const audience of websiteAudiences) {
    const result = await createWebsiteAudience(
      audience.name,
      audience.days,
      audience.url
    );
    if (result) {
      results.created.push(result.name);
    } else {
      results.errors.push(`Falha: ${audience.name}`);
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

// =====================================================
// OBTER TEMPLATE POR NOME
// =====================================================

export function getAudienceTemplate(name: string): AudienceTemplate | undefined {
  return AUDIENCE_TEMPLATES.find(
    (t) => t.name.toLowerCase().includes(name.toLowerCase())
  );
}

export function getTemplatesByFunnel(
  stage: 'TOPO' | 'MEIO' | 'FUNDO'
): AudienceTemplate[] {
  return AUDIENCE_TEMPLATES.filter((t) => t.funnelStage === stage);
}
