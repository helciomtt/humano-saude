-- =====================================================
-- TABELA: leads_landing
-- Armazena leads capturados na landing page
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leads_landing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Dados Pessoais
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  
  -- Dados da Cotação
  perfil VARCHAR(50) CHECK (perfil IN ('Individual', 'Familiar', 'Empresarial')),
  tipo_contratacao VARCHAR(50),
  cnpj VARCHAR(18),
  acomodacao VARCHAR(20),
  idades_beneficiarios TEXT[],
  bairro VARCHAR(100),
  
  -- Top 3 Planos Sugeridos (calculadora)
  top_3_planos TEXT,
  
  -- Origem
  origem VARCHAR(50) DEFAULT 'Landing Page',
  user_agent TEXT,
  ip_address INET,
  
  -- Status
  status VARCHAR(50) DEFAULT 'Novo' CHECK (status IN ('Novo', 'Contatado', 'Qualificado', 'Convertido', 'Perdido')),
  
  -- UTM Tracking
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255)
);

-- Índices
CREATE INDEX idx_leads_landing_created ON public.leads_landing(created_at DESC);
CREATE INDEX idx_leads_landing_status ON public.leads_landing(status);
CREATE INDEX idx_leads_landing_email ON public.leads_landing(email);

-- RLS
ALTER TABLE public.leads_landing ENABLE ROW LEVEL SECURITY;

-- Policy: Inserção pública (formulário landing)
CREATE POLICY "Qualquer um pode criar lead"
  ON public.leads_landing
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin pode ler todos
CREATE POLICY "Admin pode ler leads"
  ON public.leads_landing
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE public.leads_landing IS 'Leads capturados nos formulários da landing page';
