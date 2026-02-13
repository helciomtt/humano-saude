// =============================================
// 📦 HUMANO SAÚDE — TIPOS DO CRM AVANÇADO
// =============================================
// Tipagem para: Pipelines, Stages, Deals, Contacts,
// Companies, Activities, Products, Workflows
// Sincronizado com 20260213_create_crm_advanced.sql
// =============================================

// ========================================
// ENUMS
// ========================================

export const CRM_LIFECYCLE_STAGES = [
  'subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist',
] as const;
export type CrmLifecycleStage = (typeof CRM_LIFECYCLE_STAGES)[number];

export const CRM_ACTIVITY_TYPES = [
  'ligacao', 'email', 'reuniao', 'whatsapp', 'nota', 'tarefa',
  'proposta_enviada', 'proposta_aceita', 'proposta_recusada',
  'documento_enviado', 'documento_recebido', 'visita',
  'follow_up', 'stage_change', 'sistema',
] as const;
export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number];

export const CRM_DEAL_PRIORITIES = ['baixa', 'media', 'alta', 'urgente'] as const;
export type CrmDealPriority = (typeof CRM_DEAL_PRIORITIES)[number];

export const CRM_WORKFLOW_TRIGGERS = [
  'deal.stage.changed', 'deal.created', 'deal.won', 'deal.lost',
  'contact.created', 'contact.lifecycle.changed',
  'activity.overdue', 'contact.form.submitted',
  'schedule.daily', 'schedule.weekly', 'webhook.received',
] as const;
export type CrmWorkflowTrigger = (typeof CRM_WORKFLOW_TRIGGERS)[number];

export const CRM_WORKFLOW_ACTION_TYPES = [
  'email.send', 'task.create', 'field.update', 'webhook.call',
  'notification.push', 'deal.create', 'wait.delay', 'contact.update',
] as const;
export type CrmWorkflowActionType = (typeof CRM_WORKFLOW_ACTION_TYPES)[number];

export const CRM_CUSTOM_FIELD_TYPES = [
  'text', 'number', 'date', 'select', 'multi_select', 'boolean', 'url', 'email', 'phone',
] as const;
export type CrmCustomFieldType = (typeof CRM_CUSTOM_FIELD_TYPES)[number];

export const CRM_COMPANY_SIZES = ['MEI', 'ME', 'EPP', 'Médio', 'Grande'] as const;
export type CrmCompanySize = (typeof CRM_COMPANY_SIZES)[number];

// ========================================
// PIPELINE & STAGES
// ========================================

export type CrmPipeline = {
  id: string;
  nome: string;
  descricao: string | null;
  posicao: number;
  is_default: boolean;
  is_active: boolean;
  cor: string;
  created_at: string;
  updated_at: string;
};

export type CrmPipelineInsert = Omit<CrmPipeline, 'id' | 'created_at' | 'updated_at'>;
export type CrmPipelineUpdate = Partial<CrmPipelineInsert>;

export type CrmStage = {
  id: string;
  pipeline_id: string;
  nome: string;
  slug: string;
  posicao: number;
  cor: string;
  icone: string | null;
  probabilidade: number;
  is_won: boolean;
  is_lost: boolean;
  auto_move_days: number | null;
  created_at: string;
  updated_at: string;
};

export type CrmStageInsert = Omit<CrmStage, 'id' | 'created_at' | 'updated_at'>;
export type CrmStageUpdate = Partial<CrmStageInsert>;

// Stage com métricas (da view crm_deal_by_stage)
export type CrmStageWithMetrics = CrmStage & {
  pipeline_nome: string;
  total_deals: number;
  valor_total: number;
  valor_medio: number;
  deals_hot: number;
  deals_stale: number;
};

// ========================================
// COMPANIES
// ========================================

export type CrmCompany = {
  id: string;
  nome: string;
  cnpj: string | null;
  razao_social: string | null;
  dominio: string | null;
  setor: string | null;
  porte: CrmCompanySize | null;
  qtd_funcionarios: number | null;
  faturamento_anual: number | null;
  telefone: string | null;
  email: string | null;
  endereco: Record<string, unknown>;
  logo_url: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  owner_corretor_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmCompanyInsert = Omit<CrmCompany, 'id' | 'created_at' | 'updated_at'>;
export type CrmCompanyUpdate = Partial<CrmCompanyInsert>;

// Company com contagem de contatos e deals
export type CrmCompanyEnriched = CrmCompany & {
  total_contacts: number;
  total_deals: number;
  valor_total_deals: number;
  owner_nome?: string | null;
};

// ========================================
// CONTACTS
// ========================================

export type CrmContact = {
  id: string;
  company_id: string | null;
  lead_id: string | null;
  owner_corretor_id: string | null;
  nome: string;
  sobrenome: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  cargo: string | null;
  lifecycle_stage: CrmLifecycleStage;
  lead_source: string | null;
  score: number;
  score_motivo: string | null;
  ultimo_contato: string | null;
  total_atividades: number;
  avatar_url: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CrmContactInsert = Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>;
export type CrmContactUpdate = Partial<CrmContactInsert>;

// Contact com dados de empresa e owner
export type CrmContactEnriched = CrmContact & {
  company_nome?: string | null;
  owner_nome?: string | null;
  total_deals: number;
};

// ========================================
// DEALS
// ========================================

export type CrmDeal = {
  id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string | null;
  company_id: string | null;
  owner_corretor_id: string | null;
  crm_card_id: string | null;
  lead_id: string | null;
  titulo: string;
  valor: number | null;
  valor_recorrente: number | null;
  moeda: string;
  data_previsao_fechamento: string | null;
  data_ganho: string | null;
  data_perda: string | null;
  probabilidade: number | null;
  posicao: number;
  motivo_perda: string | null;
  motivo_perda_detalhe: string | null;
  score: number;
  prioridade: CrmDealPriority;
  is_hot: boolean;
  is_stale: boolean;
  dias_no_stage: number;
  tags: string[];
  custom_fields: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CrmDealInsert = Omit<CrmDeal, 'id' | 'created_at' | 'updated_at'>;
export type CrmDealUpdate = Partial<CrmDealInsert>;

// Deal com dados de contact, company, stage e owner para renderizar no Kanban
export type CrmDealEnriched = CrmDeal & {
  stage_nome?: string;
  stage_cor?: string;
  stage_slug?: string;
  contact?: {
    nome: string;
    sobrenome: string | null;
    email: string | null;
    telefone: string | null;
    whatsapp: string | null;
    cargo: string | null;
    avatar_url: string | null;
  } | null;
  company?: {
    nome: string;
    cnpj: string | null;
  } | null;
  owner?: {
    nome: string;
    foto_url: string | null;
  } | null;
  total_activities: number;
  total_products: number;
};

// ========================================
// ACTIVITIES
// ========================================

export type CrmActivity = {
  id: string;
  deal_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  owner_corretor_id: string | null;
  tipo: CrmActivityType;
  assunto: string | null;
  descricao: string | null;
  concluida: boolean;
  data_vencimento: string | null;
  data_conclusao: string | null;
  duracao_minutos: number | null;
  anexo_url: string | null;
  anexo_tipo: string | null;
  resultado: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CrmActivityInsert = Omit<CrmActivity, 'id' | 'created_at'>;
export type CrmActivityUpdate = Partial<CrmActivityInsert>;

export type CrmActivityEnriched = CrmActivity & {
  owner_nome?: string | null;
  owner_foto?: string | null;
  deal_titulo?: string | null;
  contact_nome?: string | null;
};

// ========================================
// PRODUCTS
// ========================================

export type CrmProduct = {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string | null;
  operadora_id: string | null;
  preco: number;
  preco_recorrente: number | null;
  moeda: string;
  categoria: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CrmProductInsert = Omit<CrmProduct, 'id' | 'created_at' | 'updated_at'>;

export type CrmDealProduct = {
  id: string;
  deal_id: string;
  product_id: string;
  quantidade: number;
  preco_unitario: number;
  desconto_pct: number;
  total: number;
  created_at: string;
};

export type CrmDealProductInsert = Omit<CrmDealProduct, 'id' | 'created_at'>;

// ========================================
// WORKFLOWS
// ========================================

export type CrmWorkflowAction = {
  type: CrmWorkflowActionType;
  config: Record<string, unknown>;
  delay_minutes?: number;
};

export type CrmWorkflow = {
  id: string;
  nome: string;
  descricao: string | null;
  trigger_type: CrmWorkflowTrigger;
  trigger_config: Record<string, unknown>;
  actions: CrmWorkflowAction[];
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmWorkflowInsert = Omit<CrmWorkflow, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed_at'>;
export type CrmWorkflowUpdate = Partial<CrmWorkflowInsert>;

export type CrmWorkflowExecution = {
  id: string;
  workflow_id: string;
  entity_type: string | null;
  entity_id: string | null;
  status: 'running' | 'success' | 'failed' | 'skipped';
  error_message: string | null;
  duration_ms: number | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  executed_at: string;
};

// ========================================
// CUSTOM FIELDS
// ========================================

export type CrmCustomFieldConfig = {
  id: string;
  entity_type: 'deal' | 'contact' | 'company';
  field_key: string;
  field_label: string;
  field_type: CrmCustomFieldType;
  options: Array<{ value: string; label: string }>;
  is_required: boolean;
  posicao: number;
  is_active: boolean;
  created_at: string;
};

// ========================================
// ANALYTICS / METRICS
// ========================================

export type CrmDealMetrics = {
  total_deals: number;
  deals_ganhos: number;
  deals_perdidos: number;
  deals_abertos: number;
  valor_total_pipeline: number;
  valor_ganho: number;
  valor_perdido: number;
  valor_aberto: number;
  ticket_medio: number;
  forecast_ponderado: number;
  taxa_conversao: number;
  tempo_medio_fechamento_dias: number | null;
  deals_mes_atual: number;
  deals_semana_atual: number;
  deals_hoje: number;
  deals_urgentes: number;
  deals_hot: number;
  deals_stale: number;
  ultimo_deal_criado: string | null;
  ultima_atualizacao: string | null;
};

export type CrmCorretorPerformance = {
  corretor_id: string;
  corretor_nome: string;
  foto_url: string | null;
  total_deals: number;
  deals_ganhos: number;
  deals_perdidos: number;
  valor_ganho: number;
  valor_pipeline: number;
  taxa_conversao: number;
  atividades_7d: number;
  tempo_medio_dias: number | null;
};

// ========================================
// KANBAN BOARD (Admin — multi-corretor)
// ========================================

export type AdminKanbanBoard = {
  pipeline: CrmPipeline;
  stages: CrmStageWithMetrics[];
  dealsByStage: Record<string, CrmDealEnriched[]>;
};

export type AdminKanbanDragResult = {
  dealId: string;
  sourceStageId: string;
  destinationStageId: string;
  newPosition: number;
};

// ========================================
// FILTROS
// ========================================

export type CrmDealFilters = {
  search?: string;
  pipeline_id?: string;
  stage_id?: string;
  owner_corretor_id?: string;
  prioridade?: CrmDealPriority;
  is_hot?: boolean;
  is_stale?: boolean;
  valor_min?: number;
  valor_max?: number;
  data_criacao_inicio?: string;
  data_criacao_fim?: string;
  tags?: string[];
  orderBy?: 'created_at' | 'updated_at' | 'valor' | 'score' | 'posicao';
  orderDir?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
};

export type CrmContactFilters = {
  search?: string;
  lifecycle_stage?: CrmLifecycleStage;
  company_id?: string;
  owner_corretor_id?: string;
  score_min?: number;
  tags?: string[];
  orderBy?: 'created_at' | 'updated_at' | 'score' | 'nome';
  orderDir?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
};

export type CrmCompanyFilters = {
  search?: string;
  setor?: string;
  porte?: CrmCompanySize;
  owner_corretor_id?: string;
  orderBy?: 'created_at' | 'updated_at' | 'nome';
  orderDir?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
};

// ========================================
// ATTACHMENTS
// ========================================

export type CrmAttachment = {
  id: string;
  entity_type: 'deal' | 'contact' | 'company' | 'activity' | 'quote';
  entity_id: string;
  file_name: string;
  file_url: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  version: number;
  parent_id: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type CrmAttachmentInsert = Omit<CrmAttachment, 'id' | 'created_at'>;

export type CrmAttachmentEnriched = CrmAttachment & {
  uploaded_by_nome?: string | null;
};

// ========================================
// FOLLOWERS
// ========================================

export type CrmFollower = {
  id: string;
  entity_type: 'deal' | 'contact' | 'company';
  entity_id: string;
  corretor_id: string;
  auto_follow: boolean;
  created_at: string;
};

export type CrmFollowerEnriched = CrmFollower & {
  corretor_nome: string;
  corretor_foto: string | null;
};

// ========================================
// CHANGELOG (Audit Trail)
// ========================================

export type CrmChangelog = {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_by_type: 'user' | 'workflow' | 'api' | 'system';
  created_at: string;
};

export type CrmChangelogEnriched = CrmChangelog & {
  changed_by_nome?: string | null;
};

// Mapa de nomes de campo para labels legíveis
export const CRM_FIELD_LABELS: Record<string, string> = {
  stage_id: 'Etapa',
  valor: 'Valor',
  owner_corretor_id: 'Responsável',
  prioridade: 'Prioridade',
  data_previsao_fechamento: 'Previsão de Fechamento',
  titulo: 'Título',
  contact_id: 'Contato',
  company_id: 'Empresa',
  probabilidade: 'Probabilidade',
  status: 'Status',
  lifecycle_stage: 'Lifecycle Stage',
};

// ========================================
// COMMENTS
// ========================================

export type CrmComment = {
  id: string;
  entity_type: 'deal' | 'contact' | 'company' | 'activity';
  entity_id: string;
  corretor_id: string;
  comment_text: string;
  mentions: string[];
  parent_comment_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type CrmCommentInsert = {
  entity_type: CrmComment['entity_type'];
  entity_id: string;
  corretor_id: string;
  comment_text: string;
  mentions?: string[];
  parent_comment_id?: string | null;
};

export type CrmCommentEnriched = CrmComment & {
  corretor_nome: string;
  corretor_foto: string | null;
  replies?: CrmCommentEnriched[];
};

// ========================================
// QUOTES (Propostas/Cotações)
// ========================================

export const CRM_QUOTE_STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'] as const;
export type CrmQuoteStatus = (typeof CRM_QUOTE_STATUSES)[number];

export type CrmQuote = {
  id: string;
  deal_id: string;
  quote_number: string;
  titulo: string;
  status: CrmQuoteStatus;
  subtotal: number;
  desconto_valor: number;
  imposto_valor: number;
  total: number;
  moeda: string;
  valido_ate: string | null;
  pdf_url: string | null;
  view_count: number;
  last_viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  observacoes: string | null;
  termos: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmQuoteInsert = Omit<CrmQuote, 'id' | 'created_at' | 'updated_at' | 'quote_number' | 'view_count' | 'last_viewed_at' | 'accepted_at' | 'declined_at'>;

export type CrmQuoteItem = {
  id: string;
  quote_id: string;
  product_id: string | null;
  nome: string;
  descricao: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto_pct: number;
  total: number;
  posicao: number;
  created_at: string;
};

export type CrmQuoteItemInsert = Omit<CrmQuoteItem, 'id' | 'created_at'>;

// ========================================
// NOTIFICATIONS
// ========================================

export const CRM_NOTIFICATION_TYPES = [
  'deal_moved', 'deal_won', 'deal_lost', 'deal_assigned',
  'activity_overdue', 'activity_assigned',
  'comment_mention', 'comment_reply',
  'follower_update', 'quote_viewed', 'quote_accepted', 'quote_declined',
  'system',
] as const;
export type CrmNotificationType = (typeof CRM_NOTIFICATION_TYPES)[number];

export type CrmNotification = {
  id: string;
  corretor_id: string;
  tipo: CrmNotificationType;
  titulo: string;
  mensagem: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

// ========================================
// DEAL DETAIL (Agregação completa para o painel)
// ========================================

export type CrmDealDetail = CrmDealEnriched & {
  activities: CrmActivityEnriched[];
  attachments: CrmAttachmentEnriched[];
  followers: CrmFollowerEnriched[];
  changelog: CrmChangelogEnriched[];
  comments: CrmCommentEnriched[];
  quotes: CrmQuote[];
  products: (CrmDealProduct & { product_nome?: string })[];
  related_deals: Array<{
    id: string;
    titulo: string;
    valor: number | null;
    stage_nome: string | null;
    stage_cor: string | null;
    data_ganho: string | null;
    data_perda: string | null;
  }>;
  stage_progress: Array<{
    id: string;
    nome: string;
    cor: string;
    posicao: number;
    probabilidade: number;
    is_current: boolean;
    is_completed: boolean;
  }>;
  overdue_tasks: CrmActivityEnriched[];
  today_tasks: CrmActivityEnriched[];
};

// ========================================
// RESPONSES PADRÃO
// ========================================

export type CrmPaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
