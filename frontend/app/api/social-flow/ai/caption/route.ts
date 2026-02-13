// Gerar legenda com IA
import { NextRequest, NextResponse } from "next/server"
import { CaptionGenerator } from "@/lib/social-flow/ai/caption-generator"
import type { CaptionGenerateOptions } from "@/lib/social-flow/types"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CaptionGenerateOptions
    const result = await CaptionGenerator.generate(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
