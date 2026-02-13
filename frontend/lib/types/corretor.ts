// =============================================
// 📦 TIPOS DO MÓDULO CORRETOR
// =============================================

// ========================================
// ENUMS
// ========================================

export const CORRETOR_ROLE = ['corretor', 'supervisor', 'admin'] as const;
export type CorretorRole = (typeof CORRETOR_ROLE)[number];

export const KANBAN_COLUMN_SLUG = [
  'novo_lead',
  'qualificado',
  'proposta_enviada',
  'documentacao',
  'fechado',
  'perdido',
] as const;
export type KanbanColumnSlug = (typeof KANBAN_COLUMN_SLUG)[number];

export const CRM_INTERACAO_TIPO = [
  'nota',
  'ligacao',
  'whatsapp',
  'email',
  'reuniao',
  'proposta_enviada',
  'proposta_aceita',
  'proposta_recusada',
  'documento_recebido',
  'status_change',
  'nota_voz',
  'sistema',
] as const;
export type CrmInteracaoTipo = (typeof CRM_INTERACAO_TIPO)[number];

export const MATERIAL_CATEGORIA = ['pme', 'adesao', 'individual', 'geral'] as const;
export type MaterialCategoria = (typeof MATERIAL_CATEGORIA)[number];

export const RENOVACAO_STATUS = [
  'pendente',
  'contato_feito',
  'negociando',
  'renovado',
  'cancelado',
  'perdido',
] as const;
export type RenovacaoStatus = (typeof RENOVACAO_STATUS)[number];

export const CARD_PRIORIDADE = ['baixa', 'media', 'alta', 'urgente'] as const;
export type CardPrioridade = (typeof CARD_PRIORIDADE)[number];

// ========================================
// ENTITIES
// ========================================

export type Corretor = {
  id: string;
  user_id: string | null;
  nome: string;
  cpf: string | null;
  email: string;
  telefone: string | null;
  whatsapp: string | null;
  susep: string | null;
  creci: string | null;
  foto_url: string | null;
  slug: string | null;
  logo_personalizada_url: string | null;
  cor_primaria: string;
  role: CorretorRole;
  supervisor_id: string | null;
  ativo: boolean;
  data_admissao: string | null;
  comissao_padrao_pct: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CorretorInsert = Omit<Corretor, 'id' | 'created_at' | 'updated_at'>;
export type CorretorUpdate = Partial<Omit<Corretor, 'id' | 'created_at'>>;

export type KanbanColumn = {
  id: string;
  nome: string;
  slug: KanbanColumnSlug;
  cor: string;
  icone: string | null;
  posicao: number;
  ativo: boolean;
  created_at: string;
};

export type CrmCard = {
  id: string;
  corretor_id: string;
  lead_id: string | null;
  coluna_slug: KanbanColumnSlug;
  titulo: string;
  subtitulo: string | null;
  valor_estimado: number | null;
  posicao: number;
  score: number;
  score_motivo: string | null;
  ultima_interacao_proposta: string | null;
  total_interacoes: number;
  tags: string[];
  prioridade: CardPrioridade;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CrmCardInsert = Omit<CrmCard, 'id' | 'created_at' | 'updated_at'>;
export type CrmCardUpdate = Partial<Omit<CrmCard, 'id' | 'created_at'>>;

// Card com dados enriquecidos (join com lead)
export type CrmCardEnriched = CrmCard & {
  lead?: {
    nome: string;
    whatsapp: string;
    email: string | null;
    operadora_atual: string | null;
    valor_atual: number | null;
  } | null;
  interacoes_count?: number;
  is_hot: boolean; // Interagiu com proposta nas últimas 24h
  is_stale: boolean; // Parado >48h
  hours_since_update: number;
};

export type CrmInteracao = {
  id: string;
  card_id: string;
  corretor_id: string;
  lead_id: string | null;
  tipo: CrmInteracaoTipo;
  titulo: string | null;
  descricao: string | null;
  anexo_url: string | null;
  anexo_tipo: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CrmInteracaoInsert = Omit<CrmInteracao, 'id' | 'created_at'>;

export type MaterialVendas = {
  id: string;
  categoria: MaterialCategoria;
  subcategoria: string | null;
  operadora_id: string | null;
  nome: string;
  descricao: string | null;
  tipo_arquivo: string;
  url: string;
  tamanho_bytes: number | null;
  thumbnail_url: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  uploaded_by: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type MaterialVendasInsert = Omit<MaterialVendas, 'id' | 'created_at' | 'updated_at'>;

export type BannerRequest = {
  id: string;
  corretor_id: string;
  nome_corretor: string;
  whatsapp_corretor: string;
  template_id: string | null;
  imagem_url: string | null;
  status: 'pendente' | 'processando' | 'pronto' | 'erro';
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BannerRequestInsert = Omit<BannerRequest, 'id' | 'created_at'>;

export type Renovacao = {
  id: string;
  corretor_id: string;
  proposta_id: string;
  lead_id: string | null;
  nome_cliente: string;
  operadora_nome: string | null;
  valor_atual: number | null;
  data_vencimento: string;
  dias_para_vencimento: number;
  status: RenovacaoStatus;
  notificacao_30d: boolean;
  notificacao_60d: boolean;
  notificacao_enviada_em: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RenovacaoUpdate = Partial<Omit<Renovacao, 'id' | 'created_at' | 'dias_para_vencimento'>>;

export type ComissaoComprovante = {
  id: string;
  comissao_id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  url: string;
  tamanho_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
};

// ========================================
// VIEW
// ========================================

export type CorretorDashboard = {
  corretor_id: string;
  corretor_nome: string;
  leads_novos: number;
  leads_qualificados: number;
  propostas_enviadas: number;
  fechados: number;
  perdidos: number;
  comissao_recebida: number;
  comissao_pendente: number;
  renovacoes_30d: number;
  renovacoes_60d: number;
};

// ========================================
// COMISSIONAMENTO: Regras de Grade
// ========================================

export type GradeComissao = {
  faixa: '100%' | '200%' | '300%';
  percentual: number;
  descricao: string;
  cor: string;
};

export const GRADE_COMISSAO: GradeComissao[] = [
  { faixa: '100%', percentual: 100, descricao: '1ª Parcela (100%)', cor: '#3B82F6' },
  { faixa: '200%', percentual: 200, descricao: 'Bonificação 200%', cor: '#D4AF37' },
  { faixa: '300%', percentual: 300, descricao: 'Super Bonificação 300%', cor: '#10B981' },
];

// ========================================
// KANBAN DND TYPES
// ========================================

export type KanbanBoard = Record<KanbanColumnSlug, CrmCardEnriched[]>;

export type KanbanDragResult = {
  cardId: string;
  sourceColumn: KanbanColumnSlug;
  destinationColumn: KanbanColumnSlug;
  newPosition: number;
};
