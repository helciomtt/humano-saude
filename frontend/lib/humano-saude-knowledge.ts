// =====================================================
// KNOWLEDGE BASE — Humano Saúde Assessoria
// Alimenta todos os prompts de IA para geração de copy
// =====================================================

export const HUMANO_SAUDE_KNOWLEDGE = {
  // Identidade
  companyName: 'Humano Saúde',
  tagline: 'Assessoria especializada em planos de saúde',
  systemPrefix: '[HSA]',
  siteUrl: 'https://humanosaude.com.br',
  whatsapp: '',

  // Proposta de valor
  valueProposition:
    'Assessoria 100% gratuita para empresas e famílias encontrarem o plano de saúde ideal. ' +
    'Comparamos todas as operadoras do mercado e garantimos economia real com atendimento humanizado.',

  // Público-alvo
  targetAudiences: [
    {
      segment: 'PME (Pequenas e Médias Empresas)',
      painPoints: [
        'Custo alto de plano de saúde empresarial',
        'Reajustes abusivos anuais',
        'Dificuldade em encontrar a operadora certa para o perfil da equipe',
        'Burocracia para trocar de operadora',
      ],
      desires: [
        'Reduzir custos sem perder qualidade',
        'Ter um consultor de confiança',
        'Cobertura ampla para os colaboradores',
      ],
    },
    {
      segment: 'Famílias',
      painPoints: [
        'Plano individual muito caro',
        'Não sabe qual operadora tem melhor custo-benefício',
        'Medo de ficar sem cobertura na hora que precisa',
        'Carência longa ao trocar de plano',
      ],
      desires: [
        'Segurança para a família toda',
        'Preço justo com boa rede credenciada',
        'Atendimento rápido e sem burocracia',
      ],
    },
    {
      segment: 'Profissionais Autônomos / MEI',
      painPoints: [
        'Não tem acesso a planos empresariais',
        'Plano individual com preço proibitivo',
        'Dificuldade de entender as opções do mercado',
      ],
      desires: [
        'Plano acessível com boa cobertura',
        'Rapidez na contratação',
        'Orientação profissional imparcial',
      ],
    },
  ],

  // Benefícios
  benefits: [
    {
      title: 'Assessoria 100% Gratuita',
      description: 'Não cobramos nada do cliente. Nossa remuneração vem das operadoras.',
    },
    {
      title: 'Economia Real',
      description: 'Comparamos todas as operadoras e encontramos economia média de 30% para nossos clientes.',
    },
    {
      title: 'Cotação em Minutos',
      description: 'Sistema automatizado que gera cotações personalizadas em tempo real.',
    },
    {
      title: 'Todas as Operadoras',
      description: 'Unimed, Bradesco, Amil, SulAmérica, Porto Seguro, Hapvida e mais.',
    },
    {
      title: 'Suporte Contínuo',
      description: 'Não abandonamos o cliente após a contratação. Ajudamos com reajustes, sinistros e renovações.',
    },
    {
      title: 'Atendimento Humanizado',
      description: 'Cada cliente é único. Entendemos suas necessidades antes de recomendar.',
    },
  ],

  // Prova social
  socialProof: {
    clientesAtendidos: '+500 empresas assessoradas',
    economiaGerada: 'R$ 2M+ em economia para clientes',
    satisfacao: '98% de satisfação',
    operadoras: '15+ operadoras parceiras',
  },

  // Operadoras parceiras
  operadoras: [
    'Unimed', 'Bradesco Saúde', 'Amil', 'SulAmérica',
    'Porto Seguro', 'NotreDame Intermédica', 'Hapvida', 'Prevent Senior',
  ],

  // Como funciona
  howItWorks: [
    '1. Solicite uma cotação gratuita pelo site ou WhatsApp',
    '2. Nosso consultor analisa o perfil e necessidades',
    '3. Receba comparativo de todas as operadoras',
    '4. Escolha o melhor plano com nossa orientação',
    '5. Cuidamos de toda a burocracia da contratação',
  ],

  // Copy guidelines
  copyGuidelines: {
    tone: 'Profissional mas acolhedor. Transmitir confiança e expertise sem ser frio.',
    avoidWords: ['grátis', 'promoção', 'desconto', 'barato', 'urgente', 'última chance'],
    preferWords: ['economia', 'investimento em saúde', 'proteção', 'assessoria especializada', 'sem custo'],
    ctas: [
      'Faça sua cotação gratuita',
      'Descubra quanto você pode economizar',
      'Fale com um especialista',
      'Compare planos agora',
      'Solicite uma análise personalizada',
    ],
    headlines: [
      'Seu plano de saúde pode custar menos',
      'Economia de até 30% no plano empresarial',
      'Assessoria gratuita em planos de saúde',
      'Compare todas as operadoras em um só lugar',
    ],
  },

  // Objeções comuns e respostas
  objections: [
    {
      objection: 'Já tenho plano, por que trocar?',
      response: 'Fazemos uma análise gratuita do seu plano atual. Se não encontrarmos economia, você não perde nada.',
    },
    {
      objection: 'Vocês cobram por isso?',
      response: 'Não cobramos absolutamente nada. Somos remunerados pelas operadoras parceiras.',
    },
    {
      objection: 'Vou perder carência ao trocar?',
      response: 'Na maioria dos casos, a portabilidade garante aproveitamento de carências já cumpridas.',
    },
    {
      objection: 'Como vocês garantem o melhor preço?',
      response: 'Comparamos mais de 15 operadoras simultaneamente e negociamos condições especiais para nossos clientes.',
    },
  ],
} as const;

export type HumanoSaudeKnowledge = typeof HUMANO_SAUDE_KNOWLEDGE;
