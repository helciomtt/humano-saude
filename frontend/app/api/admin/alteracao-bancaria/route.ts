import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { enviarEmailAlteracaoBancariaAprovada, enviarEmailAlteracaoBancariaRejeitada } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { solicitacao_id, acao, motivo_rejeicao } = await request.json();

    if (!solicitacao_id || !acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Buscar solicitação
    const { data: solicitacao, error: fetchErr } = await supabase
      .from('corretor_alteracao_bancaria')
      .select('*, corretores!corretor_id (id, nome, email)')
      .eq('id', solicitacao_id)
      .single();

    if (fetchErr || !solicitacao) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (solicitacao.status !== 'pendente') {
      return NextResponse.json({ error: 'Solicitação já foi processada' }, { status: 400 });
    }

    const corretor = solicitacao.corretores as { id: string; nome: string; email: string };

    if (acao === 'aprovar') {
      // 1. Desativar a conta bancária antiga
      const { data: contaAtiva } = await supabase
        .from('corretor_dados_bancarios')
        .select('id')
        .eq('corretor_id', solicitacao.corretor_id)
        .eq('ativo', true)
        .single();

      if (contaAtiva) {
        await supabase
          .from('corretor_dados_bancarios')
          .update({
            ativo: false,
            desativado_em: new Date().toISOString(),
            desativado_motivo: `Substituída por solicitação ${solicitacao_id.substring(0, 8)}`,
            substituido_por: null, // Será atualizado abaixo
          })
          .eq('id', contaAtiva.id);
      }

      // 2. Criar novo registro bancário
      const { data: novaConta, error: insertErr } = await supabase
        .from('corretor_dados_bancarios')
        .insert({
          corretor_id: solicitacao.corretor_id,
          banco_codigo: solicitacao.banco_codigo,
          banco_nome: solicitacao.banco_nome,
          agencia: solicitacao.agencia,
          conta: solicitacao.conta,
          tipo_conta: solicitacao.tipo_conta,
          titular_nome: solicitacao.titular_nome,
          titular_documento: solicitacao.titular_documento,
          tipo_chave_pix: solicitacao.tipo_chave_pix,
          chave_pix: solicitacao.chave_pix,
          ativo: true,
          verificado: false,
        })
        .select('id')
        .single();

      if (insertErr) {
        logger.error('[aprovar-alteracao] insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      // 3. Atualizar referência cruzada
      if (contaAtiva && novaConta) {
        await supabase
          .from('corretor_dados_bancarios')
          .update({ substituido_por: novaConta.id })
          .eq('id', contaAtiva.id);
      }

      // 4. Atualizar status da solicitação
      await supabase
        .from('corretor_alteracao_bancaria')
        .update({
          status: 'aprovado',
          aprovado_por: 'admin',
          aprovado_em: new Date().toISOString(),
        })
        .eq('id', solicitacao_id);

      // 5. Email de confirmação
      try {
        await enviarEmailAlteracaoBancariaAprovada({
          nome: corretor.nome,
          email: corretor.email,
          bancoNovo: solicitacao.banco_nome,
        });
      } catch (emailErr) {
        logger.error('[aprovar-alteracao] email error:', emailErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Alteração bancária aprovada e aplicada com sucesso',
      });
    }

    // REJEITAR
    await supabase
      .from('corretor_alteracao_bancaria')
      .update({
        status: 'rejeitado',
        motivo_rejeicao: motivo_rejeicao || 'Solicitação não aprovada',
        aprovado_em: new Date().toISOString(),
      })
      .eq('id', solicitacao_id);

    // Email de rejeição
    try {
      await enviarEmailAlteracaoBancariaRejeitada({
        nome: corretor.nome,
        email: corretor.email,
        motivo: motivo_rejeicao || 'Solicitação não aprovada',
      });
    } catch (emailErr) {
      logger.error('[rejeitar-alteracao] email error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Alteração bancária rejeitada',
    });
  } catch (err) {
    logger.error('[aprovar-alteracao-bancaria]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
