-- ============================================================
-- BLUEPRINT 14: Sistema de Email Tracking
-- Tabelas: email_logs, email_events
-- View: email_stats
-- Indexes, Triggers, RLS
-- ============================================================

-- ─── 1. Tabela principal: email_logs ────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resend data
  resend_id TEXT UNIQUE,                     -- ID retornado pela API Resend
  
  -- Email metadata
  from_email TEXT NOT NULL DEFAULT 'Humano Saúde <noreply@humanosaude.com.br>',
  to_email TEXT NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  reply_to TEXT,
  subject TEXT NOT NULL,
  
  -- Template & content
  template_name TEXT,                         -- ex: 'welcome', 'purchase_confirmation', 'convite_corretor'
  template_version TEXT DEFAULT '1.0',
  html_content TEXT,                          -- HTML completo renderizado (para preview no admin)
  text_content TEXT,                          -- Versão plain text (se houver)
  
  -- Classification
  email_type TEXT NOT NULL DEFAULT 'transactional',  -- transactional, marketing, system
  category TEXT,                               -- ex: 'onboarding', 'financeiro', 'notificacao'
  tags TEXT[],                                 -- tags livres para filtros
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued',        -- queued, sent, delivered, opened, clicked, bounced, complained, failed
  last_event TEXT,                              -- último evento recebido
  last_event_at TIMESTAMPTZ,                   -- timestamp do último evento
  
  -- Delivery metrics
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  error_code TEXT,
  bounce_type TEXT,                             -- hard, soft
  
  -- Context (quem disparou, referência)
  triggered_by TEXT,                            -- ex: 'system', 'admin:uuid', 'api'
  reference_type TEXT,                          -- ex: 'corretor', 'lead', 'proposta'
  reference_id TEXT,                            -- ID da entidade relacionada
  
  -- Metadata extra
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Tabela de eventos: email_events ────────────────────
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email_log_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  resend_id TEXT,                              -- ID do email no Resend (para correlação)
  
  -- Event data
  event_type TEXT NOT NULL,                    -- sent, delivered, opened, clicked, bounced, complained, unsubscribed
  event_data JSONB DEFAULT '{}',               -- payload completo do webhook
  
  -- Click tracking
  click_url TEXT,                               -- URL clicada (se evento = clicked)
  
  -- Open tracking  
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,                             -- desktop, mobile, tablet (parseado do UA)
  os TEXT,                                      -- Windows, macOS, iOS, Android
  browser TEXT,                                 -- Chrome, Safari, Firefox
  
  -- Geolocation (se disponível via Resend)
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Bounce details
  bounce_type TEXT,                             -- hard, soft
  bounce_message TEXT,
  
  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. View materializada: email_stats ─────────────────────
CREATE OR REPLACE VIEW email_stats AS
SELECT
  -- Period: last 30 days
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS total_delivered,
  COUNT(*) FILTER (WHERE status = 'opened' OR opened_count > 0) AS total_opened,
  COUNT(*) FILTER (WHERE clicked_count > 0) AS total_clicked,
  COUNT(*) FILTER (WHERE status = 'bounced') AS total_bounced,
  COUNT(*) FILTER (WHERE status = 'complained') AS total_complained,
  COUNT(*) FILTER (WHERE status = 'failed') AS total_failed,
  
  -- Rates (percentages)
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'delivered'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS delivery_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'opened' OR opened_count > 0))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0) * 100, 2
  ) AS open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE clicked_count > 0))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE status = 'opened' OR opened_count > 0), 0) * 100, 2
  ) AS click_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'bounced'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS bounce_rate,
  
  -- By type
  COUNT(*) FILTER (WHERE email_type = 'transactional') AS transactional_count,
  COUNT(*) FILTER (WHERE email_type = 'marketing') AS marketing_count,
  COUNT(*) FILTER (WHERE email_type = 'system') AS system_count,
  
  -- Timeframe
  NOW() AS calculated_at
FROM email_logs
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ─── 4. Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_category ON email_logs(category);
CREATE INDEX IF NOT EXISTS idx_email_logs_reference ON email_logs(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at DESC);

-- ─── 5. Trigger: updated_at automático ──────────────────────
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_logs_updated_at ON email_logs;
CREATE TRIGGER trg_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- ─── 6. RLS Policies ───────────────────────────────────────
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (API routes usam service role)
CREATE POLICY "service_role_email_logs_all" ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_email_events_all" ON email_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users podem ler seus próprios emails
CREATE POLICY "users_read_own_emails" ON email_logs
  FOR SELECT
  TO authenticated
  USING (to_email = auth.email());

CREATE POLICY "users_read_own_events" ON email_events
  FOR SELECT
  TO authenticated
  USING (
    email_log_id IN (
      SELECT id FROM email_logs WHERE to_email = auth.email()
    )
  );

-- ─── 7. Função RPC: buscar stats por período ───────────────
CREATE OR REPLACE FUNCTION get_email_stats_by_period(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  total_bounced BIGINT,
  total_complained BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_sent,
    COUNT(*) FILTER (WHERE el.status = 'delivered')::BIGINT AS total_delivered,
    COUNT(*) FILTER (WHERE el.status = 'opened' OR el.opened_count > 0)::BIGINT AS total_opened,
    COUNT(*) FILTER (WHERE el.clicked_count > 0)::BIGINT AS total_clicked,
    COUNT(*) FILTER (WHERE el.status = 'bounced')::BIGINT AS total_bounced,
    COUNT(*) FILTER (WHERE el.status = 'complained')::BIGINT AS total_complained,
    COUNT(*) FILTER (WHERE el.status = 'failed')::BIGINT AS total_failed,
    ROUND(
      (COUNT(*) FILTER (WHERE el.status = 'delivered'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
    ) AS delivery_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE el.status = 'opened' OR el.opened_count > 0))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE el.status = 'delivered'), 0) * 100, 2
    ) AS open_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE el.clicked_count > 0))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE el.status = 'opened' OR el.opened_count > 0), 0) * 100, 2
    ) AS click_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE el.status = 'bounced'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
    ) AS bounce_rate
  FROM email_logs el
  WHERE el.created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- ─── 8. Função RPC: daily breakdown (para gráficos) ────────
CREATE OR REPLACE FUNCTION get_email_daily_breakdown(
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  day DATE,
  sent BIGINT,
  delivered BIGINT,
  opened BIGINT,
  bounced BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.created_at::DATE AS day,
    COUNT(*)::BIGINT AS sent,
    COUNT(*) FILTER (WHERE el.status = 'delivered')::BIGINT AS delivered,
    COUNT(*) FILTER (WHERE el.status = 'opened' OR el.opened_count > 0)::BIGINT AS opened,
    COUNT(*) FILTER (WHERE el.status = 'bounced')::BIGINT AS bounced
  FROM email_logs el
  WHERE el.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY el.created_at::DATE
  ORDER BY day DESC;
END;
$$;

-- ============================================================
-- FIM: Blueprint 14 — Email Tracking System
-- ============================================================
