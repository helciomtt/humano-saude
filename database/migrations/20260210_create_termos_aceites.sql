-- =====================================================
-- Termos de Uso e LGPD - Aceites de Corretores
-- Armazena cada aceite com timestamp, IP, versão
-- SEM dependências externas (autossuficiente)
-- =====================================================

-- Tabela de versões de termos
CREATE TABLE IF NOT EXISTS termos_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('termos_uso', 'lgpd', 'politica_privacidade', 'contrato_corretor')),
  versao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar versão ativa
CREATE UNIQUE INDEX IF NOT EXISTS idx_termos_versoes_tipo_ativo 
  ON termos_versoes(tipo) WHERE ativo = TRUE;

-- Tabela de aceites
CREATE TABLE IF NOT EXISTS termos_aceites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quem aceitou (UUIDs simples sem FK para evitar dependências)
  solicitacao_id UUID,
  corretor_id UUID,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  documento TEXT NOT NULL,
  
  -- O que aceitou
  termo_versao_id UUID REFERENCES termos_versoes(id),
  termo_tipo TEXT NOT NULL,
  termo_versao TEXT NOT NULL,
  
  -- Rastreamento legal
  ip_address TEXT,
  user_agent TEXT,
  aceite_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_termos_aceites_email ON termos_aceites(email);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_documento ON termos_aceites(documento);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_solicitacao ON termos_aceites(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_corretor ON termos_aceites(corretor_id);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_created ON termos_aceites(created_at DESC);

-- RLS habilitado mas acesso total (backend usa service_role key)
ALTER TABLE termos_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE termos_aceites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access termos_versoes"
  ON termos_versoes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Full access termos_aceites"
  ON termos_aceites FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Inserir termos padrão (versão 1.0)
-- =====================================================
INSERT INTO termos_versoes (tipo, versao, titulo, conteudo) VALUES
(
  'termos_uso',
  '1.0',
  'Termos de Uso - Plataforma Humano Saúde para Corretores',
  E'## TERMOS DE USO DA PLATAFORMA HUMANO SAÚDE PARA CORRETORES\n\n**Última atualização: 10 de fevereiro de 2026**\n\n### 1. ACEITAÇÃO DOS TERMOS\n\nAo acessar e utilizar a plataforma Humano Saúde na qualidade de corretor parceiro, você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.\n\n### 2. CADASTRO E ELEGIBILIDADE\n\n2.1. Para utilizar a plataforma, o corretor deve:\n- Ser maior de 18 anos;\n- Possuir CPF ou CNPJ válido e regular;\n- Fornecer informações verdadeiras, completas e atualizadas;\n- Manter a confidencialidade de suas credenciais de acesso.\n\n2.2. A Humano Saúde reserva-se o direito de recusar, suspender ou cancelar o cadastro a qualquer momento, sem aviso prévio.\n\n### 3. RESPONSABILIDADES DO CORRETOR\n\n3.1. O corretor compromete-se a:\n- Atuar com ética e transparência junto aos clientes;\n- Não divulgar informações confidenciais da plataforma;\n- Não utilizar a plataforma para fins ilícitos;\n- Manter seus dados cadastrais atualizados;\n- Cumprir a legislação vigente, incluindo a LGPD.\n\n### 4. PROPRIEDADE INTELECTUAL\n\n4.1. Todo o conteúdo, materiais de venda, logotipos e sistemas disponibilizados são propriedade da Humano Saúde, sendo vedada a reprodução sem autorização.\n\n### 5. COMISSÕES\n\n5.1. As comissões serão calculadas conforme a grade vigente e pagas nos prazos estabelecidos.\n5.2. A Humano Saúde poderá alterar a grade de comissões mediante aviso prévio de 30 dias.\n\n### 6. LIMITAÇÃO DE RESPONSABILIDADE\n\n6.1. A plataforma é fornecida "como está". A Humano Saúde não garante disponibilidade ininterrupta do serviço.\n\n### 7. RESCISÃO\n\n7.1. Qualquer das partes pode encerrar o vínculo mediante comunicação por escrito com 30 dias de antecedência.\n\n### 8. FORO\n\n8.1. Fica eleito o foro da Comarca do Rio de Janeiro/RJ para dirimir quaisquer controvérsias.'
),
(
  'lgpd',
  '1.0',
  'Política de Privacidade e LGPD - Humano Saúde',
  E'## POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)\n\n**Última atualização: 10 de fevereiro de 2026**\n\nEm conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).\n\n### 1. CONTROLADOR DE DADOS\n\nHumano Saúde Corretora de Seguros LTDA, inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, com sede na cidade do Rio de Janeiro/RJ.\n\n### 2. DADOS COLETADOS\n\n2.1. Coletamos os seguintes dados pessoais:\n- **Dados de identificação:** nome completo, CPF/CNPJ, e-mail, telefone;\n- **Dados profissionais:** registro SUSEP, experiência, especialidades;\n- **Dados de navegação:** endereço IP, user agent, logs de acesso;\n- **Dados financeiros:** informações bancárias para pagamento de comissões.\n\n### 3. FINALIDADE DO TRATAMENTO\n\n3.1. Seus dados são tratados para:\n- Cadastro e gestão do relacionamento como corretor parceiro;\n- Cálculo e pagamento de comissões;\n- Comunicação operacional e envio de materiais;\n- Cumprimento de obrigações legais e regulatórias;\n- Melhoria contínua da plataforma.\n\n### 4. BASE LEGAL\n\n4.1. O tratamento de dados é fundamentado em:\n- **Consentimento** (Art. 7º, I da LGPD);\n- **Execução de contrato** (Art. 7º, V da LGPD);\n- **Cumprimento de obrigação legal** (Art. 7º, II da LGPD);\n- **Legítimo interesse** (Art. 7º, IX da LGPD).\n\n### 5. COMPARTILHAMENTO\n\n5.1. Seus dados poderão ser compartilhados com:\n- Operadoras de saúde parceiras (para processamento de propostas);\n- Prestadores de serviço (processamento de pagamentos);\n- Autoridades regulatórias (quando exigido por lei).\n\n### 6. SEUS DIREITOS\n\n6.1. Você tem direito a:\n- Confirmar a existência de tratamento;\n- Acessar seus dados;\n- Corrigir dados incompletos ou desatualizados;\n- Solicitar anonimização ou eliminação;\n- Revogar o consentimento;\n- Solicitar portabilidade.\n\n### 7. RETENÇÃO DE DADOS\n\n7.1. Seus dados serão mantidos enquanto durar o vínculo como corretor e por mais 5 anos após o encerramento, para cumprimento de obrigações legais.\n\n### 8. SEGURANÇA\n\n8.1. Empregamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia, controle de acesso e monitoramento.\n\n### 9. CONTATO DO ENCARREGADO (DPO)\n\nPara exercer seus direitos ou esclarecer dúvidas: privacidade@humanosaude.com'
)
ON CONFLICT DO NOTHING;
