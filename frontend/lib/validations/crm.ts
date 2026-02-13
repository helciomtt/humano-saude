import { z } from 'zod';

// ========================================
// DEAL
// ========================================

export const dealSchema = z.object({
  titulo: z.string().min(2, 'Título deve ter pelo menos 2 caracteres').max(255),
  pipeline_id: z.string().uuid('Pipeline inválido'),
  stage_id: z.string().uuid('Stage inválido'),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  owner_corretor_id: z.string().uuid().nullable().optional(),
  valor: z.coerce.number().min(0).nullable().optional(),
  valor_recorrente: z.coerce.number().min(0).nullable().optional(),
  data_previsao_fechamento: z.string().nullable().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  tags: z.array(z.string()).default([]),
});

export type DealFormData = z.infer<typeof dealSchema>;

export const dealUpdateSchema = dealSchema.partial();
export type DealUpdateFormData = z.infer<typeof dealUpdateSchema>;

// ========================================
// CONTACT
// ========================================

export const contactSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  sobrenome: z.string().max(255).nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  telefone: z.string().max(20).nullable().optional(),
  whatsapp: z.string().max(20).nullable().optional(),
  cpf: z.string().max(14).nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  cargo: z.string().max(100).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  owner_corretor_id: z.string().uuid().nullable().optional(),
  lifecycle_stage: z.enum([
    'subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist',
  ]).default('lead'),
  lead_source: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const contactUpdateSchema = contactSchema.partial();
export type ContactUpdateFormData = z.infer<typeof contactUpdateSchema>;

// ========================================
// COMPANY
// ========================================

export const companySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  cnpj: z.string().max(18).nullable().optional(),
  razao_social: z.string().max(255).nullable().optional(),
  dominio: z.string().max(255).nullable().optional(),
  setor: z.string().max(100).nullable().optional(),
  porte: z.enum(['MEI', 'ME', 'EPP', 'Médio', 'Grande']).nullable().optional(),
  qtd_funcionarios: z.coerce.number().int().min(0).nullable().optional(),
  faturamento_anual: z.coerce.number().min(0).nullable().optional(),
  telefone: z.string().max(20).nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  owner_corretor_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export type CompanyFormData = z.infer<typeof companySchema>;

export const companyUpdateSchema = companySchema.partial();

// ========================================
// ACTIVITY
// ========================================

export const activitySchema = z.object({
  tipo: z.enum([
    'ligacao', 'email', 'reuniao', 'whatsapp', 'nota', 'tarefa',
    'proposta_enviada', 'proposta_aceita', 'proposta_recusada',
    'documento_enviado', 'documento_recebido', 'visita',
    'follow_up', 'stage_change', 'sistema',
  ]),
  assunto: z.string().max(255).nullable().optional(),
  descricao: z.string().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  owner_corretor_id: z.string().uuid().nullable().optional(),
  data_vencimento: z.string().nullable().optional(),
  duracao_minutos: z.coerce.number().int().min(0).nullable().optional(),
  resultado: z.string().max(100).nullable().optional(),
});

export type ActivityFormData = z.infer<typeof activitySchema>;

// ========================================
// PIPELINE
// ========================================

export const pipelineSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().nullable().optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um hex válido (#XXXXXX)').default('#D4AF37'),
});

export type PipelineFormData = z.infer<typeof pipelineSchema>;

// ========================================
// STAGE
// ========================================

export const stageSchema = z.object({
  pipeline_id: z.string().uuid('Pipeline inválido'),
  nome: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/, 'Slug deve ser lowercase com underscores'),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366F1'),
  icone: z.string().max(50).nullable().optional(),
  probabilidade: z.coerce.number().int().min(0).max(100).default(0),
  is_won: z.boolean().default(false),
  is_lost: z.boolean().default(false),
  auto_move_days: z.coerce.number().int().min(1).nullable().optional(),
});

export type StageFormData = z.infer<typeof stageSchema>;

// ========================================
// WORKFLOW
// ========================================

export const workflowActionSchema = z.object({
  type: z.enum([
    'email.send', 'task.create', 'field.update', 'webhook.call',
    'notification.push', 'deal.create', 'wait.delay', 'contact.update',
  ]),
  config: z.record(z.string(), z.unknown()),
  delay_minutes: z.coerce.number().int().min(0).optional(),
});

export const workflowSchema = z.object({
  nome: z.string().min(2).max(255),
  descricao: z.string().nullable().optional(),
  trigger_type: z.enum([
    'deal.stage.changed', 'deal.created', 'deal.won', 'deal.lost',
    'contact.created', 'contact.lifecycle.changed',
    'activity.overdue', 'contact.form.submitted',
    'schedule.daily', 'schedule.weekly', 'webhook.received',
  ]),
  trigger_config: z.record(z.string(), z.unknown()).default({}),
  actions: z.array(workflowActionSchema).min(1, 'Pelo menos uma ação é necessária'),
  is_active: z.boolean().default(false),
});

export type WorkflowFormData = z.infer<typeof workflowSchema>;

// ========================================
// DEAL LOSS REASON
// ========================================

export const dealLossSchema = z.object({
  motivo_perda: z.string().min(1, 'Selecione um motivo'),
  motivo_perda_detalhe: z.string().nullable().optional(),
});

export type DealLossFormData = z.infer<typeof dealLossSchema>;

export const MOTIVOS_PERDA = [
  'Preço alto',
  'Escolheu concorrente',
  'Sem resposta',
  'Desistiu do plano',
  'Não qualificado',
  'Timing errado',
  'Outro',
] as const;
