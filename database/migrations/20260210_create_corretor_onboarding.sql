-- =====================================================
-- Onboarding do Corretor (Pós-Aprovação)
-- Documentos + Dados Bancários
-- SEM dependências externas (autossuficiente)
-- =====================================================

-- 1. Documentos do Corretor (CNH, RG, Contrato Social, etc.)
CREATE TABLE IF NOT EXISTS corretor_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID,
  solicitacao_id UUID,
  
  -- Tipo do documento
  tipo TEXT NOT NULL CHECK (tipo IN (
    'cnh',
    'rg_frente',
    'rg_verso',
    'contrato_social',
    'cartao_cnpj',
    'comprovante_endereco',
    'selfie',
    'outro'
  )),
  
  -- Arquivo
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  tamanho_bytes BIGINT,
  
  -- Status de verificação
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'expirado')),
  motivo_rejeicao TEXT,
  verificado_por TEXT,
  verificado_em TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dados Bancários do Corretor
CREATE TABLE IF NOT EXISTS corretor_dados_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID,
  solicitacao_id UUID,
  
  -- Dados bancários
  banco_codigo TEXT NOT NULL,
  banco_nome TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL DEFAULT 'corrente' CHECK (tipo_conta IN ('corrente', 'poupanca')),
  
  -- Titular
  titular_nome TEXT NOT NULL,
  titular_documento TEXT NOT NULL,
  tipo_chave_pix TEXT CHECK (tipo_chave_pix IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  chave_pix TEXT,
  
  -- Controle
  ativo BOOLEAN DEFAULT TRUE,
  verificado BOOLEAN DEFAULT FALSE,
  verificado_em TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_corretor_documentos_corretor ON corretor_documentos(corretor_id);
CREATE INDEX IF NOT EXISTS idx_corretor_documentos_tipo ON corretor_documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_corretor_documentos_status ON corretor_documentos(status);
CREATE INDEX IF NOT EXISTS idx_corretor_dados_bancarios_corretor ON corretor_dados_bancarios(corretor_id);

-- 4. RLS habilitado mas acesso total (backend usa service_role key)
ALTER TABLE corretor_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE corretor_dados_bancarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access corretor_documentos"
  ON corretor_documentos FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Full access corretor_dados_bancarios"
  ON corretor_dados_bancarios FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION update_generic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_corretor_documentos_updated_at ON corretor_documentos;
CREATE TRIGGER set_corretor_documentos_updated_at
  BEFORE UPDATE ON corretor_documentos
  FOR EACH ROW EXECUTE FUNCTION update_generic_updated_at();

DROP TRIGGER IF EXISTS set_corretor_dados_bancarios_updated_at ON corretor_dados_bancarios;
CREATE TRIGGER set_corretor_dados_bancarios_updated_at
  BEFORE UPDATE ON corretor_dados_bancarios
  FOR EACH ROW EXECUTE FUNCTION update_generic_updated_at();

COMMENT ON TABLE corretor_dados_bancarios IS 'Bancos comuns: 001-Banco do Brasil, 033-Santander, 104-Caixa, 237-Bradesco, 341-Itaú, 260-Nubank, 077-Inter, 336-C6 Bank, 380-PicPay, 290-PagSeguro';
