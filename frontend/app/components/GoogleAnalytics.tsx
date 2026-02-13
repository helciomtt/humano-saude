'use client';

import Script from 'next/script';

export default function GoogleAnalytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Helper functions para tracking
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
};

export const trackLeadSubmission = (data: {
  nome: string;
  perfil: string;
  source?: string;
}) => {
  trackEvent('lead_generation', {
    event_category: 'Lead',
    event_label: data.perfil,
    nome: data.nome,
    source: data.source || 'hero_form',
  });
};

export const trackCalculation = (data: {
  tipo: string;
  acomodacao: string;
  totalPlanos: number;
}) => {
  trackEvent('calculate_plan', {
    event_category: 'Calculator',
    tipo_contratacao: data.tipo,
    acomodacao: data.acomodacao,
    total_planos: data.totalPlanos,
  });
};

export const trackWhatsAppClick = (source: string) => {
  trackEvent('whatsapp_click', {
    event_category: 'Engagement',
    event_label: source,
  });
};
