import { logger } from '@/lib/logger';

// =====================================================
// CAROUSEL CREATIVE — Builder de Anúncios Carrossel
// Monta criativos de carrossel para Meta Ads
// =====================================================

const META_API_VERSION = 'v21.0';

// =====================================================
// TIPOS
// =====================================================

export interface CarouselCard {
  imageHash?: string;
  imageUrl?: string;
  videoId?: string;
  headline: string;
  description: string;
  link: string;
  callToAction: string;
}

export interface CarouselCreativeParams {
  name: string;
  pageId: string;
  cards: CarouselCard[];
  primaryText: string;
  seeMoreUrl: string;
  seeMoreDisplayUrl?: string;
  instagramActorId?: string;
}

export interface CarouselResult {
  creativeId: string;
  name: string;
  cardCount: number;
}

// =====================================================
// CARDS PADRÃO — Humano Saúde
// =====================================================

export function getDefaultCarouselCards(baseUrl: string): CarouselCard[] {
  return [
    {
      headline: 'Assessoria 100% Gratuita',
      description: 'Compare planos sem custo. Encontre o ideal para você.',
      link: `${baseUrl}?utm_source=meta&utm_medium=carousel&utm_content=card1`,
      callToAction: 'LEARN_MORE',
    },
    {
      headline: 'Planos Empresariais PME',
      description: 'A partir de 2 vidas. Economia de até 40% para sua empresa.',
      link: `${baseUrl}?utm_source=meta&utm_medium=carousel&utm_content=card2`,
      callToAction: 'LEARN_MORE',
    },
    {
      headline: 'Planos Familiares',
      description: 'Cobertura completa para toda família. Preços acessíveis.',
      link: `${baseUrl}?utm_source=meta&utm_medium=carousel&utm_content=card3`,
      callToAction: 'LEARN_MORE',
    },
    {
      headline: '15+ Operadoras Parceiras',
      description: 'Bradesco, SulAmérica, Amil, Unimed e muito mais.',
      link: `${baseUrl}?utm_source=meta&utm_medium=carousel&utm_content=card4`,
      callToAction: 'LEARN_MORE',
    },
    {
      headline: 'Cotação em 30 Segundos',
      description: 'Preencha o formulário e receba sua cotação personalizada.',
      link: `${baseUrl}?utm_source=meta&utm_medium=carousel&utm_content=card5`,
      callToAction: 'SIGN_UP',
    },
  ];
}

// =====================================================
// MONTAR OBJECT STORY SPEC (CARROSSEL)
// =====================================================

function buildCarouselStorySpec(params: CarouselCreativeParams) {
  const childAttachments = params.cards.map((card) => {
    const attachment: Record<string, unknown> = {
      name: card.headline,
      description: card.description,
      link: card.link,
      call_to_action: {
        type: card.callToAction || 'LEARN_MORE',
        value: { link: card.link },
      },
    };

    if (card.imageHash) {
      attachment.image_hash = card.imageHash;
    } else if (card.imageUrl) {
      attachment.picture = card.imageUrl;
    }

    if (card.videoId) {
      attachment.video_id = card.videoId;
    }

    return attachment;
  });

  const storySpec: Record<string, unknown> = {
    page_id: params.pageId,
    link_data: {
      message: params.primaryText,
      link: params.seeMoreUrl,
      child_attachments: childAttachments,
      multi_share_end_card: false,
      caption: params.seeMoreDisplayUrl || undefined,
    },
  };

  if (params.instagramActorId) {
    storySpec.instagram_actor_id = params.instagramActorId;
  }

  return storySpec;
}

// =====================================================
// CRIAR CRIATIVO CARROSSEL
// =====================================================

export async function createCarouselCreative(
  params: CarouselCreativeParams
): Promise<CarouselResult | null> {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';
  const adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID || '';

  if (!accessToken || !adAccountId) {
    logger.error('❌ META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não configurados');
    return null;
  }

  if (params.cards.length < 2) {
    logger.error('❌ Carrossel precisa de no mínimo 2 cards');
    return null;
  }

  if (params.cards.length > 10) {
    logger.error('❌ Carrossel suporta no máximo 10 cards');
    return null;
  }

  try {
    const objectStorySpec = buildCarouselStorySpec(params);

    const body = {
      name: params.name,
      object_story_spec: JSON.stringify(objectStorySpec),
      access_token: accessToken,
    };

    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/adcreatives`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      logger.error('❌ Erro ao criar carrossel:', data.error?.message);
      return null;
    }

    return {
      creativeId: data.id,
      name: params.name,
      cardCount: params.cards.length,
    };
  } catch (error) {
    logger.error('❌ Erro ao criar carrossel:', error);
    return null;
  }
}

// =====================================================
// HELPER — Montar Carrossel Rápido
// =====================================================

export async function quickCarousel(
  headlines: string[],
  descriptions: string[],
  imageHashes: string[],
  primaryText: string,
  landingUrl: string,
  pageId: string,
  instagramActorId?: string
): Promise<CarouselResult | null> {
  const cards: CarouselCard[] = headlines.map((headline, i) => ({
    headline,
    description: descriptions[i] || '',
    imageHash: imageHashes[i] || undefined,
    link: `${landingUrl}?utm_source=meta&utm_medium=carousel&utm_content=card${i + 1}`,
    callToAction: i === headlines.length - 1 ? 'SIGN_UP' : 'LEARN_MORE',
  }));

  return createCarouselCreative({
    name: `HSA - Carrossel - ${new Date().toISOString().split('T')[0]}`,
    pageId,
    cards,
    primaryText,
    seeMoreUrl: landingUrl,
    instagramActorId,
  });
}
