// ============================================
// UNIVERSAL PUBLISHER
// Publica em qualquer rede via adapter pattern
// ============================================

import { createServiceClient } from "@/lib/supabase"
import type {
  SocialAccount,
  SocialPost,
  SocialMediaItem,
  PublishResult,
  NetworkAdapter,
  SocialNetwork,
} from "../types"

const supabase = createServiceClient()

// Registry de adapters por rede
const adapterRegistry = new Map<SocialNetwork, NetworkAdapter>()

export class UniversalPublisher {
  static registerAdapter(adapter: NetworkAdapter) {
    adapterRegistry.set(adapter.network, adapter)
  }

  static getAdapter(network: SocialNetwork): NetworkAdapter | undefined {
    return adapterRegistry.get(network)
  }

  // Publica um post em uma rede específica
  static async publishToNetwork(
    account: SocialAccount,
    post: SocialPost,
    mediaItems: SocialMediaItem[]
  ): Promise<PublishResult> {
    const adapter = adapterRegistry.get(account.network)

    if (!adapter) {
      return { success: false, error: `Adapter não encontrado para ${account.network}` }
    }

    // Validar token antes de publicar
    const tokenValid = await adapter.validateToken(account)
    if (!tokenValid) {
      await supabase
        .from("social_accounts")
        .update({ connection_status: "expired" })
        .eq("id", account.id)

      return { success: false, error: "Token expirado. Reconecte a conta." }
    }

    // Marcar como publishing
    await supabase
      .from("social_posts")
      .update({ status: "publishing", publish_attempts: post.publish_attempts + 1 })
      .eq("id", post.id)

    try {
      const result = await adapter.publishPost(account, post, mediaItems)

      if (result.success) {
        await supabase
          .from("social_posts")
          .update({
            status: "published",
            platform_post_id: result.platformPostId,
            permalink: result.permalink,
            published_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", post.id)
      } else {
        const maxRetries = 3
        const newStatus = post.retry_count >= maxRetries ? "failed" : "scheduled"

        await supabase
          .from("social_posts")
          .update({
            status: newStatus,
            error_message: result.error,
            retry_count: post.retry_count + 1,
            // Se retry, adia 5 minutos
            ...(newStatus === "scheduled" && {
              scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            }),
          })
          .eq("id", post.id)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao publicar"

      await supabase
        .from("social_posts")
        .update({
          status: "failed",
          error_message: errorMessage,
          retry_count: post.retry_count + 1,
        })
        .eq("id", post.id)

      return { success: false, error: errorMessage }
    }
  }

  // Cross-post: publica em múltiplas redes
  static async crossPost(
    accounts: SocialAccount[],
    post: SocialPost,
    mediaItems: SocialMediaItem[]
  ): Promise<Map<string, PublishResult>> {
    const results = new Map<string, PublishResult>()

    for (const account of accounts) {
      const adaptedPost: SocialPost = {
        ...post,
        network: account.network,
        account_id: account.id,
      }
      const result = await this.publishToNetwork(account, adaptedPost, mediaItems)
      results.set(account.id, result)
    }

    return results
  }
}
