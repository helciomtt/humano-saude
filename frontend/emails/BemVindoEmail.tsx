// ─── React Email — Boas-vindas ───────────────────────────────
// Enviado ao novo usuário/lead como boas-vindas.

import { Heading, Text, Section, Button, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface BemVindoEmailProps {
  nome: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function BemVindoEmail({
  nome = 'Cliente',
}: BemVindoEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview={`Bem-vindo(a) à Humano Saúde, ${firstName}!`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>👋</Text>
      </div>

      <Heading style={heading}>Bem-vindo(a), {firstName}!</Heading>

      <Text style={paragraph}>
        Estamos felizes em ter você conosco. A{' '}
        <strong style={{ color: '#D4AF37' }}>Humano Saúde</strong> está pronta para ajudá-lo a
        encontrar o plano de saúde ideal.
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

      <Text style={footerText}>
        Em caso de dúvidas, responda este e-mail ou escreva para{' '}
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
const infoBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const infoTitle: React.CSSProperties = {
  fontSize: '14px', fontWeight: '700', color: '#D4AF37', margin: '0 0 12px 0',
  textTransform: 'uppercase', letterSpacing: '0.5px',
};
const infoItem: React.CSSProperties = {
  fontSize: '14px', color: '#374151', margin: '0 0 6px 0', lineHeight: '1.5',
};
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37', borderRadius: '8px', color: '#000',
  fontSize: '15px', fontWeight: '700', textDecoration: 'none',
  textAlign: 'center' as const, padding: '14px 36px', display: 'inline-block',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '12px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const, lineHeight: '1.5',
};
const goldLink: React.CSSProperties = { color: '#D4AF37', textDecoration: 'none' };
