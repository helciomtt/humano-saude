// ─── React Email — Convite de Corretor ───────────────────────
// Enviado quando um corretor convida alguém para ser corretor.

import { Heading, Text, Button, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface ConviteCorretorEmailProps {
  nomeConvidante: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function ConviteCorretorEmail({
  nomeConvidante = 'Corretor',
}: ConviteCorretorEmailProps) {
  return (
    <EmailLayout preview={`${nomeConvidante} te convidou para ser corretor Humano Saúde`}>
      <div style={iconWrapper}>
        <Text style={iconText}>💌</Text>
      </div>

      <Heading style={heading}>Você foi convidado!</Heading>

      <Text style={paragraph}>
        <strong>{nomeConvidante}</strong> acredita no seu potencial e te convidou para fazer parte
        da <strong style={{ color: '#D4AF37' }}>rede de corretores da Humano Saúde</strong>.
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>Por que ser um corretor Humano Saúde?</Text>
        <Text style={infoItem}>✅ Comissões competitivas acima do mercado</Text>
        <Text style={infoItem}>✅ Plataforma completa com CRM e Pipeline</Text>
        <Text style={infoItem}>✅ Leads qualificados direto no seu painel</Text>
        <Text style={infoItem}>✅ Suporte pós-venda dedicado</Text>
        <Text style={infoItem}>✅ Treinamento contínuo e materiais exclusivos</Text>
      </Section>

      <Section style={buttonWrap}>
        <Button style={primaryButton} href={`${BASE_URL}/seja-corretor`}>
          Conheça o Programa →
        </Button>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Acesse e cadastre-se. É rápido, gratuito e sem burocracia.
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
  fontSize: '16px', lineHeight: '1.7', color: '#374151', margin: '0 0 20px 0',
  textAlign: 'center' as const,
};
const infoBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '20px 0',
};
const infoTitle: React.CSSProperties = {
  fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 12px 0',
};
const infoItem: React.CSSProperties = {
  fontSize: '15px', color: '#374151', margin: '0 0 6px 0', lineHeight: '1.5',
};
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37', borderRadius: '8px', color: '#000',
  fontSize: '16px', fontWeight: '700', textDecoration: 'none',
  textAlign: 'center' as const, padding: '16px 40px', display: 'inline-block',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '14px', color: '#9CA3AF', lineHeight: '1.5', margin: 0,
  textAlign: 'center' as const,
};
