// ─── Blueprint 14: React Email — Shared Layout ──────────────
// Base layout for all Humano Saúde email templates.
// Dark header, gold accents, responsive, dark-mode ready.

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import * as React from 'react';

const LOGO_URL = 'https://humanosaude.com.br/images/logos/LOGO%201%20SEM%20FUNDO.png';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  showSpamWarning?: boolean;
}

export function EmailLayout({ preview, children, showSpamWarning = false }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img src={LOGO_URL} width="220" height="73" alt="Humano Saúde" style={logo} />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Spam Warning */}
          {showSpamWarning && (
            <Section style={spamBox}>
              <Text style={spamText}>
                <strong>⚠️ Importante:</strong> Nossos e-mails podem cair na pasta{' '}
                <strong>Spam/Lixo Eletrônico</strong>. Marque como &quot;Não é spam&quot; para receber
                os próximos comunicados.
              </Text>
            </Section>
          )}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={copyright}>
              © {new Date().getFullYear()} Humano Saúde — Todos os direitos reservados
            </Text>
            <Link href="https://humanosaude.com.br" style={footerLink}>
              humanosaude.com.br
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const main: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '32px 16px',
};

const header: React.CSSProperties = {
  backgroundColor: '#0A0A0A',
  borderRadius: '16px 16px 0 0',
  padding: '32px',
  textAlign: 'center' as const,
};

const logo: React.CSSProperties = {
  margin: '0 auto',
};

const content: React.CSSProperties = {
  padding: '32px 40px',
  backgroundColor: '#FAFAFA',
  border: '1px solid #E5E7EB',
  borderTop: 'none',
  borderRadius: '0 0 16px 16px',
};

const spamBox: React.CSSProperties = {
  backgroundColor: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: '12px',
  padding: '16px',
  marginTop: '20px',
};

const spamText: React.CSSProperties = {
  color: '#92400E',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: '#E5E7EB',
  margin: '24px 0',
};

const footer: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 16px',
};

const copyright: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 4px 0',
};

const footerLink: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '12px',
  textDecoration: 'none',
};
