// ─── React Email — Alteração Bancária (Corretor) ─────────────
// Notifica o corretor que a solicitação de alteração foi recebida.

import { Heading, Text, Section, Hr, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface AlteracaoBancariaCorretorEmailProps {
  nome: string;
  bancoNovo: string;
  motivo: string;
}

export default function AlteracaoBancariaCorretorEmail({
  nome = 'Corretor',
  bancoNovo = 'Banco Exemplo',
  motivo = 'Encerramento de conta',
}: AlteracaoBancariaCorretorEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview={`Solicitação de alteração bancária recebida`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>🏦</Text>
      </div>

      <Heading style={heading}>Solicitação recebida</Heading>

      <Text style={paragraph}>
        Olá, <strong>{firstName}</strong>! Sua solicitação de alteração de conta bancária foi recebida.
      </Text>

      <Section style={detailsBox}>
        <Row style={detailRow}>
          <Column style={labelCol}>Novo Banco</Column>
          <Column style={valueCol}>{bancoNovo}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Motivo</Column>
          <Column style={valueCol}>{motivo}</Column>
        </Row>
        <Row style={{ padding: '8px 0' }}>
          <Column style={labelCol}>Status</Column>
          <Column style={valueCol}>
            <span style={statusBadge}>EM ANÁLISE</span>
          </Column>
        </Row>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Nossa equipe analisará sua solicitação e você será notificado por e-mail sobre o resultado.
        Sua conta atual permanece ativa até a aprovação.
      </Text>
    </EmailLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: 0 };
const heading: React.CSSProperties = {
  fontSize: '24px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 16px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 20px 0',
};
const detailsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '16px 0',
};
const detailRow: React.CSSProperties = { borderBottom: '1px solid #F3F4F6', padding: '8px 0' };
const labelCol: React.CSSProperties = {
  fontSize: '13px', color: '#6B7280', fontWeight: '600', width: '120px',
};
const valueCol: React.CSSProperties = { fontSize: '14px', color: '#111827' };
const statusBadge: React.CSSProperties = {
  backgroundColor: '#FEF3C7', color: '#D4AF37',
  padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '13px', color: '#6B7280', lineHeight: '1.5', margin: 0,
  textAlign: 'center' as const,
};
