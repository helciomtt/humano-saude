// Inicia fluxo OAuth para conectar rede social
import { NextRequest, NextResponse } from "next/server"
import { InstagramAuth } from "@/lib/social-flow/networks/instagram/auth"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const network = req.nextUrl.searchParams.get("network") ?? "instagram"
    const userId = req.headers.get("x-user-id") ?? "default"

    // State para CSRF protection
    const state = crypto.randomBytes(16).toString("hex") + `|${userId}|${network}`

    if (network === "instagram") {
      const auth = new InstagramAuth()
      const authUrl = auth.getAuthUrl(state)
      return NextResponse.redirect(authUrl)
    }

    return NextResponse.json({ error: `Rede ${network} ainda não suportada` }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao iniciar conexão" },
      { status: 500 }
    )
  }
}
