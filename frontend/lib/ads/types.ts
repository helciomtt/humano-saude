// =====================================================
// TIPOS DO MÓDULO META ADS — HUMANO SAÚDE
// =====================================================

// --- Copy gerada por IA ---
export interface GeneratedCopy {
  primaryText: string[];
  headlines: string[];
  imageUrl: string;
  metadata?: {
    cta?: string;
    analysisType?: string;
    funnelStage?: FunnelStage;
    copyAngle?: CopyAngle;
    [key: string]: unknown;
  };
}

// --- Request de criação de campanha ---
export interface CreateCampaignRequest {
  objective: CampaignObjectiveKey;
  dailyBudget: number;
  targetAudience: string;
  images: string[];
  status?: 'ACTIVE' | 'PAUSED';
  funnelStage?: FunnelStage;
  linkUrl?: string;
  userObjective?: string;
}

// --- Response de campanha criada ---
export interface CreateCampaignResponse {
  campaignId: string;
  adSetId: string;
  adCreativeIds: string[];
  adIds: string[];
}

// --- Métricas de um anúncio ---
export interface AdMetrics {
  adId: string;
  adName: string;
  adSetId: string;
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  purchases: number;
  purchaseValue: number;
  roas: number;
  cpa: number;
  dailyBudget: number;
}

// --- Log de otimização ---
export interface OptimizationLog {
  adId: string;
  adName: string;
  adSetId: string;
  campaignId: string;
  actionType: 'PAUSE' | 'SCALE' | 'NO_ACTION';
  reason: string;
  metricsBefore: Record<string, unknown>;
  metricsAfter?: Record<string, unknown>;
}

// --- Config da Meta ---
export interface MetaAdsConfig {
  accessToken: string;
  adAccountId: string;
  pageId: string;
  pixelId?: string;
  pageAccessToken?: string;
  instagramId?: string;
}

// --- Targeting do Facebook ---
export interface FacebookTargeting {
  geo_locations: { countries: string[] };
  age_min?: number;
  age_max?: number;
  interests?: Array<{ id: string; name: string }>;
  flexible_spec?: Array<{ interests: Array<{ id: string; name: string }> }>;
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
}

// --- Parâmetros de Campanha ---
export interface CampaignParams {
  name: string;
  objective: MetaCampaignObjective;
  status: 'ACTIVE' | 'PAUSED';
  special_ad_categories: string[];
}

// --- Parâmetros de AdSet ---
export interface AdSetParams {
  name: string;
  campaign_id: string;
  daily_budget: number;
  billing_event: string;
  optimization_goal: string;
  targeting: FacebookTargeting;
  status?: string;
  bid_strategy?: string;
  bid_amount?: number;
  pixel_id?: string;
  custom_event_type?: string;
  attribution_spec?: Array<{ event_type: string; window_days: number }>;
}

// --- Parâmetros de Ad Creative ---
export interface AdCreativeParams {
  name: string;
  object_story_spec: {
    page_id: string;
    instagram_actor_id?: string;
    link_data?: {
      message: string;
      link: string;
      name?: string;
      image_hash?: string;
      call_to_action?: { type: string; value?: { link: string } };
    };
    video_data?: {
      video_id: string;
      title?: string;
      message?: string;
      image_hash?: string;
      call_to_action?: { type: string; value?: { link: string } };
    };
  };
}

// --- Parâmetros de Ad ---
export interface AdParams {
  name: string;
  adset_id: string;
  creative: { creative_id: string };
  status: 'ACTIVE' | 'PAUSED';
  tracking_specs?: Array<{
    action_type: string[];
    fb_pixel: string[];
  }>;
}

// --- Funil ---
export type FunnelStage = 'TOPO' | 'MEIO' | 'FUNDO';

// --- Ângulos de copy ---
export type CopyAngle = 'pain' | 'gain' | 'urgency' | 'social_proof' | 'curiosity';

// --- Objetivos internos ---
export type CampaignObjectiveKey =
  | 'TRAFEGO'
  | 'CONVERSAO'
  | 'LEADS'
  | 'ENGAJAMENTO'
  | 'ALCANCE';

// --- Objetivos da Meta API ---
export type MetaCampaignObjective =
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT';

// --- Regras de otimização ---
export interface OptimizationRules {
  pauseSpendThreshold: number;
  scaleRoasThreshold: number;
  scaleBudgetIncrease: number;
  maxDailyBudget: number;
  datePreset: MetaDatePreset;
}

// --- Presets de data ---
export type MetaDatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_14d'
  | 'last_30d'
  | 'this_month'
  | 'last_month'
  | 'maximum';

// --- Resultado do Prompt Generator ---
export interface PromptGeneratorResult {
  professionalPrompt: string;
  analysis: {
    funnelStage: FunnelStage;
    intent: 'awareness' | 'consideration' | 'conversion' | 'remarketing';
    copyAngle: CopyAngle;
    targetAudience: string;
    ctaStyle: 'baixa_friccao' | 'urgente' | 'educacional';
  };
}

// --- Análise de criativo ---
export interface CreativeAnalysis {
  format: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  visual_elements: string[];
  colors: string[];
  text_in_image: string | null;
  mood: string;
  recommended_objective: CampaignObjectiveKey;
  recommendation_confidence: number;
  technical_details: {
    has_people: boolean;
    has_product: boolean;
    has_text_overlay: boolean;
    is_professional_photo: boolean;
    visual_quality_score: number;
  };
  warnings: string[];
  optimization_tips: string[];
}

// --- Copy variation com previsão de performance ---
export interface CopyVariation {
  primary_text: string;
  headline: string;
  cta: string;
  predicted_performance: number;
  reasoning: string;
}

// --- Resultado da análise de criativo v2 ---
export interface CreativeAnalysisResult {
  analysis: CreativeAnalysis;
  copies: CopyVariation[];
}

// --- Status de erro da Meta ---
export interface MetaApiError {
  code: number;
  message: string;
  userMessage: string;
}

// --- CAPI Event ---
export interface MetaCapiEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: 'website';
  user_data: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    ct?: string[];
    st?: string[];
    country?: string[];
    zp?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, unknown>;
}

// --- Mapeamento de Interesses para planos de saúde ---
export const INTEREST_MAPPINGS: Record<string, Array<{ id: string; name: string }>> = {
  'Empresas PME': [
    { id: '6003629266583', name: 'Small and medium-sized enterprises' },
    { id: '6003012578006', name: 'Business' },
    { id: '6003987293503', name: 'Entrepreneurship' },
  ],
  'RH / Benefícios': [
    { id: '6003397425735', name: 'Human resources' },
    { id: '6003174604673', name: 'Employee benefits' },
  ],
  'Saúde': [
    { id: '6003107902433', name: 'Health' },
    { id: '6003384248805', name: 'Healthcare' },
    { id: '6003476182657', name: 'Health insurance' },
  ],
  'Plano Familiar': [
    { id: '6003107902433', name: 'Health' },
    { id: '6003476182657', name: 'Health insurance' },
    { id: '6003398510182', name: 'Family' },
  ],
  'Profissionais Autônomos': [
    { id: '6003987293503', name: 'Entrepreneurship' },
    { id: '6003156640507', name: 'Self-employment' },
    { id: '6003476182657', name: 'Health insurance' },
  ],
  'Médicos e Dentistas': [
    { id: '6003107902433', name: 'Medicine' },
    { id: '6003020834693', name: 'Physician' },
    { id: '6003632756840', name: 'Dentistry' },
  ],
  default: [
    { id: '6003476182657', name: 'Health insurance' },
    { id: '6003107902433', name: 'Health' },
    { id: '6003384248805', name: 'Healthcare' },
  ],
};
