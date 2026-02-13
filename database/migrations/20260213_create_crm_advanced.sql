-- =====================================================
-- MIGRATION: CRM Avançado — Pipeline, Deals, Contacts, Companies, Activities, Workflows
-- Data: 2026-02-13
-- Fase 1 — Fundação do CRM estilo RD Station + HubSpot
-- =====================================================
-- CONTEXTO: Expande o CRM existente (crm_cards/crm_interacoes) com entidades
-- separadas para deals, contacts, companies e automações
-- COMPATIBILIDADE: Mantém crm_cards como Kanban do corretor intacto
-- =====================================================

-- ========================================
-- 1. TABELA: crm_pipelines (Pipelines configuráveis)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  posicao INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  cor VARCHAR(7) DEFAULT '#D4AF37',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline padrão
INSERT INTO public.crm_pipelines (nome, descricao, posicao, is_default)
VALUES ('Pipeline Principal', 'Funil de vendas principal para planos de saúde', 0, true)
ON CONFLICT DO NOTHING;

DROP TRIGGER IF EXISTS update_crm_pipelines_updated_at ON crm_pipelines;
CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON crm_pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. TABELA: crm_stages (Etapas do Pipeline)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  posicao INTEGER NOT NULL DEFAULT 0,
  cor VARCHAR(7) DEFAULT '#6366F1',
  icone VARCHAR(50) DEFAULT 'Circle',
  probabilidade INTEGER DEFAULT 0 CHECK (probabilidade >= 0 AND probabilidade <= 100),
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  auto_move_days INTEGER, -- Mover automaticamente após X dias sem atividade
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pipeline_id, slug)
);

-- Stages padrão para Pipeline Principal
DO $$
DECLARE
  v_pipeline_id UUID;
BEGIN
  SELECT id INTO v_pipeline_id FROM public.crm_pipelines WHERE is_default = true LIMIT 1;
  IF v_pipeline_id IS NOT NULL THEN
    INSERT INTO public.crm_stages (pipeline_id, nome, slug, posicao, cor, icone, probabilidade, is_won, is_lost) VALUES
      (v_pipeline_id, 'Novo Lead', 'novo_lead', 0, '#3B82F6', 'UserPlus', 10, false, false),
      (v_pipeline_id, 'Qualificado', 'qualificado', 1, '#8B5CF6', 'CheckCircle', 25, false, false),
      (v_pipeline_id, 'Proposta Enviada', 'proposta_enviada', 2, '#F59E0B', 'Send', 50, false, false),
      (v_pipeline_id, 'Negociação', 'negociacao', 3, '#EC4899', 'MessageSquare', 70, false, false),
      (v_pipeline_id, 'Documentação', 'documentacao', 4, '#06B6D4', 'FileText', 85, false, false),
      (v_pipeline_id, 'Fechado Ganho', 'fechado_ganho', 5, '#10B981', 'Trophy', 100, true, false),
      (v_pipeline_id, 'Perdido', 'perdido', 6, '#EF4444', 'XCircle', 0, false, true)
    ON CONFLICT (pipeline_id, slug) DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON crm_stages(pipeline_id, posicao);

DROP TRIGGER IF EXISTS update_crm_stages_updated_at ON crm_stages;
CREATE TRIGGER update_crm_stages_updated_at
  BEFORE UPDATE ON crm_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. TABELA: crm_companies (Empresas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  razao_social VARCHAR(255),
  dominio VARCHAR(255),
  setor VARCHAR(100),         -- Saúde, Tecnologia, etc.
  porte VARCHAR(50),          -- MEI, ME, EPP, Médio, Grande
  qtd_funcionarios INTEGER,
  faturamento_anual DECIMAL(15,2),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco JSONB DEFAULT '{}'::jsonb,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  owner_corretor_id UUID REFERENCES corretores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_cnpj ON crm_companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_crm_companies_owner ON crm_companies(owner_corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_nome ON crm_companies USING gin(nome gin_trgm_ops);

DROP TRIGGER IF EXISTS update_crm_companies_updated_at ON crm_companies;
CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. TABELA: crm_contacts (Contatos individuais)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES insurance_leads(id) ON DELETE SET NULL,
  owner_corretor_id UUID REFERENCES corretores(id) ON DELETE SET NULL,
  
  -- Dados pessoais
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  cpf VARCHAR(14),
  data_nascimento DATE,
  cargo VARCHAR(100),
  
  -- Lifecycle
  lifecycle_stage VARCHAR(50) DEFAULT 'lead' 
    CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist')),
  lead_source VARCHAR(100),
  
  -- Scoring & Engagement
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_motivo TEXT,
  ultimo_contato TIMESTAMPTZ,
  total_atividades INTEGER DEFAULT 0,
  
  -- Extras
  avatar_url TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead ON crm_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner ON crm_contacts(owner_corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lifecycle ON crm_contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_score ON crm_contacts(score DESC);

DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. TABELA: crm_deals (Negócios/Oportunidades)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE RESTRICT,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  owner_corretor_id UUID REFERENCES corretores(id) ON DELETE SET NULL,
  
  -- Vinculação com CRM existente do corretor
  crm_card_id UUID REFERENCES crm_cards(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES insurance_leads(id) ON DELETE SET NULL,
  
  -- Dados do deal
  titulo VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2),
  valor_recorrente DECIMAL(12,2),  -- Para planos de saúde (mensalidade)
  moeda VARCHAR(3) DEFAULT 'BRL',
  
  -- Datas
  data_previsao_fechamento DATE,
  data_ganho TIMESTAMPTZ,
  data_perda TIMESTAMPTZ,
  
  -- Forecast
  probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100),
  
  -- Posição no Kanban (drag-and-drop dentro do stage)
  posicao INTEGER NOT NULL DEFAULT 0,
  
  -- Motivo de perda
  motivo_perda VARCHAR(255),
  motivo_perda_detalhe TEXT,
  
  -- Scoring
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Engagement flags
  is_hot BOOLEAN DEFAULT false,
  is_stale BOOLEAN DEFAULT false,
  dias_no_stage INTEGER DEFAULT 0,
  
  -- Tags e metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON crm_deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_crm_card ON crm_deals(crm_card_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_lead ON crm_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_posicao ON crm_deals(stage_id, posicao);
CREATE INDEX IF NOT EXISTS idx_crm_deals_score ON crm_deals(score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_deals_previsao ON crm_deals(data_previsao_fechamento);

DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON crm_deals;
CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. TABELA: crm_activities (Timeline de atividades)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Entidade relacionada (polimórfico)
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  
  -- Quem fez
  owner_corretor_id UUID REFERENCES corretores(id) ON DELETE SET NULL,
  
  -- Tipo
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'ligacao', 'email', 'reuniao', 'whatsapp', 'nota', 'tarefa',
    'proposta_enviada', 'proposta_aceita', 'proposta_recusada',
    'documento_enviado', 'documento_recebido', 'visita',
    'follow_up', 'stage_change', 'sistema'
  )),
  
  -- Conteúdo
  assunto VARCHAR(255),
  descricao TEXT,
  
  -- Status (para tarefas/follow-ups)
  concluida BOOLEAN DEFAULT false,
  data_vencimento TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  duracao_minutos INTEGER,
  
  -- Anexos e metadata
  anexo_url TEXT,
  anexo_tipo VARCHAR(50),
  resultado VARCHAR(100), -- "Interessado", "Não atendeu", "Reagendou", etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_owner ON crm_activities(owner_corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_tipo ON crm_activities(tipo);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created ON crm_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_vencimento ON crm_activities(data_vencimento) WHERE concluida = false;

-- ========================================
-- 7. TABELA: crm_products (Produtos vinculáveis a deals)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  codigo VARCHAR(50),
  operadora_id UUID REFERENCES operadoras(id) ON DELETE SET NULL,
  preco DECIMAL(12,2) NOT NULL,
  preco_recorrente DECIMAL(12,2), -- Mensalidade do plano
  moeda VARCHAR(3) DEFAULT 'BRL',
  categoria VARCHAR(100),  -- PME, Adesão, Individual, Empresarial
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_products_operadora ON crm_products(operadora_id);
CREATE INDEX IF NOT EXISTS idx_crm_products_active ON crm_products(is_active);

DROP TRIGGER IF EXISTS update_crm_products_updated_at ON crm_products;
CREATE TRIGGER update_crm_products_updated_at
  BEFORE UPDATE ON crm_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. TABELA: crm_deal_products (Produtos de um deal)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_deal_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES crm_products(id) ON DELETE CASCADE,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(12,2) NOT NULL,
  desconto_pct DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_products_deal ON crm_deal_products(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_products_product ON crm_deal_products(product_id);

-- ========================================
-- 9. TABELA: crm_workflows (Automações)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Trigger
  trigger_type VARCHAR(100) NOT NULL CHECK (trigger_type IN (
    'deal.stage.changed', 'deal.created', 'deal.won', 'deal.lost',
    'contact.created', 'contact.lifecycle.changed',
    'activity.overdue', 'contact.form.submitted',
    'schedule.daily', 'schedule.weekly', 'webhook.received'
  )),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  
  -- Ações (array ordenado de steps)
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES corretores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_workflows_active ON crm_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_workflows_trigger ON crm_workflows(trigger_type);

DROP TRIGGER IF EXISTS update_crm_workflows_updated_at ON crm_workflows;
CREATE TRIGGER update_crm_workflows_updated_at
  BEFORE UPDATE ON crm_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. TABELA: crm_workflow_executions (Log de execuções)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  entity_type VARCHAR(50), -- deal, contact, company
  entity_id UUID,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  error_message TEXT,
  duration_ms INTEGER,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_wf_exec_workflow ON crm_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_crm_wf_exec_status ON crm_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_crm_wf_exec_date ON crm_workflow_executions(executed_at DESC);

-- ========================================
-- 11. TABELA: crm_custom_fields_config (Campos personalizáveis)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_custom_fields_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company')),
  field_key VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN (
    'text', 'number', 'date', 'select', 'multi_select', 'boolean', 'url', 'email', 'phone'
  )),
  options JSONB DEFAULT '[]'::jsonb, -- Para select/multi_select
  is_required BOOLEAN DEFAULT false,
  posicao INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entity_type, field_key)
);

-- ========================================
-- 12. VIEW: crm_deal_metrics (Analytics do CRM)
-- ========================================
DROP VIEW IF EXISTS public.crm_deal_metrics;
CREATE VIEW public.crm_deal_metrics AS
SELECT
  -- Totais
  COUNT(*) AS total_deals,
  COUNT(*) FILTER (WHERE d.data_ganho IS NOT NULL) AS deals_ganhos,
  COUNT(*) FILTER (WHERE d.data_perda IS NOT NULL) AS deals_perdidos,
  COUNT(*) FILTER (WHERE d.data_ganho IS NULL AND d.data_perda IS NULL) AS deals_abertos,
  
  -- Valores
  COALESCE(SUM(d.valor), 0) AS valor_total_pipeline,
  COALESCE(SUM(d.valor) FILTER (WHERE d.data_ganho IS NOT NULL), 0) AS valor_ganho,
  COALESCE(SUM(d.valor) FILTER (WHERE d.data_perda IS NOT NULL), 0) AS valor_perdido,
  COALESCE(SUM(d.valor) FILTER (WHERE d.data_ganho IS NULL AND d.data_perda IS NULL), 0) AS valor_aberto,
  COALESCE(AVG(d.valor), 0) AS ticket_medio,
  
  -- Forecast (probabilidade × valor)
  COALESCE(SUM(d.valor * d.probabilidade / 100.0) FILTER (WHERE d.data_ganho IS NULL AND d.data_perda IS NULL), 0) AS forecast_ponderado,
  
  -- Taxa de conversão
  ROUND(
    COUNT(*) FILTER (WHERE d.data_ganho IS NOT NULL)::DECIMAL /
    NULLIF(COUNT(*), 0) * 100, 2
  ) AS taxa_conversao,
  
  -- Tempo médio de fechamento (dias)
  ROUND(AVG(
    EXTRACT(EPOCH FROM (d.data_ganho - d.created_at)) / 86400
  ) FILTER (WHERE d.data_ganho IS NOT NULL), 1) AS tempo_medio_fechamento_dias,
  
  -- Período
  COUNT(*) FILTER (WHERE d.created_at >= NOW() - INTERVAL '30 days') AS deals_mes_atual,
  COUNT(*) FILTER (WHERE d.created_at >= NOW() - INTERVAL '7 days') AS deals_semana_atual,
  COUNT(*) FILTER (WHERE DATE(d.created_at) = CURRENT_DATE) AS deals_hoje,
  
  -- Por prioridade
  COUNT(*) FILTER (WHERE d.prioridade = 'urgente') AS deals_urgentes,
  COUNT(*) FILTER (WHERE d.is_hot = true) AS deals_hot,
  COUNT(*) FILTER (WHERE d.is_stale = true) AS deals_stale,
  
  -- Timestamps
  MAX(d.created_at) AS ultimo_deal_criado,
  MAX(d.updated_at) AS ultima_atualizacao
FROM public.crm_deals d;

-- ========================================
-- 13. VIEW: crm_deal_by_stage (Deals por stage)
-- ========================================
DROP VIEW IF EXISTS public.crm_deal_by_stage;
CREATE VIEW public.crm_deal_by_stage AS
SELECT
  s.id AS stage_id,
  s.nome AS stage_nome,
  s.slug AS stage_slug,
  s.cor AS stage_cor,
  s.posicao AS stage_posicao,
  s.probabilidade,
  p.id AS pipeline_id,
  p.nome AS pipeline_nome,
  COUNT(d.id) AS total_deals,
  COALESCE(SUM(d.valor), 0) AS valor_total,
  COALESCE(AVG(d.valor), 0) AS valor_medio,
  COUNT(d.id) FILTER (WHERE d.is_hot = true) AS deals_hot,
  COUNT(d.id) FILTER (WHERE d.is_stale = true) AS deals_stale
FROM public.crm_stages s
LEFT JOIN public.crm_deals d ON d.stage_id = s.id
JOIN public.crm_pipelines p ON p.id = s.pipeline_id
WHERE p.is_active = true
GROUP BY s.id, s.nome, s.slug, s.cor, s.posicao, s.probabilidade, p.id, p.nome
ORDER BY p.posicao, s.posicao;

-- ========================================
-- 14. VIEW: crm_corretor_performance (Performance por corretor)
-- ========================================
DROP VIEW IF EXISTS public.crm_corretor_performance;
CREATE VIEW public.crm_corretor_performance AS
SELECT
  c.id AS corretor_id,
  c.nome AS corretor_nome,
  c.foto_url,
  COUNT(d.id) AS total_deals,
  COUNT(d.id) FILTER (WHERE d.data_ganho IS NOT NULL) AS deals_ganhos,
  COUNT(d.id) FILTER (WHERE d.data_perda IS NOT NULL) AS deals_perdidos,
  COALESCE(SUM(d.valor) FILTER (WHERE d.data_ganho IS NOT NULL), 0) AS valor_ganho,
  COALESCE(SUM(d.valor), 0) AS valor_pipeline,
  ROUND(
    COUNT(d.id) FILTER (WHERE d.data_ganho IS NOT NULL)::DECIMAL /
    NULLIF(COUNT(d.id), 0) * 100, 2
  ) AS taxa_conversao,
  COUNT(a.id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '7 days') AS atividades_7d,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (d.data_ganho - d.created_at)) / 86400
  ) FILTER (WHERE d.data_ganho IS NOT NULL), 1) AS tempo_medio_dias
FROM public.corretores c
LEFT JOIN public.crm_deals d ON d.owner_corretor_id = c.id
LEFT JOIN public.crm_activities a ON a.owner_corretor_id = c.id
WHERE c.ativo = true
GROUP BY c.id, c.nome, c.foto_url;

-- ========================================
-- 15. RPC: Mover deal entre stages (atômico)
-- ========================================
CREATE OR REPLACE FUNCTION public.move_crm_deal(
  p_deal_id UUID,
  p_new_stage_id UUID,
  p_new_position INTEGER,
  p_corretor_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_old_stage_id UUID;
  v_old_stage_nome VARCHAR;
  v_new_stage_nome VARCHAR;
  v_is_won BOOLEAN;
  v_is_lost BOOLEAN;
BEGIN
  -- Buscar stage atual
  SELECT stage_id INTO v_old_stage_id FROM crm_deals WHERE id = p_deal_id;
  SELECT nome INTO v_old_stage_nome FROM crm_stages WHERE id = v_old_stage_id;
  SELECT nome, is_won, is_lost INTO v_new_stage_nome, v_is_won, v_is_lost FROM crm_stages WHERE id = p_new_stage_id;

  -- Atualizar deal
  UPDATE crm_deals SET
    stage_id = p_new_stage_id,
    posicao = p_new_position,
    data_ganho = CASE WHEN v_is_won THEN NOW() ELSE data_ganho END,
    data_perda = CASE WHEN v_is_lost THEN NOW() ELSE data_perda END,
    dias_no_stage = 0,
    updated_at = NOW()
  WHERE id = p_deal_id;

  -- Registrar atividade de mudança de stage
  IF v_old_stage_id IS DISTINCT FROM p_new_stage_id THEN
    INSERT INTO crm_activities (deal_id, owner_corretor_id, tipo, assunto, descricao, metadata)
    VALUES (
      p_deal_id,
      p_corretor_id,
      'stage_change',
      'Movido no pipeline',
      format('De "%s" para "%s"', v_old_stage_nome, v_new_stage_nome),
      jsonb_build_object('stage_anterior', v_old_stage_id, 'stage_novo', p_new_stage_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'is_won', v_is_won, 'is_lost', v_is_lost);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 16. RPC: Recalcular score do deal
-- ========================================
CREATE OR REPLACE FUNCTION public.recalculate_deal_score(p_deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_deal RECORD;
  v_activity_count INTEGER;
  v_days_since_activity INTEGER;
BEGIN
  SELECT * INTO v_deal FROM crm_deals WHERE id = p_deal_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- +20 se tem valor
  IF v_deal.valor IS NOT NULL AND v_deal.valor > 0 THEN v_score := v_score + 20; END IF;

  -- +15 se tem contato vinculado
  IF v_deal.contact_id IS NOT NULL THEN v_score := v_score + 15; END IF;

  -- +15 se tem empresa vinculada
  IF v_deal.company_id IS NOT NULL THEN v_score := v_score + 10; END IF;

  -- +20 se stage avançado (probabilidade > 50)
  IF EXISTS (SELECT 1 FROM crm_stages WHERE id = v_deal.stage_id AND probabilidade > 50) THEN
    v_score := v_score + 20;
  END IF;

  -- +15 se teve atividade nos últimos 3 dias
  SELECT COUNT(*) INTO v_activity_count
  FROM crm_activities
  WHERE deal_id = p_deal_id AND created_at >= NOW() - INTERVAL '3 days';
  
  IF v_activity_count > 0 THEN v_score := v_score + 15; END IF;
  IF v_activity_count > 3 THEN v_score := v_score + 10; END IF;

  -- +10 se prioridade alta/urgente
  IF v_deal.prioridade IN ('alta', 'urgente') THEN v_score := v_score + 10; END IF;

  v_score := LEAST(v_score, 100);

  -- Detectar hot/stale
  SELECT EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400 INTO v_days_since_activity
  FROM crm_activities WHERE deal_id = p_deal_id;

  UPDATE crm_deals SET
    score = v_score,
    is_hot = (v_days_since_activity IS NOT NULL AND v_days_since_activity <= 1),
    is_stale = (v_days_since_activity IS NULL OR v_days_since_activity > 3),
    updated_at = NOW()
  WHERE id = p_deal_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 17. RLS Policies (Row Level Security)
-- ========================================
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Pipelines/Stages: leitura pública (configuração global)
CREATE POLICY "crm_pipelines_read" ON crm_pipelines FOR SELECT USING (true);
CREATE POLICY "crm_stages_read" ON crm_stages FOR SELECT USING (true);
CREATE POLICY "crm_products_read" ON crm_products FOR SELECT USING (true);

-- Service role pode tudo (backend usa service key)
CREATE POLICY "crm_pipelines_service" ON crm_pipelines FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_stages_service" ON crm_stages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_companies_service" ON crm_companies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_contacts_service" ON crm_contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_deals_service" ON crm_deals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_activities_service" ON crm_activities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_products_service" ON crm_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_deal_products_service" ON crm_deal_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_workflows_service" ON crm_workflows FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "crm_wf_exec_service" ON crm_workflow_executions FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE crm_pipelines IS 'Pipelines configuráveis (Admin pode criar múltiplos funis)';
COMMENT ON TABLE crm_stages IS 'Etapas de cada pipeline com probabilidade para forecast';
COMMENT ON TABLE crm_companies IS 'Empresas vinculadas a deals e contatos';
COMMENT ON TABLE crm_contacts IS 'Contatos com lifecycle stage e scoring';
COMMENT ON TABLE crm_deals IS 'Negócios/oportunidades no pipeline com drag-and-drop';
COMMENT ON TABLE crm_activities IS 'Timeline de atividades (ligação, email, reunião, etc.)';
COMMENT ON TABLE crm_products IS 'Produtos (planos de saúde) vinculáveis a deals';
COMMENT ON TABLE crm_workflows IS 'Automações com triggers e actions configuráveis';
COMMENT ON COLUMN crm_deals.valor_recorrente IS 'Valor mensal do plano de saúde (MRR)';
COMMENT ON COLUMN crm_stages.probabilidade IS 'Probabilidade de fechamento (0-100%) para forecast ponderado';
COMMENT ON COLUMN crm_stages.auto_move_days IS 'Mover deal para próximo stage se parado X dias sem atividade';
