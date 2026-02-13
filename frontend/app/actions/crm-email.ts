'use server';

// ─── CRM Email Actions ──────────────────────────────────────
// Server actions for sending emails from CRM context (deals, contacts)
// with tracking, history, and template management.
// Integrates with existing lib/email.ts (Resend) and lib/email-tracking.ts.

import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase';
import { logEmailToDb, updateEmailLog, injectTrackingPixel } from '@/lib/email-tracking';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

const PORTAL = '/portal-interno-hks-2026';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Humano Saúde <noreply@humanosaude.com.br>';

// ─── Types ───────────────────────────────────────────────────

interface SendCrmEmailInput {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  // CRM context
  dealId?: string;
  contactId?: string;
  corretorId?: string;
  templateId?: string;
}

interface CrmEmailHistoryItem {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  opened_count: number;
  clicked_count: number;
  created_at: string;
  template_name: string | null;
}

interface MessageTemplate {
  id: string;
  nome: string;
  tipo: 'email' | 'whatsapp';
  assunto: string | null;
  conteudo: string;
  variaveis: string[];
  categoria: string | null;
  ativo: boolean;
  created_at: string;
}

// ─── Send CRM Email ─────────────────────────────────────────

export async function sendCrmEmail(input: SendCrmEmailInput) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY não configurada' };
    }

    const sb = createServiceClient();

    // 1. Log email intent to DB (pre-send)
    const logId = await logEmailToDb({
      to: input.to,
      subject: input.subject,
      html: input.html,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
      emailType: 'transactional',
      category: 'crm',
      templateName: input.templateId || undefined,
      triggeredBy: input.corretorId || 'crm_system',
      referenceType: input.dealId ? 'deal' : input.contactId ? 'contact' : undefined,
      referenceId: input.dealId || input.contactId || undefined,
      metadata: {
        deal_id: input.dealId,
        contact_id: input.contactId,
        corretor_id: input.corretorId,
      },
    });

    // 2. Inject tracking pixel
    let htmlToSend = input.html;
    if (logId) {
      htmlToSend = injectTrackingPixel(input.html, logId);
    }

    // 3. Send via Resend
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [input.to],
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
      subject: input.subject,
      html: htmlToSend,
    });

    if (error) {
      logger.error('[crm-email] Resend error:', error);
      if (logId) {
        await updateEmailLog(logId, {
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        });
      }
      return { success: false, error: error.message };
    }

    // 4. Update log with Resend ID
    if (logId && data?.id) {
      await updateEmailLog(logId, {
        resend_id: data.id,
        status: 'sent',
      });
    }

    // 5. Log CRM activity
    if (input.dealId) {
      await sb.from('crm_activities').insert({
        entity_type: 'deal',
        entity_id: input.dealId,
        tipo: 'email',
        titulo: `Email enviado: ${input.subject}`,
        descricao: `Para: ${input.to}`,
        corretor_id: input.corretorId || null,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    }

    logger.info('[crm-email] Sent', { to: input.to, subject: input.subject, id: data?.id });
    revalidatePath(`${PORTAL}/crm`);

    return { success: true, emailId: data?.id, logId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    logger.error('[crm-email] sendCrmEmail failed:', msg);
    return { success: false, error: msg };
  }
}

// ─── Get CRM Email History ──────────────────────────────────

export async function getCrmEmailHistory(
  entityType: 'deal' | 'contact',
  entityId: string,
  limit = 20,
) {
  try {
    const sb = createServiceClient();

    const { data, error } = await sb
      .from('email_logs')
      .select('id, to_email, subject, status, opened_count, clicked_count, created_at, template_name')
      .eq('reference_type', entityType)
      .eq('reference_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[crm-email] getCrmEmailHistory error:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: (data || []) as CrmEmailHistoryItem[] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg, data: [] };
  }
}

// ─── Get Message Templates ──────────────────────────────────

export async function getMessageTemplates(tipo?: 'email' | 'whatsapp') {
  try {
    const sb = createServiceClient();

    let query = sb
      .from('message_templates')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query;

    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { success: true, data: [] as MessageTemplate[] };
      }
      logger.error('[crm-email] getMessageTemplates error:', error);
      return { success: false, error: error.message, data: [] as MessageTemplate[] };
    }

    return { success: true, data: (data || []) as MessageTemplate[] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg, data: [] as MessageTemplate[] };
  }
}

// ─── Create/Update Message Template ─────────────────────────

export async function upsertMessageTemplate(input: {
  id?: string;
  nome: string;
  tipo: 'email' | 'whatsapp';
  assunto?: string;
  conteudo: string;
  variaveis?: string[];
  categoria?: string;
}) {
  try {
    const sb = createServiceClient();

    const record = {
      nome: input.nome,
      tipo: input.tipo,
      assunto: input.assunto || null,
      conteudo: input.conteudo,
      variaveis: input.variaveis || [],
      categoria: input.categoria || null,
      ativo: true,
    };

    let result;
    if (input.id) {
      const { data, error } = await sb
        .from('message_templates')
        .update(record)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await sb
        .from('message_templates')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    revalidatePath(`${PORTAL}/configuracoes`);
    return { success: true, data: result };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    logger.error('[crm-email] upsertMessageTemplate failed:', msg);
    return { success: false, error: msg };
  }
}

// ─── Delete Message Template ────────────────────────────────

export async function deleteMessageTemplate(id: string) {
  try {
    const sb = createServiceClient();

    const { error } = await sb
      .from('message_templates')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`${PORTAL}/configuracoes`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ─── Apply Template Variables ───────────────────────────────

export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
