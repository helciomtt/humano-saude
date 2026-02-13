// ─── N8N Webhook Receiver ────────────────────────────────────
// POST: Receives automation events from N8N workflows
// Events: lead_created, deal_updated, activity_scheduled,
//         send_email, send_whatsapp, notification
// Supports HMAC-SHA256 signature verification.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || '';

// ─── HMAC verification ──────────────────────────────────────
function verifySignature(payload: string, signature: string | null): boolean {
  if (!N8N_WEBHOOK_SECRET) {
    logger.warn('[webhook/n8n] N8N_WEBHOOK_SECRET not set — skipping verification');
    return true; // Allow in dev mode
  }
  if (!signature) return false;

  try {
    const hmac = crypto.createHmac('sha256', N8N_WEBHOOK_SECRET);
    hmac.update(payload);
    const expected = hmac.digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ─── Event types ─────────────────────────────────────────────
type N8NEventType =
  | 'lead_created'
  | 'lead_updated'
  | 'deal_created'
  | 'deal_updated'
  | 'deal_stage_changed'
  | 'activity_scheduled'
  | 'send_email'
  | 'send_whatsapp'
  | 'notification'
  | 'contact_enriched'
  | 'custom';

interface N8NPayload {
  event: N8NEventType;
  data: Record<string, unknown>;
  metadata?: {
    workflow_id?: string;
    execution_id?: string;
    timestamp?: string;
  };
}

// ─── POST handler ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-n8n-signature');

    // Verify signature
    if (N8N_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      logger.error('[webhook/n8n] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: N8NPayload = JSON.parse(rawBody);
    const { event, data, metadata } = payload;

    if (!event) {
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    }

    logger.info(`[webhook/n8n] Event: ${event}`, { workflow_id: metadata?.workflow_id });

    // Audit log
    await supabase.from('webhook_logs').insert({
      source: 'n8n',
      event_type: event,
      payload: payload,
      status: 'received',
      metadata: metadata || {},
    });

    // Route to handler
    let result: { processed: boolean; message: string; id?: string };

    switch (event) {
      case 'lead_created':
        result = await handleLeadCreated(supabase, data);
        break;
      case 'lead_updated':
        result = await handleLeadUpdated(supabase, data);
        break;
      case 'deal_created':
        result = await handleDealCreated(supabase, data);
        break;
      case 'deal_updated':
      case 'deal_stage_changed':
        result = await handleDealUpdated(supabase, data);
        break;
      case 'activity_scheduled':
        result = await handleActivityScheduled(supabase, data);
        break;
      case 'notification':
        result = await handleNotification(supabase, data);
        break;
      case 'contact_enriched':
        result = await handleContactEnriched(supabase, data);
        break;
      case 'send_email':
      case 'send_whatsapp':
        result = await handleSendMessage(supabase, event, data);
        break;
      case 'custom':
        result = { processed: true, message: 'Custom event logged' };
        break;
      default:
        result = { processed: false, message: `Unknown event: ${event}` };
    }

    // Update audit log
    await supabase
      .from('webhook_logs')
      .update({ status: result.processed ? 'processed' : 'failed' })
      .eq('source', 'n8n')
      .eq('event_type', event)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('[webhook/n8n] Error processing webhook', error);
    return NextResponse.json({ status: 'error_logged' });
  }
}

// ─── Handlers ────────────────────────────────────────────────

async function handleLeadCreated(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const leadData = {
    nome: String(data.nome || data.name || 'Lead N8N'),
    whatsapp: String(data.whatsapp || data.phone || ''),
    email: String(data.email || ''),
    origem: String(data.origem || 'n8n_automation'),
    status: String(data.status || 'novo'),
    operadora_interesse: data.operadora_interesse as string | null,
    quantidade_vidas: Number(data.quantidade_vidas) || 1,
    observacoes: String(data.observacoes || data.notes || ''),
    metadata: { source: 'n8n', raw: data },
  };

  const { data: lead, error } = await sb
    .from('insurance_leads')
    .insert(leadData)
    .select('id')
    .single();

  if (error) {
    logger.error('[webhook/n8n] Failed to create lead', error);
    return { processed: false, message: error.message };
  }

  return { processed: true, message: 'Lead created', id: lead.id };
}

async function handleLeadUpdated(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const leadId = String(data.lead_id || data.id || '');
  if (!leadId) return { processed: false, message: 'Missing lead_id' };

  const updates: Record<string, unknown> = {};
  if (data.status) updates.status = data.status;
  if (data.nome) updates.nome = data.nome;
  if (data.whatsapp) updates.whatsapp = data.whatsapp;
  if (data.email) updates.email = data.email;
  if (data.observacoes) updates.observacoes = data.observacoes;
  if (data.operadora_interesse) updates.operadora_interesse = data.operadora_interesse;
  updates.updated_at = new Date().toISOString();

  const { error } = await sb
    .from('insurance_leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    logger.error('[webhook/n8n] Failed to update lead', error);
    return { processed: false, message: error.message };
  }

  return { processed: true, message: 'Lead updated', id: leadId };
}

async function handleDealCreated(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const dealData = {
    titulo: String(data.titulo || data.title || 'Deal N8N'),
    valor: Number(data.valor || data.value || 0),
    stage_id: data.stage_id as string | undefined,
    pipeline_id: data.pipeline_id as string | undefined,
    contact_id: data.contact_id as string | undefined,
    company_id: data.company_id as string | undefined,
    owner_corretor_id: data.owner_corretor_id as string | undefined,
    origem: String(data.origem || 'n8n'),
    observacoes: String(data.observacoes || ''),
  };

  const { data: deal, error } = await sb
    .from('crm_deals')
    .insert(dealData)
    .select('id')
    .single();

  if (error) {
    logger.error('[webhook/n8n] Failed to create deal', error);
    return { processed: false, message: error.message };
  }

  return { processed: true, message: 'Deal created', id: deal.id };
}

async function handleDealUpdated(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const dealId = String(data.deal_id || data.id || '');
  if (!dealId) return { processed: false, message: 'Missing deal_id' };

  const updates: Record<string, unknown> = {};
  if (data.titulo) updates.titulo = data.titulo;
  if (data.valor) updates.valor = Number(data.valor);
  if (data.stage_id) updates.stage_id = data.stage_id;
  if (data.status) updates.status = data.status;
  if (data.observacoes) updates.observacoes = data.observacoes;
  if (data.expected_close_date) updates.expected_close_date = data.expected_close_date;
  updates.updated_at = new Date().toISOString();

  const { error } = await sb
    .from('crm_deals')
    .update(updates)
    .eq('id', dealId);

  if (error) {
    logger.error('[webhook/n8n] Failed to update deal', error);
    return { processed: false, message: error.message };
  }

  // If stage changed, log activity
  if (data.stage_id) {
    await sb.from('crm_activities').insert({
      entity_type: 'deal',
      entity_id: dealId,
      tipo: 'stage_change',
      titulo: 'Estágio alterado via N8N',
      descricao: `Movido para estágio ${data.stage_id}`,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  return { processed: true, message: 'Deal updated', id: dealId };
}

async function handleActivityScheduled(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const activityData = {
    entity_type: String(data.entity_type || 'deal'),
    entity_id: String(data.entity_id || ''),
    tipo: String(data.tipo || data.type || 'task'),
    titulo: String(data.titulo || data.title || 'Atividade N8N'),
    descricao: String(data.descricao || data.description || ''),
    due_date: data.due_date as string | undefined,
    assigned_corretor_id: data.assigned_corretor_id as string | undefined,
    status: 'pending',
  };

  if (!activityData.entity_id) {
    return { processed: false, message: 'Missing entity_id' };
  }

  const { data: activity, error } = await sb
    .from('crm_activities')
    .insert(activityData)
    .select('id')
    .single();

  if (error) {
    logger.error('[webhook/n8n] Failed to schedule activity', error);
    return { processed: false, message: error.message };
  }

  // Notify assigned corretor
  if (activityData.assigned_corretor_id) {
    await sb.from('crm_notifications').insert({
      corretor_id: activityData.assigned_corretor_id,
      tipo: 'activity_assigned',
      titulo: 'Nova atividade atribuída',
      mensagem: activityData.titulo,
      entity_type: activityData.entity_type,
      entity_id: activityData.entity_id,
    });
  }

  return { processed: true, message: 'Activity scheduled', id: activity.id };
}

async function handleNotification(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const corretorId = String(data.corretor_id || '');
  if (!corretorId) return { processed: false, message: 'Missing corretor_id' };

  await sb.from('crm_notifications').insert({
    corretor_id: corretorId,
    tipo: String(data.tipo || 'system'),
    titulo: String(data.titulo || data.title || 'Notificação N8N'),
    mensagem: String(data.mensagem || data.message || ''),
    entity_type: data.entity_type as string | undefined,
    entity_id: data.entity_id as string | undefined,
    action_url: data.action_url as string | undefined,
  });

  return { processed: true, message: 'Notification created' };
}

async function handleContactEnriched(
  sb: ReturnType<typeof createServiceClient>,
  data: Record<string, unknown>,
) {
  const contactId = String(data.contact_id || data.id || '');
  if (!contactId) return { processed: false, message: 'Missing contact_id' };

  const updates: Record<string, unknown> = {};
  if (data.empresa) updates.empresa = data.empresa;
  if (data.cargo) updates.cargo = data.cargo;
  if (data.linkedin_url) updates.linkedin_url = data.linkedin_url;
  if (data.website) updates.website = data.website;
  if (data.tags) updates.tags = data.tags;
  updates.updated_at = new Date().toISOString();

  const { error } = await sb
    .from('crm_contacts')
    .update(updates)
    .eq('id', contactId);

  if (error) {
    logger.error('[webhook/n8n] Failed to enrich contact', error);
    return { processed: false, message: error.message };
  }

  return { processed: true, message: 'Contact enriched', id: contactId };
}

async function handleSendMessage(
  sb: ReturnType<typeof createServiceClient>,
  channel: 'send_email' | 'send_whatsapp',
  data: Record<string, unknown>,
) {
  // Log the message request — actual sending is handled by the email/whatsapp services
  // N8N should call the respective API endpoints directly for sending,
  // this handler logs the intent and creates a CRM activity

  const entityType = String(data.entity_type || 'deal');
  const entityId = String(data.entity_id || '');

  if (entityId) {
    await sb.from('crm_activities').insert({
      entity_type: entityType,
      entity_id: entityId,
      tipo: channel === 'send_email' ? 'email' : 'whatsapp',
      titulo: channel === 'send_email'
        ? `Email: ${data.subject || 'Sem assunto'}`
        : `WhatsApp: ${String(data.message || '').substring(0, 100)}`,
      descricao: channel === 'send_email'
        ? `Para: ${data.to || 'N/A'} — Assunto: ${data.subject || 'N/A'}`
        : `Para: ${data.to || data.phone || 'N/A'}`,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  return {
    processed: true,
    message: `${channel} intent logged. Use /api/send-email or /api/send-whatsapp for actual delivery.`,
  };
}
