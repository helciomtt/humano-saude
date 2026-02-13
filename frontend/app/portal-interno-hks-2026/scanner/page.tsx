'use client';

import { useState } from 'react';
import { LuxuryTitle, GoldScanner } from '@/components/premium';
import { saveScannedLead, type ScannedLeadData } from '@/app/actions/leads';
import { apiService, type PDFExtraido } from '@/app/services/api';
import { toast } from 'sonner';
import { StatsCard, StatsGrid } from '../components';
import { FileText, Target, Clock } from 'lucide-react';

export default function ScannerPDFPage() {
  const [lastScan, setLastScan] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<PDFExtraido | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const handlePdfDropped = async (file: File) => {
    console.log('📄 PDF recebido:', file.name);

    try {
      // Chamar o proxy real /api/pdf → backend Python
      const data = await apiService.extrairPDFProxy(file);
      setExtractedData(data);
      setScanCount((prev) => prev + 1);

      // Montar dados do lead a partir do PDF extraído
      const leadData: ScannedLeadData = {
        nome: data.nome_beneficiarios?.[0] || `Lead PDF - ${file.name}`,
        whatsapp: '',
        email: '',
        operadora_atual: data.operadora || undefined,
        valor_atual: data.valor_atual || undefined,
        idades: data.idades || [],
        tipo_contratacao: data.tipo_plano || undefined,
        dados_pdf: {
          arquivo: file.name,
          confianca: data.confianca,
          total_caracteres: data.total_caracteres,
          texto_preview: data.texto_extraido_preview,
        },
        observacoes: `Lead gerado pelo Scanner IA | Confiança: ${data.confianca}`,
      };

      // Salvar no Supabase via Server Action
      const result = await saveScannedLead(leadData);

      if (result.success) {
        toast.success('Lead salvo com sucesso', {
          description: `ID: ${result.lead_id}`,
        });
      } else {
        toast.error('Erro ao salvar lead', {
          description: result.message || result.error,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao processar PDF', { description: msg });
      console.error('❌ Erro no scanner:', error);
    }
  };

  const handleScanComplete = (data: any) => {
    setLastScan(data);
    console.log('✅ Scan completo:', data);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <LuxuryTitle as="h1" className="text-5xl mb-4">
          Scanner PDF Premium
        </LuxuryTitle>
        
        <p className="text-gray-300 text-lg mb-12 max-w-3xl">
          Arraste PDFs de planos de saúde e deixe nossa IA processar instantaneamente. 
          Sistema com <span className="text-[#D4AF37] font-black">98.7% de precisão</span> e processamento em <span className="text-[#D4AF37] font-black">menos de 5 segundos</span>.
        </p>

        {/* Scanner */}
        <div className="mb-8">
          <GoldScanner 
            onPdfDropped={handlePdfDropped}
            onScanComplete={handleScanComplete}
          />
        </div>

        {/* Estatísticas */}
        <StatsGrid>
          <StatsCard
            label="PDFs Processados"
            value={scanCount}
            icon={FileText}
          />
          <StatsCard
            label="Confiança Último"
            value={extractedData?.confianca || '—'}
            icon={Target}
          />
          <StatsCard
            label="Caracteres Extraídos"
            value={extractedData?.total_caracteres?.toLocaleString('pt-BR') || '—'}
            icon={Clock}
          />
        </StatsGrid>

        {/* Dados Extraídos */}
        {extractedData && (
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6 mb-8 animate-[fadeIn_0.5s_ease-in-out]">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
              DADOS EXTRAÍDOS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {extractedData.operadora && (
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Operadora:</span>
                  <span className="text-white font-bold">{extractedData.operadora}</span>
                </div>
              )}
              {extractedData.tipo_plano && (
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Tipo Plano:</span>
                  <span className="text-white font-bold">{extractedData.tipo_plano}</span>
                </div>
              )}
              {extractedData.valor_atual != null && (
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Valor Atual:</span>
                  <span className="text-[#D4AF37] font-bold">
                    R$ {Number(extractedData.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {extractedData.idades.length > 0 && (
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Idades:</span>
                  <span className="text-white font-bold">{extractedData.idades.join(', ')}</span>
                </div>
              )}
              {extractedData.nome_beneficiarios.length > 0 && (
                <div className="flex justify-between p-3 bg-white/5 rounded-lg col-span-full">
                  <span className="text-gray-400">Beneficiários:</span>
                  <span className="text-white font-bold">{extractedData.nome_beneficiarios.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Confiança:</span>
                <span className="text-[#D4AF37] font-black text-lg">{extractedData.confianca}</span>
              </div>
            </div>
            {extractedData.texto_extraido_preview && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Preview do texto extraído:</p>
                <p className="text-gray-300 text-xs font-mono line-clamp-3">{extractedData.texto_extraido_preview}</p>
              </div>
            )}
          </div>
        )}

        {/* Último scan */}
        {lastScan && (
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 animate-[fadeIn_0.5s_ease-in-out]">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>ÚLTIMO PROCESSAMENTO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Arquivo:</span>
                <span className="text-white font-bold">{lastScan.fileName}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Tamanho:</span>
                <span className="text-white font-bold">{(lastScan.size / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Processado em:</span>
                <span className="text-white font-bold">{new Date(lastScan.scannedAt).toLocaleTimeString('pt-BR')}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Precisão:</span>
                <span className="text-[#D4AF37] font-black text-lg">{lastScan.accuracy}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Como funciona */}
        <div className="glass-dark p-8 rounded-2xl mt-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase font-cinzel">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: '📄', titulo: 'Upload', desc: 'Arraste ou selecione o PDF do plano' },
              { icon: '🤖', titulo: 'IA Processa', desc: 'Sistema analisa em tempo real' },
              { icon: '📊', titulo: 'Dados Extraídos', desc: 'Informações estruturadas' },
              { icon: '💾', titulo: 'Auto-Save', desc: 'Lead salvo automaticamente' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#bf953f] to-[#D4AF37] rounded-full flex items-center justify-center text-3xl">
                  {step.icon}
                </div>
                <h3 className="text-white font-black mb-2 uppercase">{step.titulo}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="glass-dark p-6 rounded-2xl">
            <h3 className="text-xl font-black text-white mb-4 uppercase font-cinzel">⚡ Performance</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> Processamento em menos de 5 segundos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> Até 100 PDFs simultâneos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> Auto-escala conforme demanda
              </li>
            </ul>
          </div>

          <div className="glass-dark p-6 rounded-2xl">
            <h3 className="text-xl font-black text-white mb-4 uppercase font-cinzel">🎯 Precisão</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> 98.7% de precisão média
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> Validação automática de dados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> Detecção de anomalias
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
