// ============================================
// CONTENT ANALYZER — Análise de imagem com Vision
// ============================================

import type { ImageAnalysisResult } from "../types"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"

export class ContentAnalyzer {
  // Analisa imagem via URL
  static async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    return this.analyze([{ type: "image_url", image_url: { url: imageUrl, detail: "low" } }])
  }

  // Analisa imagem via base64
  static async analyzeImageBase64(base64Data: string, mimeType = "image/jpeg"): Promise<ImageAnalysisResult> {
    const dataUrl = `data:${mimeType};base64,${base64Data}`
    return this.analyze([{ type: "image_url", image_url: { url: dataUrl, detail: "low" } }])
  }

  // Gera alt-text acessível (max 125 chars)
  static async generateAltText(imageUrl: string): Promise<string> {
    const result = await this.analyzeImage(imageUrl)
    return result.altText.slice(0, 125)
  }

  // Verifica se conteúdo é seguro para publicar
  static async checkContentSafety(imageUrl: string): Promise<{ isSafe: boolean; reason?: string }> {
    const result = await this.analyzeImage(imageUrl)
    return { isSafe: result.isSafe }
  }

  private static async analyze(
    imageContent: Array<{ type: string; image_url: { url: string; detail: string } }>
  ): Promise<ImageAnalysisResult> {
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system" as const,
          content: `Você é um analista visual de conteúdo para redes sociais de uma corretora de planos de saúde (Humano Saúde).
Analise a imagem e retorne APENAS JSON:
{
  "objects": ["objeto1", "objeto2"],
  "colors": ["cor1", "cor2"],
  "mood": "profissional/alegre/informativo/etc",
  "description": "Descrição detalhada da imagem",
  "suggestedCaption": "Legenda sugerida",
  "suggestedHashtags": ["#tag1", "#tag2"],
  "isSafe": true,
  "altText": "Texto alternativo acessível (max 125 chars)"
}`,
        },
        {
          role: "user" as const,
          content: [
            { type: "text", text: "Analise esta imagem para publicação nas redes sociais:" },
            ...imageContent,
          ] as Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }>,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" as const },
    }

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error("Erro ao analisar imagem com IA")

    const data = await res.json()
    return JSON.parse(data.choices[0].message.content) as ImageAnalysisResult
  }
}
