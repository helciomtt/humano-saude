'use client';

// =====================================================
// FraudAnalysisCard — Vendas em análise de fraude
// Auto-refresh: 30 segundos
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import type { FraudItem } from '@/lib/types/analytics';

interface FraudAnalysisCardProps {
  initialData?: FraudItem[];
  loading?: boolean;
}

export default function FraudAnalysisCard({ initialData, loading: extLoading }: FraudAnalysisCardProps) {
  const [items, setItems] = useState<FraudItem[]>(initialData || []);
  const [loading, setLoading] = useState(extLoading || false);

  const fetchFraud = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard?fraud=true');
      const json = await res.json();
      if (json.success && json.data?.fraudItems) {
        setItems(json.data.fraudItems);
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (!initialData || initialData.length === 0) {
      fetchFraud();
    }
    const interval = setInterval(fetchFraud, 30000);
    return () => clearInterval(interval);
  }, [fetchFraud, initialData]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-white/5 bg-[#0a0a0a]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Análise de Fraude</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
            {items.length} em análise
          </span>
          <button
            onClick={fetchFraud}
            className="rounded p-1 text-gray-500 transition-colors hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-600">Nenhuma venda em análise de fraude ✅</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                item.hours_in_analysis > 12
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{item.customer_name}</p>
                <p className="text-[10px] text-gray-500">{item.gateway}</p>
              </div>
              <span className="text-xs font-bold text-white">
                R$ {item.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className={`text-[10px] font-medium ${
                  item.hours_in_analysis > 12 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {item.hours_in_analysis}h
                </span>
                {item.hours_in_analysis > 12 && (
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
