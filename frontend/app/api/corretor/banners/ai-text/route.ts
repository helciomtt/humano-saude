import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { prompt, operadora, plano, modalidade } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt obrigatorio' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `Você é um Diretor de Arte + Designer de Performance Sênior, especialista em criativos para planos de saúde no Brasil (Meta Ads / Google Ads).

Sua tarefa: transformar o PEDIDO do corretor em um PROMPT TÉCNICO AVANÇADO para IA generativa de imagem.

Contexto: Operadora ${operadora || 'genérica'}, Plano ${plano || 'genérico'}, Modalidade ${modalidade || 'PME'}.

REGRAS OBRIGATÓRIAS:
1. Gere APENAS o prompt técnico, sem explicações ou introduções
2. Use linguagem de design profissional: composição, hierarquia tipográfica, grid, contraste, paleta, safe area
3. Especifique: posição dos elementos (topo/meio/rodapé), tamanhos relativos, estilos de texto, tratamento de fundo
4. Inclua diretrizes de legibilidade mobile, contraste WCAG, e safe area para ads
5. Mencione técnicas específicas: gradientes, overlays, sombras, glassmorphism, etc. quando apropriado
6. Se o pedido menciona logo/imagem anexada, instrua a IA sobre posição e tamanho
7. Mantenha foco em CONVERSÃO (destaque preço, CTA, urgência visual)
8. Máximo 500 caracteres
9. Tom: instruções diretas de briefing criativo para designer sênior
10. NUNCA gere o conteúdo do banner (textos/headlines), apenas INSTRUÇÕES DE DESIGN sobre como ajustar/melhorar a imagem

EXEMPLO DE BOM PROMPT:
"Ajuste o fundo para gradiente radial de #1a1a5e para #0a0a2e. Reposicione a headline para o terço superior com tipografia bold sans-serif 64pt, cor branca com text-shadow 2px. Aumente o preço para 80pt com destaque em caixa dourada (#D4AF37) com rounded corners. CTA no rodapé como botão pill com gradiente verde. Incorpore a logo anexada no canto superior esquerdo, 15% da largura, com drop shadow sutil."

Agora transforme o pedido do corretor em um prompt técnico assim.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Pedido do corretor: ${prompt}` },
    ]);

    const text = result.response.text().trim();

    return NextResponse.json({ success: true, text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[AI Text] Error:', msg);
    return NextResponse.json({ error: 'Erro ao gerar texto' }, { status: 500 });
  }
}
