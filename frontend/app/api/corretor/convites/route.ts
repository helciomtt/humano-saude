import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const supabase = createServiceClient();

// Garantir que a tabela existe
async function ensureTable() {
  const { error } = await supabase.from('convites_corretor').select('id').limit(1);
  if (error && error.message.includes('schema cache')) {
    // Tabela não existe - não podemos criar via client, retornar aviso
    return false;
  }
  return true;
}

// GET: Listar convites
export async function GET(request: NextRequest) {
  try {
    const tableExists = await ensureTable();
    if (!tableExists) {
      return NextResponse.json({ 
        convites: [], 
        message: 'Tabela convites_corretor não existe. Execute a migration no Supabase SQL Editor.' 
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('convites_corretor')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[convites] Erro ao listar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cruzar com solicitações para verificar quem se cadastrou
    const emails = (data || []).map((c: { email_convidado: string }) => c.email_convidado);
    
    let cadastros: Record<string, { status: string; created_at: string; nome: string }> = {};
    if (emails.length > 0) {
      const { data: solicitacoes } = await supabase
        .from('solicitacoes_corretor')
        .select('email, status, created_at, nome_completo')
        .in('email', emails);

      if (solicitacoes) {
        for (const s of solicitacoes) {
          cadastros[s.email.toLowerCase()] = {
            status: s.status,
            created_at: s.created_at,
            nome: s.nome_completo,
          };
        }
      }
    }

    const convitesEnriquecidos = (data || []).map((c: { email_convidado: string; [key: string]: unknown }) => ({
      ...c,
      cadastro: cadastros[c.email_convidado.toLowerCase()] || null,
    }));

    return NextResponse.json({ convites: convitesEnriquecidos });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[convites] erro:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
