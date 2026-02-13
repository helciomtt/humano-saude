import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const leadId = formData.get('lead_id') as string;
    const telefone = formData.get('telefone') as string;
    const nome = formData.get('nome') as string;

    // Coletar todos os arquivos do form (chaves: doc_xxx)
    const arquivos: { docId: string; file: File }[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('doc_') && value instanceof File) {
        arquivos.push({ docId: key.replace('doc_', ''), file: value });
      }
    }

    if (arquivos.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const timestamp = Date.now();
    const idFolder = leadId || telefone?.replace(/\D/g, '') || `anonimo_${timestamp}`;
    const uploadResults: { docId: string; url: string; nome: string }[] = [];

    for (const { docId, file } of arquivos) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 80);
      const path = `documentos-adesao/${idFolder}/${timestamp}_${docId}_${safeName}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        logger.error(`[Docs] Erro upload ${docId}:`, uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      uploadResults.push({
        docId,
        url: urlData?.publicUrl || '',
        nome: file.name,
      });
    }

    if (uploadResults.length === 0) {
      return NextResponse.json(
        { error: 'Falha ao enviar documentos. Tente novamente.' },
        { status: 500 },
      );
    }

    // Se temos leadId, atualizar o lead no insurance_leads com info dos docs
    if (leadId) {
      const { data: currentLead } = await supabase
        .from('insurance_leads')
        .select('historico, observacoes')
        .eq('id', leadId)
        .maybeSingle();

      if (currentLead) {
        const novoHistorico = [
          ...(currentLead.historico || []),
          {
            timestamp: new Date().toISOString(),
            evento: 'documentos_enviados',
            detalhes: `${uploadResults.length} documento(s): ${uploadResults.map((d) => d.nome).join(', ')}`,
          },
        ];

        const obsExtra = `\nDocumentos enviados: ${uploadResults.map((d) => d.nome).join(', ')}`;

        await supabase
          .from('insurance_leads')
          .update({
            status: 'contatado',
            historico: novoHistorico,
            observacoes: (currentLead.observacoes || '') + obsExtra,
            dados_pdf: {
              documentos_adesao: uploadResults,
            },
          })
          .eq('id', leadId);
      }
    }

    logger.info(
      `[Docs] ✅ ${uploadResults.length} documento(s) enviado(s) para lead ${idFolder} | nome: ${nome}`,
    );

    return NextResponse.json({
      success: true,
      quantidade: uploadResults.length,
      documentos: uploadResults,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    logger.error('[Docs] ❌ Erro:', msg);
    return NextResponse.json({ error: 'Erro ao enviar documentos.' }, { status: 500 });
  }
}
