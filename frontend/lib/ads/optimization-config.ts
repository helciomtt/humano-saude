// =====================================================
// OPTIMIZATION CONFIG — Mapeamento Objetivo → Config Meta
// Humano Saúde
// =====================================================

import type { CampaignObjectiveKey, MetaCampaignObjective, FunnelStage } from './types';

interface OptimizationConfigResult {
  campaignObjective: MetaCampaignObjective;
  optimizationGoal: string;
  billingEvent: string;
  customEventType?: string;
  requiresPixel: boolean;
  recommendedCta: string;
  bidStrategy: string;
}

// Matriz: Objetivo PT × Funil → config técnica da Meta API
const CONFIG_MAP: Record<CampaignObjectiveKey, Record<FunnelStage | 'default', Omit<OptimizationConfigResult, 'campaignObjective'>>> = {
  TRAFEGO: {
    TOPO: {
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    MEIO: {
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    FUNDO: {
      optimizationGoal: 'LANDING_PAGE_VIEWS',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'SIGN_UP',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    default: {
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
  },
  CONVERSAO: {
    TOPO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'CONTENT_VIEW',
      requiresPixel: true,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    MEIO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'ADD_TO_CART',
      requiresPixel: true,
      recommendedCta: 'GET_QUOTE',
      bidStrategy: 'COST_CAP',
    },
    FUNDO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'PURCHASE',
      requiresPixel: true,
      recommendedCta: 'SIGN_UP',
      bidStrategy: 'COST_CAP',
    },
    default: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'PURCHASE',
      requiresPixel: true,
      recommendedCta: 'GET_QUOTE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
  },
  LEADS: {
    TOPO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'LEAD',
      requiresPixel: true,
      recommendedCta: 'GET_QUOTE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    MEIO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'LEAD',
      requiresPixel: true,
      recommendedCta: 'GET_QUOTE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    FUNDO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'LEAD',
      requiresPixel: true,
      recommendedCta: 'SIGN_UP',
      bidStrategy: 'COST_CAP',
    },
    default: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      customEventType: 'LEAD',
      requiresPixel: true,
      recommendedCta: 'GET_QUOTE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
  },
  ENGAJAMENTO: {
    TOPO: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    MEIO: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    FUNDO: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'SEND_MESSAGE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    default: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
  },
  ALCANCE: {
    TOPO: {
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    MEIO: {
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    FUNDO: {
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
    default: {
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: 'LEARN_MORE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    },
  },
};

const OBJECTIVE_MAP: Record<CampaignObjectiveKey, MetaCampaignObjective> = {
  TRAFEGO: 'OUTCOME_TRAFFIC',
  CONVERSAO: 'OUTCOME_SALES',
  LEADS: 'OUTCOME_LEADS',
  ENGAJAMENTO: 'OUTCOME_ENGAGEMENT',
  ALCANCE: 'OUTCOME_AWARENESS',
};

export function getOptimizationConfig(
  objective: CampaignObjectiveKey,
  pixelId?: string,
  funnelStage?: FunnelStage
): OptimizationConfigResult {
  const stage = funnelStage || 'default';
  const config = CONFIG_MAP[objective]?.[stage] || CONFIG_MAP[objective]?.default || CONFIG_MAP.TRAFEGO.default;

  // Se requer pixel mas não tem, fallback para LINK_CLICKS
  if (config.requiresPixel && !pixelId) {
    return {
      campaignObjective: OBJECTIVE_MAP[objective],
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      requiresPixel: false,
      recommendedCta: config.recommendedCta,
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    };
  }

  return {
    campaignObjective: OBJECTIVE_MAP[objective],
    ...config,
  };
}

export function getCampaignObjective(objective: CampaignObjectiveKey): MetaCampaignObjective {
  return OBJECTIVE_MAP[objective] || 'OUTCOME_TRAFFIC';
}

export function getRecommendedCTA(objective: CampaignObjectiveKey): string {
  const config = CONFIG_MAP[objective]?.default;
  return config?.recommendedCta || 'LEARN_MORE';
}

export function requiresPixel(objective: CampaignObjectiveKey): boolean {
  const config = CONFIG_MAP[objective]?.default;
  return config?.requiresPixel || false;
}
