-- =============================================
-- MIGRAÇÃO: Meta Ads Blueprint Tables (SAFE / IDEMPOTENT)
-- Data: 2026-02-10
-- Descrição: Cria todas as tabelas do sistema Meta Ads
--            Inclui tabelas pré-requisito que podem não existir
-- =============================================

-- =============================================
-- 0. FUNÇÃO AUXILIAR (idempotente)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PRÉ-REQUISITO A: ads_campaigns (tabela base)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ads_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id TEXT UNIQUE NOT NULL,
    ad_account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL,
    daily_budget NUMERIC(10,2),
    lifetime_budget NUMERIC(10,2),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend NUMERIC(10,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    ctr NUMERIC(5,2),
    cpc NUMERIC(10,2),
    cpm NUMERIC(10,2),
    cpl NUMERIC(10,2),
    auto_scale_enabled BOOLEAN DEFAULT false,
    last_optimization_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_campaigns_campaign_id ON ads_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_status ON ads_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_ad_account_id ON ads_campaigns(ad_account_id);

DROP TRIGGER IF EXISTS update_ads_campaigns_updated_at ON ads_campaigns;
CREATE TRIGGER update_ads_campaigns_updated_at
  BEFORE UPDATE ON ads_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PRÉ-REQUISITO B: ads_creatives (tabela base)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ads_creatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creative_id TEXT UNIQUE,
    ad_account_id TEXT NOT NULL,
    campaign_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    image_url TEXT,
    video_url TEXT,
    image_hash TEXT,
    title TEXT,
    primary_text TEXT,
    description TEXT,
    call_to_action TEXT,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend NUMERIC(10,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr NUMERIC(5,2),
    ai_score NUMERIC(3,2),
    ai_analysis JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_creatives_creative_id ON ads_creatives(creative_id);
CREATE INDEX IF NOT EXISTS idx_ads_creatives_campaign_id ON ads_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_creatives_status ON ads_creatives(status);

DROP TRIGGER IF EXISTS update_ads_creatives_updated_at ON ads_creatives;
CREATE TRIGGER update_ads_creatives_updated_at
  BEFORE UPDATE ON ads_creatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PRÉ-REQUISITO C: ads_audiences (tabela base)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ads_audiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audience_id TEXT UNIQUE NOT NULL,
    ad_account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    status TEXT DEFAULT 'active',
    approximate_count BIGINT,
    rules JSONB,
    lookalike_source_id TEXT,
    lookalike_ratio NUMERIC(3,2),
    campaigns_using INTEGER DEFAULT 0,
    total_spend NUMERIC(10,2) DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    avg_cpl NUMERIC(10,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_audiences_audience_id ON ads_audiences(audience_id);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_type ON ads_audiences(type);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_status ON ads_audiences(status);

DROP TRIGGER IF EXISTS update_ads_audiences_updated_at ON ads_audiences;
CREATE TRIGGER update_ads_audiences_updated_at
  BEFORE UPDATE ON ads_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PRÉ-REQUISITO D: integration_settings (tabela base)
-- =============================================
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    integration_name TEXT NOT NULL,
    encrypted_credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, integration_name)
);

CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_integration_name ON integration_settings(integration_name);

DROP TRIGGER IF EXISTS update_integration_settings_updated_at ON integration_settings;
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA 1: optimization_logs — Logs de otimização automática
-- =============================================
CREATE TABLE IF NOT EXISTS public.optimization_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id TEXT NOT NULL,
    ad_name TEXT NOT NULL,
    adset_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('PAUSE', 'SCALE', 'NO_ACTION')),
    reason TEXT NOT NULL,
    metrics_before JSONB NOT NULL,
    metrics_after JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optimization_logs_ad_id ON optimization_logs(ad_id);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_campaign_id ON optimization_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_action_type ON optimization_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_created_at ON optimization_logs(created_at DESC);

-- =============================================
-- TABELA 2: ads_campaigns_log — Log de campanhas lançadas
-- =============================================
CREATE TABLE IF NOT EXISTS public.ads_campaigns_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    adset_id TEXT NOT NULL,
    ad_ids TEXT[] NOT NULL DEFAULT '{}',
    objective TEXT NOT NULL,
    daily_budget DECIMAL(10,2) NOT NULL,
    target_audience TEXT NOT NULL,
    images_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_campaigns_log_campaign_id ON ads_campaigns_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_log_status ON ads_campaigns_log(status);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_log_created_at ON ads_campaigns_log(created_at DESC);

-- =============================================
-- TABELA 3: ads_creatives_generated — Criativos gerados por IA
-- =============================================
CREATE TABLE IF NOT EXISTS public.ads_creatives_generated (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_log_id UUID REFERENCES ads_campaigns_log(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    primary_texts TEXT[] NOT NULL DEFAULT '{}',
    headlines TEXT[] NOT NULL DEFAULT '{}',
    ad_creative_id TEXT,
    ad_id TEXT,
    performance_score DECIMAL(5,2),
    generated_name TEXT,
    video_url TEXT,
    meta_video_id TEXT,
    video_analysis JSONB DEFAULT '{}'::jsonb,
    transcription TEXT,
    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_creatives_generated_campaign ON ads_creatives_generated(campaign_log_id);

-- =============================================
-- TABELA 4: ads_optimization_rules — Regras configuráveis
-- =============================================
CREATE TABLE IF NOT EXISTS public.ads_optimization_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    pause_spend_threshold DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    scale_roas_threshold DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    scale_budget_increase DECIMAL(5,2) NOT NULL DEFAULT 0.20,
    max_daily_budget DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    date_preset TEXT NOT NULL DEFAULT 'last_7d',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ads_optimization_rules
  (name, pause_spend_threshold, scale_roas_threshold, scale_budget_increase, max_daily_budget, date_preset)
VALUES
  ('Regra Padrão HSA', 50.00, 3.00, 0.20, 500.00, 'last_7d')
ON CONFLICT DO NOTHING;

-- =============================================
-- TABELA 5: active_campaigns_cache — Anti-duplicação
-- =============================================
CREATE TABLE IF NOT EXISTS public.active_campaigns_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id TEXT NOT NULL UNIQUE,
    ads_data JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_campaigns_account ON active_campaigns_cache(account_id);

CREATE OR REPLACE FUNCTION clean_old_campaign_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM active_campaigns_cache WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ALTER: Campos extras do blueprint nas tabelas base
-- =============================================

-- ads_audiences: campos extras do blueprint
ALTER TABLE public.ads_audiences
  ADD COLUMN IF NOT EXISTS meta_audience_id TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'CUSTOM',
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT,
  ADD COLUMN IF NOT EXISTS retention_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_essential BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS use_for_exclusion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recommended_for TEXT[],
  ADD COLUMN IF NOT EXISTS health_status TEXT,
  ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ads_audiences_template ON ads_audiences(template_id);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_funnel ON ads_audiences(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_essential ON ads_audiences(is_essential) WHERE is_essential = true;

-- integration_settings: campos Meta específicos
ALTER TABLE public.integration_settings
  ADD COLUMN IF NOT EXISTS setting_key TEXT DEFAULT 'meta_default',
  ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_account_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_page_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_page_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_instagram_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_instagram_name TEXT,
  ADD COLUMN IF NOT EXISTS instagram_actor_id TEXT,
  ADD COLUMN IF NOT EXISTS instagram_actor_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_business_id TEXT,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;

-- =============================================
-- RLS — Todas as tabelas
-- =============================================

-- Tabelas pré-requisito
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ads_campaigns') THEN
    CREATE POLICY "service_role_all_ads_campaigns" ON ads_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ads_creatives') THEN
    CREATE POLICY "service_role_all_ads_creatives" ON ads_creatives FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ads_audiences') THEN
    CREATE POLICY "service_role_all_ads_audiences" ON ads_audiences FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_integration_settings') THEN
    CREATE POLICY "service_role_all_integration_settings" ON integration_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Tabelas novas
ALTER TABLE optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_campaigns_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_creatives_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_campaigns_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_optimization_logs') THEN
    CREATE POLICY "service_role_all_optimization_logs" ON optimization_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ads_campaigns_log') THEN
    CREATE POLICY "service_role_all_ads_campaigns_log" ON ads_campaigns_log FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ads_creatives_generated') THEN
    CREATE POLICY "service_role_all_ads_creatives_generated" ON ads_creatives_generated FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ads_optimization_rules') THEN
    CREATE POLICY "service_role_all_ads_optimization_rules" ON ads_optimization_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_active_campaigns_cache') THEN
    CREATE POLICY "service_role_all_active_campaigns_cache" ON active_campaigns_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Leitura para usuários autenticados
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_optimization_logs') THEN
    CREATE POLICY "auth_read_optimization_logs" ON optimization_logs FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_ads_campaigns_log') THEN
    CREATE POLICY "auth_read_ads_campaigns_log" ON ads_campaigns_log FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_ads_optimization_rules') THEN
    CREATE POLICY "auth_read_ads_optimization_rules" ON ads_optimization_rules FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_ads_campaigns') THEN
    CREATE POLICY "auth_read_ads_campaigns" ON ads_campaigns FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_ads_creatives') THEN
    CREATE POLICY "auth_read_ads_creatives" ON ads_creatives FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_ads_audiences') THEN
    CREATE POLICY "auth_read_ads_audiences" ON ads_audiences FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_integration_settings') THEN
    CREATE POLICY "auth_read_integration_settings" ON integration_settings FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- =============================================
-- STORAGE — Bucket para criativos
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';
