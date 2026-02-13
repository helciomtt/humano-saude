// Publicar ou agendar post
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"
import { UniversalPublisher } from "@/lib/social-flow/core/publisher"
import { SchedulerService } from "@/lib/social-flow/core/scheduler"
import type { SocialAccount, SocialMediaItem } from "@/lib/social-flow/types"

const supabase = createServiceClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      account_id,
      network,
      post_type = "feed",
      content,
      title,
      hashtags = [],
      first_comment,
      metadata = {},
      media_ids = [],
      scheduled_for,
      status = "draft",
      user_id = "default",
    } = body

    // Criar post no banco
    const { data: post, error } = await supabase
      .from("social_posts")
      .insert({
        user_id,
        account_id,
        network,
        post_type,
        content,
        title,
        hashtags,
        first_comment,
        metadata,
        media_ids,
        status: scheduled_for ? "scheduled" : status,
        scheduled_for,
        auto_publish: !!scheduled_for,
        created_by: user_id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Se status é "published" → publicar agora
    if (status === "published" && !scheduled_for) {
      const { data: account } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("id", account_id)
        .single()

      if (!account) {
        return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
      }

      const { data: mediaItems } = await supabase
        .from("social_media_items")
        .select("*")
        .eq("post_id", post.id)
        .order("sort_order")

      const result = await UniversalPublisher.publishToNetwork(
        account as SocialAccount,
        post,
        (mediaItems ?? []) as SocialMediaItem[]
      )

      return NextResponse.json({ post, publishResult: result })
    }

    // Se agendado
    if (scheduled_for) {
      await SchedulerService.schedulePost(post.id, scheduled_for)
    }

    return NextResponse.json({ post })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar post" },
      { status: 500 }
    )
  }
}
