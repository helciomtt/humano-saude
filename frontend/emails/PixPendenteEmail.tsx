// ─── React Email — PIX Pendente ──────────────────────────────
// Enviado quando o pagamento via PIX está aguardando confirmação.

import { Heading, Text, Section, Hr, Link, CodeInline } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface PixPendenteEmailProps {
  nome: string;
  valor: string;
  pixCode: string;
  expiresAt: string;
}

export default function PixPendenteEmail({
  nome = 'Cliente',
  valor = '299,90',
  pixCode = '00020126580014br.gov.bcb.pix...',
  expiresAt = '01/01/2026 23:59',
}: PixPendenteEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview={`PIX pendente — R$ ${valor}`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>💰</Text>
      </div>

      <Heading style={heading}>Pagamento via PIX pendente</Heading>

      <Text style={paragraph}>
        Olá, <strong>{firstName}</strong>! Seu pagamento via PIX está aguardando confirmação.
      </Text>

      <Section style={pixBox}>
        <Text style={pixLabel}>Valor a pagar</Text>
        <Text style={pixPrice}>R$ {valor}</Text>

        <Text style={pixLabel}>Código PIX (Copia e Cola)</Text>
        <div style={pixCodeBox}>
          <CodeInline style={pixCodeText}>{pixCode}</CodeInline>
        </div>

        <Text style={expiresText}>⏰ Expira em: {expiresAt}</Text>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>⚠️ Atenção:</strong> O código PIX tem validade limitada. Após o vencimento, será
          necessário gerar um novo código.
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Dúvidas sobre o pagamento? Entre em contato:{' '}
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
const pixBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '20px 0', textAlign: 'center' as const,
};
const pixLabel: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase',
  margin: '0 0 8px 0',
};
const pixPrice: React.CSSProperties = {
  fontSize: '32px', fontWeight: '800', color: '#16A34A', margin: '0 0 16px 0',
};
const pixCodeBox: React.CSSProperties = {
  backgroundColor: '#E5E7EB', borderRadius: '8px', padding: '12px',
  margin: '0 0 12px 0', wordBreak: 'break-all',
};
const pixCodeText: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '12px', color: '#111827', lineHeight: '1.4',
};
const expiresText: React.CSSProperties = {
  fontSize: '13px', fontWeight: '600', color: '#EF4444', margin: 0,
};
const warningBox: React.CSSProperties = {
  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
  borderRadius: '12px', padding: '16px', margin: '20px 0',
};
const warningText: React.CSSProperties = {
  fontSize: '13px', color: '#991B1B', margin: 0, lineHeight: '1.5',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '12px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const,
};
const goldLink: React.CSSProperties = { color: '#D4AF37', textDecoration: 'none', fontWeight: '600' };
