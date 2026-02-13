// GET/POST — CRUD de contas sociais
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

const supabase = createServiceClient()

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") ?? "default"
    const network = req.nextUrl.searchParams.get("network")

    let query = supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (network) query = query.eq("network", network)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ accounts: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { accountId } = await req.json()

    const { error } = await supabase
      .from("social_accounts")
      .update({ is_active: false })
      .eq("id", accountId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}
