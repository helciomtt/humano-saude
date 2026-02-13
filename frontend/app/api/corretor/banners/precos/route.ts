import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const operadora = searchParams.get('operadora');
  const modalidade = searchParams.get('modalidade') || 'PME';
  const acomodacao = searchParams.get('acomodacao') || 'Apartamento';

  if (!operadora) {
    return NextResponse.json({ error: 'operadora required' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('get_precos_operadora', {
    p_operadora_id: operadora,
    p_modalidade: modalidade,
    p_acomodacao: acomodacao,
  });

  if (error) {
    logger.error('[Precos] RPC error:', error.message);
    // Fallback: query direct
    const { data: plano } = await supabase
      .from('planos_operadora')
      .select('*')
      .eq('operadora_id', operadora)
      .eq('modalidade', modalidade)
      .eq('acomodacao', acomodacao)
      .eq('ativo', true)
      .limit(1)
      .single();

    if (!plano) {
      return NextResponse.json({ data: [], plano: null });
    }

    const { data: faixas } = await supabase
      .from('precos_faixa')
      .select('*')
      .eq('plano_id', plano.id)
      .order('faixa_ordem', { ascending: true });

    return NextResponse.json({
      plano: {
        plano_nome: plano.plano_nome,
        modalidade: plano.modalidade,
        acomodacao: plano.acomodacao,
        coparticipacao: plano.coparticipacao,
        coparticipacao_pct: plano.coparticipacao_pct,
        abrangencia: plano.abrangencia,
        vidas_min: plano.vidas_min,
        vidas_max: plano.vidas_max,
        rede_hospitalar: plano.rede_hospitalar,
        notas: plano.notas,
      },
      data: (faixas || []).map((f: Record<string, unknown>) => ({
        faixa_etaria: f.faixa_etaria,
        faixa_ordem: f.faixa_ordem,
        valor: Number(f.valor),
      })),
    });
  }

  // Group from RPC result
  const first = data?.[0];
  return NextResponse.json({
    plano: first ? {
      plano_nome: first.plano_nome,
      modalidade: first.modalidade,
      acomodacao: first.acomodacao,
      coparticipacao: first.coparticipacao,
      coparticipacao_pct: first.coparticipacao_pct,
      abrangencia: first.abrangencia,
      vidas_min: first.vidas_min,
      vidas_max: first.vidas_max,
      rede_hospitalar: first.rede_hospitalar,
      notas: first.notas,
    } : null,
    data: (data || []).map((r: Record<string, unknown>) => ({
      faixa_etaria: r.faixa_etaria,
      faixa_ordem: r.faixa_ordem,
      valor: Number(r.valor),
    })),
  });
}
