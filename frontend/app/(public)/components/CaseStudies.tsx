'use client';

export default function CaseStudies() {
  const cases = [
    {
      tipo: 'Plano Empresarial',
      custoAnterior: 'R$ 5.840,00',
      novoCusto: 'R$ 3.120,00',
      reducao: '46% de redução',
      extra: 'Mesma rede hospitalar',
    },
    {
      tipo: 'Plano Familiar',
      custoAnterior: 'R$ 3.200,00',
      novoCusto: 'R$ 1.950,00',
      reducao: '39% de redução',
      extra: 'Upgrade de rede Samaritano',
    },
    {
      tipo: 'Plano Individual',
      custoAnterior: 'R$ 1.100,00',
      novoCusto: 'R$ 680,00',
      reducao: '40% de redução',
      extra: 'Migração sem novas carências',
    },
  ];

  return (
    <section id="pratica" className="py-20 sm:py-32 bg-black text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1]">
          Análise <span className="text-[#B8941F]">na prática</span>
        </h2>
        <p className="text-gray-400 text-lg tracking-widest uppercase font-medium mb-24">
          como transformamos despesa em economia real
        </p>

        <div className="grid md:grid-cols-3 gap-12 text-left mb-20">
          {cases.map((item, i) => (
            <div
              key={i}
              className="bg-white/5 p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-[3.5rem] border border-white/10 hover:border-[#B8941F]/30 transition-all hover:-translate-y-2"
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[3px] mb-8 italic">
                {item.tipo}
              </p>
              
              <div className="space-y-6 mb-10">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase font-bold mb-1">Custo anterior</p>
                  <p className="text-2xl text-gray-500 line-through font-bold tracking-tight">{item.custoAnterior}</p>
                </div>
                <div>
                  <p className="text-xs text-white font-black uppercase tracking-widest mb-1">Custo com inteligência <span className="text-[#B8941F]">Humano</span></p>
                  <p className="text-4xl text-white font-black tracking-tighter">{item.novoCusto}</p>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-[#B8941F] flex flex-col gap-4">
                <div className="bg-[#B8941F] text-white py-2.5 px-6 rounded-full text-xs font-black uppercase tracking-widest text-center">
                  {item.reducao}
                </div>
                <p className="text-[11px] text-gray-400 text-center font-bold italic uppercase">
                  {item.extra}
                </p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="#calculadora"
          className="inline-flex items-center gap-2 bg-[#B8941F] hover:bg-[#A07E18] text-white px-12 py-5 rounded-xl text-sm uppercase tracking-widest font-black transition-all hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-6.75h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          Simular minha redução
        </a>
      </div>
    </section>
  );
}
