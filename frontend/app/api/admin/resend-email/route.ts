// ─── Blueprint 14: Force Resend Email API ────────────────────
// POST: Resend an email that was previously sent, using original content or Resend API

import { NextRequest, NextResponse } from 'next/server';
import { getEmailDetail, logEmailToDb, updateEmailLog, injectTrackingPixel } from '@/lib/email-tracking';
import { _getResend } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { emailLogId, forceResend = false } = await request.json();

    if (!emailLogId) {
      return NextResponse.json(
        { success: false, error: 'emailLogId é obrigatório' },
        { status: 400 }
      );
    }

    // Get original email
    const original = await getEmailDetail(emailLogId);

    if (!original) {
      return NextResponse.json(
        { success: false, error: 'Email original não encontrado' },
        { status: 404 }
      );
    }

    // Check if email can be resent
    if (!forceResend && ['queued', 'sent'].includes(original.status)) {
      return NextResponse.json(
        { success: false, error: 'Email ainda está em processamento. Use forceResend=true para forçar.' },
        { status: 409 }
      );
    }

    if (!original.html_content) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo HTML do email original não disponível para reenvio' },
        { status: 400 }
      );
    }

    // Create a new log entry for the resend
    const newLogId = await logEmailToDb({
      to: original.to_email,
      subject: original.subject,
      html: original.html_content,
      from: original.from_email,
      templateName: original.template_name || undefined,
      emailType: original.email_type as 'transactional' | 'marketing' | 'system',
      category: original.category || undefined,
      tags: [...(original.tags || []), 'resent'],
      triggeredBy: 'admin:resend',
      referenceType: 'email_resend',
      referenceId: emailLogId,
      metadata: { original_email_id: emailLogId, original_resend_id: original.resend_id },
      saveHtmlContent: true,
      status: 'queued',
    });

    // Inject new tracking pixel if we have a log ID
    let html = original.html_content;
    if (newLogId) {
      // Remove old tracking pixel if present
      html = html.replace(/<img[^>]*\/api\/track\/email\/[^>]*>/gi, '');
      html = injectTrackingPixel(html, newLogId);
    }

    // Send via Resend
    const resend = _getResend();
    const { data, error } = await resend.emails.send({
      from: original.from_email,
      to: original.to_email,
      subject: original.subject,
      html,
    });

    if (error) {
      logger.error('[resend-email] Resend API error:', error);
      if (newLogId) {
        await updateEmailLog(newLogId, {
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        });
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Update the new log with Resend ID
    if (newLogId && data?.id) {
      await updateEmailLog(newLogId, {
        resend_id: data.id,
        status: 'sent',
        html_content: html,
      });
    }

    logger.info('[resend-email] Email resent', { subject: original.subject, to: original.to_email, id: data?.id });

    return NextResponse.json({
      success: true,
      data: {
        newEmailLogId: newLogId,
        resendId: data?.id,
        originalEmailLogId: emailLogId,
      },
    });
  } catch (err) {
    logger.error('[resend-email] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao reenviar email' },
      { status: 500 }
    );
  }
}
