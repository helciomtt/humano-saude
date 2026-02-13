// =====================================================
// API: /api/ads/rules — Regras Automáticas Meta
// Gerencia regras no Ad Rules Library da Meta
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  createDefaultRules,
  listAdRules,
  deleteAdRule,
} from '@/lib/ads/ad-rules';
import { isMetaConfigured, getMetaConfig } from '@/lib/ads/meta-client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET — Listar regras existentes
export async function GET() {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const config = getMetaConfig();
    const rules = await listAdRules(config.adAccountId, config.accessToken);

    return NextResponse.json({
      success: true,
      rules,
      total: rules.length,
    });
  } catch (error) {
    logger.error('❌ Erro ao listar regras:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// POST — Criar regras padrão HSA
export async function POST() {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const config = getMetaConfig();
    const results = await createDefaultRules(config.adAccountId);

    return NextResponse.json({
      success: true,
      type: 'default_rules',
      ...results,
    });
  } catch (error) {
    logger.error('❌ Erro ao criar regras:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// DELETE — Remover regra específica
export async function DELETE(request: NextRequest) {
  try {
    if (!isMetaConfigured()) {
      return NextResponse.json(
        { error: 'Meta Ads não configurado' },
        { status: 503 }
      );
    }

    const { ruleId } = await request.json();
    if (!ruleId) {
      return NextResponse.json(
        { error: 'ruleId é obrigatório' },
        { status: 400 }
      );
    }

    const config = getMetaConfig();
    await deleteAdRule(ruleId, config.accessToken);

    return NextResponse.json({ success: true, ruleId });
  } catch (error) {
    logger.error('❌ Erro ao deletar regra:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
