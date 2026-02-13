'use server';

import { createServiceClient } from '@/lib/supabase';

// ========================================
// TYPES
// ========================================

export interface PlanoOperadora {
  id: string;
  operadora_id: string;
  operadora_nome: string;
  plano_nome: string;
  modalidade: 'PME' | 'PF' | 'Adesao';
  acomodacao: 'Apartamento' | 'Enfermaria' | 'Ambulatorial';
  coparticipacao: boolean;
  coparticipacao_pct: number | null;
  abrangencia: string;
  vidas_min: number | null;
  vidas_max: number | null;
  rede_hospitalar: string[];
  ativo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrecoFaixa {
  id: string;
  plano_id: string;
  faixa_etaria: string;
  faixa_ordem: number;
  valor: number;
  created_at: string;
}

export interface PlanoComPrecos extends PlanoOperadora {
  precos_faixa: PrecoFaixa[];
}

// ========================================
// HELPERS
// ========================================

function ok<T>(data: T) { return { success: true as const, data }; }
function fail(error: string) { return { success: false as const, error }; }

// ========================================
// LIST PLANOS
// ========================================

export async function getPlanos(filters?: {
  modalidade?: string;
  operadora_id?: string;
  acomodacao?: string;
  ativo?: boolean;
}) {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from('planos_operadora')
      .select('*, precos_faixa(*)');

    if (filters?.modalidade) query = query.eq('modalidade', filters.modalidade);
    if (filters?.operadora_id) query = query.eq('operadora_id', filters.operadora_id);
    if (filters?.acomodacao) query = query.eq('acomodacao', filters.acomodacao);
    if (filters?.ativo !== undefined) query = query.eq('ativo', filters.ativo);

    query = query.order('operadora_nome', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return ok(data as PlanoComPrecos[]);
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao listar planos');
  }
}

// ========================================
// GET SINGLE PLANO
// ========================================

export async function getPlano(id: string) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('planos_operadora')
      .select('*, precos_faixa(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return ok(data as PlanoComPrecos);
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao buscar plano');
  }
}

// ========================================
// CREATE PLANO
// ========================================

export async function createPlano(input: {
  operadora_id: string;
  operadora_nome: string;
  plano_nome: string;
  modalidade: string;
  acomodacao?: string;
  coparticipacao?: boolean;
  coparticipacao_pct?: number;
  abrangencia?: string;
  vidas_min?: number;
  vidas_max?: number;
  rede_hospitalar?: string[];
  notas?: string;
  precos?: { faixa_etaria: string; faixa_ordem: number; valor: number }[];
}) {
  try {
    const supabase = createServiceClient();
    const { precos, ...planoData } = input;

    const { data: plano, error } = await supabase
      .from('planos_operadora')
      .insert(planoData)
      .select()
      .single();

    if (error) throw error;

    // Insert precos_faixa if provided
    if (precos?.length) {
      const { error: precosError } = await supabase
        .from('precos_faixa')
        .insert(precos.map((p) => ({ ...p, plano_id: plano.id })));

      if (precosError) throw precosError;
    }

    return ok(plano);
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao criar plano');
  }
}

// ========================================
// UPDATE PLANO
// ========================================

export async function updatePlano(
  id: string,
  updates: Partial<Omit<PlanoOperadora, 'id' | 'created_at' | 'updated_at'>>,
) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('planos_operadora')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return ok(data);
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao atualizar plano');
  }
}

// ========================================
// TOGGLE PLANO ATIVO
// ========================================

export async function togglePlanoAtivo(id: string, ativo: boolean) {
  return updatePlano(id, { ativo });
}

// ========================================
// DELETE PLANO
// ========================================

export async function deletePlano(id: string) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('planos_operadora')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return ok(null);
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao remover plano');
  }
}

// ========================================
// GET OPERADORAS (distinct list)
// ========================================

export async function getOperadorasList() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('planos_operadora')
      .select('operadora_id, operadora_nome')
      .order('operadora_nome', { ascending: true });

    if (error) throw error;

    // Deduplicate
    const seen = new Set<string>();
    const unique = (data || []).filter((o) => {
      if (seen.has(o.operadora_id)) return false;
      seen.add(o.operadora_id);
      return true;
    });

    return ok(unique);
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao listar operadoras');
  }
}

// ========================================
// GET STATS
// ========================================

export async function getPlanosStats() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('planos_operadora')
      .select('id, operadora_id, modalidade, ativo');

    if (error) throw error;
    const planos = data || [];

    return ok({
      total: planos.length,
      ativos: planos.filter((p) => p.ativo).length,
      pme: planos.filter((p) => p.modalidade === 'PME').length,
      pf: planos.filter((p) => p.modalidade === 'PF').length,
      adesao: planos.filter((p) => p.modalidade === 'Adesao').length,
      operadoras: new Set(planos.map((p) => p.operadora_id)).size,
    });
  } catch (e: any) {
    return fail(e.message ?? 'Erro ao calcular métricas');
  }
}
