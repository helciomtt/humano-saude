'use client';

import { Building2, Sparkles, Users, DollarSign, Globe } from 'lucide-react';
import { useCorretorId } from '../../hooks/useCorretorToken';

export default function CorretorCompaniesPage() {
  const corretorId = useCorretorId();

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#D4AF37]" />
          Minhas <span className="text-[#D4AF37]">Empresas</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Gestão de contas corporativas e empresas vinculadas
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="relative rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-transparent p-12 text-center overflow-hidden">
        {/* Gold shimmer */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

        <div className="relative">
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-[#D4AF37]" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" />
            Módulo Empresas — Em Breve
          </h2>
          <p className="text-sm text-white/50 max-w-md mx-auto mb-8">
            O módulo de gestão de empresas está sendo preparado. Em breve você poderá
            cadastrar e gerenciar empresas, vincular contatos, acompanhar deals
            corporativos e muito mais.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Users, label: 'Contatos por empresa', desc: 'Vincule contatos à empresa' },
              { icon: DollarSign, label: 'Deals corporativos', desc: 'Acompanhe negócios PME' },
              { icon: Globe, label: 'Dados enriquecidos', desc: 'CNPJ, porte, setor, faturamento' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
              >
                <feature.icon className="h-6 w-6 text-[#D4AF37]/60 mx-auto mb-2" />
                <p className="text-xs font-medium text-white/70">{feature.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
