// ─── React Email — Aprovação do Corretor ─────────────────────
// Enviado quando o admin aprova o cadastro do corretor.

import { Heading, Text, Button, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface AprovacaoEmailProps {
  nome: string;
  email?: string;
  onboardingLink?: string;
  senhaTemporaria?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function AprovacaoEmail({
  nome = 'Corretor',
  email,
  onboardingLink,
  senhaTemporaria,
}: AprovacaoEmailProps) {
  const firstName = nome.split(' ')[0];
  const loginUrl = `${BASE_URL}/dashboard/corretor/login`;

  return (
    <EmailLayout preview={`Parabéns ${firstName}, seu cadastro foi aprovado!`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>🎉</Text>
      </div>

      <Heading style={heading}>Parabéns, {firstName}!</Heading>

      <Text style={paragraph}>
        Seu cadastro como corretor parceiro da{' '}
        <strong style={{ color: '#D4AF37' }}>Humano Saúde</strong> foi{' '}
        <strong style={{ color: '#16A34A' }}>aprovado</strong>!
      </Text>

      {senhaTemporaria && (
        <Section style={credentialsBox}>
          <Text style={credentialsTitle}>� Seus dados de acesso</Text>
          {email && (
            <Text style={credentialsItem}>
              <strong>E-mail:</strong> {email}
            </Text>
          )}
          <Text style={credentialsItem}>
            <strong>Senha:</strong>{' '}
            <code style={codeStyle}>{senhaTemporaria}</code>
          </Text>
          <Text style={credentialsNote}>
            ⚠️ Recomendamos alterar sua senha após o primeiro acesso.
          </Text>
        </Section>
      )}

      {senhaTemporaria && (
        <Section style={buttonWrap}>
          <Button style={primaryButton} href={loginUrl}>
            Acessar Painel →
          </Button>
        </Section>
      )}

      {onboardingLink && (
        <Section style={infoBox}>
          <Text style={infoText}>
            Para finalizar, complete seu onboarding enviando seus documentos e dados bancários:
          </Text>
          <Section style={buttonWrap}>
            <Button style={primaryButton} href={onboardingLink}>
              Completar Onboarding →
            </Button>
          </Section>
          <Text style={infoNote}>
            O link de onboarding é válido por 7 dias.
          </Text>
        </Section>
      )}

      <Hr style={hr} />

      <Text style={footerText}>
        Qualquer dúvida, entre em contato pelo WhatsApp ou responda este e-mail.
      </Text>
    </EmailLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: 0 };
const heading: React.CSSProperties = {
  fontSize: '28px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 16px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 20px 0',
};
const credentialsBox: React.CSSProperties = {
  backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const credentialsTitle: React.CSSProperties = {
  fontSize: '14px', fontWeight: '700', color: '#166534', margin: '0 0 12px 0',
};
const credentialsItem: React.CSSProperties = {
  fontSize: '14px', color: '#374151', margin: '0 0 6px 0', lineHeight: '1.5',
};
const codeStyle: React.CSSProperties = {
  backgroundColor: '#E5E7EB', padding: '4px 10px', borderRadius: '6px',
  fontFamily: 'monospace', fontSize: '15px', color: '#111827', fontWeight: '700', letterSpacing: '1px',
};
const credentialsNote: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', margin: '10px 0 0 0', fontStyle: 'italic',
};
const infoBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const infoText: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px 0',
};
const infoNote: React.CSSProperties = {
  fontSize: '12px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const,
};
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37', borderRadius: '8px', color: '#000',
  fontSize: '15px', fontWeight: '700', textDecoration: 'none',
  textAlign: 'center' as const, padding: '14px 32px', display: 'inline-block',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '13px', color: '#6B7280', lineHeight: '1.5', margin: 0,
  textAlign: 'center' as const,
};
