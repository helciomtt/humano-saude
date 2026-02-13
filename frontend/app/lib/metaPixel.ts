/**
 * Meta Pixel Tracking Utilities
 * 
 * Funções auxiliares para rastrear eventos customizados do Facebook Pixel
 * Pixel ID: 1572724200440814
 */

declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Rastrear visualização de lead (quando usuário visualiza página de lead)
 */
export function trackLeadView(leadId: string, operadora?: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: 'Lead View',
      content_category: 'Lead',
      content_ids: [leadId],
      content_type: 'lead',
      value: 0.00,
      currency: 'BRL',
      operadora: operadora || 'N/A',
    });
  }
}

/**
 * Rastrear geração de novo lead (quando lead é criado no sistema)
 */
export function trackLeadGeneration(data: {
  leadId: string;
  nome: string;
  operadora?: string;
  valorAtual?: number;
  valorProposto?: number;
  economiaEstimada?: number;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: data.nome,
      content_category: 'Insurance Lead',
      value: data.economiaEstimada || 0,
      currency: 'BRL',
      operadora: data.operadora || 'N/A',
      valor_atual: data.valorAtual || 0,
      valor_proposto: data.valorProposto || 0,
    });
  }
}

/**
 * Rastrear conversão de proposta (quando lead vira cliente)
 */
export function trackPropostaConversion(data: {
  propostaId: string;
  leadId: string;
  operadora: string;
  valor: number;
  comissao?: number;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_name: 'Proposta Aceita',
      content_category: 'Conversion',
      content_ids: [data.propostaId],
      value: data.valor,
      currency: 'BRL',
      operadora: data.operadora,
      comissao: data.comissao || 0,
    });
  }
}

/**
 * Rastrear início de cotação (quando usuário inicia processo de cotação)
 */
export function trackQuoteStart(data: {
  operadora?: string;
  idades?: number[];
  tipoContratacao?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: 'Cotação Iniciada',
      content_category: 'Quote',
      operadora: data.operadora || 'N/A',
      num_dependentes: data.idades?.length || 0,
      tipo_contratacao: data.tipoContratacao || 'N/A',
    });
  }
}

/**
 * Rastrear busca de planos (quando usuário pesquisa planos)
 */
export function trackPlanSearch(searchTerm: string, operadora?: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Search', {
      search_string: searchTerm,
      content_category: 'Plan Search',
      operadora: operadora || 'N/A',
    });
  }
}

/**
 * Rastrear cadastro de usuário (quando novo corretor se registra)
 */
export function trackUserRegistration(userId: string, userType: string = 'corretor') {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Novo Cadastro',
      content_category: 'User Registration',
      value: 0,
      currency: 'BRL',
      user_type: userType,
    });
  }
}

/**
 * Rastrear contato via WhatsApp (quando usuário envia mensagem)
 */
export function trackWhatsAppContact(leadId?: string, messageType?: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Contact', {
      content_name: 'WhatsApp Contact',
      content_category: 'Communication',
      channel: 'whatsapp',
      message_type: messageType || 'general',
      lead_id: leadId || 'N/A',
    });
  }
}

/**
 * Rastrear visualização de dashboard (analytics interno)
 */
export function trackDashboardView(section: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'DashboardView', {
      section: section,
      content_category: 'Analytics',
    });
  }
}

/**
 * Rastrear uso de IA (quando corretor usa features de IA)
 */
export function trackAIUsage(feature: string, data?: any) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'AIFeatureUsed', {
      feature: feature,
      content_category: 'AI',
      ...data,
    });
  }
}

/**
 * Rastrear campanha de ads (quando corretor cria/edita campanha)
 */
export function trackAdsCampaign(action: 'create' | 'edit' | 'pause' | 'resume', campaignId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'AdsCampaignAction', {
      action: action,
      campaign_id: campaignId,
      content_category: 'Ads Management',
    });
  }
}

/**
 * Rastrear exportação de relatório
 */
export function trackReportExport(reportType: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'ReportExport', {
      report_type: reportType,
      content_category: 'Reports',
    });
  }
}
