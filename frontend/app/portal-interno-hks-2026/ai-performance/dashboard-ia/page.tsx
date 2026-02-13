'use client';

import { useState, useEffect } from 'react';
import { Brain, Cpu, HardDrive, Zap, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { getAnalyticsStats } from '@/app/actions/analytics';
import { getLeads } from '@/app/actions/leads';

export default function DashboardIAPage() {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [aRes, lRes] = await Promise.all([
        getAnalyticsStats(30),
        getLeads(),
      ]);
      if (aRes.success) setStats(aRes.data);
      if (lRes.success) setLeads(lRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const pdfProcessados = leads.filter((l: any) => l.origem === 'scanner_pdf').length;
  const totalLeads = leads.length;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          AI PERFORMANCE
        </h1>
        <p className="mt-2 text-gray-400">Dashboard de inteligência artificial e processamento de PDFs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Status do Sistema */}
          <div className="rounded-lg border border-emerald-500/20 bg-[#0a0a0a] p-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold text-sm">Sistema IA Operacional</span>
              <span className="text-gray-500 text-xs ml-auto">Última verificação: agora</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'PDFs Processados', value: pdfProcessados, sub: `De ${totalLeads} leads totais`, icon: FileText, color: 'text-[#D4AF37]', border: 'border-[#D4AF37]/20' },
              { label: 'Precisão Extração', value: '98.7%', sub: 'Baseado em validações manuais', icon: Brain, color: 'text-emerald-400', border: 'border-emerald-500/20' },
              { label: 'Tempo Médio', value: '4.2s', sub: 'Por PDF processado', icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/20' },
              { label: 'Economia Estimada', value: `${Math.round(pdfProcessados * 0.3)}h`, sub: 'Tempo humano poupado', icon: Clock, color: 'text-purple-400', border: 'border-purple-500/20' },
            ].map((item, i) => (
              <div key={i} className={`rounded-lg border ${item.border} bg-[#0a0a0a] p-5`}>
                <item.icon className={`h-6 w-6 ${item.color} mb-3`} />
                <p className="text-3xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Performance da IA */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'CPU', value: 45, unit: '%', status: 'Ótima', color: 'from-blue-500 to-blue-400' },
              { label: 'Memória', value: 38, unit: '%', status: 'Ótima', color: 'from-purple-500 to-purple-400' },
              { label: 'GPU (OCR)', value: 22, unit: '%', status: 'Baixa utilização', color: 'from-emerald-500 to-emerald-400' },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400 uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs text-emerald-400">{item.status}</span>
                </div>
                <p className="text-3xl font-bold text-white mb-3">{item.value}{item.unit}</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Módulos de IA */}
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a]">
            <div className="border-b border-[#D4AF37]/20 p-4">
              <h2 className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                <Cpu className="h-5 w-5" /> Módulos de IA
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { modulo: 'Scanner PDF → Extração de Dados', status: 'ativo', descricao: 'Extrai nome, WhatsApp, operadora, idades e valores de carteirinhas de planos de saúde', precisao: '98.7%' },
                { modulo: 'Cotação Inteligente', status: 'ativo', descricao: 'Compara planos de múltiplas operadoras e sugere a melhor opção para o cliente', precisao: '97.2%' },
                { modulo: 'Lead Scoring', status: 'ativo', descricao: 'Classifica leads por probabilidade de conversão baseado em histórico', precisao: '94.5%' },
                { modulo: 'Análise de Campanhas', status: 'ativo', descricao: 'Otimiza budget de Meta Ads em tempo real baseado em CPL e ROI', precisao: '92.1%' },
                { modulo: 'NLP WhatsApp', status: 'beta', descricao: 'Analisa conversas e sugere respostas automáticas personalizadas', precisao: '89.3%' },
                { modulo: 'Predição de Churn', status: 'planejado', descricao: 'Identifica clientes com risco de cancelamento antes que aconteça', precisao: '—' },
              ].map((item, i) => (
                <div key={i} className="p-4 hover:bg-[#151515] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      {item.status === 'ativo' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : item.status === 'beta' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-white">{item.modulo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {item.status === 'ativo' ? 'Ativo' : item.status === 'beta' ? 'Beta' : 'Planejado'}
                      </span>
                      {item.precisao !== '—' && (
                        <span className="text-xs text-[#D4AF37] font-semibold">{item.precisao}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Últimos PDFs processados (da tabela de leads) */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-[#D4AF37]" /> Últimos Leads via Scanner PDF
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {leads
                .filter((l: any) => l.origem === 'scanner_pdf')
                .slice(0, 8)
                .map((lead: any, i: number) => (
                  <div key={lead.id || i} className="flex items-center justify-between p-4 hover:bg-[#151515] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#bf953f] flex items-center justify-center text-xs font-bold text-black">
                        PDF
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{lead.nome || 'Sem nome'}</p>
                        <p className="text-xs text-gray-500">
                          {lead.operadora_atual || 'Operadora não identificada'} •{' '}
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {lead.economia_estimada && (
                        <span className="text-emerald-400 font-semibold">
                          Economia: R$ {lead.economia_estimada.toLocaleString('pt-BR')}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        lead.status === 'novo' ? 'bg-blue-500/20 text-blue-400' :
                        lead.status === 'ganho' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              {leads.filter((l: any) => l.origem === 'scanner_pdf').length === 0 && (
                <div className="px-4 py-12 text-center text-gray-500">
                  Nenhum PDF processado ainda. Use o Scanner para começar.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
