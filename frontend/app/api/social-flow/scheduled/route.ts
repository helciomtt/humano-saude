// GET — Posts agendados / POST — Reagendar / DELETE — Cancelar
import { NextRequest, NextResponse } from "next/server"
import { SchedulerService } from "@/lib/social-flow/core/scheduler"

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") ?? "default"
    const posts = await SchedulerService.getScheduledPosts(userId)
    return NextResponse.json({ posts })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { postId, scheduledFor } = await req.json()
    const result = await SchedulerService.reschedulePost(postId, scheduledFor)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { postId } = await req.json()
    const success = await SchedulerService.unschedulePost(postId)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
