'use client';

// =====================================================
// ActionCenter — Centro de Ações do Auditor IA
// Recomendações do ads_recommendations table
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  AlertTriangle,
  TrendingUp,
  Info,
  Bell,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import type { ActionCenterRecommendation } from '@/lib/types/analytics';

const PRIORITY_CONFIG = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Crítico' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Alto' },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Médio' },
  LOW: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Baixo' },
};

const TYPE_ICONS = {
  ALERT: AlertTriangle,
  OPPORTUNITY: TrendingUp,
  WARNING: Bell,
  INFO: Info,
};

interface ActionCenterProps {
  className?: string;
}

export default function ActionCenter({ className }: ActionCenterProps) {
  const [recommendations, setRecommendations] = useState<ActionCenterRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/smart-analysis?recommendations=true');
      const json = await res.json();
      if (json.success && json.data?.recommendations) {
        setRecommendations(json.data.recommendations);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const filtered = filterPriority
    ? recommendations.filter(r => r.priority === filterPriority)
    : recommendations;

  const stats = {
    total: recommendations.length,
    critical: recommendations.filter(r => r.priority === 'CRITICAL').length,
    high: recommendations.filter(r => r.priority === 'HIGH').length,
    medium: recommendations.filter(r => r.priority === 'MEDIUM').length,
    low: recommendations.filter(r => r.priority === 'LOW').length,
  };

  const handleAction = async (id: string, action: 'apply' | 'dismiss') => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  if (loading) {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#0a0a0a] p-5 ${className || ''}`}>
        <div className="h-6 w-40 animate-pulse rounded bg-white/5 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5 mb-2" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-white/10 bg-[#0a0a0a] p-5 ${className || ''}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white">Action Center</h3>
          <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-medium text-[#D4AF37]">
            {stats.total} ações
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded p-1 text-gray-500 transition-colors hover:text-white"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={fetchRecommendations}
            className="rounded p-1 text-gray-500 transition-colors hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats badges */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {stats.critical > 0 && (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
            🔴 {stats.critical} críticos
          </span>
        )}
        {stats.high > 0 && (
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-400">
            🟠 {stats.high} altos
          </span>
        )}
        {stats.medium > 0 && (
          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
            🟡 {stats.medium} médios
          </span>
        )}
        {stats.low > 0 && (
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
            🔵 {stats.low} baixos
          </span>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-3 flex gap-1.5">
          <button
            onClick={() => setFilterPriority(null)}
            className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
              !filterPriority ? 'bg-[#D4AF37] text-black' : 'border border-white/10 text-gray-400'
            }`}
          >
            Todos
          </button>
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                filterPriority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color}` : 'border border-white/10 text-gray-400'
              }`}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      )}

      {/* Recommendations list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filtered.map((rec) => {
            const pConfig = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.LOW;
            const TypeIcon = TYPE_ICONS[rec.type] || Info;
            const isExpanded = expanded === rec.id;

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-lg border ${pConfig.border} ${pConfig.bg} p-3`}
              >
                <div
                  className="flex items-start gap-2 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <TypeIcon className={`h-4 w-4 mt-0.5 shrink-0 ${pConfig.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white">{rec.title}</p>
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${pConfig.bg} ${pConfig.color}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{rec.campaign_name}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 pt-2 border-t border-white/5"
                  >
                    <p className="text-xs text-gray-400 mb-2">{rec.message}</p>

                    {rec.metrics_snapshot && (
                      <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                        <div>
                          <p className="text-[9px] text-gray-500">Gasto</p>
                          <p className="text-[10px] font-bold text-white">
                            R$ {rec.metrics_snapshot.spend?.toFixed(0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500">ROAS</p>
                          <p className="text-[10px] font-bold text-white">
                            {rec.metrics_snapshot.roas?.toFixed(2)}x
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500">CPA</p>
                          <p className="text-[10px] font-bold text-white">
                            R$ {rec.metrics_snapshot.cpa?.toFixed(0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500">CTR</p>
                          <p className="text-[10px] font-bold text-white">
                            {rec.metrics_snapshot.ctr?.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(rec.id, 'apply'); }}
                        className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      >
                        <CheckCircle className="h-3 w-3" /> Aplicar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(rec.id, 'dismiss'); }}
                        className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <XCircle className="h-3 w-3" /> Dispensar
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-600">
            {filterPriority ? 'Nenhuma recomendação com esta prioridade' : 'Sem recomendações pendentes ✅'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
