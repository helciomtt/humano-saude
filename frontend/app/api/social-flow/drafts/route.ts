// GET/PUT/DELETE — Rascunhos
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

const supabase = createServiceClient()

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") ?? "default"
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ drafts: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from("social_posts")
      .update({ ...updates, version: body.version ? body.version + 1 : 1 })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ post: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const { error } = await supabase.from("social_posts").delete().eq("id", id).eq("status", "draft")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
