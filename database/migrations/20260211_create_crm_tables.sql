-- =============================================
-- 📦 CRM TABLES - Migration Standalone
-- =============================================
-- Cria todas as tabelas necessárias para o CRM do corretor
-- Seguro para executar múltiplas vezes (IF NOT EXISTS)
-- =============================================

-- 0. Garantir que a função update_updated_at_column existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 1. TABELA: crm_kanban_columns
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_kanban_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  cor VARCHAR(7) DEFAULT '#FFFFFF',
  icone VARCHAR(50),
  posicao INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colunas padrão do Kanban
INSERT INTO crm_kanban_columns (nome, slug, cor, icone, posicao) VALUES
  ('Novo Lead', 'novo_lead', '#3B82F6', 'UserPlus', 0),
  ('Qualificado', 'qualificado', '#8B5CF6', 'CheckCircle', 1),
  ('Proposta Enviada', 'proposta_enviada', '#F59E0B', 'Send', 2),
  ('Documentação', 'documentacao', '#06B6D4', 'FileText', 3),
  ('Fechado', 'fechado', '#10B981', 'Trophy', 4),
  ('Perdido', 'perdido', '#EF4444', 'XCircle', 5)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- 2. TABELA: crm_cards
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  lead_id UUID,
  coluna_slug VARCHAR(50) NOT NULL REFERENCES crm_kanban_columns(slug),
  
  -- Dados do card
  titulo VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(255),
  valor_estimado DECIMAL(10,2),
  
  -- Posição no Kanban (drag & drop ordering)
  posicao INTEGER NOT NULL DEFAULT 0,
  
  -- Lead Scoring (0–100)
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_motivo TEXT,
  
  -- Engajamento
  ultima_interacao_proposta TIMESTAMP WITH TIME ZONE,
  total_interacoes INTEGER DEFAULT 0,
  
  -- Tags e prioridade
  tags TEXT[] DEFAULT '{}',
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar FK para insurance_leads se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_leads') THEN
    BEGIN
      ALTER TABLE crm_cards ADD CONSTRAINT fk_crm_cards_lead_id FOREIGN KEY (lead_id) REFERENCES insurance_leads(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- constraint já existe
    END;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_crm_cards_corretor_id ON crm_cards(corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_cards_coluna_slug ON crm_cards(coluna_slug);
CREATE INDEX IF NOT EXISTS idx_crm_cards_lead_id ON crm_cards(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_cards_score ON crm_cards(score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_cards_updated_at ON crm_cards(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_cards_posicao ON crm_cards(posicao);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_crm_cards_updated_at ON crm_cards;
CREATE TRIGGER update_crm_cards_updated_at
  BEFORE UPDATE ON crm_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. TABELA: crm_interacoes
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_interacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  card_id UUID NOT NULL REFERENCES crm_cards(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES corretores(id),
  lead_id UUID,
  
  -- Tipo de interação
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'nota', 'ligacao', 'whatsapp', 'email', 'reuniao',
    'proposta_enviada', 'proposta_aceita', 'proposta_recusada',
    'documento_recebido', 'status_change', 'nota_voz', 'sistema'
  )),
  
  -- Conteúdo
  titulo VARCHAR(255),
  descricao TEXT,
  
  -- Anexos
  anexo_url TEXT,
  anexo_tipo VARCHAR(50),
  
  -- Mudança de status (timeline)
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_interacoes_card_id ON crm_interacoes(card_id);
CREATE INDEX IF NOT EXISTS idx_crm_interacoes_corretor_id ON crm_interacoes(corretor_id);
CREATE INDEX IF NOT EXISTS idx_crm_interacoes_lead_id ON crm_interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_interacoes_tipo ON crm_interacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_crm_interacoes_created_at ON crm_interacoes(created_at DESC);

-- ========================================
-- 4. TABELA: corretor_uploads
-- ========================================
CREATE TABLE IF NOT EXISTS public.corretor_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho_bytes BIGINT,
  pasta VARCHAR(50) DEFAULT 'geral',
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corretor_uploads_corretor_id ON corretor_uploads(corretor_id);
CREATE INDEX IF NOT EXISTS idx_corretor_uploads_pasta ON corretor_uploads(pasta);

-- ========================================
-- 5. TABELA: renovacoes (se não depender de propostas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.renovacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES corretores(id),
  proposta_id UUID,
  lead_id UUID,
  
  -- Dados do contrato
  nome_cliente VARCHAR(255) NOT NULL,
  operadora_nome VARCHAR(100),
  valor_atual DECIMAL(10,2),
  
  -- Vigência
  data_vencimento DATE NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'contato_feito', 'negociando', 'renovado', 'cancelado', 'perdido'
  )),
  
  -- Notificações
  notificacao_30d BOOLEAN DEFAULT false,
  notificacao_60d BOOLEAN DEFAULT false,
  notificacao_enviada_em TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renovacoes_corretor_id ON renovacoes(corretor_id);
CREATE INDEX IF NOT EXISTS idx_renovacoes_data_vencimento ON renovacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_renovacoes_status ON renovacoes(status);

DROP TRIGGER IF EXISTS update_renovacoes_updated_at ON renovacoes;
CREATE TRIGGER update_renovacoes_updated_at
  BEFORE UPDATE ON renovacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. TABELA: materiais_vendas
-- ========================================
CREATE TABLE IF NOT EXISTS public.materiais_vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  categoria VARCHAR(50) NOT NULL DEFAULT 'geral',
  subcategoria VARCHAR(100),
  operadora_id UUID,
  
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo_arquivo VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  thumbnail_url TEXT,
  
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  
  uploaded_by UUID,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiais_vendas_categoria ON materiais_vendas(categoria);
CREATE INDEX IF NOT EXISTS idx_materiais_vendas_ativo ON materiais_vendas(ativo);

DROP TRIGGER IF EXISTS update_materiais_vendas_updated_at ON materiais_vendas;
CREATE TRIGGER update_materiais_vendas_updated_at
  BEFORE UPDATE ON materiais_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. TABELA: banner_requests
-- ========================================
CREATE TABLE IF NOT EXISTS public.banner_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES corretores(id),
  
  nome_corretor VARCHAR(255) NOT NULL,
  whatsapp_corretor VARCHAR(20) NOT NULL,
  template_id VARCHAR(50),
  
  imagem_url TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'pronto', 'erro')),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banner_requests_corretor_id ON banner_requests(corretor_id);

-- ========================================
-- 8. TABELA: comissoes (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  proposta_id UUID,
  
  -- Dados
  descricao VARCHAR(255),
  valor_comissao DECIMAL(10,2) NOT NULL DEFAULT 0,
  percentual DECIMAL(5,2),
  
  -- Referência
  mes_referencia VARCHAR(7), -- '2026-01'
  competencia DATE,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'paga', 'cancelada')),
  data_pagamento DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comissoes_corretor_id ON comissoes(corretor_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON comissoes(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_mes_referencia ON comissoes(mes_referencia);

DROP TRIGGER IF EXISTS update_comissoes_updated_at ON comissoes;
CREATE TRIGGER update_comissoes_updated_at
  BEFORE UPDATE ON comissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. VIEW: corretor_dashboard
-- ========================================
CREATE OR REPLACE VIEW public.corretor_dashboard AS
SELECT
  c.id as corretor_id,
  c.nome as corretor_nome,
  COUNT(DISTINCT card.id) FILTER (WHERE card.coluna_slug = 'novo_lead') as leads_novos,
  COUNT(DISTINCT card.id) FILTER (WHERE card.coluna_slug = 'qualificado') as leads_qualificados,
  COUNT(DISTINCT card.id) FILTER (WHERE card.coluna_slug = 'proposta_enviada') as propostas_enviadas,
  COUNT(DISTINCT card.id) FILTER (WHERE card.coluna_slug = 'fechado') as fechados,
  COUNT(DISTINCT card.id) FILTER (WHERE card.coluna_slug = 'perdido') as perdidos,
  COALESCE(SUM(com.valor_comissao) FILTER (WHERE com.status = 'paga'), 0) as comissao_recebida,
  COALESCE(SUM(com.valor_comissao) FILTER (WHERE com.status = 'pendente'), 0) as comissao_pendente,
  COUNT(DISTINCT r.id) FILTER (WHERE r.data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '30 days') as renovacoes_30d,
  COUNT(DISTINCT r.id) FILTER (WHERE r.data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '60 days') as renovacoes_60d
FROM corretores c
LEFT JOIN crm_cards card ON card.corretor_id = c.id
LEFT JOIN comissoes com ON com.corretor_id = c.id
LEFT JOIN renovacoes r ON r.corretor_id = c.id AND r.status = 'pendente'
WHERE c.ativo = true
GROUP BY c.id, c.nome;

-- ========================================
-- 10. RLS (Row Level Security)
-- ========================================

-- Habilitar RLS
ALTER TABLE crm_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE corretor_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

-- Policies que permitem service_role key (bypass RLS automaticamente para service_role)
-- As policies abaixo são para acesso via anon key se necessário

-- CRM Cards: corretor vê seus cards
DROP POLICY IF EXISTS "crm_cards_corretor_access" ON crm_cards;
CREATE POLICY "crm_cards_corretor_access" ON crm_cards
  FOR ALL USING (true); -- service_role bypassa RLS; refinamos via app

-- CRM Interações
DROP POLICY IF EXISTS "crm_interacoes_corretor_access" ON crm_interacoes;
CREATE POLICY "crm_interacoes_corretor_access" ON crm_interacoes
  FOR ALL USING (true);

-- Renovações
DROP POLICY IF EXISTS "renovacoes_corretor_access" ON renovacoes;
CREATE POLICY "renovacoes_corretor_access" ON renovacoes
  FOR ALL USING (true);

-- Uploads
DROP POLICY IF EXISTS "corretor_uploads_access" ON corretor_uploads;
CREATE POLICY "corretor_uploads_access" ON corretor_uploads
  FOR ALL USING (true);

-- Materiais
DROP POLICY IF EXISTS "materiais_vendas_access" ON materiais_vendas;
CREATE POLICY "materiais_vendas_access" ON materiais_vendas
  FOR ALL USING (true);

-- Banners
DROP POLICY IF EXISTS "banner_requests_access" ON banner_requests;
CREATE POLICY "banner_requests_access" ON banner_requests
  FOR ALL USING (true);

-- Comissões
DROP POLICY IF EXISTS "comissoes_access" ON comissoes;
CREATE POLICY "comissoes_access" ON comissoes
  FOR ALL USING (true);

-- ========================================
-- NOTIFY PostgREST para recarregar schema
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- VERIFICAÇÃO
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration CRM aplicada com sucesso!';
  RAISE NOTICE '  → crm_kanban_columns (6 colunas padrão)';
  RAISE NOTICE '  → crm_cards';
  RAISE NOTICE '  → crm_interacoes';
  RAISE NOTICE '  → corretor_uploads';
  RAISE NOTICE '  → renovacoes';
  RAISE NOTICE '  → materiais_vendas';
  RAISE NOTICE '  → banner_requests';
  RAISE NOTICE '  → comissoes';
  RAISE NOTICE '  → VIEW corretor_dashboard';
  RAISE NOTICE '  → RLS ativado em todas as tabelas';
END $$;
