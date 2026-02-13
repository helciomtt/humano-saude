import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

// ─── Mapa de faixas ANS para idade média ──────────
const FAIXA_PARA_IDADE: Record<string, number> = {
  '0-18': 10,
  '19-23': 21,
  '24-28': 26,
  '29-33': 31,
  '34-38': 36,
  '39-43': 41,
  '44-48': 46,
  '49-53': 51,
  '54-58': 56,
  '59+': 65,
};

// ─── Mapear idade para faixa ANS ─────────────────
function idadeParaFaixa(idadeStr: string): string {
  // Se já é uma faixa (ex: "29-33"), retorna direto
  if (idadeStr.includes('-') || idadeStr.includes('+')) return idadeStr;
  const idade = parseInt(idadeStr, 10);
  if (isNaN(idade)) return '29-33';
  if (idade <= 18) return '0-18';
  if (idade <= 23) return '19-23';
  if (idade <= 28) return '24-28';
  if (idade <= 33) return '29-33';
  if (idade <= 38) return '34-38';
  if (idade <= 43) return '39-43';
  if (idade <= 48) return '44-48';
  if (idade <= 53) return '49-53';
  if (idade <= 58) return '54-58';
  return '59+';
}

// ─── Logos das operadoras ─────────────────────────
const OPERADORA_LOGOS: Record<string, string> = {
  amil: '/images/operadoras/amil-logo.png',
  sulamerica: '/images/operadoras/sulamerica-logo.png',
  bradesco: '/images/operadoras/bradesco-logo.png',
  porto: '/images/operadoras/portosaude-logo.png',
  assim: '/images/operadoras/assimsaude-logo.png',
  levesaude: '/images/operadoras/levesaude-logo.png',
  unimed: '/images/operadoras/unimed-logo.png',
  preventsenior: '/images/operadoras/preventsenior-logo.png',
  medsenior: '/images/operadoras/medsenior-logo.png',
};

const OPERADORA_NOMES: Record<string, string> = {
  amil: 'Amil',
  sulamerica: 'SulAmérica',
  bradesco: 'Bradesco Saúde',
  porto: 'Porto Saúde',
  assim: 'Assim Saúde',
  levesaude: 'Leve Saúde',
  unimed: 'Unimed FERJ',
  preventsenior: 'Prevent Senior',
  medsenior: 'MedSênior',
};

// Normalizar nome da operadora atual para ID
function normalizarOperadora(nome: string | null): string | null {
  if (!nome) return null;
  const n = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('amil')) return 'amil';
  if (n.includes('sulamerica') || n.includes('sul america')) return 'sulamerica';
  if (n.includes('bradesco')) return 'bradesco';
  if (n.includes('porto')) return 'porto';
  if (n.includes('assim')) return 'assim';
  if (n.includes('leve')) return 'levesaude';
  if (n.includes('unimed')) return 'unimed';
  if (n.includes('prevent')) return 'preventsenior';
  if (n.includes('medsenior') || n.includes('med senior')) return 'medsenior';
  if (n.includes('golden')) return null; // Não temos preços
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      valor_atual,
      operadora_atual,
      idades, // array de strings: ["29-33", "0-18", ...]
      tipo_pessoa, // "PF" | "PJ"
    } = body;

    if (!valor_atual || !idades || idades.length === 0) {
      return NextResponse.json({ error: 'valor_atual e idades são obrigatórios' }, { status: 400 });
    }

    // Converter idades para faixas ANS
    const faixas = (idades as string[]).map(idadeParaFaixa);
    const qtdVidas = faixas.length;

    // Determinar modalidade baseado no tipo_pessoa e qtd vidas
    const modalidade = tipo_pessoa === 'PJ' || qtdVidas >= 2 ? 'PME' : 'PF';

    // ID da operadora atual (para excluir das propostas)
    const operadoraAtualId = normalizarOperadora(operadora_atual);

    // Buscar todos os planos da modalidade adequada
    const { data: planos, error } = await supabase
      .from('planos_operadora')
      .select('*, precos_faixa(*)')
      .eq('modalidade', modalidade)
      .eq('ativo', true)
      .order('operadora_nome', { ascending: true });

    if (error) {
      logger.error('[Simular] DB error:', error.message);
    }

    // Também buscar da tabela planos_saude (legacy)
    const tipoContratacao = modalidade === 'PME' ? 'PME' : tipo_pessoa === 'PJ' ? 'PME' : 'PF';
    const { data: planosLegacy } = await supabase
      .from('planos_saude')
      .select('*')
      .eq('tipo_contratacao', tipoContratacao)
      .eq('ativo', true);

    // Calcular valor por beneficiário em cada plano
    interface PropostaCalc {
      operadora_id: string;
      operadora_nome: string;
      plano_nome: string;
      logo: string;
      valor_total: number;
      valores_por_faixa: { faixa: string; valor: number }[];
      coparticipacao: boolean;
      coparticipacao_pct?: number;
      abrangencia: string;
      rede_hospitalar: string[];
      economia_valor: number;
      economia_pct: number;
      notas: string | null;
      fonte: 'novo' | 'legacy';
    }

    const propostas: PropostaCalc[] = [];

    // ─── Processar planos novos (planos_operadora + precos_faixa) ──
    if (planos && planos.length > 0) {
      for (const plano of planos) {
        // Pular a operadora atual do cliente
        if (operadoraAtualId && plano.operadora_id === operadoraAtualId) continue;

        // Verificar se tem preços para as faixas necessárias
        const precosFaixa = plano.precos_faixa || [];
        if (precosFaixa.length === 0) continue;

        // Verificar vidas min/max
        if (plano.vidas_min && qtdVidas < plano.vidas_min) continue;
        if (plano.vidas_max && qtdVidas > plano.vidas_max) continue;

        // Calcular valor total para este plano
        let valorTotal = 0;
        let todasFaixasCobertas = true;
        const valoresPorFaixa: { faixa: string; valor: number }[] = [];

        for (const faixa of faixas) {
          const preco = precosFaixa.find(
            (p: { faixa_etaria: string; valor: number }) => p.faixa_etaria === faixa,
          );
          if (!preco) {
            todasFaixasCobertas = false;
            break;
          }
          valorTotal += Number(preco.valor);
          valoresPorFaixa.push({ faixa, valor: Number(preco.valor) });
        }

        if (!todasFaixasCobertas) continue;

        const economiaValor = valor_atual - valorTotal;
        const economiaPct = (economiaValor / valor_atual) * 100;

        // Só incluir se for mais barato
        if (economiaValor > 0) {
          propostas.push({
            operadora_id: plano.operadora_id,
            operadora_nome: plano.operadora_nome || OPERADORA_NOMES[plano.operadora_id] || plano.operadora_id,
            plano_nome: plano.plano_nome,
            logo: OPERADORA_LOGOS[plano.operadora_id] || '/images/operadoras/amil-logo.png',
            valor_total: Math.round(valorTotal * 100) / 100,
            valores_por_faixa: valoresPorFaixa,
            coparticipacao: plano.coparticipacao || false,
            coparticipacao_pct: plano.coparticipacao_pct ? Number(plano.coparticipacao_pct) : undefined,
            abrangencia: plano.abrangencia || 'RJ',
            rede_hospitalar: plano.rede_hospitalar || [],
            economia_valor: Math.round(economiaValor * 100) / 100,
            economia_pct: Math.round(economiaPct * 10) / 10,
            notas: plano.notas,
            fonte: 'novo',
          });
        }
      }
    }

    // ─── Processar planos legacy (planos_saude com valores JSONB) ──
    if (planosLegacy && planosLegacy.length > 0) {
      for (const plano of planosLegacy) {
        const opId = normalizarOperadora(plano.operadora);
        if (operadoraAtualId && opId === operadoraAtualId) continue;

        // Já temos proposta desta operadora nos planos novos? Skip
        if (opId && propostas.some((p) => p.operadora_id === opId)) continue;

        const valores = plano.valores as Record<string, number>;
        if (!valores) continue;

        let valorTotal = 0;
        let todasFaixasCobertas = true;
        const valoresPorFaixa: { faixa: string; valor: number }[] = [];

        for (const faixa of faixas) {
          const val = valores[faixa];
          if (!val || val === 0) {
            todasFaixasCobertas = false;
            break;
          }
          valorTotal += Number(val);
          valoresPorFaixa.push({ faixa, valor: Number(val) });
        }

        if (!todasFaixasCobertas) continue;

        const economiaValor = valor_atual - valorTotal;
        const economiaPct = (economiaValor / valor_atual) * 100;

        if (economiaValor > 0) {
          propostas.push({
            operadora_id: opId || plano.operadora.toLowerCase().replace(/\s/g, ''),
            operadora_nome: plano.operadora,
            plano_nome: plano.nome,
            logo: opId ? OPERADORA_LOGOS[opId] || '/images/operadoras/amil-logo.png' : '/images/operadoras/amil-logo.png',
            valor_total: Math.round(valorTotal * 100) / 100,
            valores_por_faixa: valoresPorFaixa,
            coparticipacao: plano.coparticipacao !== 'Isento',
            abrangencia: plano.abrangencia || 'Nacional',
            rede_hospitalar: [],
            economia_valor: Math.round(economiaValor * 100) / 100,
            economia_pct: Math.round(economiaPct * 10) / 10,
            notas: plano.extras,
            fonte: 'legacy',
          });
        }
      }
    }

    // Ordenar por maior economia e pegar top 3
    propostas.sort((a, b) => b.economia_pct - a.economia_pct);

    // Deduplicar por operadora (manter melhor de cada)
    const seen = new Set<string>();
    const top3: PropostaCalc[] = [];
    for (const p of propostas) {
      if (seen.has(p.operadora_id)) continue;
      seen.add(p.operadora_id);
      top3.push(p);
      if (top3.length >= 3) break;
    }

    // Se não encontrou propostas suficientes, gerar estimativas
    if (top3.length === 0) {
      // Fallback: estimativas genéricas
      const estimativas = [
        { id: 'porto', nome: 'Porto Saúde', pct: 0.35 },
        { id: 'sulamerica', nome: 'SulAmérica', pct: 0.28 },
        { id: 'amil', nome: 'Amil', pct: 0.22 },
      ].filter((e) => e.id !== operadoraAtualId);

      for (const est of estimativas.slice(0, 3)) {
        const valorEstimado = Math.round(valor_atual * (1 - est.pct) * 100) / 100;
        top3.push({
          operadora_id: est.id,
          operadora_nome: est.nome,
          plano_nome: 'Plano estimado',
          logo: OPERADORA_LOGOS[est.id] || '/images/operadoras/amil-logo.png',
          valor_total: valorEstimado,
          valores_por_faixa: faixas.map((f) => ({ faixa: f, valor: Math.round((valorEstimado / qtdVidas) * 100) / 100 })),
          coparticipacao: false,
          abrangencia: 'RJ',
          rede_hospitalar: [],
          economia_valor: Math.round((valor_atual - valorEstimado) * 100) / 100,
          economia_pct: Math.round(est.pct * 1000) / 10,
          notas: 'Valor estimado, sujeito à análise personalizada',
          fonte: 'novo',
        });
      }
    }

    return NextResponse.json({
      success: true,
      propostas: top3.map((p) => ({
        operadora_id: p.operadora_id,
        operadora_nome: p.operadora_nome,
        plano_nome: p.plano_nome,
        logo: p.logo,
        valor_total: p.valor_total,
        valores_por_faixa: p.valores_por_faixa,
        coparticipacao: p.coparticipacao,
        coparticipacao_pct: p.coparticipacao_pct,
        abrangencia: p.abrangencia,
        rede_hospitalar: p.rede_hospitalar,
        economia_valor: p.economia_valor,
        economia_pct: p.economia_pct,
        notas: p.notas,
      })),
      valor_atual,
      qtd_vidas: qtdVidas,
      modalidade,
    });
  } catch (err) {
    logger.error('[Simular] Erro:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
