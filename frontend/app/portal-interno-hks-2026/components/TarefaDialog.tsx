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
import { createTarefa } from '@/app/actions/tarefas';
import { toast } from 'sonner';

interface TarefaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TarefaDialog({ open, onOpenChange, onSuccess }: TarefaDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      await createTarefa({
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        prioridade: form.prioridade,
      });
      setForm({ titulo: '', descricao: '', prioridade: 'media' });
      onOpenChange(false);
      toast.success('Tarefa criada com sucesso');
      onSuccess?.();
    } catch {
      toast.error('Erro ao criar tarefa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Nova Tarefa</DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie uma nova tarefa para a equipe
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="titulo" className="text-gray-300">Título *</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => update('titulo', e.target.value)}
              placeholder="Título da tarefa"
              className="bg-[#111] border-white/10 text-white"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prioridade" className="text-gray-300">Prioridade</Label>
            <select
              id="prioridade"
              value={form.prioridade}
              onChange={(e) => update('prioridade', e.target.value)}
              className="rounded-md border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
            >
              <option value="baixa">🟢 Baixa</option>
              <option value="media">🟡 Média</option>
              <option value="alta">🟠 Alta</option>
              <option value="urgente">🔴 Urgente</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => update('descricao', e.target.value)}
              placeholder="Detalhes da tarefa..."
              className="bg-[#111] border-white/10 text-white resize-none"
              rows={4}
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
            disabled={saving || !form.titulo.trim()}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Criar Tarefa'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
