// Callback OAuth — processa retorno do Facebook/Instagram
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"
import { InstagramAuth } from "@/lib/social-flow/networks/instagram/auth"
import { logger } from '@/lib/logger';

const supabase = createServiceClient()

const PORTAL_URL = "/portal-interno-hks-2026/social-flow/settings"

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")
    const state = req.nextUrl.searchParams.get("state")
    const errorParam = req.nextUrl.searchParams.get("error")

    if (errorParam) {
      return NextResponse.redirect(new URL(`${PORTAL_URL}?error=${errorParam}`, req.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL(`${PORTAL_URL}?error=missing_params`, req.url))
    }

    // Extrair userId e network do state
    const [, userId, network] = state.split("|")

    if (network === "instagram") {
      const auth = new InstagramAuth()

      // Trocar code por short-lived token
      const shortToken = await auth.exchangeCodeForToken(code)

      // Trocar por long-lived token (60 dias)
      const longToken = await auth.exchangeForLongLivedToken(shortToken.access_token)
      const expiresAt = new Date(Date.now() + longToken.expires_in * 1000).toISOString()

      // Buscar páginas do Facebook
      const pages = await auth.getUserPages(longToken.access_token)

      if (!pages.length) {
        return NextResponse.redirect(new URL(`${PORTAL_URL}?error=no_pages`, req.url))
      }

      // Buscar Instagram Business Account de cada página
      for (const page of pages) {
        const igAccount = await auth.getInstagramBusinessAccount(page.id, page.access_token)

        if (igAccount) {
          // Upsert na tabela social_accounts
          await supabase.from("social_accounts").upsert(
            {
              user_id: userId ?? "default",
              network: "instagram",
              platform_account_id: igAccount.id,
              username: igAccount.username,
              display_name: igAccount.name,
              profile_picture_url: igAccount.profile_picture_url,
              access_token: page.access_token, // Usar page token para publicar
              token_expires_at: expiresAt,
              auxiliary_ids: { page_id: page.id, page_name: page.name },
              followers_count: igAccount.followers_count,
              following_count: igAccount.following_count,
              posts_count: igAccount.media_count,
              is_active: true,
              connection_status: "connected",
              last_sync_at: new Date().toISOString(),
            },
            { onConflict: "user_id,network,platform_account_id" }
          )
        }
      }

      return NextResponse.redirect(new URL(`${PORTAL_URL}?success=true`, req.url))
    }

    return NextResponse.redirect(new URL(`${PORTAL_URL}?error=unsupported_network`, req.url))
  } catch (error) {
    logger.error("[OAuth Callback Error]", error)
    return NextResponse.redirect(
      new URL(`${PORTAL_URL}?error=callback_failed`, req.url)
    )
  }
}
