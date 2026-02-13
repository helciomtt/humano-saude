// ─── Blueprint 14: Email Tracking Service ────────────────────
// Central service for logging emails to DB, injecting tracking pixels,
// and syncing with Resend webhooks.
// Separated from email.ts to keep existing functions untouched.

import { createServiceClient } from '@/lib/supabase';
import type {
  SendEmailOptions,
  SendEmailResult,
  EmailLog,
  EmailEvent,
  EmailStats,
  ListEmailsParams,
  ListEmailsResponse,
  ParsedUserAgent,
  DeviceType,
} from '@/lib/types/email';
import { logger } from '@/lib/logger';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

// ─── Inject tracking pixel into HTML ─────────────────────────
export function injectTrackingPixel(html: string, emailLogId: string): string {
  const pixelUrl = `${BASE_URL}/api/track/email/${emailLogId}/open`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;

  // Insert before closing </body> or at end of HTML
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
}

// ─── Log email to database ───────────────────────────────────
export async function logEmailToDb(
  options: SendEmailOptions & { resendId?: string; status?: string; errorMessage?: string }
): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const toEmail = Array.isArray(options.to) ? options.to[0] : options.to;

    const record = {
      resend_id: options.resendId || null,
      from_email: options.from || 'Humano Saúde <noreply@humanosaude.com.br>',
      to_email: toEmail,
      cc_emails: options.cc || null,
      bcc_emails: options.bcc || null,
      reply_to: options.replyTo || null,
      subject: options.subject,
      template_name: options.templateName || null,
      template_version: options.templateVersion || '1.0',
      html_content: options.saveHtmlContent !== false ? options.html : null,
      text_content: options.text || null,
      email_type: options.emailType || 'transactional',
      category: options.category || null,
      tags: options.tags || null,
      status: options.status || (options.resendId ? 'sent' : 'queued'),
      triggered_by: options.triggeredBy || 'system',
      reference_type: options.referenceType || null,
      reference_id: options.referenceId || null,
      metadata: options.metadata || {},
    };

    const { data, error } = await supabase
      .from('email_logs')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      logger.error('[email-tracking] Failed to log email:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    logger.error('[email-tracking] Unexpected error logging email:', err);
    return null;
  }
}

// ─── Update email log after send ─────────────────────────────
export async function updateEmailLog(
  logId: string,
  updates: Partial<Pick<EmailLog, 'resend_id' | 'status' | 'error_message' | 'error_code' | 'html_content' | 'failed_at'>>
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase
      .from('email_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', logId);
  } catch (err) {
    logger.error('[email-tracking] Failed to update email log:', err);
  }
}

// ─── Record email event ──────────────────────────────────────
export async function recordEmailEvent(event: {
  emailLogId: string;
  resendId?: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  clickUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  bounceType?: string;
  bounceMessage?: string;
  occurredAt?: string;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    const parsed = event.userAgent ? parseUserAgent(event.userAgent) : null;

    await supabase.from('email_events').insert({
      email_log_id: event.emailLogId,
      resend_id: event.resendId || null,
      event_type: event.eventType,
      event_data: event.eventData || {},
      click_url: event.clickUrl || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      device_type: parsed?.device || null,
      os: parsed?.os || null,
      browser: parsed?.browser || null,
      bounce_type: event.bounceType || null,
      bounce_message: event.bounceMessage || null,
      occurred_at: event.occurredAt || new Date().toISOString(),
      received_at: new Date().toISOString(),
    });

    // Update parent email_log status/counters
    await updateEmailLogFromEvent(event.emailLogId, event.eventType, event.bounceType);
  } catch (err) {
    logger.error('[email-tracking] Failed to record event:', err);
  }
}

// ─── Update email_log from event ─────────────────────────────
async function updateEmailLogFromEvent(
  emailLogId: string,
  eventType: string,
  bounceType?: string
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      last_event: eventType,
      last_event_at: now,
      updated_at: now,
    };

    switch (eventType) {
      case 'delivered':
        updates.status = 'delivered';
        updates.delivered_at = now;
        break;
      case 'opened': {
        // Increment opened_count, set first_opened_at if first time
        const { data: existing } = await supabase
          .from('email_logs')
          .select('opened_count, first_opened_at')
          .eq('id', emailLogId)
          .single();

        updates.status = 'opened';
        updates.opened_count = (existing?.opened_count || 0) + 1;
        if (!existing?.first_opened_at) {
          updates.first_opened_at = now;
        }
        break;
      }
      case 'clicked': {
        const { data: existing2 } = await supabase
          .from('email_logs')
          .select('clicked_count, first_clicked_at')
          .eq('id', emailLogId)
          .single();

        updates.clicked_count = (existing2?.clicked_count || 0) + 1;
        if (!existing2?.first_clicked_at) {
          updates.first_clicked_at = now;
        }
        break;
      }
      case 'bounced':
        updates.status = 'bounced';
        updates.bounced_at = now;
        if (bounceType) updates.bounce_type = bounceType;
        break;
      case 'complained':
        updates.status = 'complained';
        updates.complained_at = now;
        break;
      case 'sent':
        updates.status = 'sent';
        break;
    }

    await supabase.from('email_logs').update(updates).eq('id', emailLogId);
  } catch (err) {
    logger.error('[email-tracking] Failed to update log from event:', err);
  }
}

// ─── Get email stats ─────────────────────────────────────────
export async function getEmailStats(): Promise<EmailStats | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('email_stats')
      .select('*')
      .single();

    if (error) {
      logger.error('[email-tracking] Failed to get stats:', error.message);
      return null;
    }

    return data as EmailStats;
  } catch (err) {
    logger.error('[email-tracking] Unexpected error getting stats:', err);
    return null;
  }
}

// ─── List emails with filters ────────────────────────────────
export async function listEmails(params: ListEmailsParams): Promise<ListEmailsResponse> {
  const supabase = createServiceClient();
  const {
    page = 1,
    limit = 20,
    status,
    emailType,
    category,
    templateName,
    search,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const offset = (page - 1) * limit;

  let query = supabase
    .from('email_logs')
    .select('*', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (emailType) query = query.eq('email_type', emailType);
  if (category) query = query.eq('category', category);
  if (templateName) query = query.eq('template_name', templateName);
  if (search) {
    query = query.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%`);
  }
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error('[email-tracking] Failed to list emails:', error.message);
    return { emails: [], total: 0, page, limit, totalPages: 0 };
  }

  const total = count || 0;

  return {
    emails: (data || []) as EmailLog[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Get email detail ────────────────────────────────────────
export async function getEmailDetail(emailLogId: string): Promise<EmailLog | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .single();

    if (error) return null;
    return data as EmailLog;
  } catch {
    return null;
  }
}

// ─── Get email events timeline ───────────────────────────────
export async function getEmailEvents(emailLogId: string): Promise<EmailEvent[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('email_events')
      .select('*')
      .eq('email_log_id', emailLogId)
      .order('occurred_at', { ascending: true });

    if (error) return [];
    return (data || []) as EmailEvent[];
  } catch {
    return [];
  }
}

// ─── Find email_log by Resend ID ─────────────────────────────
export async function findEmailByResendId(resendId: string): Promise<EmailLog | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('resend_id', resendId)
      .single();

    if (error) return null;
    return data as EmailLog;
  } catch {
    return null;
  }
}

// ─── Parse User Agent ────────────────────────────────────────
export function parseUserAgent(ua: string): ParsedUserAgent {
  const result: ParsedUserAgent = {
    device: 'unknown',
    os: 'Unknown',
    browser: 'Unknown',
  };

  if (!ua) return result;

  // Device detection
  if (/tablet|ipad/i.test(ua)) {
    result.device = 'tablet';
  } else if (/mobile|iphone|android.*mobile/i.test(ua)) {
    result.device = 'mobile';
  } else {
    result.device = 'desktop';
  }

  // OS detection
  if (/windows/i.test(ua)) result.os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) result.os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) result.os = 'iOS';
  else if (/android/i.test(ua)) result.os = 'Android';
  else if (/linux/i.test(ua)) result.os = 'Linux';

  // Browser detection
  if (/edg\//i.test(ua)) result.browser = 'Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) result.browser = 'Opera';
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) result.browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) result.browser = 'Safari';
  else if (/firefox/i.test(ua)) result.browser = 'Firefox';
  else if (/thunderbird/i.test(ua)) result.browser = 'Thunderbird';

  return result;
}

// ─── Get status badge color ──────────────────────────────────
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    opened: 'bg-green-500/20 text-green-400',
    clicked: 'bg-[#D4AF37]/20 text-[#D4AF37]',
    bounced: 'bg-red-500/20 text-red-400',
    complained: 'bg-orange-500/20 text-orange-400',
    failed: 'bg-red-500/20 text-red-400',
  };
  return colors[status] || colors.queued;
}

// ─── Get event icon ──────────────────────────────────────────
export function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    sent: '📤',
    delivered: '✅',
    delivery_delayed: '⏳',
    opened: '👁️',
    clicked: '🔗',
    bounced: '🔴',
    complained: '⚠️',
    unsubscribed: '🚫',
  };
  return icons[eventType] || '📧';
}
