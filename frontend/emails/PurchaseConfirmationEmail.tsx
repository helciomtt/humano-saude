// ─── Blueprint 14: React Email — Purchase Confirmation ───────
// Branded Humano Saúde email for purchase confirmations.

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Hr,
  Link,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface PurchaseConfirmationEmailProps {
  nome: string;
  plano: string;
  operadora: string;
  valor: string;
  vigencia: string;
  protocolo: string;
}

const LOGO_URL = 'https://humanosaude.com.br/images/logos/LOGO%201%20SEM%20FUNDO.png';

export default function PurchaseConfirmationEmail({
  nome = 'Cliente',
  plano = 'Plano Saúde',
  operadora = 'Operadora',
  valor = '0,00',
  vigencia = '—',
  protocolo = '—',
}: PurchaseConfirmationEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img src={LOGO_URL} width="220" height="73" alt="Humano Saúde" style={logo} />
          </Section>

          {/* Card */}
          <Section style={card}>
            <div style={iconWrapper}>
              <Text style={iconText}>🎉</Text>
            </div>

            <Heading style={heading}>Compra confirmada!</Heading>
            <Text style={paragraph}>
              Parabéns, {firstName}! Seu plano de saúde foi contratado com sucesso.
            </Text>

            {/* Details table */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>📋 Detalhes do plano</Text>

              <Row style={detailRow}>
                <Column style={detailLabel}>Protocolo</Column>
                <Column style={detailValue}>
                  <code style={codeStyle}>{protocolo}</code>
                </Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Operadora</Column>
                <Column style={detailValueBold}>{operadora}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Plano</Column>
                <Column style={detailValue}>{plano}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Valor</Column>
                <Column>
                  <Text style={priceText}>
                    R$ {valor}
                    <span style={priceUnit}>/mês</span>
                  </Text>
                </Column>
              </Row>
              <Row style={{ ...detailRow, borderBottom: 'none' }}>
                <Column style={detailLabel}>Vigência</Column>
                <Column style={detailValue}>{vigencia}</Column>
              </Row>
            </Section>

            {/* Warning */}
            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>📌 Importante:</strong> Guarde o número do protocolo para acompanhar o
                andamento da sua proposta. Sua carência será contada a partir da data de vigência.
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Em caso de dúvidas, entre em contato:{' '}
              <Link href="mailto:comercial@humanosaude.com.br" style={goldLink}>
                comercial@humanosaude.com.br
              </Link>
            </Text>
          </Section>

          <Text style={copyright}>
            © {new Date().getFullYear()} Humano Saúde — Todos os direitos reservados
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const main: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '32px 16px',
};

const header: React.CSSProperties = {
  textAlign: 'center',
  backgroundColor: '#050505',
  borderRadius: '16px',
  padding: '24px 16px',
  marginBottom: '28px',
};

const logo: React.CSSProperties = {
  display: 'block',
  margin: '0 auto',
};

const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '16px',
  padding: '32px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const iconWrapper: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
};

const iconText: React.CSSProperties = {
  fontSize: '28px',
  margin: '0',
  lineHeight: '56px',
  width: '56px',
  height: '56px',
  backgroundColor: '#DCFCE7',
  borderRadius: '50%',
  display: 'inline-block',
};

const heading: React.CSSProperties = {
  color: '#111827',
  fontSize: '22px',
  textAlign: 'center',
  margin: '0 0 8px',
  fontWeight: 700,
};

const paragraph: React.CSSProperties = {
  color: '#4B5563',
  fontSize: '15px',
  textAlign: 'center',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const detailsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '24px',
};

const detailsTitle: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 12px',
};

const detailRow: React.CSSProperties = {
  borderBottom: '1px solid #E5E7EB',
  padding: '8px 0',
};

const detailLabel: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '13px',
  fontWeight: 600,
  width: '130px',
  verticalAlign: 'middle',
};

const detailValue: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  verticalAlign: 'middle',
};

const detailValueBold: React.CSSProperties = {
  ...detailValue,
  color: '#111827',
  fontWeight: 600,
};

const codeStyle: React.CSSProperties = {
  backgroundColor: '#E5E7EB',
  padding: '3px 8px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '14px',
  fontWeight: 700,
};

const priceText: React.CSSProperties = {
  color: '#16A34A',
  fontSize: '18px',
  fontWeight: 800,
  margin: '0',
  verticalAlign: 'middle',
};

const priceUnit: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '12px',
  fontWeight: 400,
};

const warningBox: React.CSSProperties = {
  backgroundColor: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '24px',
};

const warningText: React.CSSProperties = {
  color: '#92400E',
  fontSize: '13px',
  margin: '0',
  lineHeight: '1.5',
};

const hr: React.CSSProperties = {
  borderColor: '#E5E7EB',
  margin: '20px 0',
};

const footer: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '12px',
  textAlign: 'center',
  margin: '0',
};

const goldLink: React.CSSProperties = {
  color: '#D4AF37',
  textDecoration: 'none',
  fontWeight: 600,
};

const copyright: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '11px',
  textAlign: 'center',
  marginTop: '24px',
};
