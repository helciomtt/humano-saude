-- ========================================
-- Migration: Create message_templates & webhook_logs tables
-- For CRM email/WhatsApp template management and N8N webhook auditing.
-- Date: 2026-02-14
-- ========================================

-- ========================================
-- 1. message_templates (Templates de email/WhatsApp para CRM)
-- ========================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'whatsapp')),
  assunto VARCHAR(500),           -- Subject line (only for email)
  conteudo TEXT NOT NULL,          -- Template body (HTML for email, text for WhatsApp)
  variaveis TEXT[] DEFAULT '{}',   -- Available variables: {{nome}}, {{plano}}, etc.
  categoria VARCHAR(100),          -- Category: 'vendas', 'onboarding', 'renovacao', etc.
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES corretores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_tipo ON message_templates(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_message_templates_categoria ON message_templates(categoria);

-- ========================================
-- 2. webhook_logs (Audit log for all webhook events)
-- Create only if not exists — may already be partially created by other migrations
-- ========================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,      -- 'n8n', 'meta_ads', 'whatsapp', 'resend', etc.
  event_type VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'received', -- 'received', 'processed', 'failed', 'ignored'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- ========================================
-- 3. RLS Policies
-- ========================================
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_templates_service" ON message_templates;
CREATE POLICY "message_templates_service" ON message_templates 
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "webhook_logs_service" ON webhook_logs;
CREATE POLICY "webhook_logs_service" ON webhook_logs 
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- 4. Seed: Default templates
-- ========================================
INSERT INTO message_templates (nome, tipo, assunto, conteudo, variaveis, categoria) VALUES
(
  'Boas-vindas ao Lead',
  'email',
  'Bem-vindo à Humano Saúde — {{nome}}',
  '<h2>Olá {{nome}},</h2><p>Obrigado pelo seu interesse na Humano Saúde!</p><p>Nosso consultor {{corretor}} entrará em contato em breve para apresentar as melhores opções de plano de saúde para você.</p><p>Atenciosamente,<br/>Equipe Humano Saúde</p>',
  ARRAY['nome', 'corretor', 'email'],
  'vendas'
),
(
  'Proposta Comercial',
  'email',
  'Proposta Comercial — {{plano}} — Humano Saúde',
  '<h2>{{nome}},</h2><p>Segue a proposta comercial do plano <strong>{{plano}}</strong> da operadora <strong>{{operadora}}</strong>.</p><p><strong>Valor mensal:</strong> R$ {{valor}}<br/><strong>Vigência:</strong> {{vigencia}}</p><p>Estamos à disposição para esclarecer qualquer dúvida.</p><p>Att,<br/>{{corretor}}<br/>Humano Saúde</p>',
  ARRAY['nome', 'plano', 'operadora', 'valor', 'vigencia', 'corretor'],
  'vendas'
),
(
  'Lembrete de Renovação',
  'email',
  'Seu plano vence em {{dias}} dias — Humano Saúde',
  '<h2>Olá {{nome}},</h2><p>Seu plano <strong>{{plano}}</strong> tem renovação prevista para <strong>{{data_renovacao}}</strong>.</p><p>Gostaríamos de agendar uma conversa para avaliar as melhores condições para a sua renovação.</p><p>Entre em contato conosco!</p><p>Att,<br/>Equipe Humano Saúde</p>',
  ARRAY['nome', 'plano', 'data_renovacao', 'dias'],
  'renovacao'
),
(
  'Primeiro Contato WhatsApp',
  'whatsapp',
  NULL,
  'Olá {{nome}}! 👋\n\nSou {{corretor}} da Humano Saúde.\n\nVi que você tem interesse em plano de saúde. Posso te ajudar a encontrar a melhor opção com o melhor custo-benefício.\n\nQual o melhor horário para conversarmos? 🕐',
  ARRAY['nome', 'corretor'],
  'vendas'
),
(
  'Follow-up WhatsApp',
  'whatsapp',
  NULL,
  'Oi {{nome}}, tudo bem?\n\nSou {{corretor}} da Humano Saúde. Conversamos sobre planos de saúde há alguns dias.\n\nConseguiu analisar a proposta? Posso te ajudar com alguma dúvida? 😊',
  ARRAY['nome', 'corretor'],
  'vendas'
)
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. Comments
-- ========================================
COMMENT ON TABLE message_templates IS 'Templates de mensagens (email/WhatsApp) para uso no CRM';
COMMENT ON TABLE webhook_logs IS 'Log de auditoria de todos os webhooks recebidos (N8N, Meta, Resend, WhatsApp)';
