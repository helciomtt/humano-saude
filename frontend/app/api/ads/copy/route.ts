// =====================================================
// API: /api/ads/copy — Geração de Copy via IA
// Gera copy para anúncios usando GPT-4o
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAdCopy, generateCopiesForImages } from '@/lib/ads/copy-generator';
import { generateCopywritingPrompt } from '@/lib/ads/prompt-generator';
import type { CampaignObjectiveKey, FunnelStage } from '@/lib/ads/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface CopyRequest {
  objective?: CampaignObjectiveKey;
  audience?: string;
  imageUrl?: string;
  imageUrls?: string[];
  userPrompt?: string;
  funnelStage?: FunnelStage;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada' },
        { status: 503 }
      );
    }

    const body: CopyRequest = await request.json();

    const objective: CampaignObjectiveKey = body.objective || 'CONVERSAO';
    const audience = body.audience || 'Empresas PME';

    // Se fornecido userPrompt, usar o sistema de 2 camadas
    if (body.userPrompt) {
      const result = await generateCopywritingPrompt(body.userPrompt);

      return NextResponse.json({
        success: true,
        type: 'prompt_generator',
        data: result,
      });
    }

    // Se fornecidas múltiplas imagens, gerar copy em batch
    if (body.imageUrls?.length) {
      const copies = await generateCopiesForImages(
        body.imageUrls,
        objective,
        audience
      );

      return NextResponse.json({
        success: true,
        type: 'batch',
        total: copies.length,
        copies,
      });
    }

    // Geração única
    const copy = await generateAdCopy(objective, audience, body.imageUrl);

    return NextResponse.json({
      success: true,
      type: 'single',
      copy,
    });
  } catch (error) {
    logger.error('❌ Erro na geração de copy:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
