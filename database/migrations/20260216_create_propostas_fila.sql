-- =====================================================
-- MIGRATION: Fila de Propostas (Scanner Inteligente)
-- Data: 2026-02-16
-- Objetivo: centralizar propostas enviadas por corretores para operação admin
-- =====================================================

CREATE TABLE IF NOT EXISTS public.propostas_fila (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.insurance_leads(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL,

  categoria VARCHAR(30),
  origem VARCHAR(40) NOT NULL DEFAULT 'scanner_inteligente',

  status VARCHAR(30) NOT NULL DEFAULT 'enviada'
    CHECK (status IN ('enviada', 'em_analise', 'boleto_gerado', 'implantada')),
  status_observacao TEXT,
  status_historico JSONB NOT NULL DEFAULT '[]'::jsonb,

  enviada_operadora_em TIMESTAMPTZ,
  em_analise_em TIMESTAMPTZ,
  boleto_gerado_em TIMESTAMPTZ,
  implantada_em TIMESTAMPTZ,

  dados_proposta JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_propostas_fila_created_at
  ON public.propostas_fila(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_propostas_fila_status
  ON public.propostas_fila(status);
CREATE INDEX IF NOT EXISTS idx_propostas_fila_corretor_id
  ON public.propostas_fila(corretor_id);
CREATE INDEX IF NOT EXISTS idx_propostas_fila_lead_id
  ON public.propostas_fila(lead_id);

DROP TRIGGER IF EXISTS update_propostas_fila_updated_at ON public.propostas_fila;
CREATE TRIGGER update_propostas_fila_updated_at
  BEFORE UPDATE ON public.propostas_fila
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.propostas_fila ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'propostas_fila'
      AND policyname = 'service_role_all_propostas_fila'
  ) THEN
    CREATE POLICY "service_role_all_propostas_fila"
      ON public.propostas_fila
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.propostas_fila IS
  'Fila operacional de propostas enviadas via Scanner Inteligente por admin/corretores.';
