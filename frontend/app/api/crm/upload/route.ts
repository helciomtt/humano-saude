import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
]);

/**
 * POST /api/crm/upload
 * Upload de arquivo para Supabase Storage + registro em crm_attachments
 * 
 * Body: FormData com:
 *   - file: File
 *   - entity_type: 'deal' | 'contact' | 'company' | 'activity' | 'quote'
 *   - entity_id: string (UUID)
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──
    const token =
      request.cookies.get('admin_token')?.value ||
      request.cookies.get('corretor_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const jwt = await verifyToken(token);
    if (!jwt) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ── Parse form data ──
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = (formData.get('entity_type') as string) || 'deal';
    const entityId = formData.get('entity_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    if (!entityId) {
      return NextResponse.json({ error: 'entity_id é obrigatório' }, { status: 400 });
    }

    // ── Validations ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}` },
        { status: 400 },
      );
    }

    // ── Upload to Storage ──
    const sb = createServiceClient();
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `crm/${entityType}/${entityId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await sb.storage
      .from('attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('[upload] Storage error', uploadError);
      return NextResponse.json(
        { error: `Erro no upload: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // ── Get public URL ──
    const { data: urlData } = sb.storage
      .from('attachments')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // ── Insert attachment record ──
    const uploadedBy = jwt.corretor_id ?? null;

    const { data: attachment, error: dbError } = await sb
      .from('crm_attachments')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_url: fileUrl,
        storage_path: storagePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        version: 1,
        parent_id: null,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('[upload] DB error', dbError);
      // Try to clean up the uploaded file
      await sb.storage.from('attachments').remove([storagePath]);
      return NextResponse.json(
        { error: `Erro ao registrar arquivo: ${dbError.message}` },
        { status: 500 },
      );
    }

    logger.info('[upload] Arquivo enviado com sucesso', {
      fileName: file.name,
      entityType,
      entityId,
      storagePath,
    });

    return NextResponse.json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    logger.error('[upload] Unexpected error', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
