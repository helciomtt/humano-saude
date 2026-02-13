import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getCorretorIdFromRequest } from '@/lib/auth-jwt';
import { logger } from '@/lib/logger';

// ─── GET: Buscar dados do corretor ──────────────────────────
export async function GET(request: NextRequest) {
  try {
    const corretorId = await getCorretorIdFromRequest(request);
    if (!corretorId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Buscar dados do corretor
    const { data: corretor, error: corretorErr } = await supabase
      .from('corretores')
      .select('id, nome, cpf, email, telefone, whatsapp, susep, slug, data_admissao, metadata, created_at, foto_url')
      .eq('id', corretorId)
      .eq('ativo', true)
      .single();

    if (corretorErr || !corretor) {
      return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 });
    }

    // Buscar dados bancários (ativos + inativos para histórico)
    const { data: dadosBancarios } = await supabase
      .from('corretor_dados_bancarios')
      .select('id, banco_codigo, banco_nome, agencia, conta, tipo_conta, titular_nome, titular_documento, tipo_chave_pix, chave_pix, ativo, verificado, created_at, desativado_em, desativado_motivo')
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false });

    // Buscar solicitações de alteração bancária
    const { data: alteracoes } = await supabase
      .from('corretor_alteracao_bancaria')
      .select('id, banco_nome, agencia, conta, motivo, status, motivo_rejeicao, created_at, aprovado_em')
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      corretor: {
        id: corretor.id,
        nome: corretor.nome,
        cpf: corretor.cpf,
        email: corretor.email,
        telefone: corretor.telefone,
        whatsapp: corretor.whatsapp,
        susep: corretor.susep,
        slug: corretor.slug || null,
        data_admissao: corretor.data_admissao,
        created_at: corretor.created_at,
        metadata: corretor.metadata || {},
        foto_url: corretor.foto_url || null,
      },
      dados_bancarios: dadosBancarios || [],
      alteracoes: alteracoes || [],
    });
  } catch (err) {
    logger.error('Erro no perfil GET', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ─── PATCH: Atualizar email ou senha ────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const corretorId = await getCorretorIdFromRequest(request);
    if (!corretorId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { email, senha_atual, nova_senha, gerar_link } = body;
    const supabase = createServiceClient();

    // ── Gerar link de indicação (código aleatório) ────
    if (gerar_link) {
      // Verificar se o corretor JÁ tem um slug — se sim, bloquear (só admin pode alterar)
      const { data: corretorAtual } = await supabase
        .from('corretores')
        .select('slug')
        .eq('id', corretorId)
        .single();

      if (corretorAtual?.slug) {
        return NextResponse.json(
          { error: 'Seu link já foi gerado. Entre em contato com a administração para alterá-lo.' },
          { status: 403 }
        );
      }

      // Gerar código curto aleatório (8 chars alfanumérico)
      const gerarCodigo = () => {
        const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // sem 0, o, l, 1 (evita confusão visual)
        let codigo = '';
        for (let i = 0; i < 8; i++) {
          codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return codigo;
      };

      // Tentar até encontrar um código único (max 5 tentativas)
      let slugGerado = '';
      for (let tentativa = 0; tentativa < 5; tentativa++) {
        const candidato = gerarCodigo();
        const { data: existente } = await supabase
          .from('corretores')
          .select('id')
          .eq('slug', candidato)
          .single();

        if (!existente) {
          slugGerado = candidato;
          break;
        }
      }

      if (!slugGerado) {
        return NextResponse.json({ error: 'Erro ao gerar link. Tente novamente.' }, { status: 500 });
      }

      const { error: updateErr } = await supabase
        .from('corretores')
        .update({ slug: slugGerado })
        .eq('id', corretorId);

      if (updateErr) {
        logger.error('Erro ao salvar slug', updateErr, { corretor_id: corretorId });
        return NextResponse.json({ error: 'Erro ao salvar link' }, { status: 500 });
      }

      return NextResponse.json({ success: true, slug: slugGerado, message: 'Link gerado com sucesso!' });
    }

    // ── Atualizar e-mail ──────────────────────
    if (email) {
      const emailNorm = email.trim().toLowerCase();

      // Validar formato
      if (!emailNorm.includes('@') || !emailNorm.includes('.')) {
        return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
      }

      // Verificar se já existe outro corretor com esse email
      const { data: existente } = await supabase
        .from('corretores')
        .select('id')
        .eq('email', emailNorm)
        .neq('id', corretorId)
        .eq('ativo', true)
        .single();

      if (existente) {
        return NextResponse.json({ error: 'Este e-mail já está em uso por outro corretor' }, { status: 409 });
      }

      const { error: updateErr } = await supabase
        .from('corretores')
        .update({ email: emailNorm })
        .eq('id', corretorId);

      if (updateErr) {
        logger.error('Erro ao atualizar email corretor', updateErr, { corretor_id: corretorId });
        return NextResponse.json({ error: 'Erro ao atualizar e-mail' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'E-mail atualizado com sucesso' });
    }

    // ── Alterar senha ─────────────────────────
    if (senha_atual && nova_senha) {
      // Buscar corretor para verificar senha atual
      const { data: corretor } = await supabase
        .from('corretores')
        .select('id, metadata')
        .eq('id', corretorId)
        .single();

      if (!corretor) {
        return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 });
      }

      const meta = (corretor.metadata || {}) as Record<string, unknown>;
      const senhaAtual = meta.senha_temporaria as string | undefined;

      // Verificar senha atual (em produção usar bcrypt)
      if (senhaAtual && senhaAtual !== senha_atual) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
      }

      // Validar nova senha
      if (nova_senha.length < 6) {
        return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 });
      }

      // Atualizar senha no metadata
      const { error: updateErr } = await supabase
        .from('corretores')
        .update({
          metadata: {
            ...meta,
            senha_temporaria: nova_senha, // Em produção, usar hash bcrypt
            senha_alterada: true,
          },
        })
        .eq('id', corretorId);

      if (updateErr) {
        logger.error('Erro ao alterar senha corretor', updateErr, { corretor_id: corretorId });
        return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' });
    }

    return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 });
  } catch (err) {
    logger.error('Erro no perfil PATCH', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
