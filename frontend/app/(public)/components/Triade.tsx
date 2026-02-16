'use client';

import { useEffect, useRef, useState } from 'react';

const triadSteps = [
  {
    num: '01',
    title: 'Analisar',
    desc: 'Mapeamos sua fatura atual para expor cobranças indevidas e abusos ocultos.',
    icon: (
      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Assessorar',
    desc: 'Escolha técnica focada em rede hospitalar e viabilidade financeira de mercado.',
    icon: (
      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Acompanhar',
    desc: 'Gestão contínua vitalícia para que você nunca mais sofra reajustes abusivos.',
    icon: (
      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

export default function Triade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const marker = window.innerHeight * 0.7;
      const passed = marker - rect.top;
      const pct = Math.max(0, Math.min(passed / rect.height, 1)) * 100;

      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <section id="metodo" className="py-20 sm:py-32 bg-black text-center overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <span className="inline-block px-4 py-1.5 bg-[#B8941F]/10 text-[#B8941F] rounded-full text-xs font-bold uppercase tracking-[3px] mb-6 border border-[#B8941F]/20">
          Nosso método
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
          A Tríade <span className="text-[#B8941F]">Humana</span>
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-16 text-lg">
          Três pilares que garantem economia real e contínua para sua empresa.
        </p>

        {/* Timeline */}
        <div id="timeline-container" ref={containerRef} className="relative pl-16 md:pl-48 text-left mb-20">
          {/* Linha vertical */}
          <div className="absolute left-10 md:left-[6.5rem] top-0 bottom-0 w-[2px] bg-white/10 rounded-full">
            <div
              className="bg-gradient-to-b from-[#B8941F] to-[#B8941F]/60 w-full rounded-full transition-all duration-300 ease-out"
              style={{ height: `${progress}%` }}
            />
          </div>

          <div className="space-y-24 md:space-y-32">
            {triadSteps.map((step) => {
              const stepThreshold = ((Number(step.num) - 1) / triadSteps.length) * 100;
              const isActive = progress > stepThreshold;

              return (
                <div key={step.num} className="relative group">
                  {/* 3D Icon Container */}
                  <div className="absolute -left-[4rem] md:-left-[8.5rem] top-0 flex items-center justify-center">
                    {/* Outer glow ring */}
                    <div
                      className={`absolute w-14 h-14 md:w-20 md:h-20 rounded-full transition-all duration-700 ${
                        isActive
                          ? 'bg-[#B8941F]/15 shadow-[0_0_30px_rgba(184,148,31,0.3)]'
                          : 'bg-transparent'
                      }`}
                    />
                    {/* Outer ring */}
                    <div
                      className={`absolute w-14 h-14 md:w-20 md:h-20 rounded-full border-2 transition-all duration-500 ${
                        isActive
                          ? 'border-[#B8941F]/40 scale-100'
                          : 'border-white/5 scale-90'
                      }`}
                    />
                    {/* Inner circle */}
                    <div
                      className={`relative w-11 h-11 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? 'bg-gradient-to-br from-[#d4ad2e] via-[#B8941F] to-[#8A6C15] text-white shadow-[0_4px_20px_rgba(184,148,31,0.5)]'
                          : 'bg-white/5 border border-white/10 text-white/30'
                      }`}
                      style={isActive ? { boxShadow: '0 4px 20px rgba(184,148,31,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)' } : {}}
                    >
                      <span className={`transition-all duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-40'}`}>
                        {step.icon}
                      </span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div
                    className={`p-6 md:p-8 rounded-2xl border transition-all duration-500 ${
                      isActive
                        ? 'bg-white/[0.04] border-[#B8941F]/20 translate-x-0 opacity-100'
                        : 'bg-white/[0.02] border-white/5 translate-x-4 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-bold tracking-[3px] transition-colors duration-500 ${isActive ? 'text-[#B8941F]' : 'text-white/30'}`}>
                        PASSO {step.num}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://wa.me/5521988179407?text=Olá!%20Quero%20implementar%20a%20Tríade%20Humana."
          className="inline-flex items-center gap-3 bg-[#B8941F] hover:bg-[#A07E18] px-10 py-4 rounded-xl text-sm uppercase tracking-widest font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#B8941F]/20 group"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
          </svg>
          Implementar método agora
        </a>
      </div>
    </section>
  );
}
