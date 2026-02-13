-- =====================================================
-- Tabela corretores (standalone, sem dependências)
-- Execute ANTES de aprovar qualquer corretor
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.corretores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados pessoais
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  
  -- Dados profissionais
  susep VARCHAR(20),
  creci VARCHAR(20),
  foto_url TEXT,
  
  -- White-label
  slug VARCHAR(100),
  logo_personalizada_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#D4AF37',
  
  -- Hierarquia
  role VARCHAR(20) DEFAULT 'corretor' CHECK (role IN ('corretor', 'supervisor', 'admin')),
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  data_admissao DATE,
  
  -- Comissionamento
  comissao_padrao_pct DECIMAL(5,2) DEFAULT 100.00,
  
  -- Metadata (armazena onboarding_token, experiencia, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_corretores_email ON corretores(email);
CREATE INDEX IF NOT EXISTS idx_corretores_role ON corretores(role);
CREATE INDEX IF NOT EXISTS idx_corretores_ativo ON corretores(ativo);

-- RLS com acesso total (backend usa service_role key)
ALTER TABLE corretores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access corretores"
  ON corretores FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_corretores_updated_at ON corretores;
CREATE TRIGGER update_corretores_updated_at
  BEFORE UPDATE ON corretores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
