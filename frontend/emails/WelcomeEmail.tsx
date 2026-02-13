// ─── Blueprint 14: React Email — Welcome Template ────────────
// Uses React Email components for Humano Saúde welcome emails.
// Branded with gold (#D4AF37), dark header, responsive design.

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  nome: string;
  email?: string;
}

const LOGO_URL = 'https://humanosaude.com.br/images/logos/LOGO%201%20SEM%20FUNDO.png';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function WelcomeEmail({ nome = 'Cliente' }: WelcomeEmailProps) {
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
              <Text style={iconText}>👋</Text>
            </div>

            <Heading style={heading}>Bem-vindo(a), {firstName}!</Heading>

            <Text style={paragraph}>
              Estamos felizes em ter você conosco. A{' '}
              <strong style={{ color: '#D4AF37' }}>Humano Saúde</strong> está pronta para
              ajudá-lo a encontrar o plano de saúde ideal.
            </Text>

            <Section style={infoBox}>
              <Text style={infoTitle}>🎯 O que você pode fazer agora</Text>
              <Text style={infoItem}>✅ Comparar planos de saúde com economia real</Text>
              <Text style={infoItem}>✅ Fazer uma cotação online em poucos minutos</Text>
              <Text style={infoItem}>✅ Falar com um especialista via WhatsApp</Text>
            </Section>

            <Section style={buttonWrap}>
              <Button style={primaryButton} href={`${BASE_URL}/economizar`}>
                Ver Planos com Desconto →
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Em caso de dúvidas, responda este e-mail ou escreva para{' '}
              <Link href="mailto:comercial@humanosaude.com.br" style={goldLink}>
                comercial@humanosaude.com.br
              </Link>
            </Text>
          </Section>

          {/* Footer */}
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
  backgroundColor: 'rgba(212, 175, 55, 0.125)',
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

const infoBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '24px',
};

const infoTitle: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 10px',
};

const infoItem: React.CSSProperties = {
  color: '#4B5563',
  fontSize: '14px',
  margin: '0',
  padding: '6px 0',
};

const buttonWrap: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '16px',
};

const primaryButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#D4AF37',
  color: '#FFFFFF',
  padding: '14px 36px',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
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
