export const PROPOSTA_FILA_STATUS = [
  'enviada',
  'em_analise',
  'boleto_gerado',
  'implantada',
] as const;

export type PropostaFilaStatus = (typeof PROPOSTA_FILA_STATUS)[number];

export const PROPOSTA_FILA_STATUS_LABELS: Record<PropostaFilaStatus, string> = {
  enviada: 'Enviada',
  em_analise: 'Em análise',
  boleto_gerado: 'Boleto gerado',
  implantada: 'Implantada',
};

export const PROPOSTA_FILA_STATUS_BADGE_CLASS: Record<PropostaFilaStatus, string> = {
  enviada: 'border-blue-400/35 bg-blue-500/20 text-blue-100',
  em_analise: 'border-amber-400/35 bg-amber-500/20 text-amber-100',
  boleto_gerado: 'border-purple-400/35 bg-purple-500/20 text-purple-100',
  implantada: 'border-green-400/35 bg-green-500/20 text-green-100',
};
