// Sugerir hashtags com IA
import { NextRequest, NextResponse } from "next/server"
import { HashtagSuggester } from "@/lib/social-flow/ai/hashtag-suggester"
import type { HashtagSuggestOptions } from "@/lib/social-flow/types"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HashtagSuggestOptions
    const result = await HashtagSuggester.suggest(body)
    return NextResponse.json({ hashtags: result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
