-- ========================================
-- Migration: CRM Card Detail Tables
-- Tasks, Files, Comments para o CRM do corretor (crm_cards)
-- Date: 2026-02-15
-- ========================================

-- ========================================
-- 1. crm_card_tasks (Tarefas agendadas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_card_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES crm_cards(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(30) NOT NULL DEFAULT 'tarefa',
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  prioridade VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_vencimento TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  lembrete_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_card_tasks_card ON crm_card_tasks(card_id);
CREATE INDEX IF NOT EXISTS idx_crm_card_tasks_corretor ON crm_card_tasks(corretor_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_card_tasks_vencimento ON crm_card_tasks(data_vencimento) WHERE status IN ('pendente', 'em_andamento');

-- ========================================
-- 2. crm_card_files (Arquivos do lead/card)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_card_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES crm_cards(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE SET NULL,
  nome VARCHAR(500) NOT NULL,
  tipo_arquivo VARCHAR(100) NOT NULL,
  tamanho_bytes BIGINT,
  url TEXT NOT NULL,
  categoria VARCHAR(100), -- 'proposta', 'contrato', 'documento_pessoal', 'exame', 'outro'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_card_files_card ON crm_card_files(card_id);

-- ========================================
-- 3. crm_card_comments (Comentários internos)
-- ========================================
CREATE TABLE IF NOT EXISTS public.crm_card_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES crm_cards(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES crm_card_comments(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_card_comments_card ON crm_card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_crm_card_comments_parent ON crm_card_comments(parent_id);

-- ========================================
-- 4. Storage bucket para arquivos CRM
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-files', 'crm-files', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. RLS Policies
-- ========================================
ALTER TABLE crm_card_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_card_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_card_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_card_tasks_service" ON crm_card_tasks;
CREATE POLICY "crm_card_tasks_service" ON crm_card_tasks 
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "crm_card_files_service" ON crm_card_files;
CREATE POLICY "crm_card_files_service" ON crm_card_files 
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "crm_card_comments_service" ON crm_card_comments;
CREATE POLICY "crm_card_comments_service" ON crm_card_comments 
  FOR ALL USING (auth.role() = 'service_role');

-- Storage RLS
DROP POLICY IF EXISTS "crm_files_public_read" ON storage.objects;
CREATE POLICY "crm_files_public_read" ON storage.objects 
  FOR SELECT USING (bucket_id = 'crm-files');

DROP POLICY IF EXISTS "crm_files_service_write" ON storage.objects;
CREATE POLICY "crm_files_service_write" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'crm-files' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "crm_files_service_delete" ON storage.objects;
CREATE POLICY "crm_files_service_delete" ON storage.objects 
  FOR DELETE USING (bucket_id = 'crm-files' AND auth.role() = 'service_role');

-- ========================================
-- 6. Comments
-- ========================================
COMMENT ON TABLE crm_card_tasks IS 'Tarefas agendadas vinculadas a um card CRM do corretor';
COMMENT ON TABLE crm_card_files IS 'Arquivos/documentos anexados a um card CRM';
COMMENT ON TABLE crm_card_comments IS 'Comentários internos em cards CRM (com threads)';
