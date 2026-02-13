-- ============================================================
-- TABELAS DE PRECOS - Referencia Mercado RJ 2026
-- ============================================================

CREATE TABLE IF NOT EXISTS planos_operadora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operadora_id TEXT NOT NULL,
  operadora_nome TEXT NOT NULL,
  plano_nome TEXT NOT NULL,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('PME', 'PF', 'Adesao')),
  acomodacao TEXT NOT NULL DEFAULT 'Apartamento' CHECK (acomodacao IN ('Apartamento', 'Enfermaria', 'Ambulatorial')),
  coparticipacao BOOLEAN NOT NULL DEFAULT false,
  coparticipacao_pct NUMERIC(5,2) DEFAULT 0,
  abrangencia TEXT NOT NULL DEFAULT 'RJ',
  vidas_min INTEGER DEFAULT 2,
  vidas_max INTEGER DEFAULT 29,
  rede_hospitalar TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS precos_faixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES planos_operadora(id) ON DELETE CASCADE,
  faixa_etaria TEXT NOT NULL,
  faixa_ordem INTEGER NOT NULL DEFAULT 0,
  valor NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planos_operadora ON planos_operadora(operadora_id, modalidade, acomodacao);
CREATE INDEX IF NOT EXISTS idx_precos_plano ON precos_faixa(plano_id, faixa_ordem);

-- ============================================================
-- RPC Functions
-- ============================================================
CREATE OR REPLACE FUNCTION get_precos_operadora(
  p_operadora_id TEXT,
  p_modalidade TEXT DEFAULT 'PME',
  p_acomodacao TEXT DEFAULT 'Apartamento'
)
RETURNS TABLE (
  plano_id UUID,
  plano_nome TEXT,
  modalidade TEXT,
  acomodacao TEXT,
  coparticipacao BOOLEAN,
  coparticipacao_pct NUMERIC,
  abrangencia TEXT,
  vidas_min INTEGER,
  vidas_max INTEGER,
  rede_hospitalar TEXT[],
  notas TEXT,
  faixa_etaria TEXT,
  faixa_ordem INTEGER,
  valor NUMERIC
) AS $fn$
BEGIN
  RETURN QUERY
  SELECT po.id, po.plano_nome, po.modalidade, po.acomodacao,
    po.coparticipacao, po.coparticipacao_pct, po.abrangencia,
    po.vidas_min, po.vidas_max, po.rede_hospitalar, po.notas,
    pf.faixa_etaria, pf.faixa_ordem, pf.valor
  FROM planos_operadora po
  JOIN precos_faixa pf ON pf.plano_id = po.id
  WHERE po.operadora_id = p_operadora_id
    AND po.modalidade = p_modalidade
    AND po.acomodacao = p_acomodacao
    AND po.ativo = true
  ORDER BY pf.faixa_ordem ASC;
END;
$fn$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_planos_disponiveis()
RETURNS TABLE (
  operadora_id TEXT,
  operadora_nome TEXT,
  plano_nome TEXT,
  modalidade TEXT,
  acomodacao TEXT,
  coparticipacao BOOLEAN,
  valor_entrada NUMERIC
) AS $fn$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (po.operadora_id, po.modalidade, po.acomodacao)
    po.operadora_id, po.operadora_nome, po.plano_nome,
    po.modalidade, po.acomodacao, po.coparticipacao,
    (SELECT MIN(pf.valor) FROM precos_faixa pf WHERE pf.plano_id = po.id AND pf.valor > 0.01)
  FROM planos_operadora po
  WHERE po.ativo = true
  ORDER BY po.operadora_id, po.modalidade, po.acomodacao;
END;
$fn$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE planos_operadora ENABLE ROW LEVEL SECURITY;
ALTER TABLE precos_faixa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planos_read" ON planos_operadora FOR SELECT USING (true);
CREATE POLICY "precos_read" ON precos_faixa FOR SELECT USING (true);
