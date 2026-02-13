-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Tabela: convites_corretor                                     ║
-- ║  Rastreia convites enviados para novos corretores               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Função updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela principal
CREATE TABLE IF NOT EXISTS convites_corretor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_convidado TEXT NOT NULL,
  nome_convidante TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'admin', -- 'admin' ou 'corretor'
  id_convidante TEXT, -- ID do admin ou corretor que enviou
  status TEXT NOT NULL DEFAULT 'enviado', -- enviado, cadastrado
  id_solicitacao UUID REFERENCES solicitacoes_corretor(id), -- vincula ao cadastro se houver
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convites_corretor_email ON convites_corretor(email_convidado);
CREATE INDEX IF NOT EXISTS idx_convites_corretor_status ON convites_corretor(status);
CREATE INDEX IF NOT EXISTS idx_convites_corretor_origem ON convites_corretor(origem);
CREATE INDEX IF NOT EXISTS idx_convites_corretor_created ON convites_corretor(created_at DESC);

-- RLS
ALTER TABLE convites_corretor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access convites_corretor"
  ON convites_corretor FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_convites_corretor_updated_at ON convites_corretor;
CREATE TRIGGER set_convites_corretor_updated_at
  BEFORE UPDATE ON convites_corretor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
