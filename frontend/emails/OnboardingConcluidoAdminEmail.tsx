// ─── React Email — Onboarding Concluído (Admin) ──────────────
// Notifica o admin quando um corretor completa o onboarding.

import { Heading, Text, Section, Hr, Button, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface OnboardingConcluidoAdminEmailProps {
  corretorNome: string;
  corretorEmail: string;
  corretorTelefone?: string;
  corretorCpf?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function OnboardingConcluidoAdminEmail({
  corretorNome = 'Corretor',
  corretorEmail = 'corretor@email.com',
  corretorTelefone,
  corretorCpf,
}: OnboardingConcluidoAdminEmailProps) {
  return (
    <EmailLayout preview={`Onboarding concluído — ${corretorNome}`}>
      <div style={iconWrapper}>
        <Text style={iconText}>📋</Text>
      </div>

      <Heading style={heading}>Onboarding concluído</Heading>

      <Text style={paragraph}>
        O corretor <strong>{corretorNome}</strong> completou o onboarding e enviou todos os
        documentos e dados bancários.
      </Text>

      <Section style={detailsBox}>
        <Row style={detailRow}>
          <Column style={labelCol}>Corretor</Column>
          <Column style={valueColBold}>{corretorNome}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>E-mail</Column>
          <Column style={valueColGold}>{corretorEmail}</Column>
        </Row>
        {corretorTelefone && (
          <Row style={detailRow}>
            <Column style={labelCol}>Telefone</Column>
            <Column style={valueCol}>{corretorTelefone}</Column>
          </Row>
        )}
        {corretorCpf && (
          <Row style={detailRow}>
            <Column style={labelCol}>CPF</Column>
            <Column style={valueCol}>{corretorCpf}</Column>
          </Row>
        )}
        <Row style={{ padding: '8px 0' }}>
          <Column style={labelCol}>Status</Column>
          <Column style={valueCol}>
            <span style={statusBadge}>DOCUMENTOS ENVIADOS</span>
          </Column>
        </Row>
      </Section>

      <Section style={buttonWrap}>
        <Button style={primaryButton} href={`${BASE_URL}/portal-interno-hks-2026/corretores`}>
          Verificar Documentos →
        </Button>
      </Section>

      <Hr style={hr} />
    </EmailLayout>
  );
}

const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: 0 };
const heading: React.CSSProperties = {
  fontSize: '24px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 20px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 20px 0',
  textAlign: 'center' as const,
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
const valueColBold: React.CSSProperties = { fontSize: '14px', color: '#111827', fontWeight: '600' };
const valueColGold: React.CSSProperties = { fontSize: '14px', color: '#D4AF37' };
const statusBadge: React.CSSProperties = {
  backgroundColor: '#DCFCE7', color: '#166534',
  padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
};
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37', borderRadius: '8px', color: '#000',
  fontSize: '14px', fontWeight: '700', textDecoration: 'none',
  textAlign: 'center' as const, padding: '14px 32px', display: 'inline-block',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
