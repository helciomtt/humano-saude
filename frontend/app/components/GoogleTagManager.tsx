import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-K7GX9SVW';

export default function GoogleTagManager() {
  return (
    <Script
      id="google-tag-manager"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `,
      }}
    />
  );
}

export function GoogleTagManagerNoScript() {
  return (
    <noscript
      dangerouslySetInnerHTML={{
        __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      }}
    />
  );
}

// Helper functions para tracking via GTM
export const gtmPush = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push(data);
  }
};

export const trackGTMEvent = (eventName: string, eventData?: Record<string, any>) => {
  gtmPush({
    event: eventName,
    ...eventData,
  });
};

export const trackGTMLeadSubmission = (data: {
  nome: string;
  email: string;
  telefone: string;
  perfil: string;
}) => {
  trackGTMEvent('lead_submission', {
    event_category: 'Lead',
    event_label: data.perfil,
    lead_nome: data.nome,
    lead_email: data.email,
    lead_telefone: data.telefone,
  });
};

export const trackGTMCalculation = (data: {
  tipo: string;
  acomodacao: string;
  totalPlanos: number;
  valorMaisBarato?: number;
}) => {
  trackGTMEvent('calculator_result', {
    event_category: 'Calculator',
    tipo_contratacao: data.tipo,
    acomodacao: data.acomodacao,
    total_planos: data.totalPlanos,
    valor_mais_barato: data.valorMaisBarato,
  });
};

export const trackGTMWhatsAppClick = (source: string) => {
  trackGTMEvent('whatsapp_click', {
    event_category: 'Engagement',
    event_label: source,
    button_location: source,
  });
};
