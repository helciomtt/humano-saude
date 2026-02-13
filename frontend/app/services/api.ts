const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Proxy routes (Next.js API) - use these from client components
const PROXY_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

export interface CotacaoInput {
  idades: number[];
  tipo: string;
  operadora: string;
}

export interface ValorBeneficiario {
  idade: number;
  valor: number;
  faixa_etaria: string;
}

export interface CotacaoOutput {
  operadora: string;
  tipo_contratacao: string;
  plano: string;
  quantidade_beneficiarios: number;
  valores_individuais: ValorBeneficiario[];
  valor_total: number;
  desconto_aplicado: number;
  valor_final: number;
  observacoes: string[];
}

export interface PDFExtraido {
  idades: number[];
  operadora: string | null;
  valor_atual: number | null;
  tipo_plano: string | null;
  nome_beneficiarios: string[];
  observacoes: string | null;
  confianca: string;
  texto_extraido_preview: string | null;
  total_caracteres: number;
}

export const apiService = {
  async calcularCotacao(input: CotacaoInput): Promise<CotacaoOutput> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cotacao/calcular`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao calcular cotação');
    }

    return response.json();
  },

  async listarOperadoras(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cotacao/operadoras`);
    const data = await response.json();
    return data.operadoras;
  },

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  async extrairPDF(file: File): Promise<PDFExtraido> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/pdf/extrair`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao extrair dados do PDF');
    }

    return response.json();
  },

  /**
   * Health check consolidado (via proxy Next.js)
   */
  async healthCheckAll(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, { status: string; latency?: number; error?: string }>;
  }> {
    const response = await fetch(`${PROXY_BASE}/api/health`);
    return response.json();
  },

  /**
   * Calcular cotação via proxy Next.js (evita CORS)
   */
  async calcularCotacaoProxy(input: CotacaoInput): Promise<CotacaoOutput> {
    const response = await fetch(`${PROXY_BASE}/api/cotacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao calcular cotação');
    }

    return response.json();
  },

  /**
   * Listar operadoras via proxy Next.js (evita CORS)
   */
  async listarOperadorasProxy(): Promise<string[]> {
    const response = await fetch(`${PROXY_BASE}/api/cotacao`);
    if (!response.ok) throw new Error('Erro ao listar operadoras');
    const data = await response.json();
    return data.operadoras;
  },

  /**
   * Extrair PDF via proxy Next.js (evita CORS)
   */
  async extrairPDFProxy(file: File): Promise<PDFExtraido> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${PROXY_BASE}/api/pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao processar PDF');
    }

    return response.json();
  },

  /**
   * Logout do admin
   */
  async logout(): Promise<void> {
    await fetch(`${PROXY_BASE}/api/auth/logout`, { method: 'POST' });
  },
};
