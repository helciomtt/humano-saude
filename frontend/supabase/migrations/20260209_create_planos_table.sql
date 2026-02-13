-- =====================================================
-- TABELA: planos_saude
-- Armazena todos os planos disponíveis para a calculadora
-- =====================================================

CREATE TABLE IF NOT EXISTS public.planos_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Identificação do Plano
  nome VARCHAR(255) NOT NULL,
  operadora VARCHAR(100) NOT NULL,
  codigo_ans VARCHAR(50),
  
  -- Tipo e Categoria
  tipo_contratacao VARCHAR(50) NOT NULL CHECK (tipo_contratacao IN ('PF', 'PME', 'Adesão')),
  acomodacao VARCHAR(20) NOT NULL CHECK (acomodacao IN ('Enfermaria', 'Apartamento')),
  
  -- Características
  coparticipacao VARCHAR(20) DEFAULT 'Isento',
  abrangencia VARCHAR(50) DEFAULT 'Nacional',
  reembolso VARCHAR(100),
  extras TEXT,
  
  -- Preços por Faixa Etária (JSONB para flexibilidade)
  valores JSONB NOT NULL DEFAULT '{
    "0-18": 0,
    "19-23": 0,
    "24-28": 0,
    "29-33": 0,
    "34-38": 0,
    "39-43": 0,
    "44-48": 0,
    "49-53": 0,
    "54-58": 0,
    "59+": 0
  }'::jsonb,
  
  -- Metadados
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  logo_url TEXT,
  ordem INTEGER DEFAULT 0
);

-- Índices para Performance
CREATE INDEX idx_planos_operadora ON public.planos_saude(operadora);
CREATE INDEX idx_planos_tipo ON public.planos_saude(tipo_contratacao);
CREATE INDEX idx_planos_acomodacao ON public.planos_saude(acomodacao);
CREATE INDEX idx_planos_ativo ON public.planos_saude(ativo) WHERE ativo = true;

-- RLS (Row Level Security)
ALTER TABLE public.planos_saude ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública (para calculadora)
CREATE POLICY "Planos são visíveis publicamente"
  ON public.planos_saude
  FOR SELECT
  USING (ativo = true);

-- Policy: Admin pode tudo
CREATE POLICY "Admin tem controle total"
  ON public.planos_saude
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger: Updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.planos_saude
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SEED: Inserir Planos Iniciais (Baseado no WordPress)
-- =====================================================

INSERT INTO public.planos_saude (nome, operadora, tipo_contratacao, acomodacao, coparticipacao, abrangencia, reembolso, extras, valores, destaque, ordem) VALUES

-- LEVE SAÚDE INDIVIDUAL
('LEVE TOP 100', 'Leve Saúde', 'PF', 'Enfermaria', 'Isento', 'Regional (Rio/Baixada)', 'Não possui', 'Sem IOF', 
'{"0-18": 248.75, "19-23": 248.75, "24-28": 286.06, "29-33": 314.66, "34-38": 314.66, "39-43": 346.13, "44-48": 465.54, "49-53": 512.10, "54-58": 665.73, "59+": 998.59}'::jsonb, 
false, 10),

('LEVE TOP 200', 'Leve Saúde', 'PF', 'Apartamento', 'Isento', 'Regional (Rio/Baixada)', 'Não possui', 'Sem IOF',
'{"0-18": 394.68, "19-23": 394.68, "24-28": 434.15, "29-33": 477.56, "34-38": 525.32, "39-43": 556.84, "44-48": 779.57, "49-53": 865.33, "54-58": 1038.39, "59+": 1360.29}'::jsonb,
true, 5),

-- LEVE SAÚDE PME
('LEVE TOP 200 PME', 'Leve Saúde', 'PME', 'Enfermaria', 'Isento', 'Regional + Emergência', 'Fixo R$ 40,00', 'Rede Própria',
'{"0-18": 162.00, "19-23": 197.96, "24-28": 217.76, "29-33": 237.36, "34-38": 240.92, "39-43": 252.97, "44-48": 367.56, "49-53": 462.76, "54-58": 555.31, "59+": 832.96}'::jsonb,
true, 1),

('LEVE TOP 200 PME', 'Leve Saúde', 'PME', 'Apartamento', 'Isento', 'Regional + Emergência', 'Fixo R$ 40,00', 'Rede Própria',
'{"0-18": 202.50, "19-23": 247.46, "24-28": 272.20, "29-33": 296.70, "34-38": 301.15, "39-43": 316.21, "44-48": 459.45, "49-53": 555.47, "54-58": 694.34, "59+": 1041.51}'::jsonb,
true, 2),

-- AMIL S380 PME (Promo 5+ vidas)
('AMIL S380', 'Amil', 'PME', 'Enfermaria', 'Parcial', 'Nacional', 'R$ 80,00', 'Telemedicina',
'{"0-18": 209.00, "19-23": 244.52, "24-28": 298.32, "29-33": 358.00, "34-38": 375.90, "39-43": 413.50, "44-48": 516.88, "49-53": 568.57, "54-58": 710.71, "59+": 1243.60}'::jsonb,
true, 3),

('AMIL S380', 'Amil', 'PME', 'Apartamento', 'Parcial', 'Nacional', 'R$ 80,00', 'Telemedicina',
'{"0-18": 267.14, "19-23": 312.56, "24-28": 381.33, "29-33": 457.59, "34-38": 480.47, "39-43": 528.52, "44-48": 660.65, "49-53": 726.71, "54-58": 908.39, "59+": 1589.69}'::jsonb,
true, 4),

-- AMIL S450 (OURO)
('AMIL S450', 'Amil', 'PME', 'Enfermaria', 'Parcial', 'Nacional', 'R$ 96,00', 'Linha Selecionada',
'{"0-18": 266.09, "19-23": 311.33, "24-28": 379.82, "29-33": 455.78, "34-38": 478.57, "39-43": 526.43, "44-48": 658.04, "49-53": 723.84, "54-58": 904.80, "59+": 1583.40}'::jsonb,
false, 6),

('AMIL S450', 'Amil', 'PME', 'Apartamento', 'Parcial', 'Nacional', 'R$ 96,00', 'Linha Selecionada',
'{"0-18": 340.21, "19-23": 398.05, "24-28": 485.62, "29-33": 582.74, "34-38": 611.88, "39-43": 673.07, "44-48": 841.34, "49-53": 925.47, "54-58": 1156.84, "59+": 2024.47}'::jsonb,
false, 7),

-- BRADESCO EFETIVO IV
('BRADESCO EFETIVO IV', 'Bradesco', 'PME', 'Enfermaria', 'Isento', 'Nacional', '1x Tabela', 'Remissão 1 ano',
'{"0-18": 372.28, "19-23": 456.98, "24-28": 558.54, "29-33": 614.40, "34-38": 670.25, "39-43": 781.97, "44-48": 1005.40, "49-53": 1228.84, "54-58": 1509.14, "59+": 2161.02}'::jsonb,
false, 8),

-- UNIMED ESTILO RJ
('UNIMED ESTILO RJ', 'Unimed FERJ', 'PME', 'Enfermaria', 'Parcial', 'Estadual (RJ)', 'Não possui', 'Sistema Unimed',
'{"0-18": 185.29, "19-23": 228.00, "24-28": 271.04, "29-33": 290.71, "34-38": 301.58, "39-43": 350.79, "44-48": 454.14, "49-53": 596.56, "54-58": 821.00, "59+": 1434.95}'::jsonb,
false, 9),

-- ADESÃO QUALICORP
('AMPLA 200', 'Ampla Saúde', 'Adesão', 'Enfermaria', 'Isento', 'Regional', 'Não possui', 'Qualicorp',
'{"0-18": 436.80, "19-23": 532.02, "24-28": 611.81, "29-33": 691.97, "34-38": 768.77, "39-43": 880.24, "44-48": 1093.26, "49-53": 1367.68, "54-58": 1746.52, "59+": 2521.98}'::jsonb,
false, 11),

('ASSIM A20', 'Assim Saúde', 'Adesão', 'Enfermaria', 'Parcial', 'Regional', 'Não possui', 'Qualicorp',
'{"0-18": 214.23, "19-23": 257.08, "24-28": 295.64, "29-33": 325.20, "34-38": 325.20, "39-43": 357.72, "44-48": 518.69, "49-53": 570.56, "54-58": 741.73, "59+": 1238.69}'::jsonb,
false, 12),

-- ADESÃO SUPERMED
('AMIL S380 ADESÃO', 'Amil', 'Adesão', 'Enfermaria', 'Parcial', 'Nacional', 'Não possui', 'Supermed',
'{"0-18": 247.90, "19-23": 336.65, "24-28": 395.18, "29-33": 395.18, "34-38": 395.18, "39-43": 441.43, "44-48": 609.61, "49-53": 727.88, "54-58": 1046.70, "59+": 1484.22}'::jsonb,
false, 13);

COMMENT ON TABLE public.planos_saude IS 'Tabela de planos de saúde para calculadora inteligente';
COMMENT ON COLUMN public.planos_saude.valores IS 'Preços por faixa etária em formato JSON';
COMMENT ON COLUMN public.planos_saude.destaque IS 'Planos destacados aparecem primeiro nos resultados';
