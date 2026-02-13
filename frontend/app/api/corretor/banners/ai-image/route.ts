import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, operadora, plano, modalidade, angulo, template, ratio, refinementPrompt, previousImageBase64, attachmentBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const isStories = ratio === '9:16';
    const isRefinement = !!(refinementPrompt && previousImageBase64);

    /* ── Tenta modelos com suporte a geração de imagem (em ordem de preferência) ── */
    const modelsToTry = ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation', 'gemini-3-pro-image-preview'];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            // @ts-expect-error — responseModalities is available for image generation models
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        /* ── Prompt principal (nova geração) ── */
        const basePrompt = `Você é um designer sênior de anúncios para Instagram no segmento de planos de saúde do Brasil.

Analise este banner criativo e gere uma NOVA versão visual profissional inspirada nele, porém mais impactante e premium.

Contexto:
- Operadora: ${operadora || 'genérica'}
- Plano: ${plano || 'genérico'}
- Modalidade: ${modalidade || 'PME'}
- Ângulo de venda: ${angulo || 'economia'}
- Template: ${template || 'tabela'}
- Formato: ${isStories ? 'Stories 9:16 (1080x1920)' : 'Feed 4:5 (1080x1350)'}

Gere uma imagem de anúncio profissional para Instagram ${isStories ? 'Stories (vertical 9:16)' : 'Feed (4:5)'} com:
- Design moderno, premium, clean
- Cores da operadora ${operadora}
- Tipografia impactante e legível
- Elementos visuais de saúde/bem-estar
- O texto principal e preços visíveis no banner original devem ser preservados ou melhorados
- Estilo glassmorphism ou neobrutalism moderno
- Alta qualidade visual para Meta Ads

IMPORTANTE: Gere a imagem no formato ${isStories ? 'vertical (portrait 9:16)' : 'portrait (4:5)'} adequado para ${isStories ? 'Instagram Stories' : 'Instagram Feed'}.`;

        /* ── Prompt de refinamento (ajustar imagem existente) ── */
        const hasAttachment = !!(isRefinement && attachmentBase64);
        const refinePrompt = `Você é um designer sênior de anúncios para Instagram no segmento de planos de saúde do Brasil.

Eu já gerei esta imagem de anúncio (a segunda imagem anexada). Agora preciso que você faça os seguintes AJUSTES nela:

"${refinementPrompt}"

${hasAttachment ? `IMPORTANTE: O usuário anexou uma imagem adicional (a terceira imagem). Use essa imagem conforme a instrução acima — pode ser uma logo, foto, ícone ou outro elemento visual que deve ser INCORPORADO no banner. Integre-a de forma profissional no design.` : ''}

Contexto do banner:
- Operadora: ${operadora || 'genérica'}
- Plano: ${plano || 'genérico'}
- Formato: ${isStories ? 'Stories 9:16 (1080x1920)' : 'Feed 4:5 (1080x1350)'}

REGRAS CRÍTICAS:
1. MANTENHA a mesma estrutura, layout e composição da imagem atual
2. Aplique SOMENTE as alterações solicitadas pelo usuário
3. NÃO mude elementos que não foram mencionados
4. Mantenha o formato ${isStories ? 'vertical (portrait 9:16)' : 'portrait (4:5)'}
5. Mantenha a qualidade profissional para Meta Ads
6. Se o pedido envolver texto, mantenha tipografia impactante e legível
${hasAttachment ? '7. Integre a imagem anexada (terceira imagem) conforme solicitado pelo usuário' : ''}

Gere a imagem ajustada agora.`;

        const prompt = isRefinement ? refinePrompt : basePrompt;

        /* ── Montar content parts ── */
        const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data,
            },
          },
        ];

        /* Se é refinamento, enviar também a imagem previamente gerada */
        if (isRefinement) {
          const prevBase64 = previousImageBase64.replace(/^data:image\/\w+;base64,/, '');
          contentParts.push({
            inlineData: {
              mimeType: 'image/png',
              data: prevBase64,
            },
          });

          /* Se tem anexo (logo, foto, etc.), enviar como terceira imagem */
          if (attachmentBase64) {
            const attachMatch = attachmentBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (attachMatch) {
              contentParts.push({
                inlineData: {
                  mimeType: attachMatch[1],
                  data: attachMatch[2],
                },
              });
            }
          }

          contentParts.push({ text: `Ajuste solicitado: "${refinementPrompt}".${attachmentBase64 ? ' Use a terceira imagem anexada conforme a instrução.' : ''} Aplique na segunda imagem (o banner gerado) mantendo a estrutura.` });
        }

        logger.info(`[AI Image] ${isRefinement ? 'Refinando' : 'Gerando'} com modelo: ${modelName}`);

        const result = await model.generateContent(contentParts);

        /* Extrair imagem gerada da resposta */
        const parts = result.response.candidates?.[0]?.content?.parts || [];
        let generatedImageBase64: string | null = null;
        let aiText = '';

        for (const part of parts) {
          if (part.inlineData?.data) {
            generatedImageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
          if (part.text) {
            aiText += part.text;
          }
        }

        if (generatedImageBase64) {
          return NextResponse.json({
            success: true,
            imageUrl: generatedImageBase64,
            description: aiText || 'Imagem gerada com IA',
          });
        }
        /* Se não gerou imagem, tenta próximo modelo */
      } catch (modelErr) {
        logger.warn(`[AI Image] Model ${modelName} failed`, { error: modelErr instanceof Error ? modelErr.message : String(modelErr) });
        continue; /* tenta próximo modelo */
      }
    }

    /* Fallback: nenhum modelo conseguiu gerar imagem */
    return NextResponse.json({
      success: false,
      error: 'A IA não conseguiu gerar uma imagem neste momento. Verifique se sua API key do Google AI tem acesso a modelos de geração de imagem (gemini-2.5-flash-image). Tente novamente.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[AI Image Gen] Error:', msg);
    return NextResponse.json({ error: `Erro ao gerar imagem com IA: ${msg}` }, { status: 500 });
  }
}
