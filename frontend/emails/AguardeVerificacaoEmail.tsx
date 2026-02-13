// ─── React Email — Aguarde Verificação ───────────────────────
// Enviado ao corretor após completar onboarding.

import { Heading, Text, Section, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface AguardeVerificacaoEmailProps {
  nome: string;
}

export default function AguardeVerificacaoEmail({
  nome = 'Corretor',
}: AguardeVerificacaoEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview="Documentos recebidos — aguarde verificação" showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>✅</Text>
      </div>

      <Heading style={heading}>Documentos recebidos com sucesso!</Heading>

      <Text style={paragraph}>
        Olá, <strong>{firstName}</strong>! Seu onboarding foi concluído e seus documentos e dados
        bancários foram enviados.
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>Agora é com a gente!</Text>
        <Text style={infoText}>
          Nossa equipe irá verificar suas informações. Esse processo leva até{' '}
          <strong>48 horas úteis</strong>. Assim que a verificação for concluída, você receberá um
          e-mail com seus dados de acesso ao painel do corretor.
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Enquanto isso, fique tranquilo — entraremos em contato em breve! Em caso de dúvidas:{' '}
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
  fontSize: '24px', fontWeight: '700', color: '#111827',
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
  fontSize: '14px', fontWeight: '700', color: '#D4AF37', margin: '0 0 10px 0',
};
const infoText: React.CSSProperties = {
  fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.6',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '13px', color: '#9CA3AF', margin: 0, textAlign: 'center' as const, lineHeight: '1.5',
};
const goldLink: React.CSSProperties = { color: '#D4AF37', textDecoration: 'none', fontWeight: '600' };
