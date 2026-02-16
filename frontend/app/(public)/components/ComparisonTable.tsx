'use client';

import { motion } from 'framer-motion';

const comparisonData = [
  {
    feature: 'Custo Mensal (Prêmio)',
    pf: 'Altíssimo. Custa em média 30% a 40% mais caro para a mesma faixa etária e rede.',
    pj: 'Muito menor. A diluição do risco permite tabelas significativamente mais baratas.',
    copy: 'Você está pagando 40% a mais pelo mesmo hospital só porque não usou seu CNPJ.',
  },
  {
    feature: 'Acesso a Redes Premium',
    pf: 'Quase inexistente. Bradesco, SulAmérica e Amil Premium praticamente não operam PF puro.',
    pj: 'Acesso total. As melhores redes e hospitais de ponta (Sírio, Einstein, D\'Or) focam no B2B.',
    copy: 'Dê um upgrade na rede da sua família e dos seus sócios pagando preço de plano regional.',
  },
  {
    feature: 'Regra de Reajuste (ANS)',
    pf: 'Adesão sofre reajustes brutais (sinistralidade da carteira + inflação médica), frequentemente passando de 20%.',
    pj: 'Para PMEs (até 29 vidas), o reajuste segue o Pool de Risco da ANS (RN 309). Reajuste único que dilui o impacto e torna o aumento mais previsível.',
    copy: 'Fuja dos reajustes surpresa de 25% ao ano. No CNPJ, seu risco é diluído e controlado.',
  },
  {
    feature: 'Carências',
    pf: 'Cumprimento rigoroso da tabela padrão da ANS (até 300 dias para parto, 24 meses para preexistentes).',
    pj: 'Compra de Carência (PRC): A maioria das operadoras isenta ou reduz drasticamente as carências na migração de um plano anterior para o CNPJ.',
    copy: 'Migre hoje e continue usando amanhã. Nós negociamos a redução das suas carências.',
  },
  {
    feature: 'Inclusão de Dependentes',
    pf: 'Restrito e caro.',
    pj: 'O sócio pode incluir cônjuge, filhos e, dependendo da operadora, até agregados com facilidade na tabela PME.',
    copy: 'Proteja sua família inteira dentro do contrato da sua empresa com custos de atacado.',
  },
];

function XIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#B8941F]/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-[#B8941F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

export default function ComparisonTable() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerVariants}
        >
          <span className="inline-block px-4 py-1.5 bg-[#B8941F]/10 text-[#B8941F] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#B8941F]/20">
            Comparativo
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Por que usar o{' '}
            <span className="text-[#B8941F]">CNPJ</span>{' '}
            é a melhor escolha?
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Compare os benefícios de um plano empresarial com o plano pessoa física e veja a diferença na prática.
          </p>
        </motion.div>

        {/* ===== MOBILE: Stacked cards ===== */}
        <motion.div
          className="block lg:hidden space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={containerVariants}
        >
          {comparisonData.map((row, i) => (
            <motion.div
              key={i}
              variants={rowVariants}
              className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 text-sm mb-3">{row.feature}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XIcon />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Pessoa Física / Adesão</span>
                    <span className="text-sm text-gray-600">{row.pf}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8941F] block mb-0.5">Empresa / CNPJ</span>
                    <span className="text-sm text-gray-900 font-semibold">{row.pj}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm italic text-[#B8941F] font-medium">&ldquo;{row.copy}&rdquo;</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ===== DESKTOP: Table grid ===== */}
        <div className="hidden lg:block">
          <motion.div
            className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            {/* Table Header */}
            <motion.div className="grid grid-cols-[200px_1fr_1fr_1fr] bg-gray-50" variants={rowVariants}>
              <div className="p-5 lg:p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Critério
              </div>
              <div className="p-5 lg:p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <XIcon />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Pessoa Física / Adesão
                  </span>
                </div>
              </div>
              <div className="p-5 lg:p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#B8941F]/10 rounded-full border border-[#B8941F]/20">
                  <CheckIcon />
                  <span className="text-xs font-bold text-[#B8941F] uppercase tracking-wide">
                    Empresa / CNPJ
                  </span>
                </div>
              </div>
              <div className="p-5 lg:p-6 text-center">
                <span className="text-xs font-bold text-[#B8941F] uppercase tracking-wider">
                  Argumento de Venda
                </span>
              </div>
            </motion.div>

            {/* Table Rows */}
            {comparisonData.map((row, i) => (
              <motion.div
                key={i}
                variants={rowVariants}
                whileHover={{
                  backgroundColor: 'rgba(184, 148, 31, 0.04)',
                  transition: { duration: 0.2 },
                }}
                className={`grid grid-cols-[200px_1fr_1fr_1fr] border-t border-gray-100 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                } transition-colors cursor-default`}
              >
                <div className="p-5 lg:p-6 flex items-center">
                  <span className="text-sm font-semibold text-gray-800">{row.feature}</span>
                </div>
                <div className="p-5 lg:p-6 flex items-center">
                  <span className="text-sm text-gray-500">{row.pf}</span>
                </div>
                <div className="p-5 lg:p-6 flex items-center">
                  <span className="text-sm font-semibold text-gray-900">{row.pj}</span>
                </div>
                <div className="p-5 lg:p-6 flex items-center">
                  <span className="text-sm italic text-[#B8941F] font-medium">&ldquo;{row.copy}&rdquo;</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-10 sm:mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#B8941F] hover:bg-[#A07E18] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-colors"
          >
            Quero economizar com meu CNPJ
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
