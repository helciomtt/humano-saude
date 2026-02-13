import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/* Fallbacks por ângulo para quando a IA falhar */
const FALLBACKS: Record<string, { headline: string; sub: string; badge: string }[]> = {
  reajuste: [
    { headline: 'CANSOU DE PAGAR CARO?', sub: 'Troque agora e economize até 40% no seu plano', badge: 'TROQUE JÁ' },
    { headline: 'REAJUSTE PESOU NO BOLSO?', sub: 'Encontre o mesmo plano por menos', badge: 'COMPARE AGORA' },
    { headline: 'SEU PLANO SUBIU DE NOVO?', sub: 'Descubra opções com até 40% de economia', badge: 'REAJUSTE 2026' },
  ],
  economia: [
    { headline: 'ECONOMIZE ATÉ R$500/MÊS', sub: 'O melhor custo-benefício do mercado', badge: 'ECONOMIA REAL' },
    { headline: 'PAGUE MENOS, TENHA MAIS', sub: 'Planos completos com preços que cabem no bolso', badge: 'MELHOR PREÇO' },
    { headline: 'ATÉ 40% MAIS BARATO', sub: 'Compare e comprove a economia real', badge: 'COMPROVE' },
  ],
  urgencia: [
    { headline: 'CONDIÇÃO ESPECIAL HOJE', sub: 'Valor promocional válido somente esta semana', badge: 'SÓ ESTA SEMANA' },
    { headline: 'ÚLTIMOS DIAS COM DESCONTO', sub: 'Aproveite antes do próximo reajuste', badge: 'ACABA EM BREVE' },
    { headline: 'PREÇO CONGELADO ATÉ SEXTA', sub: 'Garanta agora e pague o valor de hoje', badge: 'CORRA' },
  ],
  familia: [
    { headline: 'PROTEJA QUEM VOCÊ AMA', sub: 'O melhor plano para sua família inteira', badge: 'PROTEÇÃO TOTAL' },
    { headline: 'SUA FAMÍLIA MERECE MAIS', sub: 'Cobertura completa para todos com carinho', badge: 'PARA A FAMÍLIA' },
    { headline: 'CUIDE DE QUEM IMPORTA', sub: 'Plano familiar completo e acessível', badge: 'FAMÍLIA SEGURA' },
  ],
  autoridade: [
    { headline: '+10.000 FAMÍLIAS CONFIAM', sub: 'A operadora mais bem avaliada do RJ', badge: 'MAIS ESCOLHIDO' },
    { headline: 'NOTA MÁXIMA NA ANS', sub: 'Qualidade reconhecida por milhares de clientes', badge: 'TOP ANS' },
    { headline: '95% DE APROVAÇÃO', sub: 'Clientes satisfeitos em todo o Rio de Janeiro', badge: 'REFERÊNCIA' },
  ],
  oportunidade: [
    { headline: 'PREÇO QUE NÃO VOLTA', sub: 'Garanta agora antes do próximo reajuste', badge: 'OPORTUNIDADE' },
    { headline: 'JANELA DE OPORTUNIDADE', sub: 'Valor especial por tempo limitado', badge: 'APROVEITE' },
    { headline: 'ÚLTIMA CHANCE NESTE VALOR', sub: 'Preço promocional válido só este mês', badge: 'SÓ AGORA' },
  ],
  rede: [
    { headline: 'REDE PREMIUM AO SEU ALCANCE', sub: 'Os melhores hospitais e laboratórios do RJ', badge: 'REDE PREMIUM' },
    { headline: 'HOSPITAIS TOP DO RIO', sub: 'Acesse a melhor rede credenciada do mercado', badge: 'REDE TOP' },
    { headline: 'QUALIDADE SEM IGUAL', sub: 'Copa D\'Or, Samaritano e muito mais', badge: 'REDE D\'OR' },
  ],
};

function getRandomFallback(anguloId: string): { headline: string; sub: string; badge: string } {
  const list = FALLBACKS[anguloId] || FALLBACKS.economia;
  return list[Math.floor(Math.random() * list.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { angulo, operadora, plano, modalidade, zona } = await req.json();

    if (!angulo) {
      return NextResponse.json({ error: 'Angulo obrigatório' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Voce e um copywriter de planos de saude do Brasil. Gere textos para anuncio Meta Ads.

Angulo: ${angulo.nome} - ${angulo.descricao}
Operadora: ${operadora || 'generica'}
Plano: ${plano || 'generico'}
Modalidade: ${modalidade || 'PME'}
${zona ? `Regiao: ${zona}` : ''}

Retorne SOMENTE um JSON (sem markdown):
{"headline":"TEXTO MAIUSCULO MAX 6 PALAVRAS","sub":"frase persuasiva max 60 chars","badge":"BADGE MAX 3 PALAVRAS"}

Regras: varie bastante, use gatilhos emocionais, NAO use VAGAS/MATRICULA/INSCRICAO, pode usar percentuais mas NAO invente precos em R$.`;

    /* Tenta até 2x */
    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent([{ text: prompt }]);
        const responseText = result.response.text().trim();
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.headline && parsed.sub && parsed.badge) {
            return NextResponse.json({
              success: true,
              headline: String(parsed.headline).toUpperCase().slice(0, 50),
              sub: String(parsed.sub).slice(0, 80),
              badge: String(parsed.badge).toUpperCase().slice(0, 25),
            });
          }
        }
        lastError = 'JSON inválido na resposta';
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        /* Espera 500ms antes do retry */
        if (attempt < 1) await new Promise(r => setTimeout(r, 500));
      }
    }

    /* Se falhou 2x, retorna fallback aleatório */
    logger.warn('[AI Angulo] Fallback usado após erro', { error: lastError });
    const fb = getRandomFallback(angulo.id || 'economia');
    return NextResponse.json({ success: true, ...fb });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[AI Angulo] Error:', msg);
    /* Mesmo em erro total, retorna fallback para não quebrar a UX */
    const fb = getRandomFallback('economia');
    return NextResponse.json({ success: true, ...fb });
  }
}
