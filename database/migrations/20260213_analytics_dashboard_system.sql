-- =====================================================
-- BLUEPRINT 12 — ANALYTICS & DASHBOARD SYSTEM
-- Tabelas, Views, Functions para o sistema completo
-- Data: 2026-02-13
-- =====================================================

-- =====================================================
-- 1. TABELA: analytics_visits (base de tráfego)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    page_path TEXT,
    referrer TEXT,
    referrer_domain TEXT,
    user_agent TEXT,
    is_online BOOLEAN DEFAULT false,
    ip_address TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    visit_date DATE DEFAULT CURRENT_DATE,
    page_views INTEGER DEFAULT 1,
    session_duration INTEGER DEFAULT 0,
    device_category TEXT DEFAULT 'desktop',
    visitor_id TEXT
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_analytics_visits_session ON public.analytics_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created ON public.analytics_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_online ON public.analytics_visits(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_analytics_visits_last_seen ON public.analytics_visits(last_seen) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_analytics_visits_utm_source ON public.analytics_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_visit_date ON public.analytics_visits(visit_date DESC);

-- RLS
ALTER TABLE public.analytics_visits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_visits_public_read') THEN
    CREATE POLICY analytics_visits_public_read ON public.analytics_visits FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_visits_public_insert') THEN
    CREATE POLICY analytics_visits_public_insert ON public.analytics_visits FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_visits_public_update') THEN
    CREATE POLICY analytics_visits_public_update ON public.analytics_visits FOR UPDATE USING (true);
  END IF;
END $$;

-- =====================================================
-- 2. TABELA: checkout_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    session_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    product_id TEXT,
    product_name TEXT,
    total_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    gross_amount DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    gateway TEXT,
    gateway_transaction_id TEXT,
    failure_reason TEXT,
    ip_address TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_status ON public.checkout_attempts(status);
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_created ON public.checkout_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_session ON public.checkout_attempts(session_id);

ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'checkout_attempts_service_all') THEN
    CREATE POLICY checkout_attempts_service_all ON public.checkout_attempts FOR ALL USING (true);
  END IF;
END $$;

-- =====================================================
-- 3. TABELA: abandoned_carts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    product_name TEXT,
    total_amount DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'abandoned',
    recovered_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON public.abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created ON public.abandoned_carts(created_at DESC);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'abandoned_carts_service_all') THEN
    CREATE POLICY abandoned_carts_service_all ON public.abandoned_carts FOR ALL USING (true);
  END IF;
END $$;

-- =====================================================
-- 4. VIEW: analytics_health
-- =====================================================
CREATE OR REPLACE VIEW public.analytics_health AS
WITH current_visits AS (
    SELECT
        COUNT(DISTINCT session_id) as unique_visitors,
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_seen - created_at))), 0) as avg_time_on_site
    FROM public.analytics_visits
    WHERE created_at >= NOW() - INTERVAL '30 days'
),
current_sales AS (
    SELECT
        COUNT(*) FILTER (WHERE status IN ('paid','approved','completed')) as sales,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid','approved','completed')), 0) as revenue,
        COALESCE(AVG(total_amount) FILTER (WHERE status IN ('paid','approved','completed')), 0) as aov
    FROM public.checkout_attempts
    WHERE created_at >= NOW() - INTERVAL '30 days'
),
previous_visits AS (
    SELECT
        COUNT(DISTINCT session_id) as unique_visitors,
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_seen - created_at))), 0) as avg_time_on_site
    FROM public.analytics_visits
    WHERE created_at >= NOW() - INTERVAL '60 days'
      AND created_at < NOW() - INTERVAL '30 days'
),
previous_sales AS (
    SELECT
        COUNT(*) FILTER (WHERE status IN ('paid','approved','completed')) as sales,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid','approved','completed')), 0) as revenue,
        COALESCE(AVG(total_amount) FILTER (WHERE status IN ('paid','approved','completed')), 0) as aov
    FROM public.checkout_attempts
    WHERE created_at >= NOW() - INTERVAL '60 days'
      AND created_at < NOW() - INTERVAL '30 days'
)
SELECT
    cv.unique_visitors,
    cs.sales,
    cs.revenue,
    cs.aov as average_order_value,
    cv.avg_time_on_site as avg_time_seconds,
    CASE WHEN cv.unique_visitors > 0
         THEN ROUND((cs.sales::numeric / cv.unique_visitors::numeric) * 100, 2)
         ELSE 0 END as conversion_rate,
    CASE WHEN pv.unique_visitors > 0
         THEN ROUND(((cv.unique_visitors - pv.unique_visitors)::numeric / pv.unique_visitors::numeric) * 100, 1)
         ELSE 0 END as visitors_change,
    CASE WHEN ps.revenue > 0
         THEN ROUND(((cs.revenue - ps.revenue)::numeric / ps.revenue::numeric) * 100, 1)
         ELSE 0 END as revenue_change,
    CASE WHEN ps.aov > 0
         THEN ROUND(((cs.aov - ps.aov)::numeric / ps.aov::numeric) * 100, 1)
         ELSE 0 END as aov_change,
    CASE WHEN pv.avg_time_on_site > 0
         THEN ROUND(((cv.avg_time_on_site - pv.avg_time_on_site)::numeric / pv.avg_time_on_site::numeric) * 100, 1)
         ELSE 0 END as time_change
FROM current_visits cv, current_sales cs, previous_visits pv, previous_sales ps;

-- =====================================================
-- 5. VIEW: marketing_attribution
-- =====================================================
CREATE OR REPLACE VIEW public.marketing_attribution AS
WITH traffic_sources AS (
    SELECT
        av.session_id,
        COALESCE(av.utm_source,
            CASE
                WHEN av.referrer_domain LIKE '%google%' THEN 'google-organic'
                WHEN av.referrer_domain LIKE '%facebook%' OR av.referrer_domain LIKE '%instagram%' THEN 'social-organic'
                WHEN av.referrer_domain IS NULL OR av.referrer_domain = '' THEN 'direct'
                ELSE av.referrer_domain
            END
        ) as source,
        COALESCE(av.utm_medium, 'organic') as medium,
        COALESCE(av.utm_campaign, 'none') as campaign,
        av.device_type,
        av.created_at as visit_time
    FROM public.analytics_visits av
    WHERE av.created_at >= NOW() - INTERVAL '30 days'
),
attributed_sales AS (
    SELECT
        ts.source, ts.medium, ts.campaign, ts.device_type,
        ca.total_amount, ca.status
    FROM traffic_sources ts
    INNER JOIN public.checkout_attempts ca ON ca.session_id = ts.session_id
        AND ca.created_at BETWEEN ts.visit_time AND ts.visit_time + INTERVAL '24 hours'
)
SELECT
    ts_agg.source,
    ts_agg.medium,
    ts_agg.campaign,
    ts_agg.visitors,
    ts_agg.sessions,
    COALESCE(sa.sales_count, 0) as sales_count,
    COALESCE(sa.total_revenue, 0) as total_revenue,
    CASE WHEN ts_agg.visitors > 0
         THEN ROUND((COALESCE(sa.sales_count, 0)::numeric / ts_agg.visitors::numeric) * 100, 2)
         ELSE 0 END as conversion_rate,
    CASE WHEN COALESCE(sa.sales_count, 0) > 0
         THEN ROUND(sa.total_revenue / sa.sales_count, 2)
         ELSE 0 END as average_order_value,
    ts_agg.primary_device
FROM (
    SELECT
        source, medium, campaign,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(*) as sessions,
        MODE() WITHIN GROUP (ORDER BY device_type) as primary_device
    FROM traffic_sources
    GROUP BY source, medium, campaign
) ts_agg
LEFT JOIN (
    SELECT
        source, medium, campaign,
        COUNT(*) FILTER (WHERE status IN ('paid','approved','completed')) as sales_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid','approved','completed')), 0) as total_revenue
    FROM attributed_sales
    GROUP BY source, medium, campaign
) sa ON sa.source = ts_agg.source AND sa.medium = ts_agg.medium AND sa.campaign = ts_agg.campaign
ORDER BY ts_agg.visitors DESC
LIMIT 20;

-- =====================================================
-- 6. VIEW: analytics_funnel
-- =====================================================
CREATE OR REPLACE VIEW public.analytics_funnel AS
SELECT
    (SELECT COUNT(DISTINCT session_id) FROM public.analytics_visits
     WHERE created_at >= NOW() - INTERVAL '30 days') as step_visitors,
    (SELECT COUNT(DISTINCT session_id) FROM public.analytics_visits
     WHERE (page_path LIKE '%checkout%' OR page_path LIKE '%pricing%' OR page_path LIKE '%cotacao%' OR page_path LIKE '%plano%')
     AND created_at >= NOW() - INTERVAL '30 days') as step_interested,
    (SELECT COUNT(*) FROM public.checkout_attempts
     WHERE created_at >= NOW() - INTERVAL '30 days') as step_checkout_started,
    (SELECT COUNT(*) FROM public.checkout_attempts
     WHERE status IN ('paid','approved','completed')
     AND created_at >= NOW() - INTERVAL '30 days') as step_purchased;

-- =====================================================
-- 7. VIEW: analytics_visitors_online
-- =====================================================
CREATE OR REPLACE VIEW public.analytics_visitors_online AS
SELECT
    COUNT(DISTINCT session_id) as online_count,
    COUNT(DISTINCT CASE WHEN device_type = 'mobile' OR user_agent LIKE '%Mobile%' THEN session_id END) as mobile_count,
    COUNT(DISTINCT CASE WHEN device_type = 'desktop' OR (user_agent NOT LIKE '%Mobile%' AND user_agent NOT LIKE '%Tablet%') THEN session_id END) as desktop_count,
    COUNT(DISTINCT CASE WHEN device_type = 'tablet' OR user_agent LIKE '%Tablet%' THEN session_id END) as tablet_count
FROM public.analytics_visits
WHERE last_seen >= NOW() - INTERVAL '5 minutes'
AND is_online = true;

-- =====================================================
-- 8. FUNCTION: get_analytics_period
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_analytics_period(
    start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP DEFAULT NOW()
) RETURNS TABLE (
    unique_visitors BIGINT,
    total_sales BIGINT,
    total_revenue NUMERIC,
    gross_revenue NUMERIC,
    total_discount NUMERIC,
    failed_sales BIGINT,
    paid_sales BIGINT,
    pending_sales BIGINT,
    average_order_value NUMERIC,
    conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT av.session_id) FROM public.analytics_visits av
     WHERE av.created_at BETWEEN start_date AND end_date)::BIGINT as unique_visitors,

    (SELECT COUNT(*) FROM public.checkout_attempts ca
     WHERE ca.status IN ('paid','approved','completed')
     AND ca.created_at BETWEEN start_date AND end_date)::BIGINT as total_sales,

    (SELECT COALESCE(SUM(ca.total_amount), 0) FROM public.checkout_attempts ca
     WHERE ca.status IN ('paid','approved','completed')
     AND ca.created_at BETWEEN start_date AND end_date) as total_revenue,

    (SELECT COALESCE(SUM(ca.gross_amount), 0) FROM public.checkout_attempts ca
     WHERE ca.status IN ('paid','approved','completed')
     AND ca.created_at BETWEEN start_date AND end_date) as gross_revenue,

    (SELECT COALESCE(SUM(ca.discount_amount), 0) FROM public.checkout_attempts ca
     WHERE ca.status IN ('paid','approved','completed')
     AND ca.created_at BETWEEN start_date AND end_date) as total_discount,

    (SELECT COUNT(*) FROM public.checkout_attempts ca
     WHERE ca.status IN ('failed','refused','canceled')
     AND ca.created_at BETWEEN start_date AND end_date)::BIGINT as failed_sales,

    (SELECT COUNT(*) FROM public.checkout_attempts ca
     WHERE ca.status IN ('paid','approved','completed')
     AND ca.created_at BETWEEN start_date AND end_date)::BIGINT as paid_sales,

    (SELECT COUNT(*) FROM public.checkout_attempts ca
     WHERE ca.status = 'pending'
     AND ca.created_at BETWEEN start_date AND end_date)::BIGINT as pending_sales,

    (SELECT CASE
       WHEN COUNT(*) > 0 THEN ROUND(SUM(ca.total_amount) / COUNT(*), 2)
       ELSE 0 END
     FROM public.checkout_attempts ca
     WHERE ca.status IN ('paid','approved','completed')
     AND ca.created_at BETWEEN start_date AND end_date) as average_order_value,

    (SELECT CASE
       WHEN v_count > 0 THEN ROUND((s_count::numeric / v_count::numeric) * 100, 2)
       ELSE 0 END
     FROM (
       SELECT COUNT(DISTINCT av2.session_id) as v_count
       FROM public.analytics_visits av2 WHERE av2.created_at BETWEEN start_date AND end_date
     ) v,
     (
       SELECT COUNT(*)::numeric as s_count
       FROM public.checkout_attempts ca2
       WHERE ca2.status IN ('paid','approved','completed')
       AND ca2.created_at BETWEEN start_date AND end_date
     ) s) as conversion_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 9. TABELAS: Dashboard Consolidado
-- =====================================================

-- Connected accounts (multi-plataforma)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    platform TEXT NOT NULL CHECK (platform IN ('meta','google_ads','google_analytics')),
    account_id TEXT NOT NULL,
    account_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    connection_status TEXT DEFAULT 'connected',
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_platform ON public.connected_accounts(platform);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'connected_accounts_service_all') THEN
    CREATE POLICY connected_accounts_service_all ON public.connected_accounts FOR ALL USING (true);
  END IF;
END $$;

-- Metrics cache (5 min TTL)
CREATE TABLE IF NOT EXISTS public.metrics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    platform TEXT,
    metrics JSONB NOT NULL DEFAULT '{}',
    previous_metrics JSONB,
    funnel_data JSONB,
    demographics JSONB,
    campaigns JSONB DEFAULT '[]',
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires ON public.metrics_cache(expires_at);

ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'metrics_cache_service_all') THEN
    CREATE POLICY metrics_cache_service_all ON public.metrics_cache FOR ALL USING (true);
  END IF;
END $$;

-- Dashboard alerts
CREATE TABLE IF NOT EXISTS public.dashboard_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'warning',
    related_data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    actions JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_read ON public.dashboard_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_severity ON public.dashboard_alerts(severity);

ALTER TABLE public.dashboard_alerts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dashboard_alerts_service_all') THEN
    CREATE POLICY dashboard_alerts_service_all ON public.dashboard_alerts FOR ALL USING (true);
  END IF;
END $$;

-- Daily metrics history
CREATE TABLE IF NOT EXISTS public.daily_metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    account_id UUID,
    date DATE NOT NULL,
    platform TEXT NOT NULL,
    spend DECIMAL(12,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    ctr DECIMAL(8,4) DEFAULT 0,
    cpc DECIMAL(8,4) DEFAULT 0,
    roas DECIMAL(8,4) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_platform ON public.daily_metrics_history(platform);

ALTER TABLE public.daily_metrics_history ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'daily_metrics_history_service_all') THEN
    CREATE POLICY daily_metrics_history_service_all ON public.daily_metrics_history FOR ALL USING (true);
  END IF;
END $$;

-- =====================================================
-- DONE
-- =====================================================
