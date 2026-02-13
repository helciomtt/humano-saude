import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const PYTHON_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * POST /api/cotacao
 * Proxy para o backend Python - cálculo de cotação via engine
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${PYTHON_API}/api/v1/cotacao/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Erro ao calcular cotação' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('❌ Erro no proxy cotação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao calcular cotação' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cotacao
 * Lista operadoras disponíveis via backend Python
 */
export async function GET() {
  try {
    const response = await fetch(`${PYTHON_API}/api/v1/cotacao/operadoras`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao buscar operadoras' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('❌ Erro ao buscar operadoras:', error);
    return NextResponse.json(
      { error: 'Backend Python indisponível' },
      { status: 503 }
    );
  }
}
