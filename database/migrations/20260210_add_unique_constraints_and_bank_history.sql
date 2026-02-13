-- =====================================================
-- Migration: Unique constraints + Bank change requests
-- Execute no Supabase SQL Editor
-- =====================================================

-- ── 1. UNIQUE constraints para evitar duplicatas ──────────

-- Constraint UNIQUE de email na tabela solicitacoes_corretor
-- (Impede que um mesmo email tenha 2 solicitações pendentes/aprovadas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_solicitacoes_corretor_email'
  ) THEN
    -- Primeiro, limpar eventuais duplicatas (manter o mais recente)
    DELETE FROM solicitacoes_corretor a
    USING solicitacoes_corretor b
    WHERE a.email = b.email
      AND a.created_at < b.created_at
      AND a.status = b.status;

    -- Criar unique parcial (apenas pendentes e aprovados)
    CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitacoes_email_pendente
      ON solicitacoes_corretor (LOWER(email))
      WHERE status IN ('pendente', 'aprovado');
  END IF;
END $$;

-- Constraint UNIQUE de CPF na tabela solicitacoes_corretor
-- (Limpar duplicatas de CPF antes de criar o índice)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_solicitacoes_cpf_pendente'
  ) THEN
    -- Manter apenas a solicitação mais recente para cada CPF duplicado
    DELETE FROM solicitacoes_corretor a
    USING solicitacoes_corretor b
    WHERE a.cpf = b.cpf
      AND a.cpf IS NOT NULL AND a.cpf != ''
      AND a.status IN ('pendente', 'aprovado')
      AND b.status IN ('pendente', 'aprovado')
      AND a.created_at < b.created_at;

    CREATE UNIQUE INDEX uq_solicitacoes_cpf_pendente
      ON solicitacoes_corretor (cpf)
      WHERE cpf IS NOT NULL AND cpf != '' AND status IN ('pendente', 'aprovado');
  END IF;
END $$;

-- Constraint UNIQUE de email na tabela corretores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_corretores_email'
  ) THEN
    ALTER TABLE corretores ADD CONSTRAINT uq_corretores_email UNIQUE (email);
  END IF;
END $$;

-- Constraint UNIQUE de CPF na tabela corretores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_corretores_cpf'
  ) THEN
    CREATE UNIQUE INDEX uq_corretores_cpf
      ON corretores (cpf)
      WHERE cpf IS NOT NULL AND cpf != '';
  END IF;
END $$;


-- ── 2. Coluna de histórico em corretor_dados_bancarios ────

-- Adicionar coluna para marcar contas inativas (históricas)
ALTER TABLE corretor_dados_bancarios
  ADD COLUMN IF NOT EXISTS desativado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS desativado_motivo TEXT,
  ADD COLUMN IF NOT EXISTS substituido_por UUID;


-- ── 3. Tabela de solicitações de alteração bancária ───────

CREATE TABLE IF NOT EXISTS public.corretor_alteracao_bancaria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referência ao corretor
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  
  -- Dados bancários NOVOS (propostos)
  banco_codigo VARCHAR(10) NOT NULL,
  banco_nome VARCHAR(100) NOT NULL,
  agencia VARCHAR(20) NOT NULL,
  conta VARCHAR(30) NOT NULL,
  tipo_conta VARCHAR(20) DEFAULT 'corrente',
  titular_nome VARCHAR(255) NOT NULL,
  titular_documento VARCHAR(20) NOT NULL,
  tipo_chave_pix VARCHAR(20),
  chave_pix VARCHAR(255),
  
  -- Motivo da alteração
  motivo TEXT NOT NULL,
  
  -- Dados bancários ANTIGOS (snapshot no momento da solicitação)
  dados_antigos JSONB,
  
  -- Fluxo de aprovação
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por TEXT,
  aprovado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  
  -- Aceite do corretor
  corretor_aceite_em TIMESTAMPTZ,
  corretor_aceite_ip TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alteracao_bancaria_corretor ON corretor_alteracao_bancaria(corretor_id);
CREATE INDEX IF NOT EXISTS idx_alteracao_bancaria_status ON corretor_alteracao_bancaria(status);

-- RLS
ALTER TABLE corretor_alteracao_bancaria ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'corretor_alteracao_bancaria' AND policyname = 'Full access alteracao_bancaria'
  ) THEN
    CREATE POLICY "Full access alteracao_bancaria"
      ON corretor_alteracao_bancaria FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_alteracao_bancaria_updated_at ON corretor_alteracao_bancaria;
CREATE TRIGGER update_alteracao_bancaria_updated_at
  BEFORE UPDATE ON corretor_alteracao_bancaria
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── FIM ───────────────────────────────────────────────────
