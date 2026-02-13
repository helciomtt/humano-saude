-- =====================================================
-- Solicitações de Cadastro de Corretor
-- Fluxo: Cadastro → Pendente → Aprovação Admin
-- SEM dependências externas (autossuficiente)
-- =====================================================

-- Função update_updated_at (cria se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS solicitacoes_corretor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados pessoais
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cpf TEXT,
  
  -- Dados profissionais
  registro_susep TEXT,
  experiencia_anos INT DEFAULT 0,
  operadoras_experiencia TEXT[],
  especialidade TEXT,
  
  -- PF/PJ
  tipo_pessoa TEXT DEFAULT 'pf' CHECK (tipo_pessoa IN ('pf', 'pj')),
  cnpj TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  
  -- Documentação
  documento_url TEXT,
  
  -- Motivações e modalidade
  motivacoes TEXT[],
  modalidade_trabalho TEXT DEFAULT 'digital' CHECK (modalidade_trabalho IN ('presencial', 'digital', 'hibrido')),
  como_conheceu TEXT,
  mensagem TEXT,
  
  -- Aceite de termos
  termo_aceito BOOLEAN DEFAULT FALSE,
  
  -- Controle
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao TEXT,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  
  -- Metadata
  ip_origem TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_solicitacoes_corretor_status ON solicitacoes_corretor(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_corretor_email ON solicitacoes_corretor(email);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_corretor_created ON solicitacoes_corretor(created_at DESC);

-- RLS habilitado mas acesso total (backend usa service_role key)
ALTER TABLE solicitacoes_corretor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access solicitacoes_corretor"
  ON solicitacoes_corretor FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_solicitacoes_corretor_updated_at ON solicitacoes_corretor;
CREATE TRIGGER set_solicitacoes_corretor_updated_at
  BEFORE UPDATE ON solicitacoes_corretor
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
