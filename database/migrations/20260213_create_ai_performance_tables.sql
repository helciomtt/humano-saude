-- =====================================================
-- AI PERFORMANCE ENGINE — Schema Completo
-- Blueprint 11 — Tabelas para Camadas 1-5
-- =====================================================

-- 1. Snapshot de métricas (Camada 5 - Auditor)
CREATE TABLE IF NOT EXISTS ads_insights_snapshot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_account_id TEXT,
  audit_run_id TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  spend NUMERIC(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  purchase_value NUMERIC(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  roas NUMERIC(8,4) DEFAULT 0,
  ctr NUMERIC(8,4) DEFAULT 0,
  cpc NUMERIC(8,4) DEFAULT 0,
  cpm NUMERIC(8,4) DEFAULT 0,
  frequency NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_campaign ON ads_insights_snapshot(campaign_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshot_audit ON ads_insights_snapshot(audit_run_id);

-- 2. Recomendações geradas (Camada 5 - Auditor)
CREATE TABLE IF NOT EXISTS ads_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  audit_run_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('ALERT', 'OPPORTUNITY', 'WARNING', 'INFO')),
  priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT,
  action_params JSONB DEFAULT '{}',
  metrics_snapshot JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recs_campaign ON ads_recommendations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recs_priority ON ads_recommendations(priority, resolved);
CREATE INDEX IF NOT EXISTS idx_recs_audit ON ads_recommendations(audit_run_id);

-- 3. Log de auditorias (Camada 5 - Auditor)
CREATE TABLE IF NOT EXISTS ads_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_run_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED')),
  campaigns_analyzed INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  opportunities_found INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audit_log_status ON ads_audit_log(status, created_at);

-- 4. Regras de alerta configuráveis
CREATE TABLE IF NOT EXISTS ads_alert_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_metric TEXT NOT NULL,
  condition_operator TEXT NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '=', '!=')),
  condition_value NUMERIC(12,4) NOT NULL,
  action_type TEXT NOT NULL,
  action_params JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Configurações do usuário para AI
CREATE TABLE IF NOT EXISTS ads_user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ai_model TEXT DEFAULT 'gpt-4o',
  temperature NUMERIC(3,2) DEFAULT 0.3,
  max_tokens INTEGER DEFAULT 2000,
  cache_ttl_minutes INTEGER DEFAULT 10,
  cron_interval_minutes INTEGER DEFAULT 30,
  meta_cpa_target NUMERIC(10,2) DEFAULT 15.00,
  meta_roas_target NUMERIC(6,2) DEFAULT 3.00,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notification_channels JSONB DEFAULT '["email"]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Análises salvas (cache persistente)
CREATE TABLE IF NOT EXISTS ads_analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL,
  period TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache ON ads_analysis_cache(analysis_type, period, expires_at);

-- 7. Histórico de otimizações aplicadas
CREATE TABLE IF NOT EXISTS ads_optimization_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  optimization_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  applied_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optim_campaign ON ads_optimization_logs(campaign_id, created_at);

-- 8. Regras de seed iniciais
INSERT INTO ads_alert_rules (name, description, condition_metric, condition_operator, condition_value, action_type, priority) VALUES
  ('Sangria de Budget', 'Campanha gastando sem converter', 'spend_no_purchase_hours', '>=', 6, 'PAUSE', 'CRITICAL'),
  ('CPA Acima da Meta', 'CPA excede 2x o target', 'cpa_ratio', '>=', 2.0, 'REDUCE_BUDGET', 'HIGH'),
  ('ROAS Abaixo do Mínimo', 'ROAS abaixo de 1.0', 'roas', '<', 1.0, 'ALERT', 'HIGH'),
  ('Oportunidade de Escala', 'ROAS alto com budget sobrando', 'roas', '>=', 3.0, 'SCALE_UP', 'MEDIUM'),
  ('Fadiga de Audiência', 'Frequência muito alta', 'frequency', '>=', 3.0, 'ALERT_CREATIVE', 'MEDIUM'),
  ('CTR Muito Baixo', 'CTR abaixo do mínimo', 'ctr', '<', 0.5, 'PAUSE_AD', 'LOW')
ON CONFLICT DO NOTHING;

-- 9. RLS Policies
ALTER TABLE ads_insights_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_optimization_logs ENABLE ROW LEVEL SECURITY;

-- Policy: service_role tem acesso total (cron jobs usam service role)
CREATE POLICY "Service role full access on ads_insights_snapshot"
  ON ads_insights_snapshot FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ads_recommendations"
  ON ads_recommendations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ads_audit_log"
  ON ads_audit_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ads_alert_rules"
  ON ads_alert_rules FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ads_user_settings"
  ON ads_user_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ads_analysis_cache"
  ON ads_analysis_cache FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ads_optimization_logs"
  ON ads_optimization_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: authenticated users can read recommendations and rules
CREATE POLICY "Authenticated read ads_recommendations"
  ON ads_recommendations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read ads_alert_rules"
  ON ads_alert_rules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read ads_audit_log"
  ON ads_audit_log FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own settings"
  ON ads_user_settings FOR ALL
  USING (auth.uid() = user_id);
