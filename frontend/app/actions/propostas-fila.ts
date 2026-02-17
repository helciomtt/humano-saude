'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-jwt';
import { logger } from '@/lib/logger';
import { PROPOSTA_FILA_STATUS, type PropostaFilaStatus } from '@/lib/propostas-fila-status';

export type { PropostaFilaStatus } from '@/lib/propostas-fila-status';

type SessionContext = {
  role: 'admin' | 'corretor';
  corretorId: string | null;
};

export type PropostaFilaHistoricoItem = {
  status: PropostaFilaStatus;
  timestamp: string;
  observacao?: string | null;
  atualizado_por: 'admin' | 'corretor' | 'sistema';
};

export type PropostaFilaLead = {
  id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
};

export type PropostaFilaCorretor = {
  id: string;
  nome: string;
  email: string | null;
  slug: string | null;
};

export type PropostaFilaItem = {
  id: string;
  lead_id: string;
  corretor_id: string | null;
  categoria: string | null;
  origem: string;
  status: PropostaFilaStatus;
  status_observacao: string | null;
  status_historico: PropostaFilaHistoricoItem[];
  enviada_operadora_em: string | null;
  em_analise_em: string | null;
  boleto_gerado_em: string | null;
  implantada_em: string | null;
  dados_proposta: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  lead: PropostaFilaLead | null;
  corretor: PropostaFilaCorretor | null;
};

export type PropostaFilaCreateInput = {
  lead_id: string;
  corretor_id?: string | null;
  categoria?: string | null;
  origem?: string;
  dados_proposta?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  status?: PropostaFilaStatus;
  status_observacao?: string | null;
};

type RawPropostaFilaJoin = {
  id?: unknown;
  nome?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  slug?: unknown;
};

type RawPropostaFilaRow = {
  id?: unknown;
  lead_id?: unknown;
  corretor_id?: unknown;
  categoria?: unknown;
  origem?: unknown;
  status?: unknown;
  status_observacao?: unknown;
  status_historico?: unknown;
  enviada_operadora_em?: unknown;
  em_analise_em?: unknown;
  boleto_gerado_em?: unknown;
  implantada_em?: unknown;
  dados_proposta?: unknown;
  metadata?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  lead?: RawPropostaFilaJoin | null;
  corretor?: RawPropostaFilaJoin | null;
};

function isAllowedStatus(value: unknown): value is PropostaFilaStatus {
  return typeof value === 'string' && PROPOSTA_FILA_STATUS.includes(value as PropostaFilaStatus);
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseHistory(value: unknown): PropostaFilaHistoricoItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): PropostaFilaHistoricoItem | null => {
      if (!entry || typeof entry !== 'object') return null;

      const status = (entry as { status?: unknown }).status;
      const timestamp = asString((entry as { timestamp?: unknown }).timestamp);
      const observacao = asString((entry as { observacao?: unknown }).observacao);
      const atualizadoPorRaw = asString((entry as { atualizado_por?: unknown }).atualizado_por);

      if (!isAllowedStatus(status) || !timestamp) return null;

      const atualizado_por =
        atualizadoPorRaw === 'admin' || atualizadoPorRaw === 'corretor' || atualizadoPorRaw === 'sistema'
          ? atualizadoPorRaw
          : 'sistema';

      return {
        status,
        timestamp,
        observacao,
        atualizado_por,
      };
    })
    .filter((entry): entry is PropostaFilaHistoricoItem => entry !== null);
}

function parseFilaRow(raw: RawPropostaFilaRow): PropostaFilaItem {
  const status = isAllowedStatus(raw.status) ? raw.status : 'enviada';
  const leadId = asString(raw.lead_id) || '';
  const createdAt = asString(raw.created_at) || new Date().toISOString();
  const updatedAt = asString(raw.updated_at) || createdAt;

  const leadRaw = raw.lead;
  const corretorRaw = raw.corretor;

  const lead =
    leadRaw && typeof leadRaw === 'object'
      ? {
          id: asString(leadRaw.id) || '',
          nome: asString(leadRaw.nome) || 'Lead sem nome',
          whatsapp: asString(leadRaw.whatsapp) || '',
          email: asString(leadRaw.email),
        }
      : null;

  const corretor =
    corretorRaw && typeof corretorRaw === 'object'
      ? {
          id: asString(corretorRaw.id) || '',
          nome: asString(corretorRaw.nome) || 'Corretor',
          email: asString(corretorRaw.email),
          slug: asString(corretorRaw.slug),
        }
      : null;

  return {
    id: asString(raw.id) || '',
    lead_id: leadId,
    corretor_id: asString(raw.corretor_id),
    categoria: asString(raw.categoria),
    origem: asString(raw.origem) || 'scanner_inteligente',
    status,
    status_observacao: asString(raw.status_observacao),
    status_historico: parseHistory(raw.status_historico),
    enviada_operadora_em: asString(raw.enviada_operadora_em),
    em_analise_em: asString(raw.em_analise_em),
    boleto_gerado_em: asString(raw.boleto_gerado_em),
    implantada_em: asString(raw.implantada_em),
    dados_proposta: asRecord(raw.dados_proposta),
    metadata: asRecord(raw.metadata),
    created_at: createdAt,
    updated_at: updatedAt,
    lead,
    corretor,
  };
}

async function resolveSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get('admin_token')?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload?.role === 'admin') {
      return { role: 'admin', corretorId: null };
    }
  }

  const corretorToken = cookieStore.get('corretor_token')?.value;
  if (corretorToken) {
    const payload = await verifyToken(corretorToken);
    if (payload?.role === 'corretor' && payload.corretor_id) {
      return { role: 'corretor', corretorId: payload.corretor_id };
    }
  }

  return null;
}

async function requireAdminSession(): Promise<{ success: true } | { success: false; error: string }> {
  const session = await resolveSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Apenas admin pode acessar esta ação.' };
  }
  return { success: true };
}

async function requireCorretorSession(): Promise<
  { success: true; corretorId: string } | { success: false; error: string }
> {
  const session = await resolveSession();
  if (!session || session.role !== 'corretor' || !session.corretorId) {
    return { success: false, error: 'Sessão de corretor não encontrada.' };
  }
  return { success: true, corretorId: session.corretorId };
}

function buildSelectClause() {
  return `
    id,
    lead_id,
    corretor_id,
    categoria,
    origem,
    status,
    status_observacao,
    status_historico,
    enviada_operadora_em,
    em_analise_em,
    boleto_gerado_em,
    implantada_em,
    dados_proposta,
    metadata,
    created_at,
    updated_at,
    lead:insurance_leads(id, nome, whatsapp, email),
    corretor:corretores(id, nome, email, slug)
  `;
}

export async function createPropostaFilaEntry(input: PropostaFilaCreateInput): Promise<{
  success: boolean;
  data?: PropostaFilaItem;
  error?: string;
}> {
  try {
    if (!input.lead_id) {
      return { success: false, error: 'lead_id é obrigatório.' };
    }

    const session = await resolveSession();
    const actor = session?.role === 'admin' ? 'admin' : session?.role === 'corretor' ? 'corretor' : 'sistema';
    const status = input.status || 'enviada';
    const nowIso = new Date().toISOString();

    const statusHistorico: PropostaFilaHistoricoItem[] = [
      {
        status,
        timestamp: nowIso,
        observacao: input.status_observacao || null,
        atualizado_por: actor,
      },
    ];

    const payloadToInsert = {
      lead_id: input.lead_id,
      corretor_id: input.corretor_id || session?.corretorId || null,
      categoria: input.categoria || null,
      origem: input.origem || 'scanner_inteligente',
      status,
      status_observacao: input.status_observacao || null,
      status_historico: statusHistorico,
      enviada_operadora_em: status === 'enviada' ? nowIso : null,
      em_analise_em: status === 'em_analise' ? nowIso : null,
      boleto_gerado_em: status === 'boleto_gerado' ? nowIso : null,
      implantada_em: status === 'implantada' ? nowIso : null,
      dados_proposta: input.dados_proposta || {},
      metadata: input.metadata || {},
    };

    const sb = createServiceClient();
    const { data, error } = await sb
      .from('propostas_fila')
      .insert(payloadToInsert)
      .select(buildSelectClause())
      .single();

    if (error) {
      logger.error('[createPropostaFilaEntry] erro ao inserir fila', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/portal-interno-hks-2026/propostas/fila');
    revalidatePath('/dashboard/corretor/propostas');
    revalidatePath('/dashboard/corretor/propostas/fila');

    return { success: true, data: parseFilaRow(data as RawPropostaFilaRow) };
  } catch (error: unknown) {
    logger.error('[createPropostaFilaEntry] erro inesperado', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado ao criar item na fila.';
    return { success: false, error: message };
  }
}

export async function listPropostasFilaAdmin(filters?: {
  status?: PropostaFilaStatus;
  corretor_id?: string;
  limit?: number;
}): Promise<{ success: boolean; data?: PropostaFilaItem[]; error?: string }> {
  try {
    const access = await requireAdminSession();
    if (!access.success) return access;

    const sb = createServiceClient();
    let query = sb
      .from('propostas_fila')
      .select(buildSelectClause())
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.corretor_id) {
      query = query.eq('corretor_id', filters.corretor_id);
    }

    if (filters?.limit && filters.limit > 0) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[listPropostasFilaAdmin] erro ao carregar fila', error);
      return { success: false, error: error.message };
    }

    const mapped = (data || []).map((row) => parseFilaRow(row as RawPropostaFilaRow));
    return { success: true, data: mapped };
  } catch (error: unknown) {
    logger.error('[listPropostasFilaAdmin] erro inesperado', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado ao listar a fila.';
    return { success: false, error: message };
  }
}

export async function listPropostasFilaCorretor(): Promise<{
  success: boolean;
  data?: PropostaFilaItem[];
  error?: string;
}> {
  try {
    const session = await requireCorretorSession();
    if (!session.success) return session;

    const sb = createServiceClient();
    const { data, error } = await sb
      .from('propostas_fila')
      .select(buildSelectClause())
      .eq('corretor_id', session.corretorId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[listPropostasFilaCorretor] erro ao carregar fila do corretor', error);
      return { success: false, error: error.message };
    }

    const mapped = (data || []).map((row) => parseFilaRow(row as RawPropostaFilaRow));
    return { success: true, data: mapped };
  } catch (error: unknown) {
    logger.error('[listPropostasFilaCorretor] erro inesperado', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado ao listar propostas.';
    return { success: false, error: message };
  }
}

export async function updatePropostaFilaStatus(input: {
  fila_id: string;
  status: PropostaFilaStatus;
  observacao?: string | null;
}): Promise<{ success: boolean; data?: PropostaFilaItem; error?: string }> {
  try {
    const access = await requireAdminSession();
    if (!access.success) return access;

    if (!input.fila_id) {
      return { success: false, error: 'fila_id é obrigatório.' };
    }

    const sb = createServiceClient();
    const { data: currentRow, error: currentError } = await sb
      .from('propostas_fila')
      .select('status_historico')
      .eq('id', input.fila_id)
      .single();

    if (currentError) {
      logger.error('[updatePropostaFilaStatus] erro ao buscar item atual', currentError);
      return { success: false, error: currentError.message };
    }

    const nowIso = new Date().toISOString();
    const existingHistory = parseHistory((currentRow as { status_historico?: unknown }).status_historico);
    const nextHistory: PropostaFilaHistoricoItem[] = [
      ...existingHistory,
      {
        status: input.status,
        timestamp: nowIso,
        observacao: input.observacao || null,
        atualizado_por: 'admin',
      },
    ];

    const updates: Record<string, unknown> = {
      status: input.status,
      status_observacao: input.observacao || null,
      status_historico: nextHistory,
    };

    if (input.status === 'enviada') updates.enviada_operadora_em = nowIso;
    if (input.status === 'em_analise') updates.em_analise_em = nowIso;
    if (input.status === 'boleto_gerado') updates.boleto_gerado_em = nowIso;
    if (input.status === 'implantada') updates.implantada_em = nowIso;

    const { data, error } = await sb
      .from('propostas_fila')
      .update(updates)
      .eq('id', input.fila_id)
      .select(buildSelectClause())
      .single();

    if (error) {
      logger.error('[updatePropostaFilaStatus] erro ao atualizar status', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/portal-interno-hks-2026/propostas/fila');
    revalidatePath('/dashboard/corretor/propostas');
    revalidatePath('/dashboard/corretor/propostas/fila');

    return { success: true, data: parseFilaRow(data as RawPropostaFilaRow) };
  } catch (error: unknown) {
    logger.error('[updatePropostaFilaStatus] erro inesperado', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado ao atualizar status.';
    return { success: false, error: message };
  }
}
