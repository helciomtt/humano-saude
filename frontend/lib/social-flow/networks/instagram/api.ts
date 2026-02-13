// ============================================
// INSTAGRAM Graph API Client + Adapter
// ============================================

import type {
  NetworkAdapter,
  SocialAccount,
  SocialPost,
  SocialMediaItem,
  PublishResult,
  PostMetrics,
  AccountMetricsHistory,
} from "../../types"
import { InstagramAuth } from "./auth"

const GRAPH_API_VERSION = "v21.0"
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export class InstagramAdapter implements NetworkAdapter {
  network = "instagram" as const
  private auth = new InstagramAuth()

  // Publicar post no Instagram
  async publishPost(
    account: SocialAccount,
    post: SocialPost,
    mediaItems: SocialMediaItem[]
  ): Promise<PublishResult> {
    const igUserId = account.platform_account_id
    const token = account.access_token

    try {
      if (post.post_type === "carousel" && mediaItems.length > 1) {
        return this.publishCarousel(igUserId, token, post, mediaItems)
      }

      if (post.post_type === "reel" && mediaItems[0]?.file_type === "video") {
        return this.publishReel(igUserId, token, post, mediaItems[0])
      }

      if (post.post_type === "story") {
        return this.publishStory(igUserId, token, post, mediaItems[0])
      }

      // Feed post (imagem simples)
      return this.publishFeedPost(igUserId, token, post, mediaItems[0])
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao publicar no Instagram",
      }
    }
  }

  private async publishFeedPost(
    igUserId: string,
    token: string,
    post: SocialPost,
    media: SocialMediaItem
  ): Promise<PublishResult> {
    // Step 1: Criar container
    const caption = this.buildCaption(post)
    const containerUrl = `${GRAPH_BASE}/${igUserId}/media`

    const containerParams = new URLSearchParams({
      image_url: media.public_url ?? "",
      caption,
      access_token: token,
    })

    if (post.metadata.location_id) {
      containerParams.set("location_id", post.metadata.location_id)
    }

    const containerRes = await fetch(containerUrl, {
      method: "POST",
      body: containerParams,
    })

    if (!containerRes.ok) {
      const err = await containerRes.json()
      throw new Error(err.error?.message ?? "Erro ao criar container")
    }

    const { id: containerId } = await containerRes.json()

    // Step 2: Publicar
    const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: token,
      }),
    })

    if (!publishRes.ok) {
      const err = await publishRes.json()
      throw new Error(err.error?.message ?? "Erro ao publicar")
    }

    const { id: mediaId } = await publishRes.json()

    // Buscar permalink
    const permalink = await this.getPermalink(mediaId, token)

    return { success: true, platformPostId: mediaId, permalink }
  }

  private async publishCarousel(
    igUserId: string,
    token: string,
    post: SocialPost,
    mediaItems: SocialMediaItem[]
  ): Promise<PublishResult> {
    // Criar containers individuais
    const childIds: string[] = []

    for (const media of mediaItems) {
      const params: Record<string, string> = {
        is_carousel_item: "true",
        access_token: token,
      }

      if (media.file_type === "video") {
        params.media_type = "VIDEO"
        params.video_url = media.public_url ?? ""
      } else {
        params.image_url = media.public_url ?? ""
      }

      const res = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
        method: "POST",
        body: new URLSearchParams(params),
      })

      if (!res.ok) throw new Error("Erro ao criar item do carrossel")
      const { id } = await res.json()
      childIds.push(id)
    }

    // Criar container do carrossel
    const caption = this.buildCaption(post)
    const carouselParams = new URLSearchParams({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: token,
    })

    const carouselRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      body: carouselParams,
    })

    if (!carouselRes.ok) throw new Error("Erro ao criar carrossel")
    const { id: containerId } = await carouselRes.json()

    // Publicar
    const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({ creation_id: containerId, access_token: token }),
    })

    if (!publishRes.ok) throw new Error("Erro ao publicar carrossel")
    const { id: mediaId } = await publishRes.json()
    const permalink = await this.getPermalink(mediaId, token)

    return { success: true, platformPostId: mediaId, permalink }
  }

  private async publishReel(
    igUserId: string,
    token: string,
    post: SocialPost,
    media: SocialMediaItem
  ): Promise<PublishResult> {
    const caption = this.buildCaption(post)
    const params: Record<string, string> = {
      media_type: "REELS",
      video_url: media.public_url ?? "",
      caption,
      access_token: token,
    }

    if (post.metadata.cover_url) params.cover_url = post.metadata.cover_url
    if (post.metadata.share_to_feed !== false) params.share_to_feed = "true"

    const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      body: new URLSearchParams(params),
    })

    if (!containerRes.ok) throw new Error("Erro ao criar container do reel")
    const { id: containerId } = await containerRes.json()

    // Aguardar processamento do vídeo
    await this.waitForMediaProcessing(containerId, token)

    const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({ creation_id: containerId, access_token: token }),
    })

    if (!publishRes.ok) throw new Error("Erro ao publicar reel")
    const { id: mediaId } = await publishRes.json()
    const permalink = await this.getPermalink(mediaId, token)

    return { success: true, platformPostId: mediaId, permalink }
  }

  private async publishStory(
    igUserId: string,
    token: string,
    post: SocialPost,
    media: SocialMediaItem
  ): Promise<PublishResult> {
    const params: Record<string, string> = { access_token: token }

    if (media.file_type === "video") {
      params.media_type = "STORIES"
      params.video_url = media.public_url ?? ""
    } else {
      params.media_type = "STORIES"
      params.image_url = media.public_url ?? ""
    }

    const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      body: new URLSearchParams(params),
    })

    if (!containerRes.ok) throw new Error("Erro ao criar container do story")
    const { id: containerId } = await containerRes.json()

    if (media.file_type === "video") {
      await this.waitForMediaProcessing(containerId, token)
    }

    const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({ creation_id: containerId, access_token: token }),
    })

    if (!publishRes.ok) throw new Error("Erro ao publicar story")
    const { id: mediaId } = await publishRes.json()

    return { success: true, platformPostId: mediaId }
  }

  // Busca métricas de um post
  async getPostMetrics(account: SocialAccount, platformPostId: string): Promise<Partial<PostMetrics>> {
    const metrics = ["impressions", "reach", "saved", "likes", "comments", "shares"]
    const url = `${GRAPH_BASE}/${platformPostId}/insights?metric=${metrics.join(",")}&access_token=${account.access_token}`

    try {
      const res = await fetch(url)
      if (!res.ok) return {}

      const data = await res.json()
      const values: Record<string, number> = {}

      for (const item of data.data ?? []) {
        values[item.name] = item.values?.[0]?.value ?? 0
      }

      const engagement = (values.likes ?? 0) + (values.comments ?? 0) + (values.shares ?? 0) + (values.saved ?? 0)
      const engagementRate = values.reach > 0 ? (engagement / values.reach) * 100 : 0

      return {
        impressions: values.impressions ?? 0,
        reach: values.reach ?? 0,
        likes: values.likes ?? 0,
        comments: values.comments ?? 0,
        shares: values.shares ?? 0,
        saves: values.saved ?? 0,
        engagement,
        engagement_rate: Number(engagementRate.toFixed(2)),
      }
    } catch {
      return {}
    }
  }

  // Busca métricas da conta
  async getAccountMetrics(account: SocialAccount): Promise<Partial<AccountMetricsHistory>> {
    const fields = "followers_count,follows_count,media_count"
    const url = `${GRAPH_BASE}/${account.platform_account_id}?fields=${fields}&access_token=${account.access_token}`

    try {
      const res = await fetch(url)
      if (!res.ok) return {}

      const data = await res.json()
      return {
        followers_count: data.followers_count ?? 0,
        following_count: data.follows_count ?? 0,
        posts_count: data.media_count ?? 0,
      }
    } catch {
      return {}
    }
  }

  async refreshToken(account: SocialAccount): Promise<{ access_token: string; expires_at?: string }> {
    const result = await this.auth.refreshLongLivedToken(account.access_token)
    const expiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString()
    return { access_token: result.access_token, expires_at: expiresAt }
  }

  async validateToken(account: SocialAccount): Promise<boolean> {
    return this.auth.validateToken(account.access_token)
  }

  // ============================================
  // HELPERS
  // ============================================

  private buildCaption(post: SocialPost): string {
    let caption = post.content ?? ""
    if (post.hashtags.length > 0) {
      caption += "\n\n" + post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
    }
    return caption
  }

  private async getPermalink(mediaId: string, token: string): Promise<string | undefined> {
    try {
      const res = await fetch(`${GRAPH_BASE}/${mediaId}?fields=permalink&access_token=${token}`)
      if (!res.ok) return undefined
      const data = await res.json()
      return data.permalink
    } catch {
      return undefined
    }
  }

  private async waitForMediaProcessing(containerId: string, token: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${token}`)
      if (res.ok) {
        const data = await res.json()
        if (data.status_code === "FINISHED") return
        if (data.status_code === "ERROR") throw new Error("Erro no processamento do vídeo")
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    throw new Error("Timeout no processamento do vídeo")
  }
}
