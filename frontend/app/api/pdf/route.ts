import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const PYTHON_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * POST /api/pdf
 * Proxy para o backend Python - extração de dados de PDF via IA
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Arquivo PDF é obrigatório' },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const proxyForm = new FormData();
    proxyForm.append('file', file);

    const response = await fetch(`${PYTHON_API}/api/v1/pdf/extrair`, {
      method: 'POST',
      body: proxyForm,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Erro ao processar PDF' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('❌ Erro no proxy PDF:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar PDF' },
      { status: 500 }
    );
  }
}
