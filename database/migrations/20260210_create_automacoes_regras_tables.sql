-- =============================================
-- 🔧 HUMANO SAÚDE - TABELAS AUTOMAÇÃO & REGRAS IA
-- =============================================
-- Data: 2026-02-10
-- Tabelas: automacoes, regras_ia
-- =============================================

-- ========================================
-- 1. TABELA: automacoes
-- ========================================
CREATE TABLE IF NOT EXISTS public.automacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  trigger_evento VARCHAR(255) NOT NULL,
  acoes TEXT[] DEFAULT '{}',
  ativa BOOLEAN NOT NULL DEFAULT true,
  execucoes INTEGER NOT NULL DEFAULT 0,
  ultima_execucao TEXT,

  metadata JSONB DEFAULT '{}'::jsonb
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_automacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_automacoes_updated_at ON public.automacoes;
CREATE TRIGGER set_automacoes_updated_at
BEFORE UPDATE ON public.automacoes
FOR EACH ROW
EXECUTE FUNCTION update_automacoes_updated_at();

-- Índice
CREATE INDEX IF NOT EXISTS idx_automacoes_ativa ON public.automacoes(ativa);

-- RLS
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for automacoes" ON public.automacoes;
CREATE POLICY "Allow all for automacoes" ON public.automacoes
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 2. TABELA: regras_ia
-- ========================================
CREATE TABLE IF NOT EXISTS public.regras_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50) NOT NULL DEFAULT 'automacao',
  ativa BOOLEAN NOT NULL DEFAULT true,
  condicao TEXT NOT NULL,
  acao TEXT NOT NULL,
  ultima_execucao TEXT,
  execucoes INTEGER NOT NULL DEFAULT 0,

  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT regra_categoria_valida CHECK (categoria IN (
    'automacao', 'otimizacao', 'seguranca', 'processamento'
  ))
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_regras_ia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_regras_ia_updated_at ON public.regras_ia;
CREATE TRIGGER set_regras_ia_updated_at
BEFORE UPDATE ON public.regras_ia
FOR EACH ROW
EXECUTE FUNCTION update_regras_ia_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_regras_ia_ativa ON public.regras_ia(ativa);
CREATE INDEX IF NOT EXISTS idx_regras_ia_categoria ON public.regras_ia(categoria);

-- RLS
ALTER TABLE public.regras_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for regras_ia" ON public.regras_ia;
CREATE POLICY "Allow all for regras_ia" ON public.regras_ia
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 3. SEED DATA: automacoes
-- ========================================
INSERT INTO public.automacoes (nome, descricao, trigger_evento, acoes, ativa, execucoes, ultima_execucao) VALUES
  ('Boas-vindas Lead', 'Envia mensagem de boas-vindas via WhatsApp quando um novo lead é capturado', 'Novo lead cadastrado', ARRAY['WhatsApp: Mensagem de boas-vindas', 'Notificação: Alerta equipe', 'Tarefa: Follow-up em 24h'], true, 342, '2 min atrás'),
  ('Follow-up Automático', 'Lembra o corretor de fazer follow-up se o lead não foi contatado em 48h', 'Lead sem contato > 48h', ARRAY['Notificação: Alerta corretor', 'Email: Lembrete interno'], true, 128, '1h atrás'),
  ('Cotação Enviada', 'Notifica o lead por WhatsApp quando uma cotação é gerada', 'Cotação criada', ARRAY['WhatsApp: Envio de cotação', 'Email: Cópia da cotação'], false, 56, '3 dias atrás'),
  ('Lead Perdido - Reengajamento', 'Agenda recontato 30 dias após lead ser marcado como perdido', 'Lead marcado como perdido', ARRAY['Tarefa: Recontato em 30d', 'Email: Campanha de reengajamento'], true, 23, '5h atrás'),
  ('Aniversário do Contrato', 'Alerta 30 dias antes do aniversário do contrato para renovação', 'Contrato aniversário -30d', ARRAY['Notificação: Alerta renovação', 'Tarefa: Contato renovação', 'WhatsApp: Mensagem proativa'], true, 8, '1 semana atrás')
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. SEED DATA: regras_ia
-- ========================================
INSERT INTO public.regras_ia (nome, descricao, categoria, ativa, condicao, acao, ultima_execucao, execucoes) VALUES
  ('Auto-resposta Lead Novo', 'Envia mensagem automática no WhatsApp quando novo lead é capturado', 'automacao', true, 'Lead status = novo', 'Enviar template WhatsApp de boas-vindas', '2 min atrás', 847),
  ('Escalar Campanha Performante', 'Aumenta budget em 20% quando CPL está abaixo da meta por 3 dias', 'otimizacao', true, 'CPL < meta por 3 dias consecutivos', 'Aumentar daily_budget em 20%', '1h atrás', 23),
  ('Pausar Campanha Ineficiente', 'Pausa campanha automaticamente quando CPL ultrapassa 2x a meta', 'otimizacao', true, 'CPL > 2x meta por 48h', 'Pausar campanha + notificar gestor', '3 dias atrás', 7),
  ('Lead Scoring Automático', 'Classifica leads de 0-100 baseado em dados do formulário e comportamento', 'processamento', true, 'Novo lead criado', 'Calcular score + priorizar fila', '5 min atrás', 1284),
  ('Detecção de Fraude em PDF', 'Verifica inconsistências nos PDFs de carteirinhas enviados', 'seguranca', false, 'PDF processado pelo scanner', 'Flaggar como suspeito + revisar manual', 'Nunca', 0),
  ('Follow-up Automático', 'Envia lembrete ao corretor se lead não foi contatado em 24h', 'automacao', true, 'Lead sem contato por 24h', 'Notificação + WhatsApp reminder', '30 min atrás', 392),
  ('Otimizar Público IA', 'Ajusta segmentação de audiências baseado em padrões de conversão', 'otimizacao', false, 'A cada 7 dias', 'Recalcular lookalike audiences', '5 dias atrás', 12),
  ('Alerta de Anomalia', 'Detecta quedas bruscas em métricas e notifica a equipe', 'seguranca', true, 'Métrica cai > 30% vs. média 7d', 'Alerta urgente no chat + email', '2 dias atrás', 5)
ON CONFLICT DO NOTHING;
