// =====================================================
// ACTIVE CAMPAIGNS ANALYZER — Anti-Duplicação de Copy
// Jaccard word similarity + cache no Supabase
// =====================================================

import { createServiceClient } from '../supabase';
import { getMetaConfig } from './meta-client';
import { logger } from '@/lib/logger';

const META_API_VERSION = 'v24.0';
const SIMILARITY_THRESHOLD = 0.6; // 60% = duplicação

// =====================================================
// BUSCAR CAMPANHAS ATIVAS NA META
// =====================================================

interface ActiveAdCopy {
  adId: string;
  adName: string;
  primaryText: string;
  headline: string;
}

export async function fetchActiveCampaigns(): Promise<ActiveAdCopy[]> {
  const config = getMetaConfig();
  if (!config.accessToken || !config.adAccountId) return [];

  // Tentar cache primeiro
  const cached = await getCachedAds(config.adAccountId);
  if (cached) return cached;

  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/act_${config.adAccountId}/ads?fields=id,name,creative{body,title}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&limit=200&access_token=${config.accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) return [];

    const ads: ActiveAdCopy[] = (data.data || []).map((ad: Record<string, unknown>) => {
      const creative = ad.creative as Record<string, string> | undefined;
      return {
        adId: ad.id as string,
        adName: ad.name as string,
        primaryText: creative?.body || '',
        headline: creative?.title || '',
      };
    });

    // Salvar no cache
    await cacheAds(config.adAccountId, ads);

    return ads;
  } catch (error) {
    logger.error('❌ Erro ao buscar campanhas ativas:', error);
    return [];
  }
}

// =====================================================
// CACHE (TTL: 1 hora)
// =====================================================

async function getCachedAds(accountId: string): Promise<ActiveAdCopy[] | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('active_campaigns_cache')
      .select('ads_data, updated_at')
      .eq('account_id', accountId)
      .single();

    if (!data) return null;

    const updatedAt = new Date(data.updated_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (updatedAt < oneHourAgo) return null; // Cache expirado

    return data.ads_data as ActiveAdCopy[];
  } catch {
    return null;
  }
}

async function cacheAds(accountId: string, ads: ActiveAdCopy[]): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase
      .from('active_campaigns_cache')
      .upsert({
        account_id: accountId,
        ads_data: ads,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'account_id' });
  } catch (error) {
    logger.error('⚠️ Falha ao salvar cache:', error);
  }
}

// =====================================================
// SIMILARIDADE DE JACCARD (word-level)
// =====================================================

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\sáéíóúãõâêîôûàèìòùç]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

export function calculateSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// =====================================================
// VERIFICAR DUPLICAÇÃO
// =====================================================

interface DuplicationCheck {
  isDuplicate: boolean;
  similarityScore: number;
  similarAdId?: string;
  similarAdName?: string;
}

export async function checkCopyDuplication(
  newPrimaryText: string,
  newHeadline: string
): Promise<DuplicationCheck> {
  const activeAds = await fetchActiveCampaigns();

  let highestScore = 0;
  let mostSimilarAd: ActiveAdCopy | null = null;

  for (const ad of activeAds) {
    const textSimilarity = calculateSimilarity(newPrimaryText, ad.primaryText);
    const headlineSimilarity = calculateSimilarity(newHeadline, ad.headline);

    // Peso maior para primary text (70%) vs headline (30%)
    const combinedScore = textSimilarity * 0.7 + headlineSimilarity * 0.3;

    if (combinedScore > highestScore) {
      highestScore = combinedScore;
      mostSimilarAd = ad;
    }
  }

  return {
    isDuplicate: highestScore >= SIMILARITY_THRESHOLD,
    similarityScore: Math.round(highestScore * 100),
    similarAdId: mostSimilarAd?.adId,
    similarAdName: mostSimilarAd?.adName,
  };
}

// =====================================================
// EXTRAIR ÂNGULOS ATIVOS (para evitar repetição)
// =====================================================

export async function extractActiveAngles(): Promise<string[]> {
  const activeAds = await fetchActiveCampaigns();
  return activeAds
    .map((ad) => ad.primaryText)
    .filter((text) => text.length > 10);
}

// =====================================================
// GERAR CONTEXTO ANTI-DUPLICAÇÃO PARA O GPT
// =====================================================

export async function generateAntiDuplicationContext(): Promise<string> {
  const angles = await extractActiveAngles();

  if (angles.length === 0) {
    return 'Não há anúncios ativos. Liberdade total para criar copy.';
  }

  return `ATENÇÃO — ANTI-DUPLICAÇÃO:
Os seguintes ângulos/copies JÁ estão em uso em anúncios ativos. NÃO repita hooks similares:
${angles.map((a, i) => `${i + 1}. "${a.substring(0, 80)}..."`).join('\n')}

Crie copies com ângulos DIFERENTES dos listados acima.`;
}
