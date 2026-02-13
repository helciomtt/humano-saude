import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

// ═══ CONFIGURAÇÃO FIXA — NÃO ALTERAR SEM AUDITORIA ═══
const VERTEX_MODEL = 'gemini-2.0-flash-001';
const VERTEX_LOCATION = 'us-central1';

// ═══ AUTH: Service Account do projeto Adaga Braca (GCP com créditos R$1.700) ═══
function getVertexAI() {
  const saJSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurada');
  }

  const credentials = JSON.parse(saJSON);
  const projectId = credentials.project_id; // gen-lang-client-0591725975 (Vertex AI ativo)
  const clientEmail = credentials.client_email;

  logger.info(`[AUDITORIA IA] Modelo: ${VERTEX_MODEL} | Projeto: ${projectId} | SA: ${clientEmail} | Location: ${VERTEX_LOCATION}`);

  return new VertexAI({
    project: projectId,
    location: VERTEX_LOCATION,
    googleAuthOptions: {
      credentials,
    },
  });
}

const SYSTEM_PROMPT = `Você é um especialista em faturas de planos de saúde brasileiros.
Analise o documento e retorne APENAS um JSON válido com estes campos:

{
  "operadora": "nome da operadora (Amil, Bradesco Saúde, SulAmérica, Unimed, Porto Saúde, Prevent Senior, MedSênior, Assim Saúde, Golden Cross, NotreDame Intermédica, Hapvida, Leve Saúde, etc)",
  "plano": "nome do plano se visível",
  "valor_total": 1234.56,
  "vencimento": "DD/MM/YYYY",
  "beneficiarios": 3,
  "titular": "nome do titular/pagador",
  "razao_social": "razão social do sacado/pagador",
  "documento": "CPF ou CNPJ do sacado",
  "tipo_pessoa": "PF ou PJ",
  "faixas_etarias": ["0-18", "29-33", "59+"],
  "confianca": 85
}

REGRAS:
- OPERADORA = empresa do plano de saúde, NÃO o banco do boleto.
- VALOR = procure "Valor do Documento", "Total a Pagar", "Valor Cobrado". Só o número, sem R$.
- SACADO/PAGADOR = nome e documento perto do código de barras.
- CNPJ ou palavras LTDA/S.A/ME/EIRELI = tipo_pessoa "PJ". CPF = tipo_pessoa "PF".
- FAIXAS ETÁRIAS formato ANS: 0-18, 19-23, 24-28, 29-33, 34-38, 39-43, 44-48, 49-53, 54-58, 59+
- Foque no QUADRO DE RESUMO e na área do sacado/pagador.
- Se não encontrar um campo, use null.
- Retorne SOMENTE o JSON, sem markdown, sem explicação.`;

// ─── Parsear resposta JSON ───
function parseResponse(content: string) {
  let jsonStr = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const dados = JSON.parse(jsonStr);
  return {
    operadora: dados.operadora || null,
    plano: dados.plano || null,
    valor_total: dados.valor_total || null,
    vencimento: dados.vencimento || null,
    beneficiarios: dados.beneficiarios || null,
    titular: dados.titular || null,
    razao_social: dados.razao_social || null,
    documento: dados.documento || null,
    tipo_pessoa: dados.tipo_pessoa === 'PF' || dados.tipo_pessoa === 'PJ' ? dados.tipo_pessoa : null,
    faixas_etarias: Array.isArray(dados.faixas_etarias) ? dados.faixas_etarias : null,
    confianca: dados.confianca || 0,
  };
}

// ─── Retry com backoff exponencial ───
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 2000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        lastError.message.includes('429') ||
        lastError.message.includes('RESOURCE_EXHAUSTED') ||
        lastError.message.includes('Too Many Requests') ||
        lastError.message.includes('quota') ||
        lastError.message.includes('UNAVAILABLE') ||
        lastError.message.includes('503');

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = initialDelayMs * Math.pow(2, attempt);
      logger.info(`[OCR] ⏳ Erro 429/503, retry em ${delay}ms (tentativa ${attempt + 1}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

// ─── MAIN POST ───
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('fatura') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    logger.info(`[OCR] ═══════════════════════════════════════`);
    logger.info(`[OCR] Arquivo: ${file.name}, type: ${file.type}, size: ${fileSizeMB}MB`);

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type);

    if (!isPDF && !isImage) {
      return NextResponse.json(
        { error: 'Formato não suportado. Envie PDF, JPG, PNG ou WebP.' },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20MB.' }, { status: 400 });
    }

    if (file.size < 100) {
      return NextResponse.json({ error: 'Arquivo parece vazio ou corrompido.' }, { status: 400 });
    }

    // ═══ DETERMINAR MIME TYPE ═══
    let mimeType = file.type;
    if (isPDF) {
      mimeType = 'application/pdf';
    } else if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      mimeType = 'image/jpeg';
    } else if (!mimeType || mimeType === 'application/octet-stream') {
      mimeType = 'image/jpeg';
    }

    // ═══ CONVERTER PARA BASE64 ═══
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    logger.info(`[OCR] Base64 gerado: ${(base64Data.length / 1024).toFixed(0)}KB`);

    // ═══ VERTEX AI (Projeto Adaga Braca com créditos GCP R$1.700) ═══
    const vertexAI = getVertexAI();
    const model = vertexAI.getGenerativeModel({
      model: VERTEX_MODEL,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }],
      },
    });

    logger.info(`[OCR] Enviando para Vertex AI (${VERTEX_MODEL}) com retry...`);

    const text = await withRetry(async () => {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: 'Analise esta fatura de plano de saúde e extraia os dados solicitados.',
              },
            ],
          },
        ],
      });

      const response = result.response;
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('Nenhuma resposta do modelo');
      }
      const parts = candidates[0].content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error('Resposta vazia do modelo');
      }
      return parts[0].text || '';
    });

    // ═══ LOG DA RESPOSTA BRUTA ═══
    logger.info(`[OCR] ═══ RESPOSTA BRUTA DO GEMINI (VERTEX AI) ═══`);
    logger.info(text);
    logger.info(`[OCR] ═══ FIM DA RESPOSTA BRUTA ═══`);

    // ═══ DETECÇÃO DE HTML (endpoint errado / auth redirect) ═══
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<HTML')) {
      logger.error(`[AUDITORIA IA] ⚠️ API RETORNOU HTML! Endpoint incorreto ou redirect de auth.`);
      logger.error(`[AUDITORIA IA] Primeiros 300 chars: ${text.substring(0, 300)}`);
      return NextResponse.json({
        success: false,
        error: 'Erro de configuração do servidor. Contate o suporte.',
      });
    }

    if (!text || text.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Não conseguimos ler o documento. Preencha os dados manualmente.',
      });
    }

    // ═══ PARSEAR JSON ═══
    try {
      const dados = parseResponse(text);
      logger.info('[OCR] DADOS EXTRAÍDOS', { dados });
      return NextResponse.json({ success: true, dados });
    } catch (parseErr) {
      logger.error('[OCR] Erro ao parsear JSON', parseErr, { rawText: text.substring(0, 500) });
      return NextResponse.json({
        success: false,
        error: 'Não foi possível extrair os dados. Preencha manualmente.',
      });
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno';
    const errorStr = String(err);
    logger.error('[OCR] ❌ Erro:', errorMsg);

    // Detecção de HTML no erro (endpoint inválido retorna HTML)
    if (errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html') || errorStr.includes('<!DOCTYPE')) {
      logger.error(`[AUDITORIA IA] ⚠️ RESPOSTA HTML DETECTADA NO ERRO!`);
      logger.error(`[AUDITORIA IA] Isso indica endpoint incorreto. Verifique VERTEX_LOCATION e VERTEX_MODEL.`);
      logger.error(`[AUDITORIA IA] Location atual: ${VERTEX_LOCATION} | Modelo: ${VERTEX_MODEL}`);
    }

    let userMsg = 'Não conseguimos processar o arquivo. Preencha os dados manualmente.';
    if (errorMsg.includes('SAFETY')) {
      userMsg = 'O arquivo não pôde ser processado. Tente outro ou preencha manualmente.';
    } else if (errorMsg.includes('too large') || errorMsg.includes('size')) {
      userMsg = 'Arquivo muito grande. Tire um print da fatura e envie como imagem.';
    } else if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      logger.error(`[AUDITORIA IA] ⚠️ ERRO 429 RESOURCE_EXHAUSTED após todas as tentativas de retry!`);
      logger.error(`[AUDITORIA IA] Modelo: ${VERTEX_MODEL} | Isso NÃO deveria acontecer com faturamento ativo.`);
      logger.error(`[AUDITORIA IA] Checklist: 1) Vertex AI API ativa? 2) Cota do projeto no GCP Console? 3) Billing vinculado?`);
      userMsg = 'Sistema temporariamente ocupado. Tente novamente em 30 segundos.';
    } else if (errorMsg.includes('GOOGLE_SERVICE_ACCOUNT_JSON')) {
      userMsg = 'Erro de configuração do servidor. Contate o suporte.';
      logger.error('[AUDITORIA IA] ⚠️ GOOGLE_SERVICE_ACCOUNT_JSON não está configurada!');
    } else if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('403')) {
      logger.error(`[AUDITORIA IA] ⚠️ ERRO 403 PERMISSION_DENIED!`);
      logger.error(`[AUDITORIA IA] A Service Account não tem papel "Usuário do Vertex AI" no projeto.`);
      userMsg = 'Erro de permissão no servidor. Contate o suporte.';
    }

    return NextResponse.json({ success: false, error: userMsg });
  }
}
