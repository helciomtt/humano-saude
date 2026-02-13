-- =============================================
-- 📦 MÓDULO CORRETOR - SCHEMA COMPLETO
-- =============================================
-- Multi-tenant: corretor_id para escopo de dados
-- Kanban CRM, Lead Scoring, Materiais, Renovações
-- =============================================

-- ========================================
-- 1. TABELA: corretores (Perfil do Corretor)
-- ========================================
CREATE TABLE IF NOT EXISTS public.corretores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Vinculado ao auth.users (Supabase Auth)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Dados pessoais
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  
  -- Dados profissionais
  susep VARCHAR(20),
  creci VARCHAR(20),
  foto_url TEXT,
  
  -- White-label
  slug VARCHAR(100) UNIQUE,
  logo_personalizada_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#D4AF37',
  
  -- Hierarquia
  role VARCHAR(20) DEFAULT 'corretor' CHECK (role IN ('corretor', 'supervisor', 'admin')),
  supervisor_id UUID REFERENCES corretores(id),
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  data_admissao DATE,
  
  -- Comissionamento
  comissao_padrao_pct DECIMAL(5,2) DEFAULT 100.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_corretores_user_id ON corretores(user_id);
CREATE INDEX idx_corretores_slug ON corretores(slug);
CREATE INDEX idx_corretores_role ON corretores(role);
CREATE INDEX idx_corretores_supervisor_id ON corretores(supervisor_id);
CREATE INDEX idx_corretores_ativo ON corretores(ativo);

DROP TRIGGER IF EXISTS update_corretores_updated_at ON corretores;
CREATE TRIGGER update_corretores_updated_at
  BEFORE UPDATE ON corretores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. Adicionar corretor_id às tabelas existentes
-- ========================================

-- Adicionar corretor_id em insurance_leads (multi-tenant)
ALTER TABLE insurance_leads
  ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES corretores(id);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_corretor_id ON insurance_leads(corretor_id);

-- Adicionar corretor_id em cotacoes
ALTER TABLE cotacoes
  ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES corretores(id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_corretor_id ON cotacoes(corretor_id);

-- Adicionar corretor_id em propostas
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES corretores(id);
CREATE INDEX IF NOT EXISTS idx_propostas_corretor_id ON propostas(corretor_id);

-- ========================================
-- 3. TABELA: crm_kanban_columns (Colunas do Kanban)
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
-- 4. TABELA: crm_cards (Cards do Kanban)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos multi-tenant
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES insurance_leads(id) ON DELETE SET NULL,
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
  
  -- Engajamento (para brilho dourado)
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

CREATE INDEX idx_crm_cards_corretor_id ON crm_cards(corretor_id);
CREATE INDEX idx_crm_cards_coluna_slug ON crm_cards(coluna_slug);
CREATE INDEX idx_crm_cards_lead_id ON crm_cards(lead_id);
CREATE INDEX idx_crm_cards_score ON crm_cards(score DESC);
CREATE INDEX idx_crm_cards_updated_at ON crm_cards(updated_at DESC);
CREATE INDEX idx_crm_cards_posicao ON crm_cards(posicao);

DROP TRIGGER IF EXISTS update_crm_cards_updated_at ON crm_cards;
CREATE TRIGGER update_crm_cards_updated_at
  BEFORE UPDATE ON crm_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. TABELA: crm_interacoes (Timeline Hubspot-style)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_interacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  card_id UUID NOT NULL REFERENCES crm_cards(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES corretores(id),
  lead_id UUID REFERENCES insurance_leads(id),
  
  -- Tipo de interação
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'nota', 'ligacao', 'whatsapp', 'email', 'reuniao',
    'proposta_enviada', 'proposta_aceita', 'proposta_recusada',
    'documento_recebido', 'status_change', 'nota_voz', 'sistema'
  )),
  
  -- Conteúdo
  titulo VARCHAR(255),
  descricao TEXT,
  
  -- Anexos (áudio, documentos, etc.)
  anexo_url TEXT,
  anexo_tipo VARCHAR(50),
  
  -- Mudança de status (para timeline)
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crm_interacoes_card_id ON crm_interacoes(card_id);
CREATE INDEX idx_crm_interacoes_corretor_id ON crm_interacoes(corretor_id);
CREATE INDEX idx_crm_interacoes_lead_id ON crm_interacoes(lead_id);
CREATE INDEX idx_crm_interacoes_tipo ON crm_interacoes(tipo);
CREATE INDEX idx_crm_interacoes_created_at ON crm_interacoes(created_at DESC);

-- ========================================
-- 6. TABELA: materiais_vendas (Central de Materiais)
-- ========================================
CREATE TABLE IF NOT EXISTS public.materiais_vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Categorização estilo Google Drive
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('pme', 'adesao', 'individual', 'geral')),
  subcategoria VARCHAR(100),
  
  -- Operadora vinculada (opcional)
  operadora_id UUID REFERENCES operadoras(id),
  
  -- Dados do arquivo
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo_arquivo VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  thumbnail_url TEXT,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  
  -- Quem fez upload
  uploaded_by UUID REFERENCES corretores(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_materiais_vendas_categoria ON materiais_vendas(categoria);
CREATE INDEX idx_materiais_vendas_operadora_id ON materiais_vendas(operadora_id);
CREATE INDEX idx_materiais_vendas_ativo ON materiais_vendas(ativo);

DROP TRIGGER IF EXISTS update_materiais_vendas_updated_at ON materiais_vendas;
CREATE TRIGGER update_materiais_vendas_updated_at
  BEFORE UPDATE ON materiais_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. TABELA: banner_requests (Gerador de Banners)
-- ========================================
CREATE TABLE IF NOT EXISTS public.banner_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES corretores(id),
  
  -- Input do corretor
  nome_corretor VARCHAR(255) NOT NULL,
  whatsapp_corretor VARCHAR(20) NOT NULL,
  template_id VARCHAR(50),
  
  -- Output
  imagem_url TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'pronto', 'erro')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_banner_requests_corretor_id ON banner_requests(corretor_id);
CREATE INDEX idx_banner_requests_status ON banner_requests(status);

-- ========================================
-- 8. TABELA: renovacoes (Gold Mine - Vencimentos)
-- ========================================
CREATE TABLE IF NOT EXISTS public.renovacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  corretor_id UUID NOT NULL REFERENCES corretores(id),
  proposta_id UUID NOT NULL REFERENCES propostas(id),
  lead_id UUID REFERENCES insurance_leads(id),
  
  -- Dados do contrato
  nome_cliente VARCHAR(255) NOT NULL,
  operadora_nome VARCHAR(100),
  valor_atual DECIMAL(10,2),
  
  -- Vigência
  data_vencimento DATE NOT NULL,
  dias_para_vencimento INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (data_vencimento::timestamp - NOW()))::INTEGER
  ) STORED,
  
  -- Status de renovação
  status VARCHAR(30) DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'contato_feito', 'negociando', 'renovado', 'cancelado', 'perdido'
  )),
  
  -- Notificações enviadas
  notificacao_30d BOOLEAN DEFAULT false,
  notificacao_60d BOOLEAN DEFAULT false,
  notificacao_enviada_em TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_renovacoes_corretor_id ON renovacoes(corretor_id);
CREATE INDEX idx_renovacoes_proposta_id ON renovacoes(proposta_id);
CREATE INDEX idx_renovacoes_data_vencimento ON renovacoes(data_vencimento);
CREATE INDEX idx_renovacoes_status ON renovacoes(status);
CREATE INDEX idx_renovacoes_dias_vencimento ON renovacoes(dias_para_vencimento);

DROP TRIGGER IF EXISTS update_renovacoes_updated_at ON renovacoes;
CREATE TRIGGER update_renovacoes_updated_at
  BEFORE UPDATE ON renovacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. TABELA: comissao_comprovantes (Upload de Comprovantes)
-- ========================================
CREATE TABLE IF NOT EXISTS public.comissao_comprovantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  comissao_id UUID NOT NULL REFERENCES comissoes(id) ON DELETE CASCADE,
  
  -- Arquivo
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  
  -- Quem fez upload (admin)
  uploaded_by UUID REFERENCES corretores(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comissao_comprovantes_comissao_id ON comissao_comprovantes(comissao_id);

-- ========================================
-- 10. RLS MULTI-TENANT
-- ========================================

ALTER TABLE corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissao_comprovantes ENABLE ROW LEVEL SECURITY;

-- Corretor vê apenas seus próprios dados
CREATE POLICY "corretor_own_cards" ON crm_cards
  FOR ALL USING (
    corretor_id = (SELECT id FROM corretores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "corretor_own_interacoes" ON crm_interacoes
  FOR ALL USING (
    corretor_id = (SELECT id FROM corretores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "corretor_own_renovacoes" ON renovacoes
  FOR ALL USING (
    corretor_id = (SELECT id FROM corretores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "corretor_own_banners" ON banner_requests
  FOR ALL USING (
    corretor_id = (SELECT id FROM corretores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Materiais são visíveis para todos os corretores ativos
CREATE POLICY "materiais_read_all" ON materiais_vendas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND ativo = true)
  );

-- Apenas admin pode inserir/atualizar materiais
CREATE POLICY "materiais_admin_write" ON materiais_vendas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Comprovantes: corretor vê os seus, admin vê todos
CREATE POLICY "comprovantes_access" ON comissao_comprovantes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM comissoes c
      WHERE c.id = comissao_comprovantes.comissao_id
      AND (
        c.corretor_id = (SELECT id FROM corretores WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Corretores: vê a si próprio ou admin vê todos
CREATE POLICY "corretores_access" ON corretores
  FOR ALL USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM corretores WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 11. VIEWS DO MÓDULO CORRETOR
-- ========================================

-- Dashboard do corretor: resumo de produção
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
  COUNT(DISTINCT r.id) FILTER (WHERE r.dias_para_vencimento BETWEEN 0 AND 30) as renovacoes_30d,
  COUNT(DISTINCT r.id) FILTER (WHERE r.dias_para_vencimento BETWEEN 0 AND 60) as renovacoes_60d
FROM corretores c
LEFT JOIN crm_cards card ON card.corretor_id = c.id
LEFT JOIN comissoes com ON com.corretor_id = c.id
LEFT JOIN renovacoes r ON r.corretor_id = c.id AND r.status = 'pendente'
WHERE c.ativo = true
GROUP BY c.id, c.nome;

-- ========================================
-- VERIFICAÇÃO
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Módulo Corretor criado com sucesso';
  RAISE NOTICE '  → corretores';
  RAISE NOTICE '  → crm_kanban_columns';
  RAISE NOTICE '  → crm_cards';
  RAISE NOTICE '  → crm_interacoes';
  RAISE NOTICE '  → materiais_vendas';
  RAISE NOTICE '  → banner_requests';
  RAISE NOTICE '  → renovacoes';
  RAISE NOTICE '  → comissao_comprovantes';
  RAISE NOTICE '  → RLS multi-tenant ativado';
  RAISE NOTICE '  → View corretor_dashboard criada';
END $$;

NOTIFY pgrst, 'reload schema';
