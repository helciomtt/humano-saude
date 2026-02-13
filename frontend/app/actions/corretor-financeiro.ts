'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// =============================================
// TIPOS
// =============================================

export type Producao = {
  id: string;
  corretor_id: string;
  proposta_id: string | null;
  numero_proposta: string | null;
  codigo_empresa: string | null;
  data_cadastro: string | null;
  data_producao: string | null;
  data_assinatura: string | null;
  data_vigencia: string | null;
  data_implantacao: string | null;
  nome_segurado: string;
  cpf_segurado: string | null;
  subproduto: string | null;
  modalidade: string | null;
  operadora: string | null;
  valor_mensalidade: number;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ParcelaComissao = {
  id: string;
  producao_id: string;
  corretor_id: string;
  numero_parcela: number;
  valor_parcela: number;
  taxa: number;
  data_vencimento: string;
  percentual_comissao: number;
  codigo_comissao: string | null;
  data_pagamento_comissao: string | null;
  status_comissao: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RelatorioComissao = {
  id: string;
  corretor_id: string;
  numero_relatorio: string;
  data_geracao: string;
  data_previsao: string | null;
  data_pagamento: string | null;
  tipo: string;
  valor_bruto: number;
  valor_liquido: number;
  pdf_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CorretorEndereco = {
  id: string;
  corretor_id: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  padrao: boolean;
  created_at: string;
  updated_at: string;
};

export type CorretorTelefone = {
  id: string;
  corretor_id: string;
  tipo: string;
  numero: string;
  whatsapp: boolean;
  padrao: boolean;
  created_at: string;
};

// =============================================
// PRODUÇÕES
// =============================================

export async function getProducoes(
  corretorId: string,
  filtros?: {
    busca?: string;
    modalidade?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    perPage?: number;
  },
): Promise<{
  success: boolean;
  data?: Producao[];
  total?: number;
  totalValor?: number;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const page = filtros?.page ?? 1;
    const perPage = filtros?.perPage ?? 10;
    const offset = (page - 1) * perPage;

    let query = supabase
      .from('producoes_corretor')
      .select('*', { count: 'exact' })
      .eq('corretor_id', corretorId)
      .order('data_producao', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (filtros?.busca) {
      query = query.or(`nome_segurado.ilike.%${filtros.busca}%,numero_proposta.ilike.%${filtros.busca}%`);
    }
    if (filtros?.modalidade) {
      query = query.eq('modalidade', filtros.modalidade);
    }
    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }
    if (filtros?.dataInicio) {
      query = query.gte('data_producao', filtros.dataInicio);
    }
    if (filtros?.dataFim) {
      query = query.lte('data_producao', filtros.dataFim);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Calcular total de valor
    const { data: totalData } = await supabase
      .from('producoes_corretor')
      .select('valor_mensalidade')
      .eq('corretor_id', corretorId);

    const totalValor = (totalData ?? []).reduce((acc, p) => acc + Number(p.valor_mensalidade), 0);

    return { success: true, data: data ?? [], total: count ?? 0, totalValor };
  } catch (err) {
    logger.error('[getProducoes]', err);
    return { success: false, error: 'Erro ao carregar produções' };
  }
}

export async function getParcelasProducao(
  producaoId: string,
): Promise<{
  success: boolean;
  data?: ParcelaComissao[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('parcelas_comissao')
      .select('*')
      .eq('producao_id', producaoId)
      .order('numero_parcela', { ascending: true });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getParcelasProducao]', err);
    return { success: false, error: 'Erro ao carregar parcelas' };
  }
}

// =============================================
// RELATÓRIOS DE COMISSÃO
// =============================================

export async function getRelatoriosComissao(
  corretorId: string,
  filtros?: {
    page?: number;
    perPage?: number;
  },
): Promise<{
  success: boolean;
  data?: RelatorioComissao[];
  total?: number;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const page = filtros?.page ?? 1;
    const perPage = filtros?.perPage ?? 10;
    const offset = (page - 1) * perPage;

    const { data, error, count } = await supabase
      .from('relatorios_comissao')
      .select('*', { count: 'exact' })
      .eq('corretor_id', corretorId)
      .order('data_geracao', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) throw error;
    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (err) {
    logger.error('[getRelatoriosComissao]', err);
    return { success: false, error: 'Erro ao carregar relatórios de comissão' };
  }
}

export async function getRelatorioDetalhes(
  relatorioId: string,
): Promise<{
  success: boolean;
  data?: RelatorioComissao;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('relatorios_comissao')
      .select('*')
      .eq('id', relatorioId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    logger.error('[getRelatorioDetalhes]', err);
    return { success: false, error: 'Erro ao carregar detalhes do relatório' };
  }
}

// =============================================
// ENDEREÇOS DO CORRETOR
// =============================================

export async function getCorretorEnderecos(
  corretorId: string,
): Promise<{
  success: boolean;
  data?: CorretorEndereco[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretor_enderecos')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('padrao', { ascending: false });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getCorretorEnderecos]', err);
    return { success: false, error: 'Erro ao carregar endereços' };
  }
}

export async function upsertCorretorEndereco(
  corretorId: string,
  endereco: Partial<CorretorEndereco>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    if (endereco.id) {
      const { error } = await supabase
        .from('corretor_enderecos')
        .update({
          cep: endereco.cep,
          logradouro: endereco.logradouro,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
          padrao: endereco.padrao,
        })
        .eq('id', endereco.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('corretor_enderecos')
        .insert({
          corretor_id: corretorId,
          cep: endereco.cep,
          logradouro: endereco.logradouro,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
          padrao: endereco.padrao ?? false,
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (err) {
    logger.error('[upsertCorretorEndereco]', err);
    return { success: false, error: 'Erro ao salvar endereço' };
  }
}

export async function deleteCorretorEndereco(
  enderecoId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('corretor_enderecos').delete().eq('id', enderecoId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[deleteCorretorEndereco]', err);
    return { success: false, error: 'Erro ao excluir endereço' };
  }
}

// =============================================
// TELEFONES DO CORRETOR
// =============================================

export async function getCorretorTelefones(
  corretorId: string,
): Promise<{
  success: boolean;
  data?: CorretorTelefone[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretor_telefones')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('padrao', { ascending: false });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getCorretorTelefones]', err);
    return { success: false, error: 'Erro ao carregar telefones' };
  }
}

export async function upsertCorretorTelefone(
  corretorId: string,
  telefone: Partial<CorretorTelefone>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    if (telefone.id) {
      const { error } = await supabase
        .from('corretor_telefones')
        .update({
          tipo: telefone.tipo,
          numero: telefone.numero,
          whatsapp: telefone.whatsapp,
          padrao: telefone.padrao,
        })
        .eq('id', telefone.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('corretor_telefones')
        .insert({
          corretor_id: corretorId,
          tipo: telefone.tipo ?? 'celular',
          numero: telefone.numero!,
          whatsapp: telefone.whatsapp ?? false,
          padrao: telefone.padrao ?? false,
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (err) {
    logger.error('[upsertCorretorTelefone]', err);
    return { success: false, error: 'Erro ao salvar telefone' };
  }
}

export async function deleteCorretorTelefone(
  telefoneId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('corretor_telefones').delete().eq('id', telefoneId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[deleteCorretorTelefone]', err);
    return { success: false, error: 'Erro ao excluir telefone' };
  }
}

// =============================================
// DADOS DO CORRETOR COMPLETO (para cadastro/perfil)
// =============================================

export async function getCorretorCompleto(corretorId: string): Promise<{
  success: boolean;
  data?: {
    corretor: Record<string, unknown>;
    enderecos: CorretorEndereco[];
    telefones: CorretorTelefone[];
    dados_bancarios: Record<string, unknown> | null;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const [corretorRes, enderecosRes, telefonesRes, bancarioRes] = await Promise.all([
      supabase.from('corretores').select('*').eq('id', corretorId).single(),
      supabase.from('corretor_enderecos').select('*').eq('corretor_id', corretorId).order('padrao', { ascending: false }),
      supabase.from('corretor_telefones').select('*').eq('corretor_id', corretorId).order('padrao', { ascending: false }),
      supabase.from('corretor_dados_bancarios').select('*').eq('corretor_id', corretorId).eq('ativo', true).maybeSingle(),
    ]);

    if (corretorRes.error) throw corretorRes.error;

    return {
      success: true,
      data: {
        corretor: corretorRes.data,
        enderecos: enderecosRes.data ?? [],
        telefones: telefonesRes.data ?? [],
        dados_bancarios: bancarioRes.data ?? null,
      },
    };
  } catch (err) {
    logger.error('[getCorretorCompleto]', err);
    return { success: false, error: 'Erro ao carregar dados do corretor' };
  }
}

export async function updateCorretorPerfil(
  corretorId: string,
  dados: { nome?: string; email?: string; telefone?: string; whatsapp?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('corretores')
      .update(dados)
      .eq('id', corretorId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[updateCorretorPerfil]', err);
    return { success: false, error: 'Erro ao atualizar perfil' };
  }
}
