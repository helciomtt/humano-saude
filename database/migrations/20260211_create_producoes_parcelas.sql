-- =============================================
-- PRODUÇÕES DO CORRETOR (vendas implantadas)
-- Baseado no modelo Trindade
-- =============================================

CREATE TABLE IF NOT EXISTS public.producoes_corretor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  proposta_id UUID, -- FK para propostas será adicionada quando a tabela existir
  
  -- Identificação da proposta
  numero_proposta TEXT,
  codigo_empresa TEXT,
  
  -- Datas
  data_cadastro DATE,
  data_producao DATE,
  data_assinatura DATE,
  data_vigencia DATE,
  data_implantacao DATE,
  
  -- Segurado
  nome_segurado TEXT NOT NULL,
  cpf_segurado TEXT,
  
  -- Produto
  subproduto TEXT,
  modalidade TEXT, -- Individual, Familiar, PME, Adesão, Individual Odonto
  operadora TEXT,
  
  -- Valores
  valor_mensalidade DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'Implantada', -- Implantada, Em análise, Cancelada, Suspensa
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producoes_corretor_id ON producoes_corretor(corretor_id);
CREATE INDEX IF NOT EXISTS idx_producoes_status ON producoes_corretor(status);
CREATE INDEX IF NOT EXISTS idx_producoes_data_producao ON producoes_corretor(data_producao DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_producoes_corretor_updated_at ON producoes_corretor;
CREATE TRIGGER update_producoes_corretor_updated_at
  BEFORE UPDATE ON producoes_corretor
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PARCELAS DE COMISSÃO  
-- Cada produção pode ter N parcelas
-- =============================================

CREATE TABLE IF NOT EXISTS public.parcelas_comissao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  producao_id UUID NOT NULL REFERENCES public.producoes_corretor(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  
  numero_parcela INTEGER NOT NULL,
  valor_parcela DECIMAL(10,2) NOT NULL,
  taxa DECIMAL(10,2) DEFAULT 0,
  data_vencimento DATE NOT NULL,
  
  -- Comissão
  percentual_comissao DECIMAL(5,2) DEFAULT 100, -- 100%, 50%, etc
  codigo_comissao TEXT,
  data_pagamento_comissao DATE,
  status_comissao TEXT DEFAULT 'pendente', -- pendente, paga, atrasada
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcelas_producao_id ON parcelas_comissao(producao_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_corretor_id ON parcelas_comissao(corretor_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas_comissao(data_vencimento);

-- =============================================
-- RELATÓRIOS DE COMISSÃO (transferências)
-- Cada relatório agrupa N parcelas pagas
-- =============================================

CREATE TABLE IF NOT EXISTS public.relatorios_comissao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  
  numero_relatorio TEXT NOT NULL,
  data_geracao DATE NOT NULL,
  data_previsao DATE,
  data_pagamento DATE,
  tipo TEXT DEFAULT 'Transferência', -- Transferência, Boleto, PIX
  
  valor_bruto DECIMAL(10,2) DEFAULT 0,
  valor_liquido DECIMAL(10,2) DEFAULT 0,
  
  -- Pode ter PDF do relatório
  pdf_url TEXT,
  
  status TEXT DEFAULT 'gerado', -- gerado, pago, cancelado
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relatorios_corretor_id ON relatorios_comissao(corretor_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_data_geracao ON relatorios_comissao(data_geracao DESC);

-- =============================================
-- DADOS COMPLEMENTARES DO CORRETOR (endereços, telefones)
-- =============================================

CREATE TABLE IF NOT EXISTS public.corretor_enderecos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  padrao BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corretor_enderecos_corretor ON corretor_enderecos(corretor_id);

CREATE TABLE IF NOT EXISTS public.corretor_telefones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  
  tipo TEXT DEFAULT 'celular', -- celular, fixo, comercial
  numero TEXT NOT NULL,
  whatsapp BOOLEAN DEFAULT false,
  padrao BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corretor_telefones_corretor ON corretor_telefones(corretor_id);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE producoes_corretor ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE corretor_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE corretor_telefones ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total
CREATE POLICY "service_role_all_producoes" ON producoes_corretor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_parcelas" ON parcelas_comissao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_relatorios" ON relatorios_comissao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_enderecos" ON corretor_enderecos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_telefones" ON corretor_telefones FOR ALL USING (true) WITH CHECK (true);
