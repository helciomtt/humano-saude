// ============================================
// HASHTAG SUGGESTER — Hashtags com GPT-4o-mini
// ============================================

import type { HashtagSuggestOptions, HashtagResult } from "../types"
import { getNetworkConfig } from "../config"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"

export class HashtagSuggester {
  // Sugere hashtags baseadas em conteúdo
  static async suggest(options: HashtagSuggestOptions): Promise<HashtagResult[]> {
    const config = getNetworkConfig(options.network)
    const maxHashtags = options.maxHashtags ?? config.maxHashtags

    const systemPrompt = `Você é um especialista em hashtags para redes sociais.
Sugira hashtags otimizadas para ${config.name} no nicho de planos de saúde / corretora de seguros (Humano Saúde).
Máximo: ${maxHashtags} hashtags.
Idioma: ${options.language ?? "pt-BR"}.
Mix: 30% trending, 40% nicho, 20% branded, 10% general.

Responda APENAS em JSON:
{
  "hashtags": [
    { "tag": "#exemplo", "category": "niche", "popularity": "medium", "relevanceScore": 0.85 }
  ]
}`

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content: `Conteúdo do post: "${options.content}"${options.niche ? `\nNicho específico: ${options.niche}` : ""}`,
        },
      ],
      temperature: 0.6,
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

    if (!res.ok) throw new Error("Erro ao sugerir hashtags")

    const data = await res.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    return (parsed.hashtags ?? []).slice(0, maxHashtags) as HashtagResult[]
  }

  // Sugere hashtags para nicho específico (sem conteúdo)
  static async suggestForNiche(
    niche: string,
    network: "instagram" | "facebook" | "twitter" | "linkedin" | "youtube" | "tiktok" | "pinterest" = "instagram"
  ): Promise<HashtagResult[]> {
    return this.suggest({
      content: `Post sobre ${niche} para corretora de planos de saúde`,
      network,
      niche,
    })
  }

  // Hashtags padrão do nicho saúde (fallback offline)
  static getDefaultHashtags(): string[] {
    return [
      "#planodeaude",
      "#segurosaude",
      "#humanosaude",
      "#saude",
      "#bemestar",
      "#qualidadedevida",
      "#planodesaudeempresarial",
      "#planodesaudeindividual",
      "#corretordeseguros",
      "#vidasaudavel",
      "#prevencao",
      "#saudemental",
      "#planodesaudefamiliar",
      "#seguro",
      "#protecao",
    ]
  }
}
