// ============================================
// CAPTION GENERATOR — Legendas com GPT-4o-mini
// ============================================

import type { CaptionGenerateOptions, CaptionResult, CaptionTone } from "../types"
import { getNetworkConfig } from "../config"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"

export class CaptionGenerator {
  // Gera legenda otimizada para a rede
  static async generate(options: CaptionGenerateOptions): Promise<CaptionResult> {
    const config = getNetworkConfig(options.network)
    const maxLen = options.maxLength ?? config.maxCaptionLength

    const systemPrompt = `Você é um social media expert especializado em corretora de planos de saúde (Humano Saúde).
Crie legendas envolventes e otimizadas para ${config.name}.
Limite: ${maxLen} caracteres.
Tom: ${this.getToneDescription(options.tone)}.
Idioma: ${options.language ?? "pt-BR"}.
${options.includeEmojis !== false ? "Use emojis estrategicamente." : "Não use emojis."}
${options.includeHashtags ? `Inclua até ${config.maxHashtags} hashtags relevantes do nicho de saúde/seguros.` : "Não inclua hashtags na legenda."}`

    const userPrompt = `Crie uma legenda para um post tipo "${options.postType}" sobre: ${options.topic}
${options.keywords?.length ? `Palavras-chave: ${options.keywords.join(", ")}` : ""}
${options.imageDescription ? `A imagem mostra: ${options.imageDescription}` : ""}

Responda APENAS em JSON: { "caption": "...", "hashtags": ["...", "..."] }`

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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

    if (!res.ok) throw new Error("Erro ao gerar legenda com IA")

    const data = await res.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    return {
      caption: parsed.caption,
      hashtags: parsed.hashtags ?? [],
      characterCount: parsed.caption.length,
      tone: options.tone,
    }
  }

  // Gera N variações com tons diferentes
  static async generateVariations(
    options: CaptionGenerateOptions,
    count = 3
  ): Promise<CaptionResult[]> {
    const tones: CaptionTone[] = ["professional", "casual", "fun", "inspirational", "educational"]
    const selectedTones = tones.slice(0, count)

    const results = await Promise.all(
      selectedTones.map((tone) => this.generate({ ...options, tone }))
    )

    return results
  }

  // Melhora legenda existente com feedback
  static async improve(caption: string, feedback: string): Promise<CaptionResult> {
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system" as const,
          content: "Você é um editor de social media. Melhore a legenda abaixo baseado no feedback. Responda APENAS em JSON: { \"caption\": \"...\", \"hashtags\": [] }",
        },
        {
          role: "user" as const,
          content: `Legenda original: "${caption}"\n\nFeedback: ${feedback}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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

    if (!res.ok) throw new Error("Erro ao melhorar legenda")

    const data = await res.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    return {
      caption: parsed.caption,
      hashtags: parsed.hashtags ?? [],
      characterCount: parsed.caption.length,
      tone: "professional",
    }
  }

  private static getToneDescription(tone: CaptionTone): string {
    const descriptions: Record<CaptionTone, string> = {
      professional: "Profissional, confiável, autoritativo. Ideal para corretora de seguros.",
      casual: "Descontraído, próximo, como uma conversa com um amigo.",
      fun: "Divertido, com humor leve e emojis.",
      inspirational: "Inspirador, motivacional, que gera conexão emocional.",
      educational: "Educativo, informativo, que ensina algo novo sobre saúde.",
    }
    return descriptions[tone]
  }
}
