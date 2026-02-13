// ─── React Email — Alteração Bancária Aprovada ───────────────

import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface AlteracaoBancariaAprovadaEmailProps {
  nome: string;
  bancoNovo: string;
}

export default function AlteracaoBancariaAprovadaEmail({
  nome = 'Corretor',
  bancoNovo = 'Banco Exemplo',
}: AlteracaoBancariaAprovadaEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview="Alteração bancária aprovada!" showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>✅</Text>
      </div>

      <Heading style={heading}>Alteração bancária aprovada!</Heading>

      <Text style={paragraph}>
        Olá, <strong>{firstName}</strong>! Sua solicitação de alteração de conta bancária foi{' '}
        <strong style={{ color: '#16A34A' }}>aprovada</strong>.
      </Text>

      <Section style={successBox}>
        <Text style={successTitle}>🏦 Nova conta ativa</Text>
        <Text style={successText}>
          <strong>{bancoNovo}</strong> — Seus próximos pagamentos serão creditados nesta conta.
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        A conta anterior foi desativada e consta no seu histórico para fins de auditoria.
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
const successBox: React.CSSProperties = {
  backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const successTitle: React.CSSProperties = {
  fontSize: '14px', fontWeight: '700', color: '#166534', margin: '0 0 10px 0',
};
const successText: React.CSSProperties = {
  fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.5',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '12px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const,
};
