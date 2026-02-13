import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Re-exportar todos os tipos para facilitar imports
export type {
  InsuranceLead,
  Operadora,
  Plano,
  Cotacao,
  Proposta,
  Comissao,
  AnalyticsVisit,
  AdsCampaign,
  AdsCreative,
  AdsAudience,
  WhatsAppContact,
  WhatsAppMessage,
  WebhookLog,
  IntegrationSetting,
  Tarefa,
  Notificacao,
  Documento,
  PipelineCompleto,
  DesempenhoOperadora,
  AnaliseCampanha,
  LeadStatus,
  CotacaoStatus,
  PropostaStatus,
  ComissaoStatus,
  TarefaStatus,
  TarefaPrioridade,
} from '@/lib/types/database';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('⚠️ Missing Supabase environment variables. Database features will be unavailable.');
}

// Cliente público (anon key)
// NOTA: Não tipado com Database<> pois o projeto tem 50+ tabelas.
// Para queries tipadas, importe Database de '@/lib/types/supabase'.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Cliente com Service Role para operações admin (server-side only)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) {
    logger.warn('⚠️ Missing SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    serviceKey || 'placeholder',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
