// ============================================
// SOCIAL FLOW — CONFIGURAÇÃO POR REDE
// ============================================

import type { NetworkConfig, SocialNetwork } from "./types"

export const NETWORK_CONFIGS: Record<SocialNetwork, NetworkConfig> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "instagram",
    color: "#E4405F",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    postTypes: ["feed", "carousel", "reel", "story"],
    maxHashtags: 30,
    maxMentions: 20,
    maxCaptionLength: 2200,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: true,
    supportsReels: true,
    supportsDMs: false,
    requiresBusinessAccount: true,
    oauthScopes: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "business_management",
    ],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    postTypes: ["post", "reel", "story", "link"],
    maxHashtags: 30,
    maxMentions: 50,
    maxCaptionLength: 63206,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: true,
    supportsReels: true,
    supportsDMs: false,
    requiresBusinessAccount: false,
    oauthScopes: ["pages_manage_posts", "pages_read_engagement"],
  },
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    icon: "twitter",
    color: "#000000",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    postTypes: ["tweet", "thread"],
    maxHashtags: 10,
    maxMentions: 10,
    maxCaptionLength: 280,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: false,
    supportsReels: false,
    supportsDMs: true,
    requiresBusinessAccount: false,
    oauthScopes: ["tweet.read", "tweet.write", "users.read"],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    color: "#0A66C2",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    postTypes: ["post", "article", "document"],
    maxHashtags: 5,
    maxMentions: 30,
    maxCaptionLength: 3000,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: false,
    supportsReels: false,
    supportsDMs: false,
    requiresBusinessAccount: false,
    oauthScopes: ["w_member_social", "r_liteprofile"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: "youtube",
    color: "#FF0000",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    postTypes: ["video", "shorts"],
    maxHashtags: 500,
    maxMentions: 0,
    maxCaptionLength: 5000,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: false,
    supportsReels: true,
    supportsDMs: false,
    requiresBusinessAccount: true,
    oauthScopes: ["https://www.googleapis.com/auth/youtube.upload"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: "tiktok",
    color: "#010101",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    postTypes: ["video"],
    maxHashtags: 10,
    maxMentions: 5,
    maxCaptionLength: 2200,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: false,
    supportsReels: true,
    supportsDMs: false,
    requiresBusinessAccount: true,
    oauthScopes: ["video.upload", "video.list"],
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    icon: "pinterest",
    color: "#E60023",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-600/30",
    postTypes: ["pin", "idea_pin"],
    maxHashtags: 20,
    maxMentions: 0,
    maxCaptionLength: 500,
    supportsScheduling: true,
    supportsAnalytics: true,
    supportsStories: false,
    supportsReels: false,
    supportsDMs: false,
    requiresBusinessAccount: true,
    oauthScopes: ["pins:read", "pins:write"],
  },
}

// Helpers
export function getNetworkConfig(network: SocialNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network]
}

export function getEnabledNetworks(): NetworkConfig[] {
  const { FEATURES } = require("./index")
  return Object.values(NETWORK_CONFIGS).filter((config) => {
    const key = `${config.id.toUpperCase()}_ENABLED` as keyof typeof FEATURES
    return FEATURES[key] === true
  })
}

export function getPostTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    feed: "Feed",
    carousel: "Carrossel",
    reel: "Reel",
    story: "Story",
    tweet: "Tweet",
    thread: "Thread",
    post: "Post",
    article: "Artigo",
    video: "Vídeo",
    shorts: "Shorts",
    pin: "Pin",
    idea_pin: "Idea Pin",
    link: "Link",
    document: "Documento",
  }
  return labels[type] ?? type
}

export function getPostTypeColor(type: string): string {
  const colors: Record<string, string> = {
    feed: "bg-blue-500",
    carousel: "bg-purple-500",
    reel: "bg-red-500",
    story: "bg-green-500",
    tweet: "bg-gray-500",
    video: "bg-red-600",
    shorts: "bg-red-400",
    pin: "bg-red-600",
  }
  return colors[type] ?? "bg-gray-500"
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: "Ideia",
    draft: "Rascunho",
    pending_approval: "Pendente Aprovação",
    approved: "Aprovado",
    scheduled: "Agendado",
    publishing: "Publicando",
    published: "Publicado",
    failed: "Falhou",
    deleted: "Excluído",
  }
  return labels[status] ?? status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: "bg-gray-500/20 text-gray-400",
    draft: "bg-yellow-500/20 text-yellow-400",
    pending_approval: "bg-orange-500/20 text-orange-400",
    approved: "bg-blue-500/20 text-blue-400",
    scheduled: "bg-purple-500/20 text-purple-400",
    publishing: "bg-cyan-500/20 text-cyan-400",
    published: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    deleted: "bg-gray-500/20 text-gray-400",
  }
  return colors[status] ?? "bg-gray-500/20 text-gray-400"
}
