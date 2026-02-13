// =====================================================
// TIPOS — Analytics & Dashboard (Blueprint 12)
// Views SQL + Dashboard Props + CRM
// =====================================================

// =====================================================
// VIEWS SQL
// =====================================================

/** analytics_health view */
export interface AnalyticsHealth {
  unique_visitors: number;
  sales: number;
  revenue: number;
  average_order_value: number;
  avg_time_seconds: number;
  conversion_rate: number;
  visitors_change: number;
  revenue_change: number;
  aov_change: number;
  time_change: number;
}

/** marketing_attribution view */
export interface MarketingAttribution {
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  sessions: number;
  sales_count: number;
  total_revenue: number;
  conversion_rate: number;
  average_order_value: number;
  primary_device: 'mobile' | 'tablet' | 'desktop';
}

/** analytics_funnel view */
export interface AnalyticsFunnel {
  step_visitors: number;
  step_interested: number;
  step_checkout_started: number;
  step_purchased: number;
}

/** analytics_visitors_online view */
export interface AnalyticsVisitorsOnline {
  online_count: number;
  mobile_count: number;
  desktop_count: number;
  tablet_count: number;
}

// =====================================================
// TABELA: analytics_visits
// =====================================================

export interface AnalyticsVisit {
  id?: string;
  session_id: string;
  created_at?: string;
  updated_at?: string;
  last_seen?: string;
  page_path?: string;
  referrer?: string;
  referrer_domain?: string;
  user_agent?: string;
  is_online?: boolean;
  ip_address?: string;
  country?: string;
  city?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  visit_date?: string;
  page_views?: number;
  session_duration?: number;
  device_category?: string;
  visitor_id?: string;
}

// =====================================================
// TABELA: checkout_attempts
// =====================================================

export interface CheckoutAttempt {
  id?: string;
  created_at?: string;
  updated_at?: string;
  session_id?: string;
  customer_email?: string;
  customer_name?: string;
  product_id?: string;
  product_name?: string;
  total_amount: number;
  discount_amount?: number;
  gross_amount?: number;
  status: string;
  payment_method?: string;
  gateway?: string;
  gateway_transaction_id?: string;
  failure_reason?: string;
  ip_address?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  metadata?: Record<string, unknown>;
}

// =====================================================
// DASHBOARD PROPS
// =====================================================

export interface BigNumbersMetrics {
  revenue: number;
  sales: number;
  conversion_rate: number;
  average_order_value: number;
  revenue_change: number;
  aov_change: number;
  visitors_change: number;
  time_change: number;
  unique_visitors: number;
  paid_sales: number;
  failed_sales: number;
  pending_sales: number;
}

export interface OperationalHealthData {
  abandonedCarts: { count: number; totalValue: number; last24h: number };
  failedPayments: { count: number; totalValue: number; reasons: Array<{ reason: string; count: number }> };
  chargebacks: { count: number; totalValue: number };
}

export interface SalesByDayData {
  date: string;
  revenue: number;
  sales: number;
}

export interface FunnelData {
  visitors: number;
  interested: number;
  checkoutStarted: number;
  purchased: number;
}

export interface GatewayStats {
  gateway: string;
  total_sales: number;
  approval_rate: number;
  avg_ticket: number;
  total_revenue: number;
  fallback_count: number;
  rescue_rate: number;
}

export interface FraudItem {
  id: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
  hours_in_analysis: number;
  gateway: string;
}

// =====================================================
// REALTIME FEED
// =====================================================

export type RealtimeEventType = 'sale' | 'cart_abandoned' | 'payment_failed' | 'visit';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  title: string;
  detail: string;
  amount?: number;
  timestamp: string;
}

// =====================================================
// GA4 KPIS (para página de analytics)
// =====================================================

export interface GA4KPIs {
  totalUsers: number;
  totalViews: number;
  totalEvents: number;
  totalSessions: number;
}

export interface GA4TrafficPoint {
  date: string;
  usuarios: number;
  visualizacoes: number;
}

export interface GA4Source {
  source: string;
  users: number;
  color: string;
}

export interface GA4TopPage {
  title: string;
  views: number;
}

export interface GA4Country {
  country: string;
  users: number;
}

export interface GA4City {
  city: string;
  users: number;
}

export interface GA4Device {
  device: string;
  users: number;
}

export interface GA4Browser {
  browser: string;
  users: number;
}

export interface GA4AgeGroup {
  age: string;
  users: number;
}

export interface GA4RealtimeResponse {
  activeUsers: number;
  pages: Array<{ page: string; users: number }>;
}

export interface GA4RealtimeDetailed {
  activeUsers: number;
  cities: Array<{ city: string; users: number }>;
  devices: Array<{ device: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
}

export interface GA4OutboundClick {
  url: string;
  clicks: number;
  category: 'whatsapp' | 'appstore' | 'playstore' | 'external';
}

export interface GA4OutboundSummary {
  clicks: GA4OutboundClick[];
  summary: {
    whatsapp: number;
    appstore: number;
    playstore: number;
    external: number;
    total: number;
  };
}

// =====================================================
// CRM TYPES
// =====================================================

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: string;
  source?: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
}

export interface CRMActivity {
  id: string;
  contact_id: string;
  type: string;
  description: string;
  created_at: string;
}

export interface CRMFunnelSummary {
  stage: string;
  count: number;
  total_value: number;
  avg_value: number;
}

// =====================================================
// DATE RANGE UTILITY
// =====================================================

export interface DateRange {
  startIso: string;
  endIso: string;
}

// =====================================================
// ACTION CENTER
// =====================================================

export interface ActionCenterRecommendation {
  id: string;
  campaign_id: string;
  campaign_name: string;
  type: 'ALERT' | 'OPPORTUNITY' | 'WARNING' | 'INFO';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  action_type: string;
  status: string;
  metrics_snapshot?: {
    spend: number;
    roas: number;
    cpa: number;
    ctr: number;
  };
  created_at: string;
}
