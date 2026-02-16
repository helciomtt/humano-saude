'use client';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Cadastro',
      desc: 'Preencha o formulário do site ou fale diretamente no WhatsApp',
      gradient: 'from-gold-400 to-gold-600',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Perguntas Essenciais',
      desc: 'Respondemos algumas perguntas rápidas sobre suas necessidades',
      gradient: 'from-gold-400 to-gold-500',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Cotação Gerada',
      desc: 'Receba sua cotação personalizada em até 10 minutos',
      gradient: 'from-gold-400 to-gold-500',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Título */}
        <div className="text-center mb-20">
          <span className="inline-block px-5 py-1.5 bg-gold-50 text-gold-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-gold-200">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-4">
            Seu Atendimento{' '}
            <span className="text-gold-400">Rápido e Personalizado</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Em apenas 3 passos simples, você recebe sua cotação personalizada em menos de <strong className="text-black">10 minutos</strong>
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((item, i) => (
            <div
              key={i}
              className="group relative bg-white p-10 rounded-2xl border border-gray-200 hover:border-gold-400/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Número */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-black text-white text-xl font-black mb-6">
                {item.step}
              </div>

              {/* Ícone */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gold-50 rounded-2xl flex items-center justify-center border border-gold-200">
                  <div className="[&>svg]:w-8 [&>svg]:h-8 [&>svg]:text-gold-400">
                    {item.icon}
                  </div>
                </div>
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-black mb-3">
                {item.title}
              </h3>

              {/* Descrição */}
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <div className="relative bg-black p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="relative text-center">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
              Pronto para <span className="text-gold-400">Economizar?</span>
            </h3>
            
            <p className="text-white/70 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Descubra como reduzir até <strong className="text-gold-400">40%</strong> no valor do seu plano de saúde.
              Atendimento gratuito, análise em 10 minutos e suporte completo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#calculadora"
                className="inline-flex items-center gap-3 bg-gold-400 hover:bg-gold-500 text-black px-8 py-4 rounded-xl text-sm uppercase tracking-wider font-black transition-all hover:-translate-y-0.5"
              >
                Calcular Economia
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>

              <a
                href="https://wa.me/5521988179407?text=Olá! Quero economizar no meu plano de saúde"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-transparent text-white border border-white/20 px-8 py-4 rounded-xl text-sm uppercase tracking-wider font-bold hover:bg-white/10 transition-all hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
                </svg>
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
