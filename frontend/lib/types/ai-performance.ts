// =====================================================
// TIPOS — AI Performance Engine (Blueprint 11)
// Humano Saúde — Sistema de 5 Camadas de IA
// =====================================================

// --- Status da Conta ---
export type AccountStatus = 'SAUDÁVEL' | 'ATENÇÃO' | 'CRÍTICO';

// --- Períodos suportados ---
export type PerformancePeriod = 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d';

// --- Tipo de análise ---
export type AnalysisType = 'full' | 'quick' | 'local';

// --- Estágio do Funil ---
export type FunnelStage = 'TOPO' | 'MEIO' | 'FUNDO';

// --- Nível de Consciência ---
export type AwarenessLevel =
  | 'inconsciente'
  | 'problema'
  | 'solucao'
  | 'produto'
  | 'totalmente_consciente';

// =====================================================
// CAMADA 1 — Performance Intelligence Engine
// =====================================================

export interface PerformanceData {
  campaigns: CampaignData[];
  adSets: AdSetData[];
  ads: AdData[];
  realSales: {
    totalRevenue: number;
    totalSales: number;
    avgTicket: number;
    period: string;
  };
  period: string;
  startDate: string;
  endDate: string;
}

export interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  purchases: number;
  purchaseValue: number;
  leads: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  createdTime?: string;
}

export interface AdSetData {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  purchases: number;
  purchaseValue: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
}

export interface AdData {
  id: string;
  name: string;
  adSetId: string;
  campaignId: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

// --- Resultado da análise IA completa ---
export interface AIAnalysisResult {
  timestamp: string;
  statusConta: AccountStatus;
  resumoExecutivo: {
    veredito: string;
    eficienciaGasto: number;
    maiorVitoria: string;
    maiorAmeaca: string;
  };
  acoesImediatas: AIAction[];
  rankingCriativos: {
    vencedores: CreativeRanking[];
    perdedores: CreativeRanking[];
  };
  insightsPublicos: {
    melhoresSegmentos: string[];
    segmentosSaturados: string[];
    oportunidadesInexploradas: string[];
  };
  otimizacaoLP: LPOptimization[];
  laboratorioTestes: {
    proximoTeste: TestRecommendation;
  };
  alertas: AIAlert[];
  metricas: PerformanceMetrics;
}

export interface AIAction {
  prioridade: number;
  acao: string;
  motivo: string;
  impactoEsperado: string;
  urgencia: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | 'BAIXA';
}

export interface CreativeRanking {
  nome: string;
  roas: number;
  cpa: number;
  gasto: number;
  motivo: string;
}

export interface LPOptimization {
  elemento: string;
  problema: string;
  sugestao: string;
  prioridade: string;
  impactoEstimado: string;
}

export interface TestRecommendation {
  nome: string;
  hipotese: string;
  setup: string;
  orcamento: number;
  duracao: string;
  criterioSucesso: string;
}

export interface AIAlert {
  severidade: 'CRÍTICO' | 'ATENÇÃO' | 'INFO';
  mensagem: string;
  campanhasAfetadas: string[];
  perdaEstimada: number;
}

export interface PerformanceMetrics {
  gastoTotal: number;
  receitaTotal: number;
  roasGeral: number;
  cpaGeral: number;
  ctrMedio: number;
  totalVendas: number;
}

// =====================================================
// CAMADA 2 — AI Campaign Advisor
// =====================================================

export interface CampaignInsightAI {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  metric?: string;
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AdvisorAnalysisResult {
  summary: string;
  insights: CampaignInsightAI[];
  recommendations: string[];
  healthScore: number;
  generatedAt: string;
}

// =====================================================
// CAMADA 3 — Smart Analyzer (Sem IA)
// =====================================================

export type AdSetClassification = 'winner' | 'potential' | 'underperforming' | 'loser';

export interface SmartAnalysisResult {
  healthScore: number;
  healthBreakdown: {
    efficiency: number;
    conversion: number;
    scale: number;
    health: number;
  };
  status: AccountStatus;
  insights: SmartInsight[];
  recommendations: SmartRecommendation[];
  metrics: PerformanceMetrics;
  benchmarkComparison: BenchmarkComparison;
}

export interface SmartInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  benchmark?: number;
}

export interface SmartRecommendation {
  priority: number;
  action: string;
  reason: string;
  expectedImpact: string;
  category: 'budget' | 'creative' | 'audience' | 'bidding' | 'general';
}

export interface BenchmarkComparison {
  ctr: BenchmarkRating;
  cpc: BenchmarkRating;
  cpm: BenchmarkRating;
  roas: BenchmarkRating;
}

export type BenchmarkRating = 'excellent' | 'good' | 'average' | 'poor';

export interface FullAnalysisResult extends SmartAnalysisResult {
  adSetAnalysis: AdSetAnalysisItem[];
  adAnalysis: AdAnalysisItem[];
  optimizationPlan: OptimizationStep[];
}

export interface AdSetAnalysisItem {
  id: string;
  name: string;
  classification: AdSetClassification;
  score: number;
  spend: number;
  roas: number;
  ctr: number;
  cpc: number;
  recommendation: string;
}

export interface AdAnalysisItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'carousel' | 'unknown';
  score: number;
  spend: number;
  roas: number;
  ctr: number;
  recommendation: string;
}

export interface OptimizationStep {
  step: number;
  action: string;
  target: string;
  expectedResult: string;
  timeline: string;
}

// =====================================================
// CAMADA 4 — Campaign Analyzer (Funil de Consciência)
// =====================================================

export interface CampaignAnalysisResult {
  campaignId: string;
  campaignName: string;
  awarenessLevel: AwarenessLevel;
  funnelStage: FunnelStage;
  overallScore: number;
  metrics: {
    ctr: { value: number; rating: BenchmarkRating };
    cpc: { value: number; rating: BenchmarkRating };
    roas: { value: number; rating: BenchmarkRating };
    frequency: { value: number; rating: BenchmarkRating };
  };
  insights: string[];
  recommendations: string[];
}

export interface FullCampaignAnalysis {
  campaigns: CampaignAnalysisResult[];
  funnelSummary: {
    topo: { count: number; totalSpend: number; avgCtr: number };
    meio: { count: number; totalSpend: number; avgCtr: number };
    fundo: { count: number; totalSpend: number; avgCtr: number };
  };
  overallHealthScore: number;
  aiSummary?: string;
}

// =====================================================
// CAMADA 5 — Ads Auditor (Cron)
// =====================================================

export type AuditActionType = 'PAUSE' | 'SCALE' | 'UNPAUSE' | 'NO_ACTION' | 'ALERT' | 'REVIEW';

export interface AuditResult {
  campaigns_analyzed: number;
  alerts_generated: number;
  opportunities_found: number;
  errors_count: number;
  recommendations: AuditRecommendation[];
  duration_ms: number;
}

export interface AuditRecommendation {
  campaignId: string;
  campaignName: string;
  type: 'ALERT' | 'OPPORTUNITY' | 'WARNING' | 'INFO';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  actionType: AuditActionType;
  actionParams?: Record<string, unknown>;
  metricsSnapshot: {
    spend: number;
    roas: number;
    cpa: number;
    ctr: number;
    purchases: number;
    frequency: number;
  };
}

export interface AuditRule {
  id: string;
  name: string;
  ruleType: 'sangria' | 'cpa_alto' | 'roas_baixo' | 'escala' | 'custom';
  metric: 'cpa' | 'roas' | 'spend' | 'ctr' | 'cpc' | 'purchases';
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  actionType: 'pause' | 'alert' | 'scale' | 'notify';
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  applyCampaigns?: string[];
}

export interface UserSettings {
  maxCpa: number;
  minRoas: number;
  maxFrequency: number;
  minCtr: number;
  maxSpendWithoutPurchase: number;
  autoPauseBleeders: boolean;
  autoScaleWinners: boolean;
  scaleIncrementPercent: number;
}

// =====================================================
// ANALYTICS HUB — Centro Unificado
// =====================================================

export interface UnifiedDashboardData {
  period: { startDate: string; endDate: string; label: string };
  financial: {
    totalRevenue: number;
    totalSales: number;
    avgTicket: number;
    revenueByDay: Array<{ date: string; revenue: number; sales: number }>;
  };
  traffic: {
    totalUsers: number;
    totalSessions: number;
    totalPageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    sources: Array<{ source: string; users: number; sessions: number; color: string }>;
  };
  investment: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalReach: number;
    activeCampaigns: number;
  };
  funnel: {
    pageViews: number;
    addToCart: number;
    checkoutInitiated: number;
    purchases: number;
    dropRates: { viewToCart: number; cartToCheckout: number; checkoutToPurchase: number };
  };
  kpis: {
    roasReal: number;
    cpaReal: number;
    conversaoReal: number;
    ltv: number;
  };
  realtime: {
    activeUsers: number;
    topPages: Array<{ page: string; users: number }>;
  } | null;
  integrations: {
    ga4: boolean;
    meta: boolean;
    gateway: boolean;
  };
}

// =====================================================
// AIInsightPanel — Props do componente reutilizável
// =====================================================

export interface AIInsightPanelProps {
  type: 'ai-performance' | 'analytics' | 'cockpit' | 'consolidated';
  loading?: boolean;
  error?: string;
  summary?: string;
  healthScore?: number;
  accountStatus?: AccountStatus;
  insights?: CampaignInsightAI[];
  actions?: AIAction[];
  recommendations?: string[];
  trends?: { direction: 'up' | 'down' | 'stable'; description: string };
  executiveSummary?: {
    verdict: string;
    spendEfficiency: number;
    biggestWin: string;
    biggestThreat: string;
  };
  generatedAt?: string;
  onRefresh?: () => void;
  onAskQuestion?: (question: string) => void;
}
