import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/* ═══════════ PROMPTS ═══════════ */

const ANALYZE_SYSTEM = `Você é um designer gráfico e copywriter especialista em anúncios de planos de saúde do Brasil.
Analise a imagem do anúncio enviada e extraia as seguintes informações em formato JSON:

{
  "headline": "A frase principal/título do anúncio (se houver)",
  "mensagem": "O texto complementar/corpo do anúncio",
  "cta": "O call-to-action (botão/frase de ação)",
  "cores": ["#hex1", "#hex2", "#hex3"] (até 4 cores dominantes detectadas em formato hex),
  "dicas": ["dica1", "dica2", "dica3"] (3 a 5 sugestões de melhoria para o anúncio),
  "layout": "Descrição detalhada do layout: posição dos elementos, tipo de fundo, se tem foto, se é minimalista, disposição de logos, seções, etc.",
  "prompt_sugerido": "Prompt técnico e detalhado para gerar uma versão melhorada deste anúncio com IA generativa de imagem. Descreva composição, cores, tipografia, posição dos elementos, estilo visual. Máximo 3 frases."
}

Regras:
- Responda SOMENTE com o JSON válido, sem markdown, sem explicações
- Se não conseguir detectar algum campo, use string vazia
- Cores devem ser hex válidas
- Dicas devem ser específicas e acionáveis
- Layout deve descrever a composição visual em 2-3 frases detalhadas
- O prompt_sugerido deve ser um prompt técnico que um designer usaria para recriar o anúncio com melhorias`;

/* ═══════════ HANDLER ═══════════ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, imageBase64, operadora, plano, preco, nomeCorretor, whatsapp, instrucao, analysis, refinementPrompt, attachmentBase64, ratio } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY não configurada no servidor' }, { status: 500 });
    }

    /* ══════════════════════════════ ANALYZE ══════════════════════════════ */
    if (action === 'analyze') {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Formato de imagem inválido. Envie JPG, PNG ou WebP.' }, { status: 400 });
      }
      const [, mimeType, base64Data] = match;

      const sizeBytes = base64Data.length * 0.75;
      if (sizeBytes > 15 * 1024 * 1024) {
        return NextResponse.json({ error: 'Imagem muito grande para análise. Máximo ~15MB.' }, { status: 400 });
      }

      logger.info(`[AI Clone] Analyzing image: ${mimeType}, ~${Math.round(sizeBytes / 1024)}KB`);

      const TEXT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
      let result;
      for (const modelName of TEXT_MODELS) {
        try {
          logger.info(`[AI Clone] Tentando modelo: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent([
            { text: ANALYZE_SYSTEM },
            { inlineData: { mimeType, data: base64Data } },
            { text: `Operadora do corretor: ${operadora || 'Amil'}. Plano: ${plano || 'não especificado'}.${instrucao ? ` Instrução adicional: ${instrucao}` : ''}` },
          ]);
          logger.info(`[AI Clone] Análise OK com modelo: ${modelName}`);
          break;
        } catch (modelErr) {
          logger.warn(`[AI Clone] Modelo ${modelName} falhou`, { error: modelErr instanceof Error ? modelErr.message : String(modelErr) });
          if (modelName === TEXT_MODELS[TEXT_MODELS.length - 1]) throw modelErr;
        }
      }

      const rawText = result!.response.text().trim();
      let parsed;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch?.[0] || rawText);
      } catch {
        parsed = {
          headline: '', mensagem: rawText.slice(0, 200), cta: '',
          cores: [], dicas: ['Não foi possível analisar completamente'], layout: 'Não detectado', prompt_sugerido: '',
        };
      }

      if (!Array.isArray(parsed.cores)) parsed.cores = [];
      if (!Array.isArray(parsed.dicas)) parsed.dicas = [];

      return NextResponse.json({
        success: true,
        analysis: {
          headline: parsed.headline || '',
          mensagem: parsed.mensagem || '',
          cta: parsed.cta || '',
          cores: parsed.cores.slice(0, 5),
          dicas: parsed.dicas.slice(0, 5),
          layout: parsed.layout || '',
          prompt_sugerido: parsed.prompt_sugerido || '',
        },
      });
    }

    /* ══════════════════════════════ GENERATE (IMAGE) ══════════════════════════════ */
    if (action === 'generate') {
      if (!analysis) {
        return NextResponse.json({ error: 'Análise obrigatória para gerar' }, { status: 400 });
      }

      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 });
      }
      const [, mimeType, base64Data] = match;

      const opMap: Record<string, string> = {
        amil: 'Amil', sulamerica: 'SulAmérica', bradesco: 'Bradesco Saúde',
        porto: 'Porto Saúde', assim: 'Assim Saúde', levesaude: 'Leve Saúde',
        unimed: 'Unimed', preventsenior: 'Prevent Senior', medsenior: 'MedSenior',
      };
      const opNome = opMap[operadora] || operadora || 'Amil';

      const userPrompt = refinementPrompt?.trim() || '';
      const selectedRatio = ratio || '9:16';
      const isStories = selectedRatio === '9:16';
      const formatLabel = isStories ? 'Stories vertical (9:16, 1080×1920px)' : 'Feed quadrado (4:5, 1080×1350px)';

      const prompt = `Você é um Diretor de Arte + Designer de Performance Sênior, especialista em criativos para planos de saúde no Brasil.
Seu objetivo é criar um banner pronto para tráfego pago (Meta Ads), com alta clareza, contraste, leitura mobile e foco em conversão.

${userPrompt ? `INSTRUÇÃO PRINCIPAL DO CORRETOR:\n"${userPrompt}"` : 'Crie uma versão MELHORADA e PROFISSIONAL deste anúncio.'}

ANÁLISE DO ANÚNCIO ORIGINAL:
- Headline: ${analysis.headline || 'não detectada'}
- Mensagem: ${analysis.mensagem || 'não detectada'}
- CTA: ${analysis.cta || 'não detectado'}
- Layout: ${analysis.layout || 'não detectado'}
- Cores dominantes: ${(analysis.cores || []).join(', ') || 'não detectadas'}

DADOS OBRIGATÓRIOS DO CORRETOR (incorporar no banner):
- Operadora: ${opNome}
- Plano: ${plano || 'Plano de Saúde'}
- Preço: ${preco || 'Consulte valores'}
${nomeCorretor ? `- Corretor: ${nomeCorretor}` : ''}
${whatsapp ? `- WhatsApp: ${whatsapp}` : ''}

${instrucao ? `INSTRUÇÃO EXTRA: ${instrucao}` : ''}
${attachmentBase64 ? 'IMPORTANTE: O usuário anexou uma imagem adicional (a terceira imagem). Incorpore-a no banner como logo, selo, foto ou ícone conforme contexto.' : ''}

FORMATO OBRIGATÓRIO: ${formatLabel}
A imagem DEVE ter exatamente a proporção ${isStories ? '9:16 (vertical/portrait)' : '4:5 (quase quadrado, ligeiramente vertical)'}.
${isStories ? 'Largura 1080px, altura 1920px. Orientação RETRATO (mais alto que largo).' : 'Largura 1080px, altura 1350px. Quase quadrado mas ligeiramente mais alto.'}

REGRAS DE DESIGN:
1. RESPEITE O FORMATO ${isStories ? '9:16 VERTICAL' : '4:5 FEED'} — NÃO gere landscape/horizontal
2. Design premium, profissional, pronto para Meta Ads
3. Mantenha o ESTILO VISUAL do original (cores, composição, identidade)
4. Headline grande, impactante, legível em mobile (min 48pt equivalente)
5. Preço BEM destacado (tamanho grande, cor contrastante, destaque visual)
6. CTA claro e chamativo (botão ou faixa)
7. Tipografia moderna sans-serif, alto contraste
8. Textos SEMPRE legíveis sobre o fundo (usar sombra, overlay ou caixa)
9. Hierarquia visual: Headline → Preço/Benefício → CTA → Dados de contato
10. Safe area: nada importante nos cantos (10% de margem)
${nomeCorretor || whatsapp ? '11. Nome/WhatsApp no rodapé com tamanho menor' : ''}

Gere a imagem agora no formato ${isStories ? '9:16 VERTICAL' : '4:5 FEED'}.`;

      const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ];

      if (attachmentBase64) {
        const attachMatch = attachmentBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (attachMatch) {
          contentParts.push({ inlineData: { mimeType: attachMatch[1], data: attachMatch[2] } });
        }
      }

      const IMAGE_MODELS = ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation', 'gemini-3-pro-image-preview'];

      for (const modelName of IMAGE_MODELS) {
        try {
          logger.info(`[AI Clone] Gerando imagem com modelo: ${modelName}`);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              // @ts-expect-error — responseModalities is available for image generation models
              responseModalities: ['TEXT', 'IMAGE'],
            },
          });

          const genResult = await model.generateContent(contentParts);
          const parts = genResult.response.candidates?.[0]?.content?.parts || [];
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
            logger.info(`[AI Clone] Imagem gerada com sucesso: ${modelName}`);
            return NextResponse.json({
              success: true,
              imageUrl: generatedImageBase64,
              description: aiText || 'Imagem clonada gerada com IA',
            });
          }
        } catch (modelErr) {
          logger.warn(`[AI Clone] Modelo ${modelName} falhou`, { error: modelErr instanceof Error ? modelErr.message : String(modelErr) });
          continue;
        }
      }

      return NextResponse.json({
        success: false,
        error: 'A IA não conseguiu gerar a imagem clonada. Tente novamente.',
      });
    }

    return NextResponse.json({ error: 'Action inválida (use: analyze ou generate)' }, { status: 400 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[AI Clone] Error:', msg);
    return NextResponse.json({ error: 'Erro interno na IA Clone' }, { status: 500 });
  }
}
