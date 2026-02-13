import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validação
const calcSchema = z.object({
  tipo_contratacao: z.enum(['PF', 'PME', 'Adesão']),
  acomodacao: z.enum(['Enfermaria', 'Apartamento']),
  idades: z.array(z.string()),
  cnpj: z.string().optional(),
});

const supabase = createServiceClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo_contratacao, acomodacao, idades, cnpj } = calcSchema.parse(body);
    
    // Buscar planos ativos no Supabase
    const { data: planos, error } = await supabase
      .from('planos_saude')
      .select('*')
      .eq('ativo', true)
      .eq('tipo_contratacao', tipo_contratacao)
      .eq('acomodacao', acomodacao)
      .order('ordem', { ascending: true });
    
    if (error) {
      logger.error('Erro ao buscar planos', error);
      return NextResponse.json(
        { error: 'Erro ao buscar planos' },
        { status: 500 }
      );
    }
    
    // Calcular valores totais
    const resultados = planos
      .map((plano) => {
        let valorTotal = 0;
        let temErro = false;
        
        for (const idade of idades) {
          const valor = plano.valores[idade];
          
          if (valor === undefined || valor === 0) {
            temErro = true;
            break;
          }
          
          // Lógica PME: se < 5 vidas, valor aumenta (sem desconto promo)
          let valorFinal = valor;
          if (tipo_contratacao === 'PME' && idades.length < 5) {
            valorFinal = valor / 0.8994; // Remove desconto de 10,06%
          }
          
          valorTotal += valorFinal;
        }
        
        if (temErro) return null;
        
        return {
          id: plano.id,
          nome: plano.nome,
          operadora: plano.operadora,
          acomodacao: plano.acomodacao,
          coparticipacao: plano.coparticipacao,
          abrangencia: plano.abrangencia,
          reembolso: plano.reembolso,
          extras: plano.extras,
          valorTotal: Math.round(valorTotal * 100) / 100,
          destaque: plano.destaque,
          logo_url: plano.logo_url,
        };
      })
      .filter((r) => r !== null);
    
    // Ordenar: destaques primeiro, depois por preço
    resultados.sort((a, b) => {
      if (a!.destaque && !b!.destaque) return -1;
      if (!a!.destaque && b!.destaque) return 1;
      return a!.valorTotal - b!.valorTotal;
    });
    
    return NextResponse.json({
      success: true,
      total: resultados.length,
      resultados,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    logger.error('Erro no cálculo', error);
    return NextResponse.json(
      { error: 'Erro ao calcular planos' },
      { status: 500 }
    );
  }
}
