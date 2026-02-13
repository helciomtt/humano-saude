import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { enviarEmailAprovacao } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { corretor_id } = await request.json();

    if (!corretor_id) {
      return NextResponse.json({ error: 'corretor_id é obrigatório' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Buscar corretor
    const { data: corretor, error: corretorErr } = await supabase
      .from('corretores')
      .select('id, nome, email, metadata')
      .eq('id', corretor_id)
      .single();

    if (corretorErr || !corretor) {
      return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 });
    }

    const meta = (corretor.metadata || {}) as Record<string, unknown>;
    let onboardingToken = meta.onboarding_token as string | undefined;
    const isCompleto = Boolean(meta.onboarding_completo);

    if (isCompleto) {
      return NextResponse.json({ error: 'Corretor já completou o onboarding' }, { status: 400 });
    }

    // Gerar novo token se expirou ou não existe
    const tokenExpira = meta.onboarding_token_expira as string | undefined;
    const expired = tokenExpira && new Date(tokenExpira) < new Date();

    if (!onboardingToken || expired) {
      onboardingToken = crypto.randomUUID();
      const novaExpiracao = new Date();
      novaExpiracao.setDate(novaExpiracao.getDate() + 7);

      await supabase
        .from('corretores')
        .update({
          metadata: {
            ...meta,
            onboarding_token: onboardingToken,
            onboarding_token_expira: novaExpiracao.toISOString(),
          },
        })
        .eq('id', corretor_id);
    }

    // Buscar tipo_pessoa da solicitação original
    let tipoPessoa = 'pf';
    const solId = meta.solicitacao_id as string | undefined;
    if (solId) {
      const { data: sol } = await supabase
        .from('solicitacoes_corretor')
        .select('tipo_pessoa')
        .eq('id', solId)
        .single();
      if (sol?.tipo_pessoa) tipoPessoa = sol.tipo_pessoa;
    }

    // Construir link de onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';
    const onboardingLink = `${baseUrl}/dashboard/corretor/onboarding?token=${onboardingToken}&tipo=${tipoPessoa}`;

    // Enviar email
    const senhaTemp = meta.senha_temporaria as string | undefined;
    await enviarEmailAprovacao({
      nome: corretor.nome,
      email: corretor.email,
      onboardingLink,
      senhaTemporaria: senhaTemp,
    });

    return NextResponse.json({
      success: true,
      message: `Notificação reenviada para ${corretor.email}`,
      onboardingToken,
    });
  } catch (err) {
    logger.error('[reenviar-notificacao]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
