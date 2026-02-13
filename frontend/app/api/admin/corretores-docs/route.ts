import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Buscar todos os corretores ativos
    const { data: corretores, error: corretoresErr } = await supabase
      .from('corretores')
      .select('id, nome, cpf, email, telefone, susep, metadata, created_at, data_admissao')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (corretoresErr) {
      logger.error('[corretores-docs] Error fetching corretores:', corretoresErr);
      return NextResponse.json(
        { success: false, error: corretoresErr.message },
        { status: 500 },
      );
    }

    // Buscar TODOS os documentos (vinculados + órfãos sem corretor_id)
    const { data: documentos } = await supabase
      .from('corretor_documentos')
      .select('id, corretor_id, tipo, nome_arquivo, url, mime_type, tamanho_bytes, status, created_at')
      .order('created_at', { ascending: true });

    // Buscar TODOS os dados bancários (vinculados + órfãos)
    const { data: dadosBancarios } = await supabase
      .from('corretor_dados_bancarios')
      .select('id, corretor_id, banco_codigo, banco_nome, agencia, conta, tipo_conta, titular_nome, titular_documento, tipo_chave_pix, chave_pix, ativo, verificado, created_at')
      .order('created_at', { ascending: true });

    // Buscar solicitação de cada corretor para dados extras
    const solicitacaoIds = (corretores || [])
      .map((c) => (c.metadata as Record<string, unknown>)?.solicitacao_id as string)
      .filter(Boolean);

    let solicitacoesMap: Record<string, Record<string, unknown>> = {};
    if (solicitacaoIds.length > 0) {
      const { data: sols } = await supabase
        .from('solicitacoes_corretor')
        .select('id, tipo_pessoa, razao_social, nome_fantasia, cnpj, especialidade, experiencia_anos, motivacoes, modalidade_trabalho, como_conheceu, operadoras_experiencia, registro_susep, mensagem')
        .in('id', solicitacaoIds);
      if (sols) {
        solicitacoesMap = Object.fromEntries(sols.map((s) => [s.id, s]));
      }
    }

    // Agrupar por corretor
    const result = (corretores || []).map((corretor) => {
      const meta = (corretor.metadata || {}) as Record<string, unknown>;
      const solId = meta.solicitacao_id as string | undefined;
      const solicitacao = solId ? solicitacoesMap[solId] || null : null;

      return {
        id: corretor.id,
        nome: corretor.nome,
        cpf: corretor.cpf,
        email: corretor.email,
        telefone: corretor.telefone,
        susep: corretor.susep,
        data_admissao: corretor.data_admissao,
        created_at: corretor.created_at,
        metadata: meta,
        solicitacao,
        documentos: (documentos || []).filter((d) => d.corretor_id === corretor.id),
        dados_bancarios: (dadosBancarios || []).filter((db) => db.corretor_id === corretor.id),
      };
    });

    // Documentos/bancários órfãos (corretor_id é null — enviados antes do fix)
    const docsOrfaos = (documentos || []).filter((d) => !d.corretor_id);
    const bancarioOrfao = (dadosBancarios || []).filter((db) => !db.corretor_id);

    if (docsOrfaos.length > 0 || bancarioOrfao.length > 0) {
      result.push({
        id: 'orfaos',
        nome: '⚠️ Sem vínculo',
        cpf: null as unknown as string,
        email: '—',
        telefone: null as unknown as string,
        susep: null as unknown as string,
        data_admissao: null as unknown as string,
        created_at: null as unknown as string,
        metadata: {},
        solicitacao: null,
        documentos: docsOrfaos,
        dados_bancarios: bancarioOrfao,
      });
    }

    // Filtrar: só mostrar corretores que têm documentos OU dados bancários OU onboarding em progresso
    const comDados = result.filter(
      (c) =>
        c.documentos.length > 0 ||
        c.dados_bancarios.length > 0 ||
        (c.metadata as Record<string, unknown>)?.onboarding_token,
    );

    return NextResponse.json({ success: true, data: comDados });
  } catch (err) {
    logger.error('[corretores-docs] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 },
    );
  }
}
