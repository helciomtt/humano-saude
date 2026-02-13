// ============================================
// INSTAGRAM OAuth2 via Facebook Graph API
// ============================================

const GRAPH_API_VERSION = "v21.0"
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export class InstagramAuth {
  private appId: string
  private appSecret: string
  private redirectUri: string

  constructor() {
    this.appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!
    this.appSecret = process.env.FACEBOOK_APP_SECRET!
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social-flow/callback`
  }

  // Gera URL de login OAuth
  getAuthUrl(state: string): string {
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "business_management",
    ].join(",")

    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${scopes}&state=${state}&response_type=code`
  }

  // Troca code por short-lived token
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in: number }> {
    const url = `${GRAPH_BASE}/oauth/access_token?client_id=${this.appId}&client_secret=${this.appSecret}&redirect_uri=${encodeURIComponent(this.redirectUri)}&code=${code}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Erro ao trocar code: ${res.statusText}`)
    return res.json()
  }

  // Troca short-lived por long-lived token (60 dias)
  async exchangeForLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
    const url = `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${shortToken}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Erro ao obter long-lived token: ${res.statusText}`)
    return res.json()
  }

  // Renova long-lived token (antes de expirar)
  async refreshLongLivedToken(token: string): Promise<{ access_token: string; expires_in: number }> {
    return this.exchangeForLongLivedToken(token)
  }

  // Busca páginas do Facebook do usuário
  async getUserPages(token: string): Promise<Array<{ id: string; name: string; access_token: string }>> {
    const url = `${GRAPH_BASE}/me/accounts?access_token=${token}&fields=id,name,access_token`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Erro ao buscar páginas")
    const data = await res.json()
    return data.data ?? []
  }

  // Busca Instagram Business Account vinculado à página
  async getInstagramBusinessAccount(
    pageId: string,
    pageToken: string
  ): Promise<{
    id: string
    username: string
    name: string
    profile_picture_url: string
    followers_count: number
    following_count: number
    media_count: number
  } | null> {
    const url = `${GRAPH_BASE}/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count}&access_token=${pageToken}`

    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const ig = data.instagram_business_account

    if (!ig) return null

    return {
      id: ig.id,
      username: ig.username ?? "",
      name: ig.name ?? "",
      profile_picture_url: ig.profile_picture_url ?? "",
      followers_count: ig.followers_count ?? 0,
      following_count: ig.follows_count ?? 0,
      media_count: ig.media_count ?? 0,
    }
  }

  // Valida se um token ainda funciona
  async validateToken(token: string): Promise<boolean> {
    try {
      const url = `${GRAPH_BASE}/me?access_token=${token}`
      const res = await fetch(url)
      return res.ok
    } catch {
      return false
    }
  }
}
