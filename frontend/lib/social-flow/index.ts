// ============================================
// SOCIAL FLOW — ENTRY POINT + FEATURE FLAGS
// ============================================

export const FEATURES = {
  // Redes
  INSTAGRAM_ENABLED: true,
  FACEBOOK_ENABLED: false,
  TWITTER_ENABLED: false,
  LINKEDIN_ENABLED: false,
  YOUTUBE_ENABLED: false,
  TIKTOK_ENABLED: false,
  PINTEREST_ENABLED: false,

  // Funcionalidades
  AI_CAPTIONS: true,
  AI_HASHTAGS: true,
  AI_IMAGE_ANALYSIS: true,
  CROSS_POSTING: true,
  SCHEDULING: true,
  ANALYTICS: true,
  BEST_TIMES: true,
  MEDIA_LIBRARY: true,
  TEAM_WORKFLOW: true,
  REPORTS: true,
} as const

export type FeatureFlag = keyof typeof FEATURES

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag]
}

// Re-exports
export * from "./types"
export * from "./config"
