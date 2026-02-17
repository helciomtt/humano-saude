'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  CrmDealDetail, CrmDealEnriched,
  CrmAttachment, CrmAttachmentEnriched, CrmAttachmentInsert,
  CrmFollower, CrmFollowerEnriched,
  CrmChangelog, CrmChangelogEnriched,
  CrmComment, CrmCommentEnriched, CrmCommentInsert,
  CrmQuote, CrmQuoteInsert, CrmQuoteItem, CrmQuoteItemInsert,
  CrmNotification,
  CrmActivityEnriched,
  CrmDealProduct, CrmDealProductInsert, CrmProduct,
} from '@/lib/types/crm';

// ========================================
// HELPERS
// ========================================

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

function err(msg: string): ActionResult<never> {
  return { success: false, error: msg };
}

function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

// ========================================
// DEAL DETAIL — Agregação completa para o painel
// ========================================

export async function getDealFullDetail(dealId: string): Promise<ActionResult<CrmDealDetail>> {
  try {
    const sb = createServiceClient();

    // Busca paralela de todas as entidades associadas
    const [
      dealRes,
      activitiesRes,
      attachmentsRes,
      followersRes,
      changelogRes,
      commentsRes,
      quotesRes,
      productsRes,
    ] = await Promise.all([
      // Deal com joins
      sb.from('crm_deals').select(`
        *,
        contact:crm_contacts(id, nome, sobrenome, email, whatsapp, telefone, avatar_url, cpf, cargo, lifecycle_stage, score, tags),
        company:crm_companies(id, nome, cnpj, setor, porte, telefone, email),
        owner:corretores(id, nome, foto_url, email),
        stage:crm_stages(id, nome, cor, slug, posicao, probabilidade, is_won, is_lost)
      `).eq('id', dealId).single(),

      // Activities (timeline)
      sb.from('crm_activities').select(`
        *,
        owner:corretores(nome, foto_url)
      `).eq('deal_id', dealId).order('created_at', { ascending: false }).limit(100),

      // Attachments
      sb.from('crm_attachments').select(`
        *,
        uploader:corretores(nome)
      `).eq('entity_type', 'deal').eq('entity_id', dealId).order('created_at', { ascending: false }),

      // Followers
      sb.from('crm_followers').select(`
        *,
        corretor:corretores(nome, foto_url)
      `).eq('entity_type', 'deal').eq('entity_id', dealId),

      // Changelog
      sb.from('crm_changelog').select(`
        *,
        changed_by_corretor:corretores(nome)
      `).eq('entity_type', 'deal').eq('entity_id', dealId).order('created_at', { ascending: false }).limit(50),

      // Comments
      sb.from('crm_comments').select(`
        *,
        corretor:corretores(nome, foto_url)
      `).eq('entity_type', 'deal').eq('entity_id', dealId).order('created_at', { ascending: true }),

      // Quotes
      sb.from('crm_quotes').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }),

      // Deal Products
      sb.from('crm_deal_products').select(`
        *,
        product:crm_products(nome)
      `).eq('deal_id', dealId),
    ]);

    if (dealRes.error) throw dealRes.error;
    const deal = dealRes.data;

    // Stage progress: todas as stages do pipeline com indicação de progresso
    const { data: allStages } = await sb
      .from('crm_stages')
      .select('id, nome, cor, posicao, probabilidade, is_won, is_lost')
      .eq('pipeline_id', deal.pipeline_id)
      .order('posicao');

    const currentStagePos = deal.stage?.posicao ?? 0;
    const stageProgress = (allStages ?? []).map((s) => ({
      id: s.id,
      nome: s.nome,
      cor: s.cor,
      posicao: s.posicao,
      probabilidade: s.probabilidade,
      is_current: s.id === deal.stage_id,
      is_completed: s.posicao < currentStagePos,
    }));

    // Related deals (mesma company ou mesmo contact)
    let relatedDeals: CrmDealDetail['related_deals'] = [];
    if (deal.contact_id || deal.company_id) {
      let relatedQuery = sb.from('crm_deals').select(`
        id, titulo, valor, data_ganho, data_perda,
        stage:crm_stages(nome, cor)
      `).neq('id', dealId).limit(5);

      if (deal.company_id) {
        relatedQuery = relatedQuery.eq('company_id', deal.company_id);
      } else if (deal.contact_id) {
        relatedQuery = relatedQuery.eq('contact_id', deal.contact_id);
      }

      const { data: related } = await relatedQuery;
      relatedDeals = (related ?? []).map((r) => {
        const stageData = Array.isArray(r.stage) ? r.stage[0] : r.stage;
        return {
          id: r.id,
          titulo: r.titulo,
          valor: r.valor,
          stage_nome: stageData?.nome ?? null,
          stage_cor: stageData?.cor ?? null,
          data_ganho: r.data_ganho,
          data_perda: r.data_perda,
        };
      });
    }

    // Overdue & today tasks
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const activities: CrmActivityEnriched[] = (activitiesRes.data ?? []).map((a) => ({
      ...a,
      owner_nome: a.owner?.nome ?? null,
      owner_foto: a.owner?.foto_url ?? null,
      deal_titulo: null,
      contact_nome: null,
    }));

    const overdueTasks = activities.filter(
      (a) => !a.concluida && a.data_vencimento && new Date(a.data_vencimento) < now
    );

    const todayTasks = activities.filter(
      (a) => !a.concluida && a.data_vencimento &&
        a.data_vencimento >= todayStart && a.data_vencimento < todayEnd
    );

    // Montar comments com threads
    const flatComments: CrmCommentEnriched[] = (commentsRes.data ?? []).map((c) => ({
      ...c,
      corretor_nome: c.corretor?.nome ?? 'Desconhecido',
      corretor_foto: c.corretor?.foto_url ?? null,
      replies: [],
    }));

    // Agrupar replies nos parents
    const commentMap = new Map<string, CrmCommentEnriched>();
    const rootComments: CrmCommentEnriched[] = [];
    flatComments.forEach((c) => commentMap.set(c.id, c));
    flatComments.forEach((c) => {
      if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
        const parent = commentMap.get(c.parent_comment_id)!;
        parent.replies = parent.replies ?? [];
        parent.replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    const enrichedDeal: CrmDealDetail = {
      ...deal,
      stage_nome: deal.stage?.nome,
      stage_cor: deal.stage?.cor,
      stage_slug: deal.stage?.slug,
      contact: deal.contact,
      company: deal.company,
      owner: deal.owner,
      total_activities: activities.length,
      total_products: productsRes.data?.length ?? 0,
      activities,
      attachments: (attachmentsRes.data ?? []).map((a) => ({
        ...a,
        uploaded_by_nome: a.uploader?.nome ?? null,
      })),
      followers: (followersRes.data ?? []).map((f) => ({
        ...f,
        corretor_nome: f.corretor?.nome ?? 'Desconhecido',
        corretor_foto: f.corretor?.foto_url ?? null,
      })),
      changelog: (changelogRes.data ?? []).map((c) => ({
        ...c,
        changed_by_nome: c.changed_by_corretor?.nome ?? null,
      })),
      comments: rootComments,
      quotes: quotesRes.data ?? [],
      products: (productsRes.data ?? []).map((p) => ({
        ...p,
        product_nome: p.product?.nome ?? undefined,
      })),
      related_deals: relatedDeals,
      stage_progress: stageProgress,
      overdue_tasks: overdueTasks,
      today_tasks: todayTasks,
    };

    return ok(enrichedDeal);
  } catch (e) {
    logger.error('[getDealFullDetail]', e);
    return err('Erro ao carregar detalhes do deal');
  }
}

// ========================================
// INLINE EDIT — Atualizar campo individual do deal
// ========================================

export async function updateDealField(
  dealId: string,
  field: string,
  value: string | number | boolean | null,
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const normalizedValue =
      field === 'owner_corretor_id' && typeof value === 'string' && value.trim().length === 0
        ? null
        : value;

    const { data: dealRefs, error: refsError } = await sb
      .from('crm_deals')
      .select('lead_id, crm_card_id')
      .eq('id', dealId)
      .maybeSingle();

    if (refsError) throw refsError;

    const { error } = await sb.from('crm_deals').update({ [field]: normalizedValue }).eq('id', dealId);
    if (error) throw error;

    if (field === 'owner_corretor_id') {
      const ownerId = typeof normalizedValue === 'string' ? normalizedValue : null;

      if (dealRefs?.lead_id) {
        const { error: leadOwnerError } = await sb
          .from('insurance_leads')
          .update({ corretor_id: ownerId, updated_at: new Date().toISOString() })
          .eq('id', dealRefs.lead_id);

        if (leadOwnerError) {
          logger.warn('[updateDealField] Falha ao sincronizar corretor no lead', {
            deal_id: dealId,
            lead_id: dealRefs.lead_id,
            error: leadOwnerError.message,
          });
        }

        const { error: queueOwnerError } = await sb
          .from('propostas_fila')
          .update({ corretor_id: ownerId })
          .eq('lead_id', dealRefs.lead_id);

        if (queueOwnerError) {
          logger.warn('[updateDealField] Falha ao sincronizar corretor na fila de propostas', {
            deal_id: dealId,
            lead_id: dealRefs.lead_id,
            error: queueOwnerError.message,
          });
        }
      }

      if (dealRefs?.crm_card_id) {
        const { error: cardOwnerError } = await sb
          .from('crm_cards')
          .update({ corretor_id: ownerId })
          .eq('id', dealRefs.crm_card_id);

        if (cardOwnerError) {
          logger.warn('[updateDealField] Falha ao sincronizar corretor no card do CRM', {
            deal_id: dealId,
            crm_card_id: dealRefs.crm_card_id,
            error: cardOwnerError.message,
          });
        }
      }
    }

    return { success: true };
  } catch (e) {
    logger.error('[updateDealField]', e);
    return err('Erro ao atualizar campo');
  }
}

// ========================================
// ATTACHMENTS
// ========================================

export async function addAttachment(input: CrmAttachmentInsert): Promise<ActionResult<CrmAttachment>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_attachments').insert(input).select().single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    logger.error('[addAttachment]', e);
    return err('Erro ao adicionar arquivo');
  }
}

export async function deleteAttachment(id: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();

    // Buscar storage_path para deletar do storage
    const { data: att } = await sb.from('crm_attachments').select('storage_path').eq('id', id).single();
    if (att?.storage_path) {
      await sb.storage.from('crm-attachments').remove([att.storage_path]);
    }

    const { error } = await sb.from('crm_attachments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteAttachment]', e);
    return err('Erro ao excluir arquivo');
  }
}

export async function getAttachments(
  entityType: string,
  entityId: string,
): Promise<ActionResult<CrmAttachmentEnriched[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_attachments')
      .select(`*, uploader:corretores(nome)`)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return ok((data ?? []).map((a) => ({
      ...a,
      uploaded_by_nome: a.uploader?.nome ?? null,
    })));
  } catch (e) {
    logger.error('[getAttachments]', e);
    return err('Erro ao carregar arquivos');
  }
}

// ========================================
// FOLLOWERS
// ========================================

export async function followEntity(
  entityType: 'deal' | 'contact' | 'company',
  entityId: string,
  corretorId: string,
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_followers').insert({
      entity_type: entityType,
      entity_id: entityId,
      corretor_id: corretorId,
    });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[followEntity]', e);
    return err('Erro ao seguir');
  }
}

export async function unfollowEntity(
  entityType: 'deal' | 'contact' | 'company',
  entityId: string,
  corretorId: string,
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('crm_followers')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('corretor_id', corretorId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[unfollowEntity]', e);
    return err('Erro ao deixar de seguir');
  }
}

export async function getFollowers(
  entityType: string,
  entityId: string,
): Promise<ActionResult<CrmFollowerEnriched[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_followers')
      .select(`*, corretor:corretores(nome, foto_url)`)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);
    if (error) throw error;

    return ok((data ?? []).map((f) => ({
      ...f,
      corretor_nome: f.corretor?.nome ?? 'Desconhecido',
      corretor_foto: f.corretor?.foto_url ?? null,
    })));
  } catch (e) {
    logger.error('[getFollowers]', e);
    return err('Erro ao carregar seguidores');
  }
}

// ========================================
// CHANGELOG
// ========================================

export async function getChangelog(
  entityType: string,
  entityId: string,
  limit = 50,
): Promise<ActionResult<CrmChangelogEnriched[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_changelog')
      .select(`*, changed_by_corretor:corretores(nome)`)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return ok((data ?? []).map((c) => ({
      ...c,
      changed_by_nome: c.changed_by_corretor?.nome ?? null,
    })));
  } catch (e) {
    logger.error('[getChangelog]', e);
    return err('Erro ao carregar histórico');
  }
}

// ========================================
// COMMENTS
// ========================================

export async function addComment(input: CrmCommentInsert): Promise<ActionResult<CrmComment>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_comments').insert(input).select().single();
    if (error) throw error;

    // Notificar mencionados
    if (input.mentions && input.mentions.length > 0) {
      const notifications = input.mentions.map((mentionedId) => ({
        corretor_id: mentionedId,
        tipo: 'comment_mention' as const,
        titulo: 'Você foi mencionado',
        mensagem: input.comment_text.substring(0, 200),
        entity_type: input.entity_type,
        entity_id: input.entity_id,
      }));
      await sb.from('crm_notifications').insert(notifications);
    }

    // Notificar se é reply
    if (input.parent_comment_id) {
      const { data: parent } = await sb
        .from('crm_comments')
        .select('corretor_id')
        .eq('id', input.parent_comment_id)
        .single();

      if (parent && parent.corretor_id !== input.corretor_id) {
        await sb.from('crm_notifications').insert({
          corretor_id: parent.corretor_id,
          tipo: 'comment_reply',
          titulo: 'Resposta ao seu comentário',
          mensagem: input.comment_text.substring(0, 200),
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        });
      }
    }

    return ok(data);
  } catch (e) {
    logger.error('[addComment]', e);
    return err('Erro ao adicionar comentário');
  }
}

export async function deleteComment(id: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_comments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteComment]', e);
    return err('Erro ao excluir comentário');
  }
}

export async function togglePinComment(id: string, isPinned: boolean): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_comments').update({ is_pinned: isPinned }).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[togglePinComment]', e);
    return err('Erro ao fixar comentário');
  }
}

// ========================================
// QUOTES
// ========================================

export async function createQuote(
  input: Omit<CrmQuoteInsert, 'quote_number'>,
  items: Omit<CrmQuoteItemInsert, 'quote_id'>[],
): Promise<ActionResult<CrmQuote>> {
  try {
    const sb = createServiceClient();

    // Gerar número da cotação
    const { data: quoteNumber } = await sb.rpc('generate_crm_quote_number');

    const { data: quote, error } = await sb
      .from('crm_quotes')
      .insert({ ...input, quote_number: quoteNumber })
      .select()
      .single();
    if (error) throw error;

    // Inserir itens
    if (items.length > 0) {
      const itemsWithQuoteId = items.map((item, idx) => ({
        ...item,
        quote_id: quote.id,
        posicao: idx,
      }));
      await sb.from('crm_quote_items').insert(itemsWithQuoteId);
    }

    return ok(quote);
  } catch (e) {
    logger.error('[createQuote]', e);
    return err('Erro ao criar cotação');
  }
}

export async function updateQuoteStatus(
  quoteId: string,
  status: CrmQuote['status'],
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const updates: Record<string, unknown> = { status };

    if (status === 'accepted') updates.accepted_at = new Date().toISOString();
    if (status === 'declined') updates.declined_at = new Date().toISOString();
    if (status === 'viewed') {
      // Incrementar view count
      const { data: current } = await sb.from('crm_quotes').select('view_count').eq('id', quoteId).single();
      updates.view_count = (current?.view_count ?? 0) + 1;
      updates.last_viewed_at = new Date().toISOString();
    }

    const { error } = await sb.from('crm_quotes').update(updates).eq('id', quoteId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updateQuoteStatus]', e);
    return err('Erro ao atualizar status da cotação');
  }
}

export async function getQuoteItems(quoteId: string): Promise<ActionResult<CrmQuoteItem[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('posicao');
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    logger.error('[getQuoteItems]', e);
    return err('Erro ao carregar itens da cotação');
  }
}

// ========================================
// NOTIFICATIONS
// ========================================

export async function getNotifications(
  corretorId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
): Promise<ActionResult<CrmNotification[]>> {
  try {
    const sb = createServiceClient();
    let query = sb
      .from('crm_notifications')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 50);

    if (options.unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query;
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    logger.error('[getNotifications]', e);
    return err('Erro ao carregar notificações');
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('crm_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[markNotificationRead]', e);
    return err('Erro ao marcar como lida');
  }
}

export async function markAllNotificationsRead(corretorId: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('crm_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('corretor_id', corretorId)
      .eq('is_read', false);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[markAllNotificationsRead]', e);
    return err('Erro ao marcar todas como lidas');
  }
}

export async function getUnreadCount(corretorId: string): Promise<ActionResult<number>> {
  try {
    const sb = createServiceClient();
    const { count, error } = await sb
      .from('crm_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('corretor_id', corretorId)
      .eq('is_read', false);
    if (error) throw error;
    return ok(count ?? 0);
  } catch (e) {
    logger.error('[getUnreadCount]', e);
    return err('Erro ao contar notificações');
  }
}

// ========================================
// DEAL PRODUCTS — CRUD
// ========================================

export async function getDealProducts(
  dealId: string,
): Promise<ActionResult<(CrmDealProduct & { product_nome?: string })[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_deal_products')
      .select(`*, product:crm_products(nome)`)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const mapped = (data ?? []).map((p: Record<string, unknown>) => ({
      ...(p as CrmDealProduct),
      product_nome: (p.product as { nome?: string } | null)?.nome ?? undefined,
    }));
    return ok(mapped);
  } catch (e) {
    logger.error('[getDealProducts]', e);
    return err('Erro ao buscar produtos do deal');
  }
}

export async function addDealProduct(
  input: CrmDealProductInsert,
): Promise<ActionResult<CrmDealProduct>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_deal_products')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return ok(data as CrmDealProduct);
  } catch (e) {
    logger.error('[addDealProduct]', e);
    return err('Erro ao adicionar produto');
  }
}

export async function updateDealProduct(
  id: string,
  updates: Partial<Pick<CrmDealProduct, 'quantidade' | 'preco_unitario' | 'desconto_pct' | 'total'>>,
): Promise<ActionResult<CrmDealProduct>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_deal_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return ok(data as CrmDealProduct);
  } catch (e) {
    logger.error('[updateDealProduct]', e);
    return err('Erro ao atualizar produto');
  }
}

export async function removeDealProduct(id: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('crm_deal_products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[removeDealProduct]', e);
    return err('Erro ao remover produto');
  }
}

// ========================================
// PRODUCT CATALOG — List
// ========================================

export async function listProducts(): Promise<ActionResult<CrmProduct[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_products')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true });
    if (error) throw error;
    return ok((data ?? []) as CrmProduct[]);
  } catch (e) {
    logger.error('[listProducts]', e);
    return err('Erro ao listar produtos');
  }
}
