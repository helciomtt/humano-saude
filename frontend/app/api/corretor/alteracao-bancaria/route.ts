import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { enviarEmailAlteracaoBancariaCorretor, enviarEmailAlteracaoBancariaAdmin } from '@/lib/email';
import { logger } from '@/lib/logger';

// POST - Corretor solicita alteração bancária
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      corretor_id,
      banco_codigo,
      banco_nome,
      agencia,
      conta,
      tipo_conta,
      titular_nome,
      titular_documento,
      tipo_chave_pix,
      chave_pix,
      motivo,
    } = body;

    if (!corretor_id || !banco_codigo || !banco_nome || !agencia || !conta || !titular_nome || !titular_documento || !motivo) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verificar se corretor existe
    const { data: corretor, error: corretorErr } = await supabase
      .from('corretores')
      .select('id, nome, email')
      .eq('id', corretor_id)
      .single();

    if (corretorErr || !corretor) {
      return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 });
    }

    // Verificar se já existe solicitação pendente
    const { data: pendente } = await supabase
      .from('corretor_alteracao_bancaria')
      .select('id')
      .eq('corretor_id', corretor_id)
      .eq('status', 'pendente')
      .single();

    if (pendente) {
      return NextResponse.json(
        { error: 'Já existe uma solicitação de alteração bancária pendente. Aguarde a análise.' },
        { status: 409 },
      );
    }

    // Buscar dados bancários atuais para snapshot
    const { data: dadosAtuais } = await supabase
      .from('corretor_dados_bancarios')
      .select('*')
      .eq('corretor_id', corretor_id)
      .eq('ativo', true)
      .single();

    // Criar solicitação
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '';

    const { data: solicitacao, error: insertErr } = await supabase
      .from('corretor_alteracao_bancaria')
      .insert({
        corretor_id,
        banco_codigo,
        banco_nome,
        agencia,
        conta,
        tipo_conta: tipo_conta || 'corrente',
        titular_nome,
        titular_documento,
        tipo_chave_pix: tipo_chave_pix || null,
        chave_pix: chave_pix || null,
        motivo,
        dados_antigos: dadosAtuais || null,
        status: 'pendente',
        corretor_aceite_em: new Date().toISOString(),
        corretor_aceite_ip: ip,
      })
      .select('id')
      .single();

    if (insertErr) {
      logger.error('[alteracao-bancaria] insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Enviar emails (non-blocking)
    try {
      await enviarEmailAlteracaoBancariaCorretor({
        nome: corretor.nome,
        email: corretor.email,
        bancoNovo: banco_nome,
        motivo,
      });
      await enviarEmailAlteracaoBancariaAdmin({
        corretorNome: corretor.nome,
        corretorEmail: corretor.email,
        bancoAntigo: dadosAtuais?.banco_nome || '—',
        bancoNovo: banco_nome,
        motivo,
      });
    } catch (emailErr) {
      logger.error('[alteracao-bancaria] email error (non-critical):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação de alteração bancária enviada com sucesso! Aguarde a análise.',
      id: solicitacao?.id,
    });
  } catch (err) {
    logger.error('[alteracao-bancaria]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET - Listar solicitações (admin ou corretor específico)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const corretor_id = searchParams.get('corretor_id');
    const status = searchParams.get('status');

    const supabase = createServiceClient();

    let query = supabase
      .from('corretor_alteracao_bancaria')
      .select(`
        *,
        corretores!corretor_id (id, nome, email, cpf, telefone)
      `)
      .order('created_at', { ascending: false });

    if (corretor_id) query = query.eq('corretor_id', corretor_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      logger.error('[alteracao-bancaria GET]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    logger.error('[alteracao-bancaria GET]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
