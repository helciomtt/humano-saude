// =====================================================
// API: /api/ads/audiences — Gestão de Públicos
// CRUD de Custom Audiences na Meta
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  listCustomAudiences,
  createCustomAudience,
  createWebsiteAudience,
  createLookalikeAudience,
  createDefaultAudiences,
  AUDIENCE_TEMPLATES,
  getTemplatesByFunnel,
} from '@/lib/meta-audiences';
import { isMetaConfigured } from '@/lib/ads/meta-client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET — Listar audiences + templates
export async function GET(request: NextRequest) {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const funnel = searchParams.get('funnel') as 'TOPO' | 'MEIO' | 'FUNDO' | null;

    const [audiences] = await Promise.all([
      listCustomAudiences(),
    ]);

    const templates = funnel
      ? getTemplatesByFunnel(funnel)
      : AUDIENCE_TEMPLATES;

    return NextResponse.json({
      success: true,
      audiences,
      templates,
      total: audiences.length,
    });
  } catch (error) {
    logger.error('❌ Erro ao listar audiences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// POST — Criar audience
export async function POST(request: NextRequest) {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type } = body as { type: string };

    // Setup: criar todas as audiences padrão
    if (type === 'setup') {
      const result = await createDefaultAudiences();
      return NextResponse.json({
        success: true,
        type: 'setup',
        ...result,
      });
    }

    // Website audience
    if (type === 'website') {
      const { name, retentionDays, urlContains } = body;
      const result = await createWebsiteAudience(name, retentionDays, urlContains);
      if (!result) {
        return NextResponse.json(
          { error: 'Falha ao criar Website Audience' },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, audience: result });
    }

    // Lookalike audience
    if (type === 'lookalike') {
      const { originAudienceId, name, ratio } = body;
      if (!originAudienceId) {
        return NextResponse.json(
          { error: 'originAudienceId é obrigatório' },
          { status: 400 }
        );
      }
      const result = await createLookalikeAudience(originAudienceId, name, ratio);
      if (!result) {
        return NextResponse.json(
          { error: 'Falha ao criar Lookalike Audience' },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, audience: result });
    }

    // Custom audience genérica
    const result = await createCustomAudience(body);
    if (!result) {
      return NextResponse.json(
        { error: 'Falha ao criar Custom Audience' },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, audience: result });
  } catch (error) {
    logger.error('❌ Erro ao criar audience:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
