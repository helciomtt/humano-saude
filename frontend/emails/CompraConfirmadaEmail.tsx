// ─── React Email — Confirmação de Compra ─────────────────────
// Enviado ao cliente após contratação do plano.

import { Heading, Text, Section, Hr, Link, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface CompraConfirmadaEmailProps {
  nome: string;
  plano: string;
  operadora: string;
  valor: string;
  vigencia: string;
  protocolo: string;
}

export default function CompraConfirmadaEmail({
  nome = 'Cliente',
  plano = 'Plano Exemplo',
  operadora = 'Operadora',
  valor = '299,90',
  vigencia = '01/01/2026',
  protocolo = 'HS-000000',
}: CompraConfirmadaEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview={`Compra confirmada — ${plano}`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>🎉</Text>
      </div>

      <Heading style={heading}>Compra confirmada!</Heading>

      <Text style={paragraph}>
        Parabéns, <strong>{firstName}</strong>! Seu plano de saúde foi contratado com sucesso.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailsTitle}>📋 Detalhes do plano</Text>
        <Row style={detailRow}>
          <Column style={labelCol}>Protocolo</Column>
          <Column style={valueCol}>
            <code style={codeStyle}>{protocolo}</code>
          </Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Operadora</Column>
          <Column style={valueColBold}>{operadora}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Plano</Column>
          <Column style={valueCol}>{plano}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Valor</Column>
          <Column style={valueCol}>
            <span style={priceStyle}>R$ {valor}</span>
            <span style={priceUnit}>/mês</span>
          </Column>
        </Row>
        <Row style={{ padding: '8px 0' }}>
          <Column style={labelCol}>Vigência</Column>
          <Column style={valueCol}>{vigencia}</Column>
        </Row>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>📌 Importante:</strong> Guarde o número do protocolo para acompanhar o andamento
          da sua proposta. Sua carência será contada a partir da data de vigência.
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
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
  fontSize: '28px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 16px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 20px 0',
};
const detailsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const detailsTitle: React.CSSProperties = {
  fontSize: '14px', fontWeight: '700', color: '#D4AF37', margin: '0 0 12px 0',
  textTransform: 'uppercase', letterSpacing: '0.5px',
};
const detailRow: React.CSSProperties = { borderBottom: '1px solid #F3F4F6', padding: '8px 0' };
const labelCol: React.CSSProperties = {
  fontSize: '13px', color: '#6B7280', fontWeight: '600', width: '120px',
};
const valueCol: React.CSSProperties = { fontSize: '14px', color: '#374151' };
const valueColBold: React.CSSProperties = { fontSize: '14px', color: '#111827', fontWeight: '600' };
const codeStyle: React.CSSProperties = {
  backgroundColor: '#E5E7EB', padding: '3px 8px', borderRadius: '4px',
  fontFamily: 'monospace', fontSize: '14px', color: '#111827', fontWeight: '700',
};
const priceStyle: React.CSSProperties = { color: '#16A34A', fontSize: '18px', fontWeight: '800' };
const priceUnit: React.CSSProperties = { color: '#9CA3AF', fontSize: '12px' };
const warningBox: React.CSSProperties = {
  backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
  borderRadius: '12px', padding: '16px', margin: '20px 0',
};
const warningText: React.CSSProperties = {
  fontSize: '13px', color: '#92400E', margin: 0, lineHeight: '1.5',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '12px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const,
};
const goldLink: React.CSSProperties = { color: '#D4AF37', textDecoration: 'none', fontWeight: '600' };
