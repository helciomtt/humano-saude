// ─── React Email — Alteração Bancária Rejeitada ──────────────

import { Heading, Text, Section, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface AlteracaoBancariaRejeitadaEmailProps {
  nome: string;
  motivo: string;
}

export default function AlteracaoBancariaRejeitadaEmail({
  nome = 'Corretor',
  motivo = 'Dados bancários inválidos',
}: AlteracaoBancariaRejeitadaEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview="Alteração bancária não aprovada" showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>❌</Text>
      </div>

      <Heading style={heading}>Alteração bancária não aprovada</Heading>

      <Text style={paragraph}>
        Olá, <strong>{firstName}</strong>. Infelizmente sua solicitação de alteração de conta
        bancária não foi aprovada.
      </Text>

      <Section style={errorBox}>
        <Text style={errorTitle}>Motivo</Text>
        <Text style={errorText}>{motivo}</Text>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Sua conta bancária atual continua ativa. Caso queira, envie uma nova solicitação.
        Em caso de dúvidas, entre em contato:{' '}
        <Link href="mailto:comercial@humanosaude.com.br" style={goldLink}>
          comercial@humanosaude.com.br
        </Link>
      </Text>
    </EmailLayout>
  );
}

const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: 0 };
const heading: React.CSSProperties = {
  fontSize: '24px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 16px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 20px 0',
};
const errorBox: React.CSSProperties = {
  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const errorTitle: React.CSSProperties = {
  fontSize: '14px', fontWeight: '700', color: '#991B1B', margin: '0 0 10px 0',
};
const errorText: React.CSSProperties = {
  fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.5',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '12px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const, lineHeight: '1.5',
};
const goldLink: React.CSSProperties = { color: '#D4AF37', textDecoration: 'none', fontWeight: '600' };
