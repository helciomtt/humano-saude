-- ============================================================
-- SEED: Precos Referencia Mercado RJ 2026
-- Dados do formato Comparavel (tabelas publicas)
-- PME Apartamento + PF/Adesao
-- ============================================================

-- AMIL PME Apto (Bronze RJ, 2-29 vidas)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('amil', 'Amil', 'Amil Bronze RJ', 'PME', 'Apartamento', false, 'RJ', 2, 29, ARRAY['Hospital Americas','Hospital Badim','Hospital Vitoria','Rede Labs a+'], 'Prata Apto, 5-29 vidas')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,243.39),('19-23',2,284.76),('24-28',3,347.42),('29-33',4,416.90),('34-38',5,437.74),
  ('39-43',6,481.52),('44-48',7,601.90),('49-53',8,662.09),('54-58',9,827.62),('59+',10,1448.34)
) AS f(faixa,ordem,val);

-- SULAMERICA PME Apto (Direto Rio II, 5-29 vidas)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('sulamerica', 'SulAmerica', 'Direto Rio II', 'PME', 'Apartamento', false, 'Nacional', 5, 29, ARRAY['Copa DOr','Samaritano','Barra DOr','Rede DOr'], 'Direto Rio II Apto 5-29')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,182.93),('19-23',2,225.82),('24-28',3,281.49),('29-33',4,346.73),('34-38',5,385.15),
  ('39-43',6,404.38),('44-48',7,561.76),('49-53',8,617.94),('54-58',9,713.91),('59+',10,1393.32)
) AS f(faixa,ordem,val);

-- BRADESCO PME Apto (FLEX, copart 30%)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, coparticipacao_pct, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('bradesco', 'Bradesco Saude', 'FLEX', 'PME', 'Apartamento', true, 30.00, 'Nacional', 3, 29, ARRAY['Samaritano','Copa DOr','Pro Cardiaco','Einstein'], 'FLEX Apto copart 30%')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,257.96),('19-23',2,309.55),('24-28',3,361.14),('29-33',4,412.73),('34-38',5,464.32),
  ('39-43',6,515.91),('44-48',7,567.50),('49-53',8,619.09),('54-58',9,670.68),('59+',10,1547.66)
) AS f(faixa,ordem,val);

-- PORTO PME Apto (Bronze PRO Copar, 3-29 vidas)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('porto', 'Porto Saude', 'Bronze PRO Copar', 'PME', 'Apartamento', true, 'RJ', 3, 29, ARRAY['Copa Star','Barra DOr','Norte DOr','Rede Labs a+'], 'PRO 3-29 Bronze Apto')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,162.45),('19-23',2,197.01),('24-28',3,237.66),('29-33',4,272.08),('34-38',5,294.80),
  ('39-43',6,304.45),('44-48',7,363.68),('49-53',8,391.51),('54-58',9,483.74),('59+',10,813.14)
) AS f(faixa,ordem,val);

-- ASSIM PME Apto (A60, 2-9 vidas)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('assim', 'Assim Saude', 'A60', 'PME', 'Apartamento', false, 'RJ', 2, 9, ARRAY['Prontobaby','Hosp Sao Matheus','Daniel Lipp','Hospital Badim'], 'A60 Apto 2-9 vidas')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,201.39),('19-23',2,273.49),('24-28',3,300.84),('29-33',4,327.92),('34-38',5,332.84),
  ('39-43',6,349.48),('44-48',7,495.21),('49-53',8,668.53),('54-58',9,802.24),('59+',10,1208.17)
) AS f(faixa,ordem,val);

-- LEVE SAUDE PME Apto (Personal Empresarial, 2-99 vidas)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('levesaude', 'Leve Saude', 'Personal Empresarial', 'PME', 'Apartamento', false, 'RJ', 2, 99, ARRAY['Caxias DOr','Unidades Proprias Leve'], 'Personal Emp Apto 2-99')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,166.90),('19-23',2,211.96),('24-28',3,233.16),('29-33',4,254.14),('34-38',5,259.23),
  ('39-43',6,272.19),('44-48',7,386.50),('49-53',8,493.95),('54-58',9,592.74),('59+',10,895.04)
) AS f(faixa,ordem,val);

-- UNIMED FERJ PME Apto (Prime Nacional)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('unimed', 'Unimed FERJ', 'Prime Nacional', 'PME', 'Apartamento', false, 'RJ', 2, 29, ARRAY['Hospital Unimed-Rio','Rede Referenciada Unimed'], 'Prime Nacional Apto')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,257.79),('19-23',2,317.08),('24-28',3,377.10),('29-33',4,404.44),('34-38',5,419.44),
  ('39-43',6,487.81),('44-48',7,631.52),('49-53',8,829.63),('54-58',9,1142.07),('59+',10,1546.71)
) AS f(faixa,ordem,val);

-- PREVENT SENIOR PME Apto (foco 44+)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('preventsenior', 'Prevent Senior', 'Prevent Senior Apto', 'PME', 'Apartamento', false, 'RJ', 1, 99, ARRAY['Sancta Maggiore RJ','Rede Propria Prevent'], 'Foco senior 44+')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,372.77),('19-23',2,465.97),('24-28',3,582.46),('29-33',4,640.70),('34-38',5,672.74),
  ('39-43',6,740.01),('44-48',7,925.02),('49-53',8,1017.52),('54-58',9,1208.31),('59+',10,1589.90)
) AS f(faixa,ordem,val);

-- MEDSENIOR PME Apto (Black, 44+)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('medsenior', 'MedSenior', 'Black', 'PME', 'Apartamento', false, 'RJ', 1, 99, ARRAY['Centro Medico MedSenior','Rede Parceira'], 'Foco senior 44+, Black')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('44-48',7,1205.92),('49-53',8,1205.92),('54-58',9,1447.10),('59+',10,1895.70)
) AS f(faixa,ordem,val);

-- ============================================================
-- PF / ADESAO
-- ============================================================

-- ASSIM PF (A80 Quarto)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('assim', 'Assim Saude', 'A80 Quarto', 'PF', 'Apartamento', false, 'RJ', 1, 1, ARRAY['Prontobaby','Hosp Sao Matheus','Daniel Lipp'], 'PF A80 Quarto')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,317.40),('19-23',2,431.03),('24-28',3,474.13),('29-33',4,516.80),('34-38',5,524.55),
  ('39-43',6,550.78),('44-48',7,780.46),('49-53',8,1053.62),('54-58',9,1264.34),('59+',10,1904.10)
) AS f(faixa,ordem,val);

-- UNIMED FERJ PF (Individual Apto)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('unimed', 'Unimed FERJ', 'FERJ Individual Apto', 'PF', 'Apartamento', false, 'RJ', 1, 1, ARRAY['Hospital Unimed-Rio','Rede Referenciada'], 'PF Individual Apto')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,257.79),('19-23',2,317.08),('24-28',3,377.10),('29-33',4,404.44),('34-38',5,419.44),
  ('39-43',6,487.81),('44-48',7,631.52),('49-53',8,829.63),('54-58',9,1142.07),('59+',10,1546.71)
) AS f(faixa,ordem,val);

-- LEVE SAUDE PF (Individual AMB/QC)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('levesaude', 'Leve Saude', 'Leve Individual', 'PF', 'Apartamento', false, 'RJ', 1, 1, ARRAY['Caxias DOr','Unidades Proprias Leve'], 'PF Individual AMB/QC')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,175.29),('19-23',2,280.73),('24-28',3,322.84),('29-33',4,361.58),('34-38',5,397.74),
  ('39-43',6,445.47),('44-48',7,556.83),('49-53',8,640.36),('54-58',9,736.41),('59+',10,994.15)
) AS f(faixa,ordem,val);

-- PREVENT SENIOR PF
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('preventsenior', 'Prevent Senior', 'Prevent Senior PF', 'PF', 'Apartamento', false, 'RJ', 1, 1, ARRAY['Sancta Maggiore RJ','Rede Propria Prevent'], 'PF senior')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('0-18',1,372.77),('19-23',2,465.97),('24-28',3,582.46),('29-33',4,640.70),('34-38',5,672.74),
  ('39-43',6,740.01),('44-48',7,925.02),('49-53',8,1017.52),('54-58',9,1208.31),('59+',10,1589.90)
) AS f(faixa,ordem,val);

-- MEDSENIOR PF (Black Individual)
WITH ins AS (
  INSERT INTO planos_operadora (operadora_id, operadora_nome, plano_nome, modalidade, acomodacao, coparticipacao, abrangencia, vidas_min, vidas_max, rede_hospitalar, notas)
  VALUES ('medsenior', 'MedSenior', 'Black Individual', 'PF', 'Apartamento', false, 'RJ', 1, 1, ARRAY['Centro Medico MedSenior','Rede Parceira'], 'PF senior 44+ Black')
  RETURNING id
) INSERT INTO precos_faixa (plano_id, faixa_etaria, faixa_ordem, valor)
SELECT ins.id, f.faixa, f.ordem, f.val FROM ins, (VALUES
  ('44-48',7,1205.92),('49-53',8,1205.92),('54-58',9,1447.10),('59+',10,1895.70)
) AS f(faixa,ordem,val);
