import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'humano_saude_meta_2026';

/**
 * GET /api/webhooks/meta
 * Verificação do webhook pelo Meta (Facebook/Instagram)
 * Meta envia um GET com hub.challenge para confirmar o endpoint
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    logger.info('Meta webhook verificado com sucesso');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/meta
 * Recebe eventos do Meta Ads / Instagram / Facebook
 * Eventos: lead_gen, ad_insights, page_post_engagement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log webhook para auditoria
    await supabase.from('webhook_logs').insert({
      source: 'meta_ads',
      event_type: body.object || 'unknown',
      payload: body,
      status: 'received',
    });

    // Processar entradas
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const field = change.field;
        const value = change.value;

        switch (field) {
          case 'leadgen': {
            // Lead gerado via formulário do Facebook
            await processLeadGen(value);
            break;
          }

          case 'ad_insights': {
            // Atualização de métricas de campanha
            await processAdInsights(value);
            break;
          }

          default:
            logger.debug('Meta webhook field não processado', { field });
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error('Erro no webhook Meta', error);

    // Sempre retornar 200 para o Meta não reenviar
    return NextResponse.json({ status: 'error_logged' });
  }
}

/**
 * Processa lead gerado via Facebook Lead Ads
 */
async function processLeadGen(value: Record<string, unknown>) {
  try {
    const leadData = {
      nome: String(value.full_name || value.name || 'Lead Facebook'),
      whatsapp: String(value.phone_number || ''),
      email: String(value.email || ''),
      origem: 'facebook_lead_ads',
      status: 'novo',
      operadora_interesse: null,
      valor_plano_atual: null,
      quantidade_vidas: 1,
      observacoes: `Lead via Facebook Ads - Form ID: ${value.form_id || 'N/A'}`,
      metadata: value,
    };

    const { error } = await supabase
      .from('insurance_leads')
      .insert(leadData);

    if (error) {
      logger.error('Erro ao salvar lead do Facebook', error);
    } else {
      logger.info('Lead do Facebook salvo com sucesso', { form_id: value.form_id });
    }
  } catch (error) {
    logger.error('Erro processando leadgen', error);
  }
}

/**
 * Processa atualização de métricas de anúncio
 */
async function processAdInsights(value: Record<string, unknown>) {
  try {
    const campaignId = String(value.campaign_id || '');
    if (!campaignId) return;

    const { error } = await supabase
      .from('ads_campaigns')
      .update({
        impressions: Number(value.impressions) || 0,
        clicks: Number(value.clicks) || 0,
        spend: Number(value.spend) || 0,
        conversions: Number(value.conversions) || 0,
        ctr: Number(value.ctr) || 0,
        cpc: Number(value.cpc) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId);

    if (error) {
      logger.error('Erro ao atualizar métricas da campanha', error, { campaign_id: campaignId });
    }
  } catch (error) {
    logger.error('Erro processando ad_insights', error);
  }
}
