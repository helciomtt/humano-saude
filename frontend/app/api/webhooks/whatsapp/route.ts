import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

const WA_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'humano_saude_wa_2026';

/**
 * GET /api/webhooks/whatsapp
 * Verificação do webhook pela Meta (WhatsApp Business API)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verificado');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Recebe mensagens e status do WhatsApp Business API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log para auditoria
    await supabase.from('webhook_logs').insert({
      source: 'whatsapp',
      event_type: 'message',
      payload: body,
      status: 'received',
    });

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // Processar mensagens recebidas
        const messages = value.messages || [];
        for (const msg of messages) {
          await processIncomingMessage(msg, value.metadata);
        }

        // Processar status de mensagens enviadas
        const statuses = value.statuses || [];
        for (const status of statuses) {
          await processMessageStatus(status);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error('Erro no webhook WhatsApp', error);
    return NextResponse.json({ status: 'error_logged' });
  }
}

/**
 * Processa mensagem recebida do WhatsApp
 */
async function processIncomingMessage(
  msg: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  try {
    const phone = String(msg.from || '');
    const messageId = String(msg.id || '');
    const timestamp = msg.timestamp
      ? new Date(Number(msg.timestamp) * 1000).toISOString()
      : new Date().toISOString();

    // Extrair conteúdo baseado no tipo
    let content = '';
    let mediaUrl: string | null = null;
    const type = String(msg.type || 'text');

    switch (type) {
      case 'text':
        content = String((msg.text as Record<string, unknown>)?.body || '');
        break;
      case 'image':
      case 'document':
      case 'video':
      case 'audio':
        content = `[${type}]`;
        mediaUrl = String((msg[type] as Record<string, unknown>)?.id || '');
        break;
      case 'reaction':
        content = `[reação: ${(msg.reaction as Record<string, unknown>)?.emoji || ''}]`;
        break;
      default:
        content = `[${type}]`;
    }

    // Upsert contato
    await supabase.from('whatsapp_contacts').upsert(
      {
        phone,
        name: phone,
        last_message_at: timestamp,
        unread_count: 1,
      },
      { onConflict: 'phone' }
    );

    // Salvar mensagem
    const { error } = await supabase.from('whatsapp_messages').insert({
      contact_phone: phone,
      wa_message_id: messageId,
      direction: 'inbound',
      type,
      content,
      media_url: mediaUrl,
      status: 'received',
      sent_at: timestamp,
    });

    if (error) {
      logger.error('Erro ao salvar mensagem WhatsApp', error, { phone });
    }
  } catch (error) {
    logger.error('Erro processando mensagem WA', error);
  }
}

/**
 * Processa atualização de status de mensagem enviada
 */
async function processMessageStatus(status: Record<string, unknown>) {
  try {
    const waMessageId = String(status.id || '');
    const newStatus = String(status.status || '');

    if (!waMessageId || !newStatus) return;

    const { error } = await supabase
      .from('whatsapp_messages')
      .update({
        status: newStatus, // sent, delivered, read, failed
        ...(newStatus === 'delivered'
          ? { delivered_at: new Date().toISOString() }
          : {}),
        ...(newStatus === 'read'
          ? { read_at: new Date().toISOString() }
          : {}),
      })
      .eq('wa_message_id', waMessageId);

    if (error) {
      logger.error('Erro ao atualizar status mensagem WA', error, { wa_message_id: waMessageId });
    }
  } catch (error) {
    logger.error('Erro processando status WA', error);
  }
}
