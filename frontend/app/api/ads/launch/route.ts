// =====================================================
// API: /api/ads/launch — Lançar Campanha Completa
// Cria Campaign → AdSet → Creative → Ad na Meta
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  isMetaConfigured,
  getMetaConfig,
  createCampaign,
  createAdSet,
  createAdCreative,
  createAd,
  buildTargeting,
} from '@/lib/ads/meta-client';
import { getOptimizationConfig, getRecommendedCTA } from '@/lib/ads/optimization-config';
import { generateAdCopy } from '@/lib/ads/copy-generator';
import { getFunnelStrategy, buildStrategyTargeting, calculateAdjustedBudget } from '@/lib/ads/funnel-strategy';
import type { FunnelStage, CampaignObjectiveKey, MetaCampaignObjective } from '@/lib/ads/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// =====================================================
// SCHEMA DO BODY
// =====================================================

interface LaunchRequest {
  name: string;
  dailyBudget: number;
  primaryText: string;
  headline: string;
  imageUrl?: string;
  imageHash?: string;
  linkUrl: string;
  description?: string;
  objective?: CampaignObjectiveKey;
  funnelStage?: FunnelStage;
  audience?: string;
  status?: 'ACTIVE' | 'PAUSED';
  customAudienceIds?: string[];
  excludedAudienceIds?: string[];
  generateCopy?: boolean;
}

// =====================================================
// POST — LANÇAR CAMPANHA
// =====================================================

export async function POST(request: NextRequest) {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado. Verifique as variáveis de ambiente.' },
        { status: 503 }
      );
    }

    const body: LaunchRequest = await request.json();

    if (!body.name || !body.dailyBudget || !body.linkUrl) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, dailyBudget, linkUrl' },
        { status: 400 }
      );
    }

    if (!body.primaryText && !body.generateCopy) {
      return NextResponse.json(
        { error: 'Forneça primaryText ou ative generateCopy' },
        { status: 400 }
      );
    }

    const config = getMetaConfig();
    const objective: CampaignObjectiveKey = body.objective || 'CONVERSAO';
    const funnelStage: FunnelStage = body.funnelStage || 'TOPO';
    const audience = body.audience || 'Empresas PME';
    const status = body.status || 'PAUSED';

    // ─── 1. Gerar copy se necessário ───
    let primaryText = body.primaryText || '';
    let headline = body.headline || '';
    const description = body.description || '';

    if (body.generateCopy) {
      try {
        const generated = await generateAdCopy(objective, audience, body.imageUrl);
        if (generated) {
          primaryText = generated.primaryText[0] || primaryText;
          headline = generated.headlines[0] || headline;
        }
      } catch (err) {
        logger.warn('Falha na geração de copy', { error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (!primaryText || !headline) {
      return NextResponse.json(
        { error: 'primaryText e headline são obrigatórios' },
        { status: 400 }
      );
    }

    // ─── 2. Config de otimização ───
    const optConfig = getOptimizationConfig(objective, funnelStage);
    const campaignObjective = optConfig.campaignObjective as MetaCampaignObjective;
    const cta = getRecommendedCTA(objective);

    // ─── 3. Criar campanha ───
    const campaignName = `[HSA] ${body.name} - ${funnelStage}`;
    const campaignResult = await createCampaign(config.adAccountId, {
      name: campaignName,
      objective: campaignObjective,
      status,
      special_ad_categories: [],
    });

    if (!campaignResult?.id) {
      return NextResponse.json(
        { error: 'Falha ao criar campanha na Meta' },
        { status: 502 }
      );
    }

    // ─── 4. Targeting ───
    const strategy = getFunnelStrategy(funnelStage, objective);
    let targeting = strategy
      ? buildStrategyTargeting(strategy)
      : buildTargeting(audience);

    if (body.customAudienceIds?.length) {
      targeting = {
        ...targeting,
        custom_audiences: body.customAudienceIds.map((id) => ({ id })),
      };
    }
    if (body.excludedAudienceIds?.length) {
      targeting = {
        ...targeting,
        excluded_custom_audiences: body.excludedAudienceIds.map((id) => ({ id })),
      };
    }

    // ─── 5. Budget ajustado ───
    const adjustedBudget = strategy
      ? calculateAdjustedBudget(body.dailyBudget, strategy)
      : body.dailyBudget;

    // ─── 6. Criar AdSet ───
    const adSetResult = await createAdSet(config.adAccountId, {
      name: `${campaignName} - AdSet`,
      campaign_id: campaignResult.id,
      daily_budget: adjustedBudget,
      targeting,
      optimization_goal: optConfig.optimizationGoal,
      billing_event: optConfig.billingEvent,
      status,
      ...(optConfig.requiresPixel && config.pixelId
        ? {
            pixel_id: config.pixelId,
            custom_event_type: optConfig.customEventType || 'PURCHASE',
          }
        : {}),
    });

    if (!adSetResult?.id) {
      return NextResponse.json(
        { error: 'Falha ao criar AdSet', campaignId: campaignResult.id, partial: true },
        { status: 502 }
      );
    }

    // ─── 7. Criar Creative ───
    const objectStorySpec: {
      page_id: string;
      instagram_actor_id?: string;
      link_data: {
        message: string;
        link: string;
        name: string;
        image_hash?: string;
        call_to_action: { type: string; value: { link: string } };
      };
    } = {
      page_id: config.pageId,
      link_data: {
        message: primaryText,
        link: body.linkUrl,
        name: headline,
        call_to_action: { type: cta, value: { link: body.linkUrl } },
      },
    };

    if (body.imageHash) objectStorySpec.link_data.image_hash = body.imageHash;
    if (config.instagramId) objectStorySpec.instagram_actor_id = config.instagramId;

    const creativeResult = await createAdCreative(config.adAccountId, {
      name: `${campaignName} - Creative`,
      object_story_spec: objectStorySpec,
    });

    if (!creativeResult?.id) {
      return NextResponse.json(
        { error: 'Falha ao criar Creative', campaignId: campaignResult.id, adSetId: adSetResult.id, partial: true },
        { status: 502 }
      );
    }

    // ─── 8. Criar Ad ───
    const adResult = await createAd(config.adAccountId, {
      name: `${campaignName} - Ad`,
      adset_id: adSetResult.id,
      creative: { creative_id: creativeResult.id },
      status,
    });

    if (!adResult?.id) {
      return NextResponse.json(
        { error: 'Falha ao criar Ad', campaignId: campaignResult.id, adSetId: adSetResult.id, creativeId: creativeResult.id, partial: true },
        { status: 502 }
      );
    }

    // ─── 9. Salvar no Supabase ───
    try {
      const supabase = createServiceClient();
      await supabase.from('ads_campaigns_log').insert({
        campaign_id: campaignResult.id,
        adset_id: adSetResult.id,
        creative_id: creativeResult.id,
        ad_id: adResult.id,
        campaign_name: campaignName,
        objective,
        funnel_stage: funnelStage,
        daily_budget_cents: adjustedBudget,
        primary_text: primaryText,
        headline,
        description,
        link_url: body.linkUrl,
        image_hash: body.imageHash || null,
        image_url: body.imageUrl || null,
        status,
        cta,
        launched_at: new Date().toISOString(),
      });
    } catch (dbError) {
      logger.warn('Campanha criada mas falha ao salvar log', { error: dbError instanceof Error ? dbError.message : String(dbError) });
    }

    // ─── 10. Resposta ───
    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        creativeId: creativeResult.id,
        adId: adResult.id,
        campaignName,
        objective: campaignObjective,
        funnelStage,
        dailyBudget: `R$${(adjustedBudget / 100).toFixed(2)}`,
        status,
        copy: { primaryText, headline, description },
        cta,
      },
    });
  } catch (error) {
    logger.error('❌ Erro no launch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
