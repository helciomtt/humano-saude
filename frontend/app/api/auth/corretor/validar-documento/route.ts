import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

// Lazy initialization — não instanciar no module scope para evitar erro em build sem OPENAI_API_KEY
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * POST /api/auth/corretor/validar-documento
 * Recebe uma imagem (base64 ou File) e o tipo esperado (cnh, rg_frente, rg_verso)
 * Retorna se o documento é válido ou não
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, tipoEsperado } = body as {
      imageBase64: string;
      tipoEsperado: 'cnh' | 'rg_frente' | 'rg_verso';
    };

    if (!imageBase64 || !tipoEsperado) {
      return NextResponse.json(
        { valid: false, error: 'Imagem e tipo são obrigatórios' },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Se não tem API key, aceita qualquer documento (fallback)
      logger.warn('[validar-documento] OPENAI_API_KEY não configurada, aceitando documento');
      return NextResponse.json({ valid: true, message: 'Validação indisponível — documento aceito' });
    }

    // Construir o prompt baseado no tipo de documento
    const promptMap: Record<string, string> = {
      cnh: `Analise esta imagem e determine se é uma CNH (Carteira Nacional de Habilitação) brasileira válida.
Verifique se:
- A imagem mostra claramente um documento do tipo CNH
- É possível identificar elementos característicos como: foto do titular, número do registro, categoria, nome completo, data de nascimento, campos típicos da CNH
- NÃO é outro tipo de documento (RG, passaporte, carteirinha, etc.)
- NÃO é uma foto aleatória, screenshot, ou imagem sem relação com documento

Responda APENAS com um JSON no formato: {"valido": true/false, "motivo": "explicação curta"}`,

      rg_frente: `Analise esta imagem e determine se é a FRENTE de um RG (Registro Geral / Carteira de Identidade) brasileiro.
Verifique se:
- A imagem mostra claramente a frente de um RG brasileiro
- É possível identificar elementos como: foto do titular, número do RG, nome, filiação
- NÃO é uma CNH, passaporte, ou outro documento
- NÃO é o verso do RG
- NÃO é uma foto aleatória

Responda APENAS com um JSON no formato: {"valido": true/false, "motivo": "explicação curta"}`,

      rg_verso: `Analise esta imagem e determine se é o VERSO de um RG (Registro Geral / Carteira de Identidade) brasileiro.
Verifique se:
- A imagem mostra claramente o verso de um RG brasileiro
- É possível identificar elementos como: CPF, data de expedição, impressão digital, assinatura
- NÃO é a frente do RG
- NÃO é uma CNH, passaporte, ou outro documento
- NÃO é uma foto aleatória

Responda APENAS com um JSON no formato: {"valido": true/false, "motivo": "explicação curta"}`,
    };

    const prompt = promptMap[tipoEsperado];
    if (!prompt) {
      return NextResponse.json({ valid: true, message: 'Tipo não requer validação visual' });
    }

    // Garantir que o base64 tem o prefixo correto
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'low' },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '';
    
    // Tentar parsear o JSON da resposta
    try {
      // Extrair JSON do conteúdo (pode ter markdown ao redor)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          valid: result.valido === true,
          message: result.motivo || (result.valido ? 'Documento válido' : 'Documento não corresponde ao tipo selecionado'),
        });
      }
    } catch {
      logger.error('[validar-documento] Erro ao parsear resposta:', content);
    }

    // Se não conseguiu parsear, aceitar (fail-open)
    return NextResponse.json({ valid: true, message: 'Validação inconclusiva — documento aceito' });
  } catch (err) {
    logger.error('[validar-documento] Erro:', err);
    // Em caso de erro, aceitar o documento (fail-open para não bloquear o usuário)
    return NextResponse.json({ valid: true, message: 'Erro na validação — documento aceito' });
  }
}
