'use client';

// =====================================================
// AIInsightPanel — Componente Reutilizável
// Usado em: /admin/ai, /admin/analytics, /admin/cockpit
// =====================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ShieldAlert,
  Zap,
  MessageSquare,
} from 'lucide-react';
import type { AIInsightPanelProps, CampaignInsightAI, AIAction, AccountStatus } from '@/lib/types/ai-performance';

// =====================================================
// HELPERS
// =====================================================

function getStatusColor(status?: AccountStatus): string {
  switch (status) {
    case 'SAUDÁVEL': return 'text-emerald-400';
    case 'ATENÇÃO': return 'text-yellow-400';
    case 'CRÍTICO': return 'text-red-400';
    default: return 'text-white/60';
  }
}

function getStatusBg(status?: AccountStatus): string {
  switch (status) {
    case 'SAUDÁVEL': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'ATENÇÃO': return 'bg-yellow-500/10 border-yellow-500/20';
    case 'CRÍTICO': return 'bg-red-500/10 border-red-500/20';
    default: return 'bg-white/5 border-white/10';
  }
}

function getHealthColor(score?: number): string {
  if (!score) return 'text-white/40';
  if (score >= 70) return 'text-emerald-400';
  if (score >= 45) return 'text-yellow-400';
  if (score >= 25) return 'text-orange-400';
  return 'text-red-400';
}

function getInsightIcon(type: CampaignInsightAI['type']) {
  switch (type) {
    case 'success': return <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />;
    case 'danger': return <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0" />;
    case 'info': return <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />;
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'CRÍTICA': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'ALTA': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'MÉDIA': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'BAIXA': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-white/10 text-white/60 border-white/20';
  }
}

// =====================================================
// COMPONENTE
// =====================================================

export default function AIInsightPanel({
  type,
  loading,
  error,
  summary,
  healthScore,
  accountStatus,
  insights,
  actions,
  recommendations,
  trends,
  executiveSummary,
  generatedAt,
  onRefresh,
  onAskQuestion,
}: AIInsightPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState('');

  const handleAsk = async () => {
    if (!question.trim() || !onAskQuestion) return;
    setChatLoading(true);
    setChatResponse('');
    onAskQuestion(question);
    setQuestion('');
    setChatLoading(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-[#D4AF37] animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-[#D4AF37]"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-white/40 mt-3">Analisando dados com IA...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          {onRefresh && (
            <button onClick={onRefresh} className="ml-auto text-xs text-white/40 hover:text-white flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              AI Performance Engine
              {accountStatus && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBg(accountStatus)} ${getStatusColor(accountStatus)}`}>
                  {accountStatus}
                </span>
              )}
            </h3>
            <p className="text-xs text-white/40">
              {generatedAt ? `Atualizado ${new Date(generatedAt).toLocaleString('pt-BR')}` : 'Análise inteligente'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Score */}
          {healthScore !== undefined && (
            <div className="text-center">
              <p className={`text-lg font-bold ${getHealthColor(healthScore)}`}>{healthScore}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Score</p>
            </div>
          )}

          {/* Trend */}
          {trends && (
            <div className="flex items-center gap-1">
              {trends.direction === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
              {trends.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
              {trends.direction === 'stable' && <Minus className="h-4 w-4 text-white/40" />}
            </div>
          )}

          {onRefresh && (
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              className="h-7 w-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-white/40" />
            </button>
          )}

          {isExpanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Executive Summary */}
              {executiveSummary && (
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-sm text-white/80 leading-relaxed">{executiveSummary.verdict}</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase">Eficiência</p>
                      <p className="text-sm font-semibold text-white">{executiveSummary.spendEfficiency}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase">Maior Vitória</p>
                      <p className="text-xs text-emerald-400 truncate">{executiveSummary.biggestWin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase">Maior Ameaça</p>
                      <p className="text-xs text-red-400 truncate">{executiveSummary.biggestThreat}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {summary && !executiveSummary && (
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-sm text-white/70 leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Insights */}
              {insights && insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Insights</p>
                  {insights.slice(0, 5).map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{insight.title}</p>
                        <p className="text-xs text-white/50 mt-0.5">{insight.description}</p>
                      </div>
                      {insight.impact && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          insight.impact === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                          insight.impact === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {insight.impact}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {actions && actions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-semibold flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Ações Imediatas
                  </p>
                  {actions.slice(0, 4).map((action, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3">
                      <span className="h-5 w-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[10px] font-bold text-[#D4AF37] flex-shrink-0">
                        {action.prioridade}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{action.acao}</p>
                        <p className="text-xs text-white/40 mt-0.5">{action.motivo}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getUrgencyColor(action.urgencia)}`}>
                        {action.urgencia}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {recommendations && recommendations.length > 0 && !actions?.length && (
                <div className="space-y-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Recomendações</p>
                  <ul className="space-y-1.5">
                    {recommendations.slice(0, 5).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="text-[#D4AF37] font-bold text-xs mt-0.5">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chat */}
              {onAskQuestion && (
                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-white/30 flex-shrink-0" />
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                      placeholder="Pergunte algo sobre seus dados..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                    />
                    <button
                      onClick={handleAsk}
                      disabled={!question.trim() || chatLoading}
                      className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <Send className="h-3.5 w-3.5 text-[#D4AF37]" />
                    </button>
                  </div>
                  {chatResponse && (
                    <div className="mt-3 rounded-lg bg-white/[0.02] p-3">
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{chatResponse}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
