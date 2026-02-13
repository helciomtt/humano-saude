// =====================================================
// META CAPI — Conversion API (Server-Side)
// Recupera 20-30% das conversões perdidas por ad blockers
// =====================================================

import { createHash } from 'crypto';

const META_API_VERSION = 'v19.0';

// =====================================================
// HASH SHA256 (padrão CAPI)
// =====================================================

function hashSHA256(value: string): string {
  return createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// =====================================================
// TIPOS
// =====================================================

interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface CapiEventParams {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
}

interface CapiResponse {
  events_received: number;
  messages: string[];
  fbtrace_id: string;
}

// =====================================================
// ENVIAR EVENTO GENÉRICO
// =====================================================

export async function sendMetaConversionEvent(
  params: CapiEventParams
): Promise<CapiResponse> {
  const pixelId = process.env.META_PIXEL_ID || process.env.FACEBOOK_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    throw new Error('META_PIXEL_ID e META_ACCESS_TOKEN são necessários para CAPI');
  }

  // Construir user_data com hashing
  const userData: Record<string, unknown> = {};

  if (params.userData.email) userData.em = [hashSHA256(params.userData.email)];
  if (params.userData.phone) userData.ph = [hashSHA256(params.userData.phone)];
  if (params.userData.firstName) userData.fn = [hashSHA256(params.userData.firstName)];
  if (params.userData.lastName) userData.ln = [hashSHA256(params.userData.lastName)];
  if (params.userData.city) userData.ct = [hashSHA256(params.userData.city)];
  if (params.userData.state) userData.st = [hashSHA256(params.userData.state)];
  if (params.userData.country) userData.country = [hashSHA256(params.userData.country)];
  if (params.userData.zip) userData.zp = [hashSHA256(params.userData.zip)];
  if (params.userData.clientIpAddress) userData.client_ip_address = params.userData.clientIpAddress;
  if (params.userData.clientUserAgent) userData.client_user_agent = params.userData.clientUserAgent;
  if (params.userData.fbc) userData.fbc = params.userData.fbc;
  if (params.userData.fbp) userData.fbp = params.userData.fbp;

  const eventData: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: 'website',
    user_data: userData,
  };

  if (params.customData) {
    eventData.custom_data = params.customData;
  }

  const body: Record<string, unknown> = {
    data: [eventData],
    access_token: accessToken,
  };

  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `CAPI Error: ${response.status}`);
  }

  return data as CapiResponse;
}

// =====================================================
// EVENTOS DE ALTO NÍVEL
// =====================================================

export async function sendPurchaseEvent(params: {
  orderId: string;
  email?: string;
  phone?: string;
  totalAmount: number;
  currency?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}): Promise<CapiResponse> {
  return sendMetaConversionEvent({
    eventName: 'Purchase',
    eventId: `purchase_${params.orderId}_${Date.now()}`,
    eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br',
    userData: {
      email: params.email,
      phone: params.phone,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
      country: 'br',
    },
    customData: {
      value: params.totalAmount,
      currency: params.currency || 'BRL',
      content_type: 'product',
      content_ids: [params.orderId],
    },
  });
}

export async function sendLeadEvent(params: {
  leadId: string;
  email?: string;
  phone?: string;
  leadValue?: number;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}): Promise<CapiResponse> {
  return sendMetaConversionEvent({
    eventName: 'Lead',
    eventId: `lead_${params.leadId}_${Date.now()}`,
    eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br',
    userData: {
      email: params.email,
      phone: params.phone,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
      country: 'br',
    },
    customData: {
      value: params.leadValue || 0,
      currency: 'BRL',
      content_category: 'insurance_lead',
      content_ids: [params.leadId],
    },
  });
}

export async function sendInitiateCheckoutEvent(params: {
  sessionId: string;
  email?: string;
  phone?: string;
  cartValue?: number;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}): Promise<CapiResponse> {
  return sendMetaConversionEvent({
    eventName: 'InitiateCheckout',
    eventId: `checkout_${params.sessionId}_${Date.now()}`,
    eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br',
    userData: {
      email: params.email,
      phone: params.phone,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
      country: 'br',
    },
    customData: {
      value: params.cartValue || 0,
      currency: 'BRL',
      content_category: 'cotacao',
    },
  });
}

export async function sendViewContentEvent(params: {
  contentId: string;
  contentName: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}): Promise<CapiResponse> {
  return sendMetaConversionEvent({
    eventName: 'ViewContent',
    eventId: `view_${params.contentId}_${Date.now()}`,
    eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br',
    userData: {
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
      country: 'br',
    },
    customData: {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: 'page',
    },
  });
}
