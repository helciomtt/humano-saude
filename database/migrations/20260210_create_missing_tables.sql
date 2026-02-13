-- =============================================
-- 🔧 HUMANO SAÚDE - TABELAS FALTANDO
-- =============================================
-- Data: 2026-02-10
-- Tabelas: tarefas, notificacoes, documentos
-- View: dashboard_stats (já existe em supabase_schema.sql)
-- Tabela: insurance_leads (já existe em supabase_schema.sql)
-- =============================================

-- ========================================
-- NOTA: insurance_leads e dashboard_stats
-- ========================================
-- Essas já estão definidas em supabase_schema.sql
-- Se ainda não foram aplicadas no seu Supabase, rode:
--   supabase_schema.sql PRIMEIRO
-- Depois rode este arquivo.
-- ========================================

-- ========================================
-- 0. FUNÇÃO AUXILIAR: update_updated_at_column
-- ========================================
-- Cria a função se ainda não existir (usada pelos triggers abaixo)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 1. TABELA: tarefas
-- ========================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dados da tarefa
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  prioridade VARCHAR(20) NOT NULL DEFAULT 'media',

  -- Atribuição
  atribuido_a VARCHAR(255),

  -- Relacionamentos (sem FK rígida — tabelas podem não existir ainda)
  lead_id UUID,
  proposta_id UUID,

  -- Datas
  data_vencimento DATE,
  concluida_em TIMESTAMPTZ,

  -- Extras
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT tarefa_status_valido CHECK (status IN (
    'pendente', 'em_andamento', 'concluida', 'cancelada'
  )),
  CONSTRAINT tarefa_prioridade_valida CHECK (prioridade IN (
    'baixa', 'media', 'alta', 'urgente'
  ))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON public.tarefas(prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_lead_id ON public.tarefas(lead_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON public.tarefas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_tarefas_atribuido_a ON public.tarefas(atribuido_a);
CREATE INDEX IF NOT EXISTS idx_tarefas_created_at ON public.tarefas(created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_tarefas_updated_at ON public.tarefas;
CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. TABELA: notificacoes
-- ========================================
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dados da notificação
  user_id UUID,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'info',
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,

  -- Extras
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT notificacao_tipo_valido CHECK (tipo IN (
    'info', 'warning', 'error', 'success'
  ))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON public.notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at DESC);

-- ========================================
-- 3. TABELA: documentos
-- ========================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dados do documento
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL DEFAULT 'pdf',
  tipo_arquivo VARCHAR(100),
  url TEXT NOT NULL,
  tamanho BIGINT DEFAULT 0,
  categoria VARCHAR(100) DEFAULT 'Geral',

  -- Relacionamentos (sem FK rígida — tabelas podem não existir ainda)
  lead_id UUID,
  proposta_id UUID,
  uploaded_by VARCHAR(255),

  -- Extras
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_lead_id ON public.documentos(lead_id);
CREATE INDEX IF NOT EXISTS idx_documentos_proposta_id ON public.documentos(proposta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON public.documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON public.documentos(created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_documentos_updated_at ON public.documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. STORAGE BUCKET: documentos
-- ========================================
-- No Supabase Dashboard, crie um bucket chamado 'documentos'
-- Storage > New Bucket > Name: documentos > Public: true
-- Ou via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documentos', 'documentos', true)
-- ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. RLS (Row Level Security)
-- ========================================
-- Para produção, habilitar RLS em todas as tabelas:

-- ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para admin via service_role):
-- CREATE POLICY "Allow service_role full access on tarefas"
--   ON public.tarefas FOR ALL
--   USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow service_role full access on notificacoes"
--   ON public.notificacoes FOR ALL
--   USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow service_role full access on documentos"
--   ON public.documentos FOR ALL
--   USING (true) WITH CHECK (true);

-- ========================================
-- 6. DADOS INICIAIS (seed)
-- ========================================

-- Notificações de boas-vindas
INSERT INTO public.notificacoes (titulo, mensagem, tipo) VALUES
  ('Bem-vindo ao Humano Saúde! 🎉', 'O sistema está configurado e pronto para uso. Comece adicionando leads pelo Scanner PDF.', 'success'),
  ('Configure as integrações', 'Acesse Configurações > APIs para configurar WhatsApp, Meta Pixel e Google Analytics.', 'info'),
  ('Atualize seu perfil', 'Complete seu perfil com CRECI e SUSEP para credibilidade.', 'info');

-- Tarefas iniciais
INSERT INTO public.tarefas (titulo, descricao, status, prioridade) VALUES
  ('Configurar integrações', 'Configurar WhatsApp Business API, Meta Pixel e Google Analytics nas configurações do sistema', 'pendente', 'alta'),
  ('Importar operadoras', 'Cadastrar as operadoras de saúde parceiras no sistema (Amil, Bradesco, SulAmérica, etc)', 'pendente', 'alta'),
  ('Cadastrar planos', 'Inserir tabela de preços dos planos de cada operadora para a calculadora funcionar', 'pendente', 'urgente'),
  ('Testar Scanner PDF', 'Fazer teste com um PDF real de carteirinha/boleto para validar a extração de dados', 'pendente', 'media'),
  ('Configurar domínio', 'Apontar domínio customizado para o projeto na Vercel', 'pendente', 'media');
