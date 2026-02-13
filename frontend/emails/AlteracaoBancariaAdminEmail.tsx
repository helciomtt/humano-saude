// ─── React Email — Alteração Bancária (Admin) ────────────────
// Notifica o admin sobre solicitação de alteração bancária.

import { Heading, Text, Section, Hr, Button, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface AlteracaoBancariaAdminEmailProps {
  corretorNome: string;
  corretorEmail: string;
  bancoAntigo: string;
  bancoNovo: string;
  motivo: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function AlteracaoBancariaAdminEmail({
  corretorNome = 'Corretor',
  corretorEmail = 'corretor@email.com',
  bancoAntigo = 'Banco Antigo',
  bancoNovo = 'Banco Novo',
  motivo = 'Encerramento de conta',
}: AlteracaoBancariaAdminEmailProps) {
  return (
    <EmailLayout preview={`Alteração bancária — ${corretorNome}`}>
      <div style={iconWrapper}>
        <Text style={iconText}>⚠️</Text>
      </div>

      <Heading style={heading}>Solicitação de alteração bancária</Heading>

      <Section style={detailsBox}>
        <Row style={detailRow}>
          <Column style={labelCol}>Corretor</Column>
          <Column style={valueCol}>{corretorNome}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>E-mail</Column>
          <Column style={valueColGold}>{corretorEmail}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Banco Atual</Column>
          <Column style={valueCol}>{bancoAntigo}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Novo Banco</Column>
          <Column style={valueColBold}>{bancoNovo}</Column>
        </Row>
        <Row style={{ padding: '8px 0' }}>
          <Column style={labelCol}>Motivo</Column>
          <Column style={valueCol}>{motivo}</Column>
        </Row>
      </Section>

      <Section style={buttonWrap}>
        <Button style={primaryButton} href={`${BASE_URL}/portal-interno-hks-2026/corretores`}>
          Analisar Solicitação →
        </Button>
      </Section>

      <Hr style={hr} />
    </EmailLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: 0 };
const heading: React.CSSProperties = {
  fontSize: '24px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 20px 0',
};
const detailsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '16px 0',
};
const detailRow: React.CSSProperties = { borderBottom: '1px solid #F3F4F6', padding: '8px 0' };
const labelCol: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', fontWeight: '600', width: '120px', textTransform: 'uppercase',
};
const valueCol: React.CSSProperties = { fontSize: '14px', color: '#374151' };
const valueColGold: React.CSSProperties = { fontSize: '14px', color: '#D4AF37' };
const valueColBold: React.CSSProperties = { fontSize: '14px', color: '#111827', fontWeight: '600' };
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37', borderRadius: '8px', color: '#000',
  fontSize: '14px', fontWeight: '700', textDecoration: 'none',
  textAlign: 'center' as const, padding: '14px 32px', display: 'inline-block',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
