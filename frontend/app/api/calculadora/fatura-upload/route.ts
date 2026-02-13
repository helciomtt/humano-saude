import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fatura = formData.get('fatura') as File | null;
    const telefone = formData.get('telefone') as string | null;

    if (!fatura) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const sb = createServiceClient();
    const timestamp = Date.now();
    const sanitizedPhone = (telefone || 'unknown').replace(/\D/g, '');
    const ext = fatura.name.split('.').pop() || 'jpg';
    const path = `faturas-originais/${sanitizedPhone}/${timestamp}.${ext}`;

    const arrayBuffer = await fatura.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await sb.storage
      .from('media')
      .upload(path, buffer, {
        contentType: fatura.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      logger.error('[Fatura Upload] Erro:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = sb.storage.from('media').getPublicUrl(path);

    logger.info(`✅ Fatura upload: ${path} → ${urlData.publicUrl}`);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
    });
  } catch (err: unknown) {
    logger.error('[Fatura Upload] Erro inesperado:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao fazer upload da fatura' },
      { status: 500 }
    );
  }
}
