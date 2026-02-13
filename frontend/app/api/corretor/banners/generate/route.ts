import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const corretorId = formData.get('corretorId') as string;
    const nomeCorretor = formData.get('nomeCorretor') as string;
    const operadora = formData.get('operadora') as string;
    const templateId = formData.get('templateId') as string;

    if (!file || !corretorId) {
      return NextResponse.json({ error: 'Arquivo e corretorId obrigatórios' }, { status: 400 });
    }

    // nome e whatsapp são opcionais

    const bannerId = crypto.randomUUID();
    const ext = file.type.includes('png') ? 'png' : 'jpg';
    const path = `banners/${corretorId}/${bannerId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      logger.error('[Banner] Upload error:', uploadError.message);
      return NextResponse.json({ error: 'Falha no upload do banner' }, { status: 500 });
    }

    const publicUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;

    // Save record
    await supabase.from('banner_requests').insert({
      corretor_id: corretorId,
      nome_corretor: nomeCorretor || 'Corretor',
      whatsapp_corretor: '',
      template_id: `${operadora}-${templateId}`,
      status: 'pronto',
      imagem_url: publicUrl,
      metadata: {
        provider: 'template-client',
        operadora,
        templateId,
        persistent: true,
      },
    });

    return NextResponse.json({
      success: true,
      bannerId,
      imageUrl: publicUrl,
      persistent: true,
      operadora,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[Banner] Error:', msg);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
