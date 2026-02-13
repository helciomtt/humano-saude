'use client';

import { useState, useEffect } from 'react';
import ScannerPDF from '../components/ScannerPDF';
import CotacaoForm from '../components/CotacaoForm';
import CotacaoResult from '../components/CotacaoResult';
import { BigNumber, VisitantesOnline } from '../components/BigNumbers';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, DollarSign, Target, Sparkles } from 'lucide-react';
import { CotacaoOutput } from '../services/api';
import { getDashboardStats } from '@/app/actions/leads';
import Logo from '../components/Logo';

interface PDFExtraido {
  idades: number[];
  operadora: string | null;
  valor_atual: number | null;
  tipo_plano: string | null;
  nome_beneficiarios: string[];
  observacoes: string | null;
  confianca: string;
}

export default function DashboardPage() {
  const [resultado, setResultado] = useState<CotacaoOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Estados para preencher o formulário automaticamente
  const [idadesAutomaticas, setIdadesAutomaticas] = useState<number[]>([]);
  const [operadoraAutomatica, setOperadoraAutomatica] = useState<string>('');
  const [tipoAutomatico, setTipoAutomatico] = useState<string>('');

  // Buscar estatísticas do banco de dados
  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      const result = await getDashboardStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
      setStatsLoading(false);
    }
    fetchStats();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDadosExtraidosPDF = (dados: PDFExtraido) => {
    // Preencher formulário com dados do PDF
    setIdadesAutomaticas(dados.idades);
    
    if (dados.operadora) {
      setOperadoraAutomatica(dados.operadora);
    }
    
    if (dados.tipo_plano) {
      setTipoAutomatico(dados.tipo_plano);
    }

    // Scroll suave para o formulário
    setTimeout(() => {
      document.getElementById('formulario-cotacao')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 500);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header com Logo Oficial */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo variant="1" size="lg" className="max-w-[240px]" />
          <div className="h-12 w-px bg-white/10" />
          <div>
            <h1 className="text-3xl font-bold mb-1 font-[family-name:var(--font-heading)]">Dashboard</h1>
            <p className="text-muted-foreground">
              Sistema de cotações de planos de saúde com IA
            </p>
          </div>
        </div>
        
        {/* Badge Enterprise */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#F6E05E]/10 border border-[#D4AF37]/30">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          <span className="text-sm font-semibold text-[#F6E05E]">Enterprise</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <BigNumber
          title="Leads Captados"
          value={stats?.total_leads || 0}
          change={stats?.leads_mes_atual ? 
            Math.round((stats.leads_mes_atual / (stats.total_leads || 1)) * 100) : 0}
          icon={Activity}
          loading={statsLoading}
        />
        
        <BigNumber
          title="Economia Total"
          value={stats?.economia_total 
            ? new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(stats.economia_total)
            : 'R$ 0'}
          change={stats?.economia_mes_atual && stats?.economia_total
            ? Math.round((stats.economia_mes_atual / stats.economia_total) * 100)
            : 0}
          icon={DollarSign}
          loading={statsLoading}
        />
        
        <BigNumber
          title="Taxa de Conversão"
          value={stats?.taxa_conversao || '0'}
          suffix="%"
          change={5}
          icon={Target}
          loading={statsLoading}
        />
        
        <VisitantesOnline 
          count={Math.floor(Math.random() * 15) + 1}
          loading={statsLoading}
        />
      </div>

      {/* Scanner de PDF - NOVO! */}
      <div className="mb-6">
        <ScannerPDF onDadosExtraidos={handleDadosExtraidosPDF} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div id="formulario-cotacao">
          <CotacaoForm 
            onCalculate={setResultado} 
            onLoading={setLoading}
            idadesIniciais={idadesAutomaticas}
            operadoraInicial={operadoraAutomatica}
            tipoInicial={tipoAutomatico}
          />
        </div>

        {/* Resultado */}
        <div>
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Calculando cotação...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && resultado && <CotacaoResult resultado={resultado} />}

          {!loading && !resultado && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Faça upload de um PDF ou</p>
                  <p>Preencha o formulário para calcular uma cotação</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
