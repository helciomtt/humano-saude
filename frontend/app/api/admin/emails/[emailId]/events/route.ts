// ─── Blueprint 14: Email Events Timeline API ─────────────────
// GET: Returns all events for a specific email (timeline)

import { NextRequest, NextResponse } from 'next/server';
import { getEmailEvents } from '@/lib/email-tracking';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;

    if (!emailId) {
      return NextResponse.json(
        { success: false, error: 'emailId é obrigatório' },
        { status: 400 }
      );
    }

    const events = await getEmailEvents(emailId);

    return NextResponse.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (err) {
    logger.error('[api/admin/emails/events] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar eventos' },
      { status: 500 }
    );
  }
}
