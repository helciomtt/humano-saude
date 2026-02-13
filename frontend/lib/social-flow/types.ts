// ============================================
// SOCIAL FLOW — TIPOS CORE
// ============================================

export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "pinterest"

export type PostStatus =
  | "idea"
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "deleted"

export type PostType =
  | "feed"
  | "carousel"
  | "reel"
  | "story"
  | "tweet"
  | "thread"
  | "post"
  | "article"
  | "video"
  | "shorts"
  | "pin"
  | "idea_pin"
  | "link"
  | "document"

export type UserRole = "viewer" | "creator" | "editor" | "approver" | "admin"
export type MediaType = "image" | "video" | "gif" | "document" | "carousel"
export type CaptionTone = "professional" | "casual" | "fun" | "inspirational" | "educational"
export type HashtagCategory = "trending" | "niche" | "branded" | "general"
export type HashtagPopularity = "high" | "medium" | "low"
export type ConnectionStatus = "connected" | "expired" | "revoked" | "error"

// ============================================
// NETWORK CONFIG
// ============================================

export interface NetworkConfig {
  id: SocialNetwork
  name: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  postTypes: PostType[]
  maxHashtags: number
  maxMentions: number
  maxCaptionLength: number
  supportsScheduling: boolean
  supportsAnalytics: boolean
  supportsStories: boolean
  supportsReels: boolean
  supportsDMs: boolean
  requiresBusinessAccount: boolean
  oauthScopes: string[]
}

// ============================================
// SOCIAL ACCOUNT
// ============================================

export interface SocialAccount {
  id: string
  user_id: string
  network: SocialNetwork
  platform_account_id: string
  username: string
  display_name?: string
  profile_picture_url?: string
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  auxiliary_ids: Record<string, string>
  followers_count: number
  following_count: number
  posts_count: number
  engagement_rate: number
  is_active: boolean
  is_primary: boolean
  connection_status: ConnectionStatus
  last_error?: string
  last_error_at?: string
  last_sync_at?: string
  created_at: string
  updated_at: string
}

// ============================================
// POST
// ============================================

export interface PostMetadata {
  location_id?: string
  location_name?: string
  tagged_users?: Array<{ username: string; x: number; y: number }>
  cover_url?: string
  share_to_feed?: boolean
  is_thread?: boolean
  poll?: { options: string[]; duration_hours: number }
  board_id?: string
  privacy_status?: string
  [key: string]: unknown
}

export interface SocialPost {
  id: string
  user_id: string
  account_id: string
  network: SocialNetwork
  post_type: PostType
  content?: string
  title?: string
  hashtags: string[]
  first_comment?: string
  metadata: PostMetadata
  media_ids: string[]
  is_cross_post: boolean
  cross_post_parent_id?: string
  status: PostStatus
  approval_required: boolean
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejection_reason?: string
  scheduled_for?: string
  auto_publish: boolean
  published_at?: string
  platform_post_id?: string
  permalink?: string
  error_message?: string
  retry_count: number
  publish_attempts: number
  created_by?: string
  created_at: string
  updated_at: string
  version: number
  // Joined metrics
  metrics?: PostMetrics
}

// ============================================
// MEDIA
// ============================================

export interface SocialMediaItem {
  id: string
  post_id: string
  file_path: string
  public_url?: string
  thumbnail_url?: string
  file_type: "image" | "video"
  file_size_bytes?: number
  mime_type?: string
  width?: number
  height?: number
  duration_seconds?: number
  sort_order: number
  created_at: string
}

export interface MediaLibraryItem {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_url?: string
  file_type: "image" | "video"
  file_size: number
  mime_type?: string
  width?: number
  height?: number
  duration_seconds?: number
  thumbnail_url?: string
  folder: string
  tags: string[]
  color_label?: string
  is_favorite: boolean
  alt_text?: string
  ai_description?: string
  uploaded_at: string
  deleted_at?: string
}

// ============================================
// METRICS
// ============================================

export interface PostMetrics {
  id: string
  post_id: string
  impressions: number
  reach: number
  engagement: number
  likes: number
  comments: number
  shares: number
  saves: number
  video_views: number
  link_clicks: number
  engagement_rate: number
  updated_at: string
}

export interface AccountMetricsHistory {
  id: string
  account_id: string
  followers_count: number
  following_count: number
  posts_count: number
  engagement_rate: number
  impressions: number
  reach: number
  recorded_at: string
}

export interface BestTimeSlot {
  id: string
  user_id: string
  account_id: string
  day_of_week: number
  hour_of_day: number
  engagement_score: number
  posts_analyzed: number
  avg_engagement: number
  updated_at: string
}

// ============================================
// APPROVAL
// ============================================

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  user_name?: string
  message: string
  created_at: string
}

// ============================================
// AI
// ============================================

export interface CaptionGenerateOptions {
  network: SocialNetwork
  postType: PostType
  topic: string
  tone: CaptionTone
  language?: string
  keywords?: string[]
  includeEmojis?: boolean
  includeHashtags?: boolean
  maxLength?: number
  imageDescription?: string
}

export interface CaptionResult {
  caption: string
  hashtags: string[]
  characterCount: number
  tone: CaptionTone
}

export interface HashtagSuggestOptions {
  content: string
  network: SocialNetwork
  niche?: string
  language?: string
  maxHashtags?: number
}

export interface HashtagResult {
  tag: string
  category: HashtagCategory
  popularity: HashtagPopularity
  relevanceScore: number
}

export interface ImageAnalysisResult {
  objects: string[]
  colors: string[]
  mood: string
  description: string
  suggestedCaption: string
  suggestedHashtags: string[]
  isSafe: boolean
  altText: string
}

// ============================================
// PUBLISH
// ============================================

export interface PublishResult {
  success: boolean
  platformPostId?: string
  permalink?: string
  error?: string
}

export interface ScheduleResult {
  success: boolean
  postId: string
  scheduledFor: string
}

// ============================================
// WORKER REPORTS
// ============================================

export interface WorkerReport {
  job: string
  startedAt: string
  completedAt: string
  totalProcessed: number
  successCount: number
  failureCount: number
  skippedCount: number
  errors: Array<{ id: string; error: string }>
}

// ============================================
// NETWORK ADAPTER INTERFACE
// ============================================

export interface NetworkAdapter {
  network: SocialNetwork
  publishPost(account: SocialAccount, post: SocialPost, mediaItems: SocialMediaItem[]): Promise<PublishResult>
  getPostMetrics(account: SocialAccount, platformPostId: string): Promise<Partial<PostMetrics>>
  getAccountMetrics(account: SocialAccount): Promise<Partial<AccountMetricsHistory>>
  refreshToken(account: SocialAccount): Promise<{ access_token: string; expires_at?: string }>
  validateToken(account: SocialAccount): Promise<boolean>
}
