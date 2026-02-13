// ─── React Email — Confirmação de Cadastro ───────────────────
// Enviado ao corretor após solicitar cadastro (aguarda análise).

import { Heading, Text, Section, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface ConfirmacaoCadastroEmailProps {
  nome: string;
  tipoPessoa?: 'pf' | 'pj';
}

export default function ConfirmacaoCadastroEmail({
  nome = 'Corretor',
  tipoPessoa = 'pf',
}: ConfirmacaoCadastroEmailProps) {
  const firstName = nome.split(' ')[0];
  const tipoLabel = tipoPessoa === 'pj' ? ' (Pessoa Jurídica)' : '';

  return (
    <EmailLayout preview={`Cadastro recebido, ${firstName}!`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>✅</Text>
      </div>

      <Heading style={heading}>Olá, {firstName}!</Heading>

      <Text style={paragraph}>
        Recebemos sua solicitação de cadastro como corretor{tipoLabel} parceiro da{' '}
        <strong style={{ color: '#D4AF37' }}>Humano Saúde</strong>.
      </Text>

      <Section style={stepsBox}>
        <Text style={stepsTitle}>� Próximos passos</Text>
        <Text style={stepItem}>1. Nossa equipe analisará seu cadastro</Text>
        <Text style={stepItem}>
          2. Você receberá um e-mail com a resposta em até <strong>48 horas úteis</strong>
        </Text>
        <Text style={stepItem}>
          3. Se aprovado, enviaremos seus dados de acesso e um link para completar seu onboarding
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Caso tenha dúvidas, entre em contato pelo e-mail{' '}
        <Link href="mailto:comercial@humanosaude.com.br" style={goldLink}>
          comercial@humanosaude.com.br
        </Link>
      </Text>
    </EmailLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const iconWrapper: React.CSSProperties = {
  textAlign: 'center' as const,
  marginBottom: '8px',
};
const iconText: React.CSSProperties = {
  fontSize: '48px',
  lineHeight: '1',
  margin: 0,
};
const heading: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 20px 0',
};
const stepsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};
const stepsTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#D4AF37',
  margin: '0 0 12px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};
const stepItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 6px 0',
  lineHeight: '2',
};
const hr: React.CSSProperties = {
  borderColor: '#E5E7EB',
  margin: '24px 0',
};
const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#9CA3AF',
  lineHeight: '1.5',
  margin: 0,
  textAlign: 'center' as const,
};
const goldLink: React.CSSProperties = {
  color: '#D4AF37',
  textDecoration: 'none',
  fontWeight: '600',
};
