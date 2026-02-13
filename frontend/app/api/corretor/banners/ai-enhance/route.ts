import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, operadora, plano, modalidade, angulo, template } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagem obrigatoria' }, { status: 400 });
    }

    // Remove data:image/png;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `Voce e um designer senior especialista em criativos para Meta Ads (Facebook/Instagram) no segmento de planos de saude do Brasil.

Analise este banner e gere uma versao MELHORADA dos textos com foco em ALTA CONVERSAO.

Contexto:
- Operadora: ${operadora || 'generica'}
- Plano: ${plano || 'generico'}  
- Modalidade: ${modalidade || 'PME'}
- Angulo de anuncio: ${angulo || 'economia'}
- Template: ${template || 'destaque'}

VOCE DEVE retornar APENAS um JSON valido com esta estrutura exata (sem markdown, sem explicacao):
{
  "headline": "HEADLINE MELHORADA (max 6 palavras, impactante, caps)",
  "badge": "BADGE CURTO (max 3 palavras, caps)",
  "mensagem": "Frase persuasiva com gatilho mental (max 80 chars)",
  "cta": "TEXTO DO BOTAO CTA (max 5 palavras, caps)",
  "dicas": "3 dicas rapidas de melhoria visual separadas por |"
}

Regras de copywriting Meta Andromeda:
- Headline deve causar INTERRUPCAO no scroll (pattern interrupt)
- Badge deve criar URGENCIA ou ESCASSEZ
- Mensagem deve ter GATILHO EMOCIONAL + beneficio claro
- CTA deve ter VERBO DE ACAO forte
- Use numeros quando possivel (40%, R$500, 10.000+)
- NAO invente precos especificos
- Adapte ao angulo selecionado (${angulo})`;

    const result = await model.generateContent([
      { text: systemPrompt },
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text().trim();
    
    // Try to parse JSON from response (may have markdown code blocks)
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // Fallback: return raw text
      return NextResponse.json({ 
        success: true, 
        enhanced: {
          headline: 'ECONOMIZE AGORA',
          badge: 'OFERTA LIMITADA',
          mensagem: 'Troque de plano e pague menos com a mesma qualidade',
          cta: 'GARANTA SUA VAGA',
          dicas: 'Adicione imagem de fundo | Teste angulo de urgencia | Use cores contrastantes',
        }
      });
    }

    return NextResponse.json({ success: true, enhanced: parsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[AI Enhance] Error:', msg);
    return NextResponse.json({ error: 'Erro ao analisar com IA' }, { status: 500 });
  }
}
