import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, corretorId, nomeCorretor, operadora, plano, formato, origem } = body;

    if (!imageBase64 || !corretorId) {
      return NextResponse.json({ error: 'imageBase64 e corretorId obrigatórios' }, { status: 400 });
    }

    // Extrair base64 puro
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 });
    }
    const [, mimeType, base64Data] = match;
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

    const imageId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const folder = origem === 'ia-clone' ? 'ia-clone' : 'criativopro';
    const path = `${folder}/${corretorId}/${timestamp}_${imageId}.${ext}`;

    // Converter base64 para buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      logger.error('[Save Image] Upload error:', uploadError.message);
      return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
    }

    const publicUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;

    // Salvar registro no banco
    await supabase.from('banner_requests').insert({
      corretor_id: corretorId,
      nome_corretor: nomeCorretor || 'Corretor',
      whatsapp_corretor: '',
      template_id: `${origem}-${operadora || 'geral'}-${formato || '9:16'}`,
      status: 'pronto',
      imagem_url: publicUrl,
      metadata: {
        provider: origem || 'criativopro',
        operadora: operadora || '',
        plano: plano || '',
        formato: formato || '9:16',
        savedAt: new Date().toISOString(),
        persistent: true,
      },
    });

    logger.info(`[Save Image] Salvo: ${path} | Origem: ${origem}`);

    return NextResponse.json({
      success: true,
      imageId,
      imageUrl: publicUrl,
      path,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[Save Image] Error:', msg);
    return NextResponse.json({ error: 'Erro interno ao salvar' }, { status: 500 });
  }
}

// GET: listar imagens salvas do corretor
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const corretorId = searchParams.get('corretorId');

    let query = supabase
      .from('banner_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    // Se corretorId='all', busca todos. Senão filtra.
    if (corretorId && corretorId !== 'all') {
      query = query.eq('corretor_id', corretorId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[Save Image] List error:', error.message);
      return NextResponse.json({ error: 'Erro ao buscar imagens' }, { status: 500 });
    }

    return NextResponse.json({ success: true, images: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[Save Image] Error:', msg);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
