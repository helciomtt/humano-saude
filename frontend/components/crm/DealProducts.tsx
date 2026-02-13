'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Check, X, Package, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type {
  CrmDealProduct, CrmDealProductInsert, CrmProduct,
} from '@/lib/types/crm';
import {
  getDealProducts, addDealProduct, updateDealProduct,
  removeDealProduct, listProducts,
} from '@/app/actions/crm-detail';

// ========================================
// TYPES
// ========================================

type DealProductRow = CrmDealProduct & { product_nome?: string };

// ========================================
// DEAL PRODUCTS COMPONENT
// ========================================

export default function DealProducts({
  dealId,
  initialProducts,
  onTotalChange,
}: {
  dealId: string;
  initialProducts?: DealProductRow[];
  onTotalChange?: (total: number) => void;
}) {
  const [products, setProducts] = useState<DealProductRow[]>(initialProducts ?? []);
  const [catalog, setCatalog] = useState<CrmProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Fetch products if not provided via initialProducts ──
  useEffect(() => {
    if (!initialProducts) {
      getDealProducts(dealId).then((res) => {
        if (res.success && res.data) setProducts(res.data);
      });
    }
  }, [dealId, initialProducts]);

  // ── Totals ──
  const subtotal = products.reduce((s, p) => s + p.preco_unitario * p.quantidade, 0);
  const totalDesconto = products.reduce((s, p) => {
    return s + p.preco_unitario * p.quantidade * (p.desconto_pct / 100);
  }, 0);
  const total = products.reduce((s, p) => s + p.total, 0);

  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  // ── Load catalog when adding ──
  const handleStartAdd = useCallback(async () => {
    if (catalog.length === 0) {
      const res = await listProducts();
      if (res.success && res.data) setCatalog(res.data);
    }
    setIsAdding(true);
  }, [catalog.length]);

  // ── Add product from catalog ──
  const handleAddFromCatalog = useCallback(async (product: CrmProduct) => {
    setLoading(true);
    const input: CrmDealProductInsert = {
      deal_id: dealId,
      product_id: product.id,
      quantidade: 1,
      preco_unitario: product.preco,
      desconto_pct: 0,
      total: product.preco,
    };
    const res = await addDealProduct(input);
    if (res.success && res.data) {
      setProducts((prev) => [...prev, { ...res.data!, product_nome: product.nome }]);
    }
    setIsAdding(false);
    setLoading(false);
  }, [dealId]);

  // ── Update inline ──
  const handleUpdate = useCallback(async (
    id: string,
    field: 'quantidade' | 'preco_unitario' | 'desconto_pct',
    value: number,
  ) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;

    const updated = { ...p, [field]: value };
    const newTotal = updated.preco_unitario * updated.quantidade * (1 - updated.desconto_pct / 100);
    updated.total = Math.round(newTotal * 100) / 100;

    // Optimistic
    setProducts((prev) => prev.map((x) => (x.id === id ? updated : x)));

    await updateDealProduct(id, {
      [field]: value,
      total: updated.total,
    });
    setEditingId(null);
  }, [products]);

  // ── Remove ──
  const handleRemove = useCallback(async (id: string) => {
    setProducts((prev) => prev.filter((x) => x.id !== id));
    await removeDealProduct(id);
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Produtos & Serviços
          </h3>
          <span className="text-[10px] text-white/30">({products.length})</span>
        </div>
        <button
          onClick={handleStartAdd}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
                     bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </button>
      </div>

      {/* Product selector */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-[#D4AF37]/10 bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/60">Selecione um produto:</span>
                <button onClick={() => setIsAdding(false)}>
                  <X className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
                </button>
              </div>
              {catalog.length === 0 ? (
                <p className="text-[10px] text-white/20 py-3 text-center">Nenhum produto no catálogo</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                  {catalog
                    .filter((c) => !products.some((p) => p.product_id === c.id))
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleAddFromCatalog(c)}
                        disabled={loading}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded-md text-xs transition-colors',
                          'hover:bg-white/[0.05] text-white/80 hover:text-white',
                          loading && 'opacity-50 pointer-events-none',
                        )}
                      >
                        <span className="truncate">{c.nome}</span>
                        <span className="text-[#D4AF37] font-medium flex-shrink-0 ml-2">
                          {formatCurrency(c.preco)}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products list */}
      {products.length > 0 ? (
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_60px_80px_50px_80px_28px] gap-1 px-3 py-2 bg-white/[0.03] text-[10px] text-white/30 font-medium uppercase tracking-wider">
            <span>Produto</span>
            <span className="text-right">Qtd</span>
            <span className="text-right">Preço</span>
            <span className="text-right">Desc.</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {products.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_60px_80px_50px_80px_28px] gap-1 px-3 py-2.5 items-center
                           hover:bg-white/[0.02] group transition-colors"
              >
                {/* Nome */}
                <span className="text-xs text-white truncate">
                  {p.product_nome ?? 'Produto'}
                </span>

                {/* Quantidade */}
                {editingId === p.id ? (
                  <input
                    type="number"
                    min={1}
                    defaultValue={p.quantidade}
                    onBlur={(e) => handleUpdate(p.id, 'quantidade', parseInt(e.target.value) || 1)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdate(p.id, 'quantidade', parseInt((e.target as HTMLInputElement).value) || 1);
                      }
                    }}
                    className="w-full text-right text-xs bg-white/[0.05] border border-[#D4AF37]/20
                               rounded px-1 py-0.5 text-white outline-none focus:border-[#D4AF37]/50"
                    autoFocus
                  />
                ) : (
                  <span className="text-xs text-white/70 text-right">{p.quantidade}</span>
                )}

                {/* Preço unitário */}
                <span className="text-xs text-white/50 text-right">
                  {formatCurrency(p.preco_unitario)}
                </span>

                {/* Desconto */}
                <span className="text-xs text-white/40 text-right">
                  {p.desconto_pct > 0 ? `${p.desconto_pct}%` : '—'}
                </span>

                {/* Total */}
                <span className="text-xs text-[#D4AF37] font-medium text-right">
                  {formatCurrency(p.total)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === p.id ? (
                    <button onClick={() => setEditingId(null)}>
                      <Check className="h-3 w-3 text-green-400" />
                    </button>
                  ) : (
                    <button onClick={() => setEditingId(p.id)}>
                      <Edit2 className="h-3 w-3 text-white/30 hover:text-white/60" />
                    </button>
                  )}
                  <button onClick={() => handleRemove(p.id)}>
                    <Trash2 className="h-3 w-3 text-red-400/50 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-2.5 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/30">Subtotal</span>
              <span className="text-white/60">{formatCurrency(subtotal)}</span>
            </div>
            {totalDesconto > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Descontos</span>
                <span className="text-red-400/60">-{formatCurrency(totalDesconto)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1.5 border-t border-white/[0.04]">
              <span className="text-white/50 font-medium">Total</span>
              <span className="text-[#D4AF37] font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <Package className="h-6 w-6 text-white/10 mx-auto mb-2" />
          <p className="text-[11px] text-white/20">Nenhum produto adicionado</p>
        </div>
      )}
    </div>
  );
}
