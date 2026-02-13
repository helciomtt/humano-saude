-- ============================================
-- SOCIAL FLOW — SCHEMA COMPLETO
-- Executar no Supabase SQL Editor
-- Data: 2026-02-10
-- ============================================

-- 1. CONTAS SOCIAIS CONECTADAS
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  network TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  auxiliary_ids JSONB DEFAULT '{}',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'connected',
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, network, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_social_accounts_network ON social_accounts(network);

-- 2. POSTS (AGENDADOS, PUBLICADOS, RASCUNHOS)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  network TEXT NOT NULL,
  post_type TEXT DEFAULT 'feed',
  content TEXT,
  title TEXT,
  hashtags TEXT[] DEFAULT '{}',
  first_comment TEXT,
  metadata JSONB DEFAULT '{}',
  media_ids UUID[] DEFAULT '{}',
  is_cross_post BOOLEAN DEFAULT false,
  cross_post_parent_id UUID REFERENCES social_posts(id),
  status TEXT DEFAULT 'draft',
  approval_required BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  scheduled_for TIMESTAMPTZ,
  auto_publish BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,
  permalink TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  publish_attempts INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_account ON social_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';

-- 3. MÍDIA DOS POSTS
CREATE TABLE IF NOT EXISTS social_media_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BIBLIOTECA DE MÍDIA
CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  folder TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  color_label TEXT,
  is_favorite BOOLEAN DEFAULT false,
  alt_text TEXT,
  ai_description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_library_user ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(folder);

-- 5. MÉTRICAS DE POSTS
CREATE TABLE IF NOT EXISTS social_post_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE UNIQUE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HISTÓRICO DE MÉTRICAS
CREATE TABLE IF NOT EXISTS social_post_metrics_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_account_metrics_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ANÁLISE DE MELHORES HORÁRIOS
CREATE TABLE IF NOT EXISTS best_times_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  hour_of_day INTEGER NOT NULL,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  posts_analyzed INTEGER DEFAULT 0,
  avg_engagement DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, day_of_week, hour_of_day)
);

-- 8. COMENTÁRIOS DE APROVAÇÃO
CREATE TABLE IF NOT EXISTS social_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_account_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_times_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_comments ENABLE ROW LEVEL SECURITY;

-- Service role pode tudo (cron jobs e API routes usam service_role_key)
CREATE POLICY "service_role_all_social_accounts" ON social_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_social_posts" ON social_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_social_media_items" ON social_media_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_media_library" ON media_library FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_social_post_metrics" ON social_post_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_social_post_metrics_history" ON social_post_metrics_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_social_account_metrics_history" ON social_account_metrics_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_best_times_analysis" ON best_times_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_social_post_comments" ON social_post_comments FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
