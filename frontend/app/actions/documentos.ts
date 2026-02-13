'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR DOCUMENTOS
// ========================================

export async function getDocumentos(filters?: {
  lead_id?: string;
  proposta_id?: string;
  tipo?: string;
  search?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('documentos')
      .select('*, insurance_leads(nome)')
      .order('created_at', { ascending: false });

    if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
    if (filters?.proposta_id) query = query.eq('proposta_id', filters.proposta_id);
    if (filters?.tipo) query = query.eq('tipo', filters.tipo);
    if (filters?.search) query = query.ilike('nome', `%${filters.search}%`);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar documentos:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// REGISTRAR DOCUMENTO (após upload no Storage)
// ========================================

export async function createDocumento(input: {
  nome: string;
  tipo: string;
  url: string;
  tamanho?: number;
  lead_id?: string;
  proposta_id?: string;
  tags?: string[];
}) {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome: input.nome,
        tipo: input.tipo,
        url: input.url,
        tamanho: input.tamanho || null,
        lead_id: input.lead_id || null,
        proposta_id: input.proposta_id || null,
        tags: input.tags || null,
        metadata: {},
      })
      .select('id, nome')
      .single();

    if (error) {
      logger.error('❌ Erro ao registrar documento:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/documentos`);
    return { success: true, data, message: 'Documento registrado!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// DELETAR DOCUMENTO
// ========================================

export async function deleteDocumento(id: string) {
  try {
    // Buscar URL para deletar do storage
    const { data: doc } = await supabase
      .from('documentos')
      .select('url')
      .eq('id', id)
      .single();

    // Deletar do banco
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    // Tentar deletar do storage (se URL do Supabase Storage)
    if (doc?.url?.includes('supabase')) {
      const path = doc.url.split('/storage/v1/object/public/')[1];
      if (path) {
        await supabase.storage.from('documentos').remove([path]);
      }
    }

    revalidatePath(`${PORTAL}/documentos`);
    return { success: true, message: 'Documento removido!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// STATS DE DOCUMENTOS
// ========================================

export async function getDocumentoStats() {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('tipo, tamanho');

    if (error) return { success: false, data: null, error: error.message };

    // Agrupar por tipo
    const porTipo: Record<string, number> = {};
    data?.forEach((d: any) => {
      porTipo[d.tipo] = (porTipo[d.tipo] || 0) + 1;
    });

    const totalBytes = data?.reduce((sum: number, d: any) => sum + (d.tamanho || 0), 0) || 0;
    const tamanhoFormatado = totalBytes < 1024 * 1024
      ? `${(totalBytes / 1024).toFixed(1)} KB`
      : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;

    const stats = {
      total: data?.length || 0,
      tamanho_total: tamanhoFormatado,
      categorias: Object.keys(porTipo).length,
      por_tipo: porTipo,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
