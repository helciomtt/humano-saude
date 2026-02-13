// Analisar imagem com IA (Vision)
import { NextRequest, NextResponse } from "next/server"
import { ContentAnalyzer } from "@/lib/social-flow/ai/content-analyzer"

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, base64, mimeType } = await req.json()

    let result
    if (base64) {
      result = await ContentAnalyzer.analyzeImageBase64(base64, mimeType)
    } else if (imageUrl) {
      result = await ContentAnalyzer.analyzeImage(imageUrl)
    } else {
      return NextResponse.json({ error: "Envie imageUrl ou base64" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
