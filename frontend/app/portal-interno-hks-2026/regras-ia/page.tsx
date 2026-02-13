'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, Shield, Settings, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRegrasIA, toggleRegraIA, type RegraIA } from '@/app/actions/regrasIA';

const catIcon = (c: string) => {
  switch (c) {
    case 'automacao': return <Zap className="h-4 w-4 text-yellow-400" />;
    case 'otimizacao': return <Brain className="h-4 w-4 text-purple-400" />;
    case 'seguranca': return <Shield className="h-4 w-4 text-red-400" />;
    case 'processamento': return <Settings className="h-4 w-4 text-cyan-400" />;
    default: return null;
  }
};

const catLabel = (c: string) => {
  switch (c) {
    case 'automacao': return 'Automação';
    case 'otimizacao': return 'Otimização';
    case 'seguranca': return 'Segurança';
    case 'processamento': return 'Processamento';
    default: return c;
  }
};

export default function RegrasIAPage() {
  const [regras, setRegras] = useState<RegraIA[]>([]);
  const [filtro, setFiltro] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegrasIA().then((data) => {
      setRegras(data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, currentState: boolean) => {
    // Optimistic update
    setRegras((prev) => prev.map((r) => r.id === id ? { ...r, ativa: !currentState } : r));
    const result = await toggleRegraIA(id, !currentState);
    if (!result.success) {
      setRegras((prev) => prev.map((r) => r.id === id ? { ...r, ativa: currentState } : r));
      toast.error('Erro ao alterar regra');
    }
  };

  const filtered = filtro ? regras.filter((r) => r.categoria === filtro) : regras;
  const ativas = regras.filter((r) => r.ativa).length;
  const totalExecucoes = regras.reduce((s, r) => s + r.execucoes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          REGRAS DE IA
        </h1>
        <p className="mt-2 text-gray-400">Configure regras de automação e inteligência artificial</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total de Regras', value: regras.length, icon: Brain, color: 'text-[#D4AF37]', border: 'border-[#D4AF37]/20' },
          { label: 'Regras Ativas', value: ativas, icon: CheckCircle, color: 'text-green-400', border: 'border-green-500/20' },
          { label: 'Inativas', value: regras.length - ativas, icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-500/20' },
          { label: 'Execuções Totais', value: totalExecucoes.toLocaleString('pt-BR'), icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/20' },
        ].map((item, i) => (
          <div key={i} className={`rounded-lg border ${item.border} bg-[#0a0a0a] p-5`}>
            <item.icon className={`h-6 w-6 ${item.color} mb-3`} />
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro('')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            filtro === '' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          Todas
        </button>
        {['automacao', 'otimizacao', 'seguranca', 'processamento'].map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filtro === c ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {catIcon(c)} {catLabel(c)}
          </button>
        ))}
      </div>

      {/* Lista de regras */}
      <div className="space-y-3">
        {filtered.map((regra) => (
          <div key={regra.id} className={`rounded-lg border bg-[#0a0a0a] p-5 transition-all ${
            regra.ativa ? 'border-white/10' : 'border-white/5 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {catIcon(regra.categoria)}
                <div>
                  <h3 className="text-sm font-semibold text-white">{regra.nome}</h3>
                  <p className="text-xs text-gray-500">{regra.descricao}</p>
                </div>
              </div>
              <button onClick={() => handleToggle(regra.id, regra.ativa)} className="transition-colors">
                {regra.ativa
                  ? <ToggleRight className="h-7 w-7 text-[#D4AF37]" />
                  : <ToggleLeft className="h-7 w-7 text-gray-600" />
                }
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#151515] p-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Condição (SE)</p>
                <p className="text-xs text-gray-300">{regra.condicao}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Ação (ENTÃO)</p>
                <p className="text-xs text-gray-300">{regra.acao}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${
                  regra.ativa ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {regra.ativa ? 'Ativa' : 'Inativa'}
                </span>
                <span>{catLabel(regra.categoria)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{regra.ultima_execucao}</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{regra.execucoes.toLocaleString('pt-BR')} execuções</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
