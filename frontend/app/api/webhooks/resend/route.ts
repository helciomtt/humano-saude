// ─── Blueprint 14: Resend Webhook Handler ────────────────────
// POST: Receives Resend webhook events (delivered, opened, clicked, bounced, complained)
// HEAD: Required by Resend for webhook verification

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  findEmailByResendId,
  recordEmailEvent,
} from '@/lib/email-tracking';
import type { ResendWebhookPayload } from '@/lib/types/email';
import { logger } from '@/lib/logger';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';

// ─── Verify Resend webhook signature ─────────────────────────
function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    // If no secret configured, skip verification (dev mode)
    logger.warn('[webhook/resend] No RESEND_WEBHOOK_SECRET — skipping signature verification');
    return !WEBHOOK_SECRET; // Allow if no secret set (dev), reject if secret set but no signature
  }

  try {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ─── Map Resend event type to simple event type ──────────────
function mapEventType(resendType: string): string {
  const map: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'delivery_delayed',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
  };
  return map[resendType] || resendType;
}

// ─── HEAD: Resend webhook verification ───────────────────────
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// ─── POST: Process webhook events ────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('resend-signature') || request.headers.get('svix-signature');

    // Verify signature
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      logger.error('[webhook/resend] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: ResendWebhookPayload = JSON.parse(rawBody);
    const { type, data } = payload;

    if (!type || !data?.email_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const eventType = mapEventType(type);
    const resendId = data.email_id;

    logger.info(`[webhook/resend] Event: ${eventType} for email ${resendId}`);

    // Find the email_log by Resend ID
    const emailLog = await findEmailByResendId(resendId);

    if (!emailLog) {
      // Email not tracked in our system — could be from direct Resend API usage
      logger.warn(`[webhook/resend] Email not found for resend_id: ${resendId}`);
      // Still return 200 to acknowledge the webhook
      return NextResponse.json({ received: true, tracked: false });
    }

    // Record the event
    await recordEmailEvent({
      emailLogId: emailLog.id,
      resendId,
      eventType,
      eventData: data as unknown as Record<string, unknown>,
      clickUrl: data.click?.link || undefined,
      ipAddress: data.click?.ipAddress || data.open?.ipAddress || undefined,
      userAgent: data.click?.userAgent || data.open?.userAgent || undefined,
      bounceType: data.bounce?.type || undefined,
      bounceMessage: data.bounce?.message || undefined,
      occurredAt: data.click?.timestamp || data.open?.timestamp || payload.created_at,
    });

    return NextResponse.json({ received: true, tracked: true, emailLogId: emailLog.id });
  } catch (err) {
    logger.error('[webhook/resend] Error processing webhook:', err);
    // Always return 200 to prevent Resend from retrying
    return NextResponse.json({ received: true, error: 'Processing error' }, { status: 200 });
  }
}
