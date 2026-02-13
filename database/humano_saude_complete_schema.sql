-- =============================================
-- 📦 HUMANO SAÚDE - SCHEMA COMPLETO ADAPTADO
-- =============================================
-- Schema adaptado do projeto original para Corretora de Saúde
-- Removido: checkout, products, sales
-- Mantido: leads, ads, analytics, whatsapp, crm
-- Adicionado: operadoras, cotacoes, propostas
-- =============================================

-- ========================================
-- 0. FUNÇÕES AUXILIARES
-- ========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 1. TABELA: insurance_leads (JÁ EXISTE)
-- ========================================
-- Esta tabela já foi criada anteriormente
-- Verificando se existe:
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'insurance_leads') THEN
    RAISE NOTICE 'Tabela insurance_leads não existe. Execute o schema básico primeiro.';
  ELSE
    RAISE NOTICE '✅ Tabela insurance_leads já existe';
  END IF;
END $$;

-- ========================================
-- 2. TABELA: operadoras (Planos de Saúde)
-- ========================================
CREATE TABLE IF NOT EXISTS public.operadoras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  nome VARCHAR(100) NOT NULL UNIQUE,
  cnpj VARCHAR(18) UNIQUE,
  ans_registro VARCHAR(20), -- Registro ANS
  
  -- Contato
  telefone VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  
  -- Endereço
  endereco_rua VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado VARCHAR(2),
  endereco_cep VARCHAR(10),
  
  -- Configurações
  logo_url TEXT,
  ativa BOOLEAN DEFAULT true,
  comissao_padrao DECIMAL(5,2), -- % de comissão
  
  -- Notas
  observacoes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_operadoras_nome ON operadoras(nome);
CREATE INDEX idx_operadoras_ativa ON operadoras(ativa);

DROP TRIGGER IF EXISTS update_operadoras_updated_at ON operadoras;
CREATE TRIGGER update_operadoras_updated_at
  BEFORE UPDATE ON operadoras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. TABELA: planos (Produtos das Operadoras)
-- ========================================
CREATE TABLE IF NOT EXISTS public.planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  operadora_id UUID REFERENCES operadoras(id) ON DELETE CASCADE,
  
  -- Identificação
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  tipo VARCHAR(50) NOT NULL, -- Individual, Empresarial, PME
  
  -- Cobertura
  abrangencia VARCHAR(50), -- Nacional, Regional, Municipal
  coparticipacao BOOLEAN DEFAULT false,
  
  -- Valores
  valor_base DECIMAL(10,2) NOT NULL,
  faixa_etaria_min INTEGER,
  faixa_etaria_max INTEGER,
  
  -- Acomodação
  acomodacao VARCHAR(50), -- Enfermaria, Apartamento
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- SEO e Metadados
  descricao TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_planos_operadora_id ON planos(operadora_id);
CREATE INDEX idx_planos_tipo ON planos(tipo);
CREATE INDEX idx_planos_ativo ON planos(ativo);

DROP TRIGGER IF EXISTS update_planos_updated_at ON planos;
CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON planos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. TABELA: cotacoes (Propostas Geradas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.cotacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  lead_id UUID REFERENCES insurance_leads(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  
  -- Número da Cotação
  numero_cotacao TEXT UNIQUE,
  
  -- Dados da Cotação
  nome_cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255),
  telefone_cliente VARCHAR(20),
  
  -- Composição do Plano
  titulares JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{nome, cpf, idade, valor}]
  dependentes JSONB DEFAULT '[]'::jsonb, -- [{nome, cpf, idade, valor}]
  
  -- Valores
  valor_total DECIMAL(10,2) NOT NULL,
  economia_estimada DECIMAL(10,2),
  valor_plano_anterior DECIMAL(10,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, enviada, aceita, recusada, expirada
  validade_ate DATE,
  
  -- Observações
  observacoes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enviada_em TIMESTAMP WITH TIME ZONE,
  aceita_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_cotacoes_lead_id ON cotacoes(lead_id);
CREATE INDEX idx_cotacoes_status ON cotacoes(status);
CREATE INDEX idx_cotacoes_created_at ON cotacoes(created_at DESC);

DROP TRIGGER IF EXISTS update_cotacoes_updated_at ON cotacoes;
CREATE TRIGGER update_cotacoes_updated_at
  BEFORE UPDATE ON cotacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. TABELA: propostas (Contratos Fechados)
-- ========================================
CREATE TABLE IF NOT EXISTS public.propostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  cotacao_id UUID REFERENCES cotacoes(id),
  lead_id UUID REFERENCES insurance_leads(id),
  plano_id UUID REFERENCES planos(id),
  operadora_id UUID REFERENCES operadoras(id),
  
  -- Número da Proposta
  numero_proposta TEXT UNIQUE NOT NULL,
  
  -- Dados do Cliente
  nome_titular VARCHAR(255) NOT NULL,
  cpf_titular VARCHAR(14) NOT NULL,
  email_titular VARCHAR(255),
  telefone_titular VARCHAR(20),
  
  -- Valores
  valor_mensalidade DECIMAL(10,2) NOT NULL,
  comissao_corretor DECIMAL(10,2),
  comissao_percentual DECIMAL(5,2),
  
  -- Vigência
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dia_vencimento INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'analise', -- analise, aprovada, ativa, cancelada, suspensa
  
  -- Documentos
  documentos JSONB DEFAULT '[]'::jsonb, -- [{tipo, url, nome, data_upload}]
  
  -- Observações
  observacoes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovada_em TIMESTAMP WITH TIME ZONE,
  ativada_em TIMESTAMP WITH TIME ZONE,
  cancelada_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_propostas_lead_id ON propostas(lead_id);
CREATE INDEX idx_propostas_operadora_id ON propostas(operadora_id);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_propostas_cpf_titular ON propostas(cpf_titular);
CREATE INDEX idx_propostas_created_at ON propostas(created_at DESC);

DROP TRIGGER IF EXISTS update_propostas_updated_at ON propostas;
CREATE TRIGGER update_propostas_updated_at
  BEFORE UPDATE ON propostas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. TABELA: comissoes (Comissões dos Corretores)
-- ========================================
CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES auth.users(id),
  
  -- Dados da Comissão
  mes_referencia DATE NOT NULL,
  valor_comissao DECIMAL(10,2) NOT NULL,
  percentual DECIMAL(5,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, paga, cancelada
  
  -- Pagamento
  forma_pagamento VARCHAR(50),
  data_pagamento DATE,
  comprovante_url TEXT,
  
  -- Observações
  observacoes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comissoes_proposta_id ON comissoes(proposta_id);
CREATE INDEX idx_comissoes_corretor_id ON comissoes(corretor_id);
CREATE INDEX idx_comissoes_status ON comissoes(status);
CREATE INDEX idx_comissoes_mes_referencia ON comissoes(mes_referencia);

DROP TRIGGER IF EXISTS update_comissoes_updated_at ON comissoes;
CREATE TRIGGER update_comissoes_updated_at
  BEFORE UPDATE ON comissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. TABELA: analytics_visits (Analytics GA4)
-- ========================================
CREATE TABLE IF NOT EXISTS public.analytics_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Session info
  session_id TEXT,
  client_id TEXT,
  
  -- Page info
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  
  -- UTM
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Device
  device_category TEXT,
  browser TEXT,
  os TEXT,
  
  -- Location
  country TEXT,
  city TEXT,
  
  -- Metrics
  session_duration INTEGER,
  page_views INTEGER DEFAULT 1,
  
  -- Timestamps
  visit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_visits_session_id ON analytics_visits(session_id);
CREATE INDEX idx_analytics_visits_page_path ON analytics_visits(page_path);
CREATE INDEX idx_analytics_visits_visit_date ON analytics_visits(visit_date);
CREATE INDEX idx_analytics_visits_utm_source ON analytics_visits(utm_source);
CREATE INDEX idx_analytics_visits_utm_campaign ON analytics_visits(utm_campaign);

-- ========================================
-- 8. TABELA: ads_campaigns (Campanhas Meta Ads)
-- ========================================
CREATE TABLE IF NOT EXISTS public.ads_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Meta Ads
  campaign_id TEXT UNIQUE NOT NULL,
  ad_account_id TEXT NOT NULL,
  
  -- Info básica
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL,
  
  -- Budget
  daily_budget NUMERIC(10,2),
  lifetime_budget NUMERIC(10,2),
  
  -- Métricas (cache)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  
  -- Métricas calculadas
  ctr NUMERIC(5,2),
  cpc NUMERIC(10,2),
  cpm NUMERIC(10,2),
  cpl NUMERIC(10,2), -- Custo por Lead
  
  -- Automação
  auto_scale_enabled BOOLEAN DEFAULT false,
  last_optimization_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ads_campaigns_campaign_id ON ads_campaigns(campaign_id);
CREATE INDEX idx_ads_campaigns_status ON ads_campaigns(status);
CREATE INDEX idx_ads_campaigns_ad_account_id ON ads_campaigns(ad_account_id);

DROP TRIGGER IF EXISTS update_ads_campaigns_updated_at ON ads_campaigns;
CREATE TRIGGER update_ads_campaigns_updated_at
  BEFORE UPDATE ON ads_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. TABELA: ads_creatives (Criativos)
-- ========================================
CREATE TABLE IF NOT EXISTS public.ads_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Meta Ads
  creative_id TEXT UNIQUE,
  ad_account_id TEXT NOT NULL,
  campaign_id TEXT,
  
  -- Info básica
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  image_hash TEXT,
  
  -- Copy
  title TEXT,
  primary_text TEXT,
  description TEXT,
  call_to_action TEXT,
  
  -- Performance (cache)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC(5,2),
  
  -- AI Analysis
  ai_score NUMERIC(3,2),
  ai_analysis JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ads_creatives_creative_id ON ads_creatives(creative_id);
CREATE INDEX idx_ads_creatives_campaign_id ON ads_creatives(campaign_id);
CREATE INDEX idx_ads_creatives_status ON ads_creatives(status);

DROP TRIGGER IF EXISTS update_ads_creatives_updated_at ON ads_creatives;
CREATE TRIGGER update_ads_creatives_updated_at
  BEFORE UPDATE ON ads_creatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. TABELA: ads_audiences (Públicos)
-- ========================================
CREATE TABLE IF NOT EXISTS public.ads_audiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Meta Ads
  audience_id TEXT UNIQUE NOT NULL,
  ad_account_id TEXT NOT NULL,
  
  -- Info básica
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  status TEXT DEFAULT 'active',
  
  -- Size
  approximate_count BIGINT,
  
  -- Rules (para custom audiences)
  rules JSONB,
  
  -- Lookalike source
  lookalike_source_id TEXT,
  lookalike_ratio NUMERIC(3,2),
  
  -- Performance
  campaigns_using INTEGER DEFAULT 0,
  total_spend NUMERIC(10,2) DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  avg_cpl NUMERIC(10,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ads_audiences_audience_id ON ads_audiences(audience_id);
CREATE INDEX idx_ads_audiences_type ON ads_audiences(type);
CREATE INDEX idx_ads_audiences_status ON ads_audiences(status);

DROP TRIGGER IF EXISTS update_ads_audiences_updated_at ON ads_audiences;
CREATE TRIGGER update_ads_audiences_updated_at
  BEFORE UPDATE ON ads_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 11. TABELA: whatsapp_contacts (Contatos WhatsApp)
-- ========================================
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- WhatsApp
  phone TEXT UNIQUE NOT NULL,
  profile_name TEXT,
  
  -- Info
  name TEXT,
  email TEXT,
  
  -- Relacionamento com Lead
  lead_id UUID REFERENCES insurance_leads(id),
  
  -- Stats
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_blocked BOOLEAN DEFAULT false,
  tags TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX idx_whatsapp_contacts_email ON whatsapp_contacts(email);
CREATE INDEX idx_whatsapp_contacts_lead_id ON whatsapp_contacts(lead_id);

DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 12. TABELA: whatsapp_messages (Mensagens WhatsApp)
-- ========================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  
  -- WhatsApp
  wa_message_id TEXT UNIQUE,
  phone TEXT NOT NULL,
  
  -- Message
  direction TEXT NOT NULL, -- inbound, outbound
  type TEXT NOT NULL, -- text, image, video, audio, document
  content TEXT,
  media_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- ========================================
-- 13. TABELA: webhook_logs (Logs de Webhooks)
-- ========================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  
  -- Payload
  payload JSONB NOT NULL,
  headers JSONB,
  
  -- Processing
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Relacionamentos
  lead_id UUID REFERENCES insurance_leads(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_lead_id ON webhook_logs(lead_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- ========================================
-- 14. TABELA: integration_settings (Configurações de Integrações)
-- ========================================
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User
  user_id UUID,
  
  -- Integration
  integration_name TEXT NOT NULL,
  
  -- Credentials (ENCRYPTED)
  encrypted_credentials JSONB NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  
  -- Config
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, integration_name)
);

CREATE INDEX idx_integration_settings_user_id ON integration_settings(user_id);
CREATE INDEX idx_integration_settings_integration_name ON integration_settings(integration_name);

DROP TRIGGER IF EXISTS update_integration_settings_updated_at ON integration_settings;
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 15. VIEWS ÚTEIS
-- ========================================

-- View: Pipeline de Vendas Completo
CREATE OR REPLACE VIEW public.pipeline_completo AS
SELECT 
  l.id as lead_id,
  l.nome,
  l.whatsapp,
  l.email,
  l.status as lead_status,
  l.operadora_atual,
  l.valor_atual,
  l.economia_estimada,
  COUNT(DISTINCT c.id) as total_cotacoes,
  COUNT(DISTINCT p.id) as total_propostas,
  MAX(c.created_at) as ultima_cotacao,
  MAX(p.created_at) as ultima_proposta,
  l.created_at as lead_criado_em
FROM insurance_leads l
LEFT JOIN cotacoes c ON c.lead_id = l.id
LEFT JOIN propostas p ON p.lead_id = l.id
WHERE l.arquivado = FALSE
GROUP BY l.id, l.nome, l.whatsapp, l.email, l.status, l.operadora_atual, 
         l.valor_atual, l.economia_estimada, l.created_at
ORDER BY l.created_at DESC;

-- View: Desempenho por Operadora
CREATE OR REPLACE VIEW public.desempenho_operadoras AS
SELECT 
  o.nome as operadora,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT c.id) as total_cotacoes,
  COUNT(DISTINCT p.id) as total_propostas,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'ativa') as propostas_ativas,
  AVG(p.valor_mensalidade) as ticket_medio,
  SUM(p.valor_mensalidade) FILTER (WHERE p.status = 'ativa') as receita_recorrente
FROM operadoras o
LEFT JOIN planos pl ON pl.operadora_id = o.id
LEFT JOIN propostas p ON p.operadora_id = o.id
LEFT JOIN cotacoes c ON c.plano_id = pl.id
LEFT JOIN insurance_leads l ON l.id = c.lead_id
WHERE o.ativa = true
GROUP BY o.id, o.nome
ORDER BY propostas_ativas DESC, total_leads DESC;

-- View: Análise de Campanhas
CREATE OR REPLACE VIEW public.analise_campanhas AS
SELECT 
  ac.name as campanha,
  ac.status,
  ac.spend as investimento,
  ac.impressions as impressoes,
  ac.clicks as cliques,
  ac.leads_generated as leads_gerados,
  ac.cpl as custo_por_lead,
  COUNT(DISTINCT l.id) as leads_no_sistema,
  COUNT(DISTINCT p.id) as propostas_fechadas,
  SUM(p.valor_mensalidade) as receita_gerada,
  CASE 
    WHEN ac.spend > 0 THEN 
      ROUND((SUM(p.valor_mensalidade * 12) / ac.spend)::NUMERIC, 2)
    ELSE 0
  END as roi_anual
FROM ads_campaigns ac
LEFT JOIN insurance_leads l ON l.origem = 'meta_ads' 
  AND l.metadata->>'campaign_id' = ac.campaign_id
LEFT JOIN propostas p ON p.lead_id = l.id AND p.status = 'ativa'
GROUP BY ac.id, ac.name, ac.status, ac.spend, ac.impressions, 
         ac.clicks, ac.leads_generated, ac.cpl
ORDER BY ac.created_at DESC;

-- ========================================
-- 16. DADOS INICIAIS (Opcional)
-- ========================================

-- Inserir operadoras principais
INSERT INTO operadoras (nome, cnpj, ativa) VALUES
  ('Unimed', '00.000.000/0001-00', true),
  ('Bradesco Saúde', '00.000.000/0001-01', true),
  ('Amil', '00.000.000/0001-02', true),
  ('SulAmérica', '00.000.000/0001-03', true),
  ('Porto Seguro', '00.000.000/0001-04', true),
  ('NotreDame Intermédica', '00.000.000/0001-05', true),
  ('Hapvida', '00.000.000/0001-06', true),
  ('Prevent Senior', '00.000.000/0001-07', true)
ON CONFLICT (nome) DO NOTHING;

-- ========================================
-- RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS em tabelas críticas
ALTER TABLE operadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir leitura para service role)
CREATE POLICY "Enable read access for service role" ON operadoras
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for service role" ON planos
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for service role" ON cotacoes
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for service role" ON propostas
  FOR SELECT USING (true);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Listar todas as tabelas criadas
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Listar todas as views
SELECT 
  schemaname,
  viewname 
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- ========================================
-- FIM DO SCHEMA COMPLETO
-- ========================================

NOTIFY pgrst, 'reload schema';
