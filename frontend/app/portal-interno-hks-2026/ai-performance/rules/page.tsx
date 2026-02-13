'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Plus, Trash2, Play, Pause, RefreshCw, Bell,
  AlertTriangle, CheckCircle, Clock, Zap, Settings, BarChart3,
  TrendingUp, TrendingDown, Target, DollarSign
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  campaignsAnalyzed: number;
  alertsGenerated: number;
  opportunitiesFound: number;
  durationMs: number;
}

interface Recommendation {
  campaignName: string;
  type: 'ALERT' | 'OPPORTUNITY' | 'WARNING' | 'INFO';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
}

interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  LOW: 'bg-blue-500/20 text-blue-400',
};

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  ALERT: AlertTriangle,
  OPPORTUNITY: TrendingUp,
  WARNING: Bell,
  INFO: BarChart3,
};

export default function RulesPage() {
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const rules: Rule[] = [
    { id: '1', name: 'Sangria de Budget', condition: 'spend ≥ R$50 AND purchases = 0 AND hours ≥ 6', action: 'PAUSAR campanha + notificar', enabled: true, triggerCount: 12 },
    { id: '2', name: 'CPA Acima da Meta', condition: 'CPA ≥ 2× meta_cpa_target', action: 'Reduzir budget 30%', enabled: true, triggerCount: 8 },
    { id: '3', name: 'ROAS Abaixo do Mínimo', condition: 'ROAS < 1.0 AND spend > R$30', action: 'Alerta urgente + revisar', enabled: true, triggerCount: 5 },
    { id: '4', name: 'Oportunidade de Escala', condition: 'ROAS ≥ 3× AND CPA ≤ 50% meta AND spend < 70% budget', action: 'Escalar budget +20%', enabled: true, triggerCount: 3 },
    { id: '5', name: 'Fadiga de Audiência', condition: 'frequency ≥ 3.0 AND CTR declining 3 days', action: 'Alertar troca de criativos', enabled: true, triggerCount: 7 },
    { id: '6', name: 'CTR Muito Baixo', condition: 'CTR < 0.5% AND impressions > 1000', action: 'Pausar anúncio específico', enabled: false, triggerCount: 0 },
  ];

  const fetchAuditData = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/smart-analysis?period=last_7d');
      const json = await res.json();
      if (json.success && json.data?.insights) {
        const recs: Recommendation[] = json.data.insights.slice(0, 10).map((ins: { type: string; title: string; description: string }, i: number) => ({
          campaignName: 'Análise Geral',
          type: ins.type === 'danger' ? 'ALERT' : ins.type === 'warning' ? 'WARNING' : ins.type === 'success' ? 'OPPORTUNITY' : 'INFO',
          priority: ins.type === 'danger' ? 'CRITICAL' : ins.type === 'warning' ? 'HIGH' : 'MEDIUM',
          title: ins.title,
          message: ins.description,
        }));
        setRecommendations(recs);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const runManualAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await fetch('/api/cron/audit-campaigns');
      const json = await res.json();
      if (json.success) {
        setAuditLogs(prev => [{
          id: `log-${Date.now()}`,
          timestamp: json.data.timestamp,
          campaignsAnalyzed: json.data.campaignsAnalyzed || 0,
          alertsGenerated: json.data.alertsGenerated || 0,
          opportunitiesFound: json.data.opportunitiesFound || 0,
          durationMs: json.data.durationMs || 0,
        }, ...prev]);
        await fetchAuditData();
      }
    } catch { /* silent */ }
    setRunningAudit(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            <ShieldAlert className="h-9 w-9" />
            REGRAS & ALERTAS
          </h1>
          <p className="mt-2 text-gray-400">Automação Camada 5 — Ads Auditor com regras e cron a cada 30min</p>
        </div>
        <button
          onClick={runManualAudit}
          disabled={runningAudit}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#bf953f] disabled:opacity-50"
        >
          {runningAudit ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {runningAudit ? 'Auditando...' : 'Executar Auditoria'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Rules Grid */}
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a]">
            <div className="border-b border-[#D4AF37]/20 p-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                <Settings className="h-4 w-4" /> Regras Configuradas
              </h2>
              <span className="text-xs text-gray-500">{rules.filter(r => r.enabled).length} de {rules.length} ativas</span>
            </div>
            <div className="divide-y divide-white/5">
              {rules.map(rule => (
                <div key={rule.id} className="p-4 hover:bg-[#151515] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${rule.enabled ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{rule.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="text-[#D4AF37]">SE</span> {rule.condition} <span className="text-[#D4AF37]">→</span> {rule.action}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-600">{rule.triggerCount}× disparada</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Recommendations / Alerts */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#D4AF37]" /> Alertas Ativos
              </h2>
            </div>
            {recommendations.length === 0 ? (
              <div className="p-12 text-center text-gray-600 text-sm">
                <CheckCircle className="h-8 w-8 text-emerald-400/30 mx-auto mb-3" />
                Nenhum alerta ativo. Suas campanhas estão dentro dos parâmetros.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recommendations.map((rec, i) => {
                  const Icon = TYPE_ICONS[rec.type] || Bell;
                  return (
                    <div key={i} className="p-4 hover:bg-[#151515] transition-colors">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-4 w-4 mt-0.5 ${
                          rec.type === 'ALERT' ? 'text-red-400' :
                          rec.type === 'WARNING' ? 'text-yellow-400' :
                          rec.type === 'OPPORTUNITY' ? 'text-emerald-400' : 'text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{rec.title}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[rec.priority]}`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{rec.message}</p>
                          <p className="text-[10px] text-gray-600 mt-1">Campanha: {rec.campaignName}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D4AF37]" /> Log de Auditorias
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="text-sm text-white">
                          {log.campaignsAnalyzed} campanhas analisadas
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(log.timestamp).toLocaleString('pt-BR')} • {log.durationMs}ms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-red-400">{log.alertsGenerated} alertas</span>
                      <span className="text-emerald-400">{log.opportunitiesFound} oportunidades</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cron Info */}
          <div className="rounded-lg border border-white/5 bg-[#0a0a0a] p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-[#D4AF37]" />
              <div>
                <p className="text-xs text-gray-400">
                  <span className="text-[#D4AF37] font-semibold">Cron Automático:</span> A Camada 5 (Ads Auditor) executa automaticamente a cada 30 minutos via Vercel Cron.
                  Resultados são salvos em <code className="text-gray-500">ads_recommendations</code> e notificações enviadas para alertas críticos.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
