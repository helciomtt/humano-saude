import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailConviteCorretor } from '@/lib/email';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

// ─── POST: Enviar convite para ser corretor ─────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nomeConvidante, origem, idConvidante } = body;

    if (!email || !nomeConvidante) {
      return NextResponse.json(
        { error: 'Email e nome do convidante são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const result = await enviarEmailConviteCorretor({
      emailConvidado: email,
      nomeConvidante: nomeConvidante,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar convite' },
        { status: 500 }
      );
    }

    // Salvar convite no banco
    try {
      await supabase.from('convites_corretor').insert({
        email_convidado: email.toLowerCase(),
        nome_convidante: nomeConvidante,
        origem: origem || 'admin',
        id_convidante: idConvidante || null,
        status: 'enviado',
      });
    } catch (dbErr) {
      logger.warn('[convite] Não foi possível salvar no banco', { error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
    }

    return NextResponse.json({
      success: true,
      message: 'Convite enviado com sucesso',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[convite-corretor] erro', err, { message: msg });
    return NextResponse.json(
      { error: msg || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
