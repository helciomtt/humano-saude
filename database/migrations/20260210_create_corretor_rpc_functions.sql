-- =====================================================
-- RPC Functions para o Módulo do Corretor
-- Funções auxiliares chamadas via supabase.rpc()
-- =====================================================

-- Incrementar contador de interações de um card
CREATE OR REPLACE FUNCTION increment_card_interacoes(
  card_id UUID,
  increment_by INT DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE crm_cards
  SET total_interacoes = total_interacoes + increment_by,
      updated_at = NOW()
  WHERE id = card_id;
END;
$$;

-- Recalcular score de um card baseado em regras
CREATE OR REPLACE FUNCTION recalculate_card_score(target_card_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  card_record RECORD;
  new_score INT := 0;
  interaction_count INT;
  recent_proposta BOOLEAN;
BEGIN
  -- Buscar card
  SELECT * INTO card_record FROM crm_cards WHERE id = target_card_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Valor estimado > 0 = +20
  IF card_record.valor_estimado IS NOT NULL AND card_record.valor_estimado > 0 THEN
    new_score := new_score + 20;
  END IF;

  -- Interações > 3 = +15
  IF card_record.total_interacoes > 3 THEN
    new_score := new_score + 15;
  END IF;

  -- Proposta recente (< 24h) = +25
  IF card_record.ultima_interacao_proposta IS NOT NULL 
     AND card_record.ultima_interacao_proposta > NOW() - INTERVAL '24 hours' THEN
    new_score := new_score + 25;
    recent_proposta := TRUE;
  END IF;

  -- Coluna avançada = +20
  IF card_record.coluna_slug IN ('proposta_enviada', 'documentacao', 'fechado') THEN
    new_score := new_score + 20;
  END IF;

  -- Prioridade alta = +10
  IF card_record.prioridade = 'alta' THEN
    new_score := new_score + 10;
  END IF;

  -- Tem tags = +5
  IF card_record.tags IS NOT NULL AND array_length(card_record.tags, 1) > 0 THEN
    new_score := new_score + 5;
  END IF;

  -- Cap at 100
  IF new_score > 100 THEN
    new_score := 100;
  END IF;

  -- Update
  UPDATE crm_cards
  SET score = new_score,
      score_motivo = CASE
        WHEN new_score >= 80 THEN 'Lead quente: alto engajamento'
        WHEN new_score >= 50 THEN 'Lead morno: engajamento moderado'
        ELSE 'Lead frio: baixo engajamento'
      END,
      updated_at = NOW()
  WHERE id = target_card_id;

  RETURN new_score;
END;
$$;

-- Mover renovações para status automaticamente quando vencem
CREATE OR REPLACE FUNCTION check_renovacoes_vencidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE renovacoes
  SET status = 'vencido',
      updated_at = NOW()
  WHERE data_vencimento < CURRENT_DATE
    AND status = 'pendente';
END;
$$;

-- Buscar métricas do corretor (alternativa à view)
CREATE OR REPLACE FUNCTION get_corretor_metrics(p_corretor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_leads', (SELECT COUNT(*) FROM crm_cards WHERE corretor_id = p_corretor_id),
    'leads_novos', (SELECT COUNT(*) FROM crm_cards WHERE corretor_id = p_corretor_id AND coluna_slug = 'novo_lead'),
    'leads_qualificados', (SELECT COUNT(*) FROM crm_cards WHERE corretor_id = p_corretor_id AND coluna_slug = 'qualificado'),
    'propostas_enviadas', (SELECT COUNT(*) FROM crm_cards WHERE corretor_id = p_corretor_id AND coluna_slug = 'proposta_enviada'),
    'fechados', (SELECT COUNT(*) FROM crm_cards WHERE corretor_id = p_corretor_id AND coluna_slug = 'fechado'),
    'renovacoes_pendentes', (SELECT COUNT(*) FROM renovacoes WHERE corretor_id = p_corretor_id AND status = 'pendente'),
    'renovacoes_30d', (SELECT COUNT(*) FROM renovacoes WHERE corretor_id = p_corretor_id AND data_vencimento <= CURRENT_DATE + INTERVAL '30 days' AND data_vencimento >= CURRENT_DATE),
    'comissoes_pendentes', (SELECT COALESCE(SUM(valor_comissao), 0) FROM comissoes WHERE corretor_id = p_corretor_id AND status = 'pendente'),
    'comissoes_mes', (SELECT COALESCE(SUM(valor_comissao), 0) FROM comissoes WHERE corretor_id = p_corretor_id AND mes_referencia >= date_trunc('month', CURRENT_DATE))
  ) INTO result;

  RETURN result;
END;
$$;
