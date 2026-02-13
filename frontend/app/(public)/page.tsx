'use client';

import dynamic from 'next/dynamic';
import Header from './components/Header';
import Hero from './components/Hero';
import Partners from './components/Partners';

// Lazy load componentes pesados
const CalculatorWizard = dynamic(() => import('./components/CalculatorWizard'), {
  loading: () => <div className="min-h-[600px] flex items-center justify-center">Carregando calculadora...</div>,
  ssr: false,
});

const HowItWorks = dynamic(() => import('./components/HowItWorks'));
const AISimulator = dynamic(() => import('./components/AISimulator'));
const CaseStudies = dynamic(() => import('./components/CaseStudies'));
const Triade = dynamic(() => import('./components/Triade'));
const Testimonials = dynamic(() => import('./components/Testimonials'), {
  loading: () => <div className="min-h-[400px]" />,
  ssr: false,
});
const FAQ = dynamic(() => import('./components/FAQ'));
const Footer = dynamic(() => import('./components/Footer'));
const WhatsAppFloat = dynamic(() => import('./components/WhatsAppFloat'), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <div id="hero">
          <Hero />
        </div>
        <Partners />
        <div id="calculadora">
          <CalculatorWizard />
        </div>
        <HowItWorks />
        <div id="ia-simulator">
          <AISimulator />
        </div>
        <div id="case-studies">
          <CaseStudies />
        </div>
        <div id="triade">
          <Triade />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        <div id="faq">
          <FAQ />
        </div>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
