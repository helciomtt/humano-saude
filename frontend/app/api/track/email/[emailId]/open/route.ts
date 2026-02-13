// ─── Blueprint 14: Email Open Tracking Pixel ─────────────────
// Returns a 1x1 transparent PNG and logs the "opened" event.
// URL: /api/track/email/[emailId]/open

import { NextRequest, NextResponse } from 'next/server';
import { recordEmailEvent } from '@/lib/email-tracking';
import { logger } from '@/lib/logger';

// 1x1 transparent PNG (68 bytes)
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params;

  // Always return the pixel image first (don't block on DB)
  const response = new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(TRANSPARENT_PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  // Record the open event asynchronously (fire-and-forget)
  if (emailId && emailId !== 'undefined') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Non-blocking: record event in background
    recordEmailEvent({
      emailLogId: emailId,
      eventType: 'opened',
      ipAddress: ip,
      userAgent,
      occurredAt: new Date().toISOString(),
    }).catch((err) => {
      logger.error('[track/email] Failed to record open event:', err);
    });
  }

  return response;
}
