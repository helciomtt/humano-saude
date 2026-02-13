-- =====================================================
-- MIGRATION: Unificar leads_landing → insurance_leads
-- Data: 2026-02-13
-- Fase 2.1 — Consolidação de tabelas de leads
-- =====================================================
-- PROBLEMA: Duas tabelas duplicam dados (insurance_leads + leads_landing)
-- SOLUÇÃO: insurance_leads como tabela canônica + coluna origem expandida
-- ROLLBACK: View leads_landing garante backward-compatibility
-- =====================================================

-- 1. Expandir constraint de origem na insurance_leads
-- (adicionar 'landing' como valor válido se não existir)
DO $$
BEGIN
  -- Remover constraint antiga de origem se existir
  ALTER TABLE public.insurance_leads
    DROP CONSTRAINT IF EXISTS insurance_leads_origem_check;
    
  -- Não há constraint nomeada de origem — é apenas um DEFAULT
  -- Vamos adicionar colunas que existem em leads_landing mas não em insurance_leads
  
  -- telefone (leads_landing usa 'telefone', insurance_leads usa 'whatsapp')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'telefone'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN telefone VARCHAR(20);
  END IF;

  -- perfil
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'perfil'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN perfil VARCHAR(50);
  END IF;

  -- acomodacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'acomodacao'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN acomodacao VARCHAR(20);
  END IF;

  -- idades_beneficiarios (text array — landing page format)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'idades_beneficiarios'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN idades_beneficiarios TEXT[];
  END IF;

  -- bairro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'bairro'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN bairro VARCHAR(100);
  END IF;

  -- top_3_planos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'top_3_planos'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN top_3_planos TEXT;
  END IF;

  -- ip_address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN ip_address INET;
  END IF;

  -- user_agent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN user_agent TEXT;
  END IF;

  -- utm_source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'utm_source'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN utm_source VARCHAR(255);
  END IF;

  -- utm_medium
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'utm_medium'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN utm_medium VARCHAR(255);
  END IF;

  -- utm_campaign
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'utm_campaign'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN utm_campaign VARCHAR(255);
  END IF;

  -- utm_content
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN utm_content VARCHAR(255);
  END IF;

  -- utm_term
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'utm_term'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN utm_term VARCHAR(255);
  END IF;

  -- cnpj
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'insurance_leads' 
      AND column_name = 'cnpj'
  ) THEN
    ALTER TABLE public.insurance_leads 
      ADD COLUMN cnpj VARCHAR(18);
  END IF;

END $$;

-- 2. Índice para coluna origem (performance)
CREATE INDEX IF NOT EXISTS idx_insurance_leads_origem 
  ON public.insurance_leads(origem);

-- 3. Migrar dados de leads_landing para insurance_leads
-- (protegido contra duplicatas por email)
DO $$
BEGIN
  -- Só migrar se a tabela leads_landing existir
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'leads_landing'
  ) THEN
    INSERT INTO public.insurance_leads (
      nome, 
      email, 
      whatsapp,
      telefone,
      perfil,
      tipo_contratacao,
      cnpj,
      acomodacao,
      idades_beneficiarios,
      bairro,
      top_3_planos,
      origem,
      user_agent,
      ip_address,
      status,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      created_at,
      historico
    )
    SELECT 
      ll.nome,
      ll.email,
      ll.telefone,        -- telefone → whatsapp (campo obrigatório)
      ll.telefone,        -- também copiar para telefone
      ll.perfil,
      ll.tipo_contratacao,
      ll.cnpj,
      ll.acomodacao,
      ll.idades_beneficiarios,
      ll.bairro,
      ll.top_3_planos,
      'landing',
      ll.user_agent,
      ll.ip_address,
      CASE ll.status 
        WHEN 'Novo' THEN 'novo'
        WHEN 'Contatado' THEN 'contatado'
        WHEN 'Qualificado' THEN 'negociacao'
        WHEN 'Convertido' THEN 'ganho'
        WHEN 'Perdido' THEN 'perdido'
        ELSE 'novo'
      END,
      ll.utm_source,
      ll.utm_medium,
      ll.utm_campaign,
      ll.utm_content,
      ll.utm_term,
      ll.created_at,
      jsonb_build_array(
        jsonb_build_object(
          'timestamp', ll.created_at,
          'evento', 'migrado_de_leads_landing',
          'origem', 'migration_2026_02_13',
          'detalhes', 'Lead migrado automaticamente da tabela leads_landing'
        )
      )
    FROM public.leads_landing ll
    WHERE ll.email NOT IN (
      SELECT il.email FROM public.insurance_leads il WHERE il.email IS NOT NULL
    );

    RAISE NOTICE 'Migração de leads_landing concluída.';
  ELSE
    RAISE NOTICE 'Tabela leads_landing não existe, pulando migração.';
  END IF;
END $$;

-- 4. Criar VIEW de compatibilidade (não quebrar queries existentes)
-- Se leads_landing existia como tabela, precisamos dropá-la antes de criar a view
-- CUIDADO: Só fazer isso DEPOIS de confirmar que a migração funcionou!
-- Por segurança, NÃO dropar automaticamente — criar a view apenas se não existir tabela

-- Para aplicar manualmente DEPOIS de validar a migração (1 semana):
-- DROP TABLE IF EXISTS public.leads_landing CASCADE;
-- 
-- CREATE OR REPLACE VIEW public.leads_landing AS
-- SELECT 
--   id,
--   nome,
--   email,
--   COALESCE(telefone, whatsapp) as telefone,
--   perfil,
--   tipo_contratacao,
--   cnpj,
--   acomodacao,
--   idades_beneficiarios,
--   bairro,
--   top_3_planos,
--   origem,
--   user_agent,
--   ip_address,
--   status,
--   utm_source,
--   utm_medium,
--   utm_campaign,
--   utm_content,
--   utm_term,
--   created_at
-- FROM public.insurance_leads
-- WHERE origem = 'landing';

-- 5. Atualizar view dashboard_stats para incluir origem landing
-- DROP + CREATE porque CREATE OR REPLACE não permite renomear/reordenar colunas
DROP VIEW IF EXISTS public.dashboard_stats;
CREATE VIEW public.dashboard_stats AS
SELECT
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS leads_mes_atual,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS leads_semana_atual,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS leads_hoje,
  
  COUNT(*) FILTER (WHERE status = 'novo') AS leads_novos,
  COUNT(*) FILTER (WHERE status = 'contatado') AS leads_contatados,
  COUNT(*) FILTER (WHERE status = 'negociacao') AS leads_em_negociacao,
  COUNT(*) FILTER (WHERE status = 'proposta_enviada') AS leads_com_proposta,
  COUNT(*) FILTER (WHERE status = 'ganho') AS leads_ganhos,
  COUNT(*) FILTER (WHERE status = 'perdido') AS leads_perdidos,
  
  SUM(economia_estimada) AS economia_total,
  SUM(economia_estimada) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS economia_mes_atual,
  AVG(economia_estimada) AS economia_media,
  
  SUM(valor_atual) AS valor_total_planos_atuais,
  SUM(valor_proposto) AS valor_total_propostas,
  AVG(valor_atual) AS ticket_medio_atual,
  AVG(valor_proposto) AS ticket_medio_proposto,
  
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'ganho')::DECIMAL / 
     NULLIF(COUNT(*), 0) * 100), 2
  ) AS taxa_conversao,
  
  AVG(
    EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
  ) FILTER (WHERE status = 'ganho') AS tempo_medio_conversao_dias,
  
  -- Origem dos Leads (expandida com 'landing')
  COUNT(*) FILTER (WHERE origem = 'scanner_pdf') AS leads_scanner_pdf,
  COUNT(*) FILTER (WHERE origem = 'meta_ads') AS leads_meta_ads,
  COUNT(*) FILTER (WHERE origem = 'manual') AS leads_manual,
  COUNT(*) FILTER (WHERE origem = 'landing') AS leads_landing_page,
  COUNT(*) FILTER (WHERE origem = 'calculadora_economia') AS leads_calculadora,
  
  MAX(created_at) AS ultimo_lead_criado,
  MAX(updated_at) AS ultima_atualizacao
FROM public.insurance_leads
WHERE arquivado = FALSE;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON COLUMN public.insurance_leads.telefone IS 'Telefone alternativo (da landing page). Preferir whatsapp para contato.';
COMMENT ON COLUMN public.insurance_leads.perfil IS 'Perfil do lead: Individual, Familiar, Empresarial (da landing page).';
COMMENT ON COLUMN public.insurance_leads.top_3_planos IS 'Top 3 planos sugeridos pela calculadora da landing page.';
COMMENT ON COLUMN public.insurance_leads.ip_address IS 'IP do visitante (landing page tracking).';
COMMENT ON COLUMN public.insurance_leads.utm_source IS 'UTM source para rastreamento de campanhas.';
