// =====================================================
// API: /api/ads/capi — Conversion API (Server-Side)
// Enviar eventos de conversão para Meta
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  sendPurchaseEvent,
  sendLeadEvent,
  sendInitiateCheckoutEvent,
  sendViewContentEvent,
} from '@/lib/meta-capi';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface CapiEventRequest {
  event: 'Purchase' | 'Lead' | 'InitiateCheckout' | 'ViewContent';
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
  orderId?: string;
  leadId?: string;
  sessionId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CapiEventRequest = await request.json();

    if (!body.event) {
      return NextResponse.json(
        { error: 'event é obrigatório (Purchase, Lead, InitiateCheckout, ViewContent)' },
        { status: 400 }
      );
    }

    const clientIp = body.clientIpAddress || request.headers.get('x-forwarded-for') || undefined;
    const userAgent = body.clientUserAgent || request.headers.get('user-agent') || undefined;

    let result;

    switch (body.event) {
      case 'Purchase':
        result = await sendPurchaseEvent({
          orderId: body.orderId || `order_${Date.now()}`,
          email: body.email,
          phone: body.phone,
          totalAmount: body.value || 0,
          currency: body.currency || 'BRL',
          clientIp,
          userAgent,
          fbc: body.fbc,
          fbp: body.fbp,
        });
        break;

      case 'Lead':
        result = await sendLeadEvent({
          leadId: body.leadId || `lead_${Date.now()}`,
          email: body.email,
          phone: body.phone,
          leadValue: body.value,
          clientIp,
          userAgent,
          fbc: body.fbc,
          fbp: body.fbp,
        });
        break;

      case 'InitiateCheckout':
        result = await sendInitiateCheckoutEvent({
          sessionId: body.sessionId || `session_${Date.now()}`,
          email: body.email,
          phone: body.phone,
          cartValue: body.value,
          clientIp,
          userAgent,
          fbc: body.fbc,
          fbp: body.fbp,
        });
        break;

      case 'ViewContent':
        result = await sendViewContentEvent({
          contentId: body.contentId || `content_${Date.now()}`,
          contentName: body.contentName || '',
          clientIp,
          userAgent,
          fbc: body.fbc,
          fbp: body.fbp,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Evento não suportado: ${body.event}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      event: body.event,
      response: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Erro CAPI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
