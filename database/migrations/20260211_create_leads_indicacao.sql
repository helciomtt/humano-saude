-- =============================================
-- LEADS DE INDICAÇÃO (Calculadora de Economia)
-- Cada lead vem do link /economizar/[slug] do corretor
-- =============================================

CREATE TABLE IF NOT EXISTS public.leads_indicacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Vínculo obrigatório com o corretor que gerou o link
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,

  -- Dados do lead
  nome TEXT,
  email TEXT,
  telefone TEXT,
  cpf TEXT,

  -- Dados da fatura atual (extraídos por OCR ou manual)
  operadora_atual TEXT,
  plano_atual TEXT,
  valor_atual DECIMAL(10,2),
  qtd_vidas INTEGER DEFAULT 1,
  idades TEXT[], -- Array de idades informadas

  -- Resultado da simulação
  valor_estimado_min DECIMAL(10,2), -- -40%
  valor_estimado_max DECIMAL(10,2), -- -20%
  economia_estimada DECIMAL(10,2),  -- valor_atual - média estimada

  -- Funil de status
  status TEXT DEFAULT 'simulou' CHECK (status IN (
    'simulou',
    'entrou_em_contato',
    'em_analise',
    'proposta_enviada',
    'fechado',
    'perdido'
  )),

  -- Tracking de engajamento
  clicou_no_contato BOOLEAN DEFAULT false,
  data_contato TIMESTAMP WITH TIME ZONE,

  -- Metadata para tracking (UTM, device, etc)
  origem TEXT DEFAULT 'link_corretor',
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_indicacao_corretor ON leads_indicacao(corretor_id);
CREATE INDEX IF NOT EXISTS idx_leads_indicacao_status ON leads_indicacao(status);
CREATE INDEX IF NOT EXISTS idx_leads_indicacao_created ON leads_indicacao(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_indicacao_contato ON leads_indicacao(clicou_no_contato);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_leads_indicacao_updated_at ON leads_indicacao;
CREATE TRIGGER update_leads_indicacao_updated_at
  BEFORE UPDATE ON leads_indicacao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS: Corretor só vê leads do link dele
-- =============================================

ALTER TABLE leads_indicacao ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (para server actions)
CREATE POLICY "service_role_all_leads_indicacao"
  ON leads_indicacao FOR ALL
  USING (true)
  WITH CHECK (true);

-- Segurança: o filtro por corretor_id é feito nas server actions
-- usando service_role, não via auth.uid() (corretores não usam Supabase Auth)
