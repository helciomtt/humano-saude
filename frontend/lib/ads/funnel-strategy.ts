// =====================================================
// FUNNEL STRATEGY — Configurações por estágio de funil
// Humano Saúde — Planos de Saúde
// =====================================================

import type { FunnelStage, CampaignObjectiveKey, FacebookTargeting } from './types';

// =====================================================
// TIPOS
// =====================================================

interface FunnelStrategy {
  optimizationGoal: string;
  billingEvent: string;
  bidStrategy: string;
  bidAmount?: number;
  budgetMultiplier: number;
  customEventType?: string;
  targeting: Partial<FacebookTargeting>;
  description: string;
}

type ObjectiveKey = 'TRAFEGO' | 'CONVERSAO' | 'LEADS' | 'REMARKETING' | 'ENGAJAMENTO';

// Interesses relevantes para planos de saúde
const HEALTH_INTERESTS = [
  { id: '6003476182657', name: 'Health insurance' },
  { id: '6003107902433', name: 'Health' },
  { id: '6003384248805', name: 'Healthcare' },
  { id: '6003629266583', name: 'Small and medium-sized enterprises' },
];

// =====================================================
// MATRIZ DE ESTRATÉGIAS (15 combinações)
// =====================================================

const STRATEGY_MATRIX: Record<FunnelStage, Record<ObjectiveKey, FunnelStrategy>> = {
  TOPO: {
    TRAFEGO: {
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 1.0,
      targeting: {
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: ['feed', 'story', 'marketplace', 'right_hand_column'],
        instagram_positions: ['stream', 'story', 'reels', 'explore', 'explore_home'],
      },
      description: 'Tráfego frio — maximizar cliques com público amplo',
    },
    CONVERSAO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      customEventType: 'CONTENT_VIEW',
      budgetMultiplier: 1.5,
      targeting: {
        flexible_spec: [{ interests: HEALTH_INTERESTS }],
        publisher_platforms: ['facebook', 'instagram'],
      },
      description: 'Conversão topo — otimizar para visualização com interesse em saúde',
    },
    LEADS: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      customEventType: 'LEAD',
      budgetMultiplier: 1.2,
      targeting: {
        flexible_spec: [{ interests: HEALTH_INTERESTS }],
      },
      description: 'Leads topo — capturar interesse inicial em planos de saúde',
    },
    REMARKETING: {
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 0.5,
      targeting: {},
      description: 'Remarketing topo — reengajar visitantes antigos',
    },
    ENGAJAMENTO: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 0.8,
      targeting: {
        publisher_platforms: ['facebook', 'instagram'],
      },
      description: 'Engajamento topo — gerar interação com conteúdo educativo',
    },
  },
  MEIO: {
    TRAFEGO: {
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 0.8,
      targeting: {
        publisher_platforms: ['facebook', 'instagram'],
      },
      description: 'Tráfego meio — engagers do site e redes sociais',
    },
    CONVERSAO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'COST_CAP',
      bidAmount: 5000, // R$50 cost cap
      customEventType: 'ADD_TO_CART',
      budgetMultiplier: 1.2,
      targeting: {},
      description: 'Conversão meio — otimizar para cotação iniciada com cost cap',
    },
    LEADS: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      customEventType: 'LEAD',
      budgetMultiplier: 1.0,
      targeting: {},
      description: 'Leads meio — converter interesse em lead qualificado',
    },
    REMARKETING: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      customEventType: 'CONTENT_VIEW',
      budgetMultiplier: 0.9,
      targeting: {},
      description: 'Remarketing meio — nutrir leads com conteúdo relevante',
    },
    ENGAJAMENTO: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 0.7,
      targeting: {},
      description: 'Engajamento meio — conteúdo comparativo de operadoras',
    },
  },
  FUNDO: {
    TRAFEGO: {
      optimizationGoal: 'LANDING_PAGE_VIEWS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 0.6,
      targeting: {},
      description: 'Tráfego fundo — landing page para quem já cotou',
    },
    CONVERSAO: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'COST_CAP',
      bidAmount: 3000, // R$30 cost cap
      customEventType: 'PURCHASE',
      budgetMultiplier: 0.7,
      targeting: {},
      description: 'Conversão fundo — fechar proposta com custo controlado',
    },
    LEADS: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'COST_CAP',
      bidAmount: 2000, // R$20 cost cap
      customEventType: 'LEAD',
      budgetMultiplier: 0.8,
      targeting: {},
      description: 'Leads fundo — capturar lead quente de forma econômica',
    },
    REMARKETING: {
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'COST_CAP',
      bidAmount: 2500, // R$25 cost cap
      customEventType: 'PURCHASE',
      budgetMultiplier: 1.0,
      targeting: {},
      description: 'Remarketing fundo — converter abandonos de cotação',
    },
    ENGAJAMENTO: {
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetMultiplier: 0.5,
      targeting: {},
      description: 'Engajamento fundo — depoimentos e prova social',
    },
  },
};

// =====================================================
// FUNÇÕES PÚBLICAS
// =====================================================

export function getFunnelStrategy(
  funnelStage: FunnelStage,
  objective: CampaignObjectiveKey | 'REMARKETING',
  _pixelId?: string
): FunnelStrategy {
  const objectiveKey = (objective === 'ALCANCE' ? 'TRAFEGO' : objective) as ObjectiveKey;
  return (
    STRATEGY_MATRIX[funnelStage]?.[objectiveKey] ||
    STRATEGY_MATRIX.MEIO.LEADS
  );
}

export function buildStrategyTargeting(
  strategy: FunnelStrategy,
  audienceIds?: string[],
  country: string = 'BR'
): FacebookTargeting {
  const targeting: FacebookTargeting = {
    geo_locations: { countries: [country] },
    age_min: 25,
    age_max: 55,
    ...strategy.targeting,
  };

  // Adicionar custom audiences se fornecidos
  if (audienceIds && audienceIds.length > 0) {
    targeting.custom_audiences = audienceIds.map((id) => ({ id }));
  }

  return targeting;
}

export function calculateAdjustedBudget(
  baseBudgetCents: number,
  strategy: FunnelStrategy
): number {
  return Math.round(baseBudgetCents * strategy.budgetMultiplier);
}

export function getStrategyDescription(
  funnelStage: FunnelStage,
  objective: CampaignObjectiveKey
): string {
  const strategy = getFunnelStrategy(funnelStage, objective);
  return strategy.description;
}
