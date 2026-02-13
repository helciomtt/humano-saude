// =====================================================
// BRAND SAFETY — Proteção de Marca
// Humano Saúde
// =====================================================

export const EXCLUDED_CATEGORIES = {
  NEWS: 'news',
  POLITICS: 'politics',
  GAMING: 'gaming',
  MATURE: 'mature',
  DEBATED_SOCIAL_ISSUES: 'debated_social_issues',
} as const;

export const DEFAULT_BRAND_SAFETY_CONFIG = {
  disableComments: false,
  excludeCategories: ['news', 'politics', 'debated_social_issues'] as string[],
  blockLists: [] as string[],
};

interface BrandSafetyConfig {
  disableComments: boolean;
  excludeCategories: string[];
  blockLists: string[];
}

interface BrandSafetyStatus {
  isConfigured: boolean;
  excludedCategories: string[];
  commentsDisabled: boolean;
}

// Aplicar brand safety na criação de campanha
export function configureBrandSafety(
  config?: Partial<BrandSafetyConfig>
): Record<string, unknown> {
  const safetyConfig = { ...DEFAULT_BRAND_SAFETY_CONFIG, ...config };

  const params: Record<string, unknown> = {};

  if (safetyConfig.excludeCategories.length > 0) {
    params.excluded_publisher_categories = safetyConfig.excludeCategories;
  }

  if (safetyConfig.blockLists.length > 0) {
    params.publisher_block_lists = safetyConfig.blockLists;
  }

  return params;
}

export function applyDefaultBrandSafety(): Record<string, unknown> {
  return configureBrandSafety(DEFAULT_BRAND_SAFETY_CONFIG);
}

export function getBrandSafetyStatus(config?: BrandSafetyConfig): BrandSafetyStatus {
  const c = config || DEFAULT_BRAND_SAFETY_CONFIG;
  return {
    isConfigured: c.excludeCategories.length > 0,
    excludedCategories: c.excludeCategories,
    commentsDisabled: c.disableComments,
  };
}
