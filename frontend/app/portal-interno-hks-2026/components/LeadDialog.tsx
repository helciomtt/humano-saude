'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveScannedLead } from '@/app/actions/leads';
import { toast } from 'sonner';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeadDialog({ open, onOpenChange, onSuccess }: LeadDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    operadora_interesse: '',
    valor_plano_atual: '',
    quantidade_vidas: '',
    observacoes: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.nome.trim() || !form.whatsapp.trim()) return;
    setSaving(true);
    try {
      await saveScannedLead({
        nome: form.nome,
        whatsapp: form.whatsapp,
        email: form.email || undefined,
        operadora_atual: form.operadora_interesse || undefined,
        valor_atual: form.valor_plano_atual ? Number(form.valor_plano_atual) : undefined,
        idades: form.quantidade_vidas ? Array.from({ length: Number(form.quantidade_vidas) }, () => 30) : [],
        observacoes: form.observacoes || undefined,
      });
      setForm({ nome: '', whatsapp: '', email: '', operadora_interesse: '', valor_plano_atual: '', quantidade_vidas: '', observacoes: '' });
      onOpenChange(false);
      toast.success('Lead criado com sucesso');
      onSuccess?.();
    } catch {
      toast.error('Erro ao criar lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Novo Lead</DialogTitle>
          <DialogDescription className="text-gray-400">
            Cadastre um novo lead manualmente
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome" className="text-gray-300">Nome *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => update('nome', e.target.value)}
              placeholder="Nome completo"
              className="bg-[#111] border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-[#111] border-white/10 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="email@exemplo.com"
                className="bg-[#111] border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="operadora" className="text-gray-300">Operadora Atual</Label>
              <Input
                id="operadora"
                value={form.operadora_interesse}
                onChange={(e) => update('operadora_interesse', e.target.value)}
                placeholder="Ex: Amil, Bradesco..."
                className="bg-[#111] border-white/10 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valor" className="text-gray-300">Valor Atual (R$)</Label>
              <Input
                id="valor"
                type="number"
                value={form.valor_plano_atual}
                onChange={(e) => update('valor_plano_atual', e.target.value)}
                placeholder="0,00"
                className="bg-[#111] border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vidas" className="text-gray-300">Quantidade de Vidas</Label>
            <Input
              id="vidas"
              type="number"
              value={form.quantidade_vidas}
              onChange={(e) => update('quantidade_vidas', e.target.value)}
              placeholder="1"
              className="bg-[#111] border-white/10 text-white"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="obs" className="text-gray-300">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => update('observacoes', e.target.value)}
              placeholder="Informações adicionais..."
              className="bg-[#111] border-white/10 text-white resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.nome.trim() || !form.whatsapp.trim()}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Lead'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
