-- =====================================================
-- MIGRATION: CRM Detail Panel — Tabelas de suporte
-- Data: 2026-02-13
-- Tabelas: attachments, followers, changelog, comments,
--          quotes, quote_items, notifications
-- =====================================================
-- Complementa 20260213_create_crm_advanced.sql com as
-- entidades necessárias para o painel de detalhes 3-colunas
-- =====================================================

-- ========================================
-- 1. crm_attachments (Arquivos vinculados a entidades)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company', 'activity', 'quote')),
  entity_id UUID NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES crm_attachments(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES corretores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_attachments_entity ON crm_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_attachments_uploaded_by ON crm_attachments(uploaded_by);

-- ========================================
-- 2. crm_followers (Seguir deals/contacts/companies)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company')),
  entity_id UUID NOT NULL,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  auto_follow BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, corretor_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_followers_entity ON crm_followers(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_followers_corretor ON crm_followers(corretor_id);

-- ========================================
-- 3. crm_changelog (Audit Trail de alterações)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_changelog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company', 'stage', 'pipeline')),
  entity_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES corretores(id) ON DELETE SET NULL,
  changed_by_type VARCHAR(20) DEFAULT 'user' CHECK (changed_by_type IN ('user', 'workflow', 'api', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_changelog_entity ON crm_changelog(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_changelog_created ON crm_changelog(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_changelog_changed_by ON crm_changelog(changed_by);

-- ========================================
-- 4. crm_comments (Comentários com @mentions e threads)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company', 'activity')),
  entity_id UUID NOT NULL,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  parent_comment_id UUID REFERENCES crm_comments(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_comments_entity ON crm_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_corretor ON crm_comments(corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_parent ON crm_comments(parent_comment_id);

DROP TRIGGER IF EXISTS update_crm_comments_updated_at ON crm_comments;
CREATE TRIGGER update_crm_comments_updated_at
  BEFORE UPDATE ON crm_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. crm_quotes (Cotações/Propostas comerciais)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  
  -- Valores
  subtotal DECIMAL(12,2) DEFAULT 0,
  desconto_valor DECIMAL(12,2) DEFAULT 0,
  imposto_valor DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  moeda VARCHAR(3) DEFAULT 'BRL',
  
  -- Validade
  valido_ate DATE,
  
  -- PDF e tracking
  pdf_url TEXT,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- Conteúdo
  observacoes TEXT,
  termos TEXT,
  
  -- Metadata
  created_by UUID REFERENCES corretores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_quotes_deal ON crm_quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_status ON crm_quotes(status);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_number ON crm_quotes(quote_number);

DROP TRIGGER IF EXISTS update_crm_quotes_updated_at ON crm_quotes;
CREATE TRIGGER update_crm_quotes_updated_at
  BEFORE UPDATE ON crm_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. crm_quote_items (Itens de uma cotação)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES crm_quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES crm_products(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  quantidade DECIMAL(10,2) DEFAULT 1,
  preco_unitario DECIMAL(12,2) NOT NULL,
  desconto_pct DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  posicao INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_quote_items_quote ON crm_quote_items(quote_id);

-- ========================================
-- 7. crm_notifications (Notificações internas do CRM)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'deal_moved', 'deal_won', 'deal_lost', 'deal_assigned',
    'activity_overdue', 'activity_assigned',
    'comment_mention', 'comment_reply',
    'follower_update', 'quote_viewed', 'quote_accepted', 'quote_declined',
    'system'
  )),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_notifications_corretor ON crm_notifications(corretor_id, is_read);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_created ON crm_notifications(created_at DESC);

-- ========================================
-- 8. TRIGGER: Auto-follow deal owner ao criar deal
-- ========================================
CREATE OR REPLACE FUNCTION public.auto_follow_crm_deal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_corretor_id IS NOT NULL THEN
    INSERT INTO crm_followers (entity_type, entity_id, corretor_id, auto_follow)
    VALUES ('deal', NEW.id, NEW.owner_corretor_id, true)
    ON CONFLICT (entity_type, entity_id, corretor_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_follow_crm_deal ON crm_deals;
CREATE TRIGGER trg_auto_follow_crm_deal
  AFTER INSERT ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION auto_follow_crm_deal();

-- ========================================
-- 9. TRIGGER: Log changelog em deal updates
-- ========================================
CREATE OR REPLACE FUNCTION public.log_crm_deal_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_corretor_id UUID;
BEGIN
  -- Tenta inferir quem fez a alteração (via current_setting ou fallback)
  BEGIN
    v_corretor_id := current_setting('app.current_corretor_id', true)::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_corretor_id := NULL;
  END;

  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO crm_changelog (entity_type, entity_id, field_name, old_value, new_value, changed_by)
    VALUES ('deal', NEW.id, 'stage_id', OLD.stage_id::TEXT, NEW.stage_id::TEXT, v_corretor_id);
  END IF;

  IF OLD.valor IS DISTINCT FROM NEW.valor THEN
    INSERT INTO crm_changelog (entity_type, entity_id, field_name, old_value, new_value, changed_by)
    VALUES ('deal', NEW.id, 'valor', OLD.valor::TEXT, NEW.valor::TEXT, v_corretor_id);
  END IF;

  IF OLD.owner_corretor_id IS DISTINCT FROM NEW.owner_corretor_id THEN
    INSERT INTO crm_changelog (entity_type, entity_id, field_name, old_value, new_value, changed_by)
    VALUES ('deal', NEW.id, 'owner_corretor_id', OLD.owner_corretor_id::TEXT, NEW.owner_corretor_id::TEXT, v_corretor_id);
  END IF;

  IF OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN
    INSERT INTO crm_changelog (entity_type, entity_id, field_name, old_value, new_value, changed_by)
    VALUES ('deal', NEW.id, 'prioridade', OLD.prioridade, NEW.prioridade, v_corretor_id);
  END IF;

  IF OLD.data_previsao_fechamento IS DISTINCT FROM NEW.data_previsao_fechamento THEN
    INSERT INTO crm_changelog (entity_type, entity_id, field_name, old_value, new_value, changed_by)
    VALUES ('deal', NEW.id, 'data_previsao_fechamento', OLD.data_previsao_fechamento::TEXT, NEW.data_previsao_fechamento::TEXT, v_corretor_id);
  END IF;

  IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
    INSERT INTO crm_changelog (entity_type, entity_id, field_name, old_value, new_value, changed_by)
    VALUES ('deal', NEW.id, 'titulo', OLD.titulo, NEW.titulo, v_corretor_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_crm_deal_changes ON crm_deals;
CREATE TRIGGER trg_log_crm_deal_changes
  AFTER UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION log_crm_deal_changes();

-- ========================================
-- 10. TRIGGER: Notificar followers em mudança de stage
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_crm_followers_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_stage_nome VARCHAR;
  v_follower RECORD;
BEGIN
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    SELECT nome INTO v_new_stage_nome FROM crm_stages WHERE id = NEW.stage_id;

    FOR v_follower IN
      SELECT corretor_id FROM crm_followers
      WHERE entity_type = 'deal' AND entity_id = NEW.id
    LOOP
      INSERT INTO crm_notifications (corretor_id, tipo, titulo, mensagem, entity_type, entity_id, action_url)
      VALUES (
        v_follower.corretor_id,
        'deal_moved',
        format('Deal "%s" movido', NEW.titulo),
        format('Movido para etapa "%s"', v_new_stage_nome),
        'deal',
        NEW.id,
        format('/portal-interno-hks-2026/crm?deal=%s', NEW.id)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_followers_stage ON crm_deals;
CREATE TRIGGER trg_notify_followers_stage
  AFTER UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION notify_crm_followers_stage_change();

-- ========================================
-- 11. RPC: Gerar próximo número de quote
-- ========================================
CREATE OR REPLACE FUNCTION public.generate_crm_quote_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO v_count FROM crm_quotes WHERE quote_number LIKE 'QT-' || v_year || '-%';
  RETURN 'QT-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. RLS Policies
-- ========================================
ALTER TABLE crm_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notifications ENABLE ROW LEVEL SECURITY;

-- Service role pode tudo
DROP POLICY IF EXISTS "crm_attachments_service" ON crm_attachments;
CREATE POLICY "crm_attachments_service" ON crm_attachments FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "crm_followers_service" ON crm_followers;
CREATE POLICY "crm_followers_service" ON crm_followers FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "crm_changelog_service" ON crm_changelog;
CREATE POLICY "crm_changelog_service" ON crm_changelog FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "crm_comments_service" ON crm_comments;
CREATE POLICY "crm_comments_service" ON crm_comments FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "crm_quotes_service" ON crm_quotes;
CREATE POLICY "crm_quotes_service" ON crm_quotes FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "crm_quote_items_service" ON crm_quote_items;
CREATE POLICY "crm_quote_items_service" ON crm_quote_items FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "crm_notifications_service" ON crm_notifications;
CREATE POLICY "crm_notifications_service" ON crm_notifications FOR ALL USING (auth.role() = 'service_role');

-- Leitura de changelog e attachments (público para membros da org)
DROP POLICY IF EXISTS "crm_attachments_read" ON crm_attachments;
CREATE POLICY "crm_attachments_read" ON crm_attachments FOR SELECT USING (true);
DROP POLICY IF EXISTS "crm_changelog_read" ON crm_changelog;
CREATE POLICY "crm_changelog_read" ON crm_changelog FOR SELECT USING (true);
DROP POLICY IF EXISTS "crm_comments_read" ON crm_comments;
CREATE POLICY "crm_comments_read" ON crm_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "crm_quotes_read" ON crm_quotes;
CREATE POLICY "crm_quotes_read" ON crm_quotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "crm_quote_items_read" ON crm_quote_items;
CREATE POLICY "crm_quote_items_read" ON crm_quote_items FOR SELECT USING (true);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE crm_attachments IS 'Arquivos vinculados a deals, contacts, companies, activities ou quotes';
COMMENT ON TABLE crm_followers IS 'Corretores que seguem deals/contacts — recebem notificações de mudanças';
COMMENT ON TABLE crm_changelog IS 'Audit trail — toda alteração de campo é logada automaticamente via trigger';
COMMENT ON TABLE crm_comments IS 'Comentários threaded com @mentions em entidades do CRM';
COMMENT ON TABLE crm_quotes IS 'Cotações/propostas comerciais vinculadas a deals';
COMMENT ON TABLE crm_notifications IS 'Notificações internas do CRM por corretor';
