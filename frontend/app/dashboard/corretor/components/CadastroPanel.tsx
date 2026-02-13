'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle,
  Shield,
  Building2,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  getCorretorCompleto,
  updateCorretorPerfil,
  getCorretorEnderecos,
  upsertCorretorEndereco,
  deleteCorretorEndereco,
  getCorretorTelefones,
  upsertCorretorTelefone,
  deleteCorretorTelefone,
} from '@/app/actions/corretor-financeiro';
import type { CorretorEndereco, CorretorTelefone } from '@/app/actions/corretor-financeiro';

// =============================================
// TYPES
// =============================================

type TabId = 'enderecos' | 'telefones' | 'dados_bancarios';

// =============================================
// CADASTRO PANEL
// =============================================

export default function CadastroPanel({ corretorId }: { corretorId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('enderecos');

  // Dados do corretor
  const [corretor, setCorretor] = useState<Record<string, unknown> | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  // Dados relacionados
  const [enderecos, setEnderecos] = useState<CorretorEndereco[]>([]);
  const [telefones, setTelefones] = useState<CorretorTelefone[]>([]);
  const [dadosBancarios, setDadosBancarios] = useState<Record<string, unknown> | null>(null);

  // Edição inline
  const [editingEndereco, setEditingEndereco] = useState<Partial<CorretorEndereco> | null>(null);
  const [editingTelefone, setEditingTelefone] = useState<Partial<CorretorTelefone> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getCorretorCompleto(corretorId);
    if (result.success && result.data) {
      setCorretor(result.data.corretor);
      setNome(String(result.data.corretor.nome ?? ''));
      setEmail(String(result.data.corretor.email ?? ''));
      setEnderecos(result.data.enderecos);
      setTelefones(result.data.telefones);
      setDadosBancarios(result.data.dados_bancarios);
    }
    setLoading(false);
  }, [corretorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSavePerfil = async () => {
    setSaving(true);
    const result = await updateCorretorPerfil(corretorId, { nome, email });
    if (result.success) {
      toast.success('Perfil atualizado!');
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleSaveEndereco = async () => {
    if (!editingEndereco) return;
    setSaving(true);
    const result = await upsertCorretorEndereco(corretorId, editingEndereco);
    if (result.success) {
      toast.success('Endereço salvo!');
      setEditingEndereco(null);
      // Refresh
      const res = await getCorretorEnderecos(corretorId);
      if (res.success) setEnderecos(res.data ?? []);
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleDeleteEndereco = async (id: string) => {
    const result = await deleteCorretorEndereco(id);
    if (result.success) {
      toast.success('Endereço removido');
      setEnderecos((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleSaveTelefone = async () => {
    if (!editingTelefone || !editingTelefone.numero) return;
    setSaving(true);
    const result = await upsertCorretorTelefone(corretorId, editingTelefone);
    if (result.success) {
      toast.success('Telefone salvo!');
      setEditingTelefone(null);
      const res = await getCorretorTelefones(corretorId);
      if (res.success) setTelefones(res.data ?? []);
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleDeleteTelefone = async (id: string) => {
    const result = await deleteCorretorTelefone(id);
    if (result.success) {
      toast.success('Telefone removido');
      setTelefones((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Busca CEP
  const buscarCep = async (cep: string) => {
    if (cep.length < 8) return;
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEditingEndereco((prev) => ({
          ...prev,
          cep: cleanCep,
          logradouro: data.logradouro || prev?.logradouro,
          bairro: data.bairro || prev?.bairro,
          cidade: data.localidade || prev?.cidade,
          uf: data.uf || prev?.uf,
        }));
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'enderecos', label: 'Endereços', icon: MapPin },
    { id: 'telefones', label: 'Telefones', icon: Phone },
    { id: 'dados_bancarios', label: 'Dados bancários', icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="h-5 w-5 text-[#D4AF37]" />
          Cadastro
        </h2>
        <p className="text-sm text-white/40 mt-1">Seus dados cadastrais</p>
      </div>

      {/* Card do perfil */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar / Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center bg-white/[0.02] overflow-hidden">
              {corretor?.foto_url ? (
                <Image
                  src={String(corretor.foto_url)}
                  alt="Foto"
                  width={112}
                  height={112}
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : corretor?.logo_personalizada_url ? (
                <Image
                  src={String(corretor.logo_personalizada_url)}
                  alt="Logo"
                  width={112}
                  height={112}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <User className="h-10 w-10 text-white/20" />
              )}
            </div>
            <button className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              Alterar logotipo
            </button>
          </div>

          {/* Campos */}
          <div className="flex-1 space-y-4">
            <p className="text-lg font-bold text-white uppercase mb-4">
              {String(corretor?.nome ?? '')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Nome*</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                />
              </div>
            </div>

            {/* Info readonly */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-white/30 uppercase">CPF</p>
                <p className="text-xs text-white/60 mt-0.5">{String(corretor?.cpf ?? '—')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase">SUSEP</p>
                <p className="text-xs text-white/60 mt-0.5">{String(corretor?.susep ?? '—')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase">Role</p>
                <p className="text-xs text-white/60 mt-0.5 capitalize">{String(corretor?.role ?? '—')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase">Status</p>
                <p className="text-xs mt-0.5">
                  {corretor?.ativo ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Ativo
                    </span>
                  ) : (
                    <span className="text-red-400">Inativo</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePerfil}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Confirmar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="flex border-b border-white/[0.08]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2',
                  activeTab === tab.id
                    ? 'text-[#D4AF37] border-[#D4AF37]'
                    : 'text-white/40 border-transparent hover:text-white/60',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* ─── ENDEREÇOS ─── */}
          {activeTab === 'enderecos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/40">Endereços cadastrados</p>
                <button
                  onClick={() => setEditingEndereco({})}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/20 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Incluir
                </button>
              </div>

              {/* Tabela endereços */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-white/40 uppercase w-10"></th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">Cep</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">Logradouro</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase hidden md:table-cell">Nº</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase hidden md:table-cell">Complemento</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase hidden lg:table-cell">Bairro</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">Cidade</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase w-12">UF</th>
                      <th className="text-center px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase w-16">Padrão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enderecos.length === 0 && !editingEndereco && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-white/30 text-sm">
                          Nenhum endereço cadastrado
                        </td>
                      </tr>
                    )}
                    {enderecos.map((end) => (
                      <tr key={end.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingEndereco(end)}
                              className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-[#D4AF37] transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteEndereco(end.id)}
                              className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-white/60">{end.cep || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-white">{end.logradouro || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-white/60 hidden md:table-cell">{end.numero || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-white/60 hidden md:table-cell">{end.complemento || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-white/60 hidden lg:table-cell">{end.bairro || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-white">{end.cidade || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-white/60">{end.uf || '—'}</td>
                        <td className="px-3 py-2.5 text-center">
                          {end.padrao && <CheckCircle className="h-3.5 w-3.5 text-green-400 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Form de edição/criação de endereço */}
              <AnimatePresence>
                {editingEndereco && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">
                          {editingEndereco.id ? 'Editar endereço' : 'Novo endereço'}
                        </p>
                        <button onClick={() => setEditingEndereco(null)} className="text-white/30 hover:text-white">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">CEP</label>
                          <input
                            type="text"
                            value={editingEndereco.cep ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEditingEndereco((p) => ({ ...p, cep: v }));
                              if (v.replace(/\D/g, '').length === 8) buscarCep(v);
                            }}
                            placeholder="00000-000"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/40 mb-1 block">Logradouro</label>
                          <input
                            type="text"
                            value={editingEndereco.logradouro ?? ''}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, logradouro: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Nº</label>
                          <input
                            type="text"
                            value={editingEndereco.numero ?? ''}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, numero: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Complemento</label>
                          <input
                            type="text"
                            value={editingEndereco.complemento ?? ''}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, complemento: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Bairro</label>
                          <input
                            type="text"
                            value={editingEndereco.bairro ?? ''}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, bairro: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Cidade</label>
                          <input
                            type="text"
                            value={editingEndereco.cidade ?? ''}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, cidade: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">UF</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={editingEndereco.uf ?? ''}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, uf: e.target.value.toUpperCase() }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingEndereco.padrao ?? false}
                            onChange={(e) => setEditingEndereco((p) => ({ ...p, padrao: e.target.checked }))}
                            className="accent-[#D4AF37]"
                          />
                          Endereço padrão
                        </label>

                        <div className="flex-1" />

                        <button
                          onClick={() => setEditingEndereco(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEndereco}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#F6E05E] transition-all disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Salvar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ─── TELEFONES ─── */}
          {activeTab === 'telefones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/40">Telefones cadastrados</p>
                <button
                  onClick={() => setEditingTelefone({})}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/20 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Incluir
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-white/40 uppercase w-10"></th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">Tipo</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">Número</th>
                      <th className="text-center px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">WhatsApp</th>
                      <th className="text-center px-3 py-2 text-[11px] font-semibold text-[#D4AF37] uppercase">Padrão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telefones.length === 0 && !editingTelefone && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-white/30 text-sm">
                          Nenhum telefone cadastrado
                        </td>
                      </tr>
                    )}
                    {telefones.map((tel) => (
                      <tr key={tel.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingTelefone(tel)}
                              className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-[#D4AF37] transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTelefone(tel.id)}
                              className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-white/60 capitalize">{tel.tipo}</td>
                        <td className="px-3 py-2.5 text-xs text-white">{tel.numero}</td>
                        <td className="px-3 py-2.5 text-center">
                          {tel.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-green-400 mx-auto" />}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {tel.padrao && <CheckCircle className="h-3.5 w-3.5 text-green-400 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Form telefone */}
              <AnimatePresence>
                {editingTelefone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-white">
                        {editingTelefone.id ? 'Editar telefone' : 'Novo telefone'}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Tipo</label>
                          <select
                            value={editingTelefone.tipo ?? 'celular'}
                            onChange={(e) => setEditingTelefone((p) => ({ ...p, tipo: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                          >
                            <option value="celular">Celular</option>
                            <option value="fixo">Fixo</option>
                            <option value="comercial">Comercial</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Número</label>
                          <input
                            type="text"
                            value={editingTelefone.numero ?? ''}
                            onChange={(e) => setEditingTelefone((p) => ({ ...p, numero: e.target.value }))}
                            placeholder="(21) 99999-9999"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div className="flex items-end gap-4">
                          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer pb-2">
                            <input
                              type="checkbox"
                              checked={editingTelefone.whatsapp ?? false}
                              onChange={(e) => setEditingTelefone((p) => ({ ...p, whatsapp: e.target.checked }))}
                              className="accent-green-500"
                            />
                            WhatsApp
                          </label>
                          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer pb-2">
                            <input
                              type="checkbox"
                              checked={editingTelefone.padrao ?? false}
                              onChange={(e) => setEditingTelefone((p) => ({ ...p, padrao: e.target.checked }))}
                              className="accent-[#D4AF37]"
                            />
                            Padrão
                          </label>
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => setEditingTelefone(null)}
                            className="px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveTelefone}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#F6E05E] transition-all disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ─── DADOS BANCÁRIOS ─── */}
          {activeTab === 'dados_bancarios' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">Conta bancária ativa para recebimento de comissões</p>

              {dadosBancarios ? (
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">Banco</p>
                      <p className="text-sm text-white font-medium">
                        {String(dadosBancarios.banco_codigo ?? '')} — {String(dadosBancarios.banco_nome ?? '')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">Agência</p>
                      <p className="text-sm text-white">{String(dadosBancarios.agencia ?? '—')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">Conta</p>
                      <p className="text-sm text-white">{String(dadosBancarios.conta ?? '—')}-{String(dadosBancarios.digito ?? '')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">Tipo</p>
                      <p className="text-sm text-white capitalize">{String(dadosBancarios.tipo_conta ?? '—')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">Titular</p>
                      <p className="text-sm text-white">{String(dadosBancarios.titular_nome ?? '—')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">CPF/CNPJ Titular</p>
                      <p className="text-sm text-white">{String(dadosBancarios.titular_cpf_cnpj ?? '—')}</p>
                    </div>
                    {dadosBancarios.pix_chave ? (
                      <div className="col-span-2">
                        <p className="text-[10px] text-white/30 uppercase mb-1">Chave PIX</p>
                        <p className="text-sm text-[#D4AF37]">{String(dadosBancarios.pix_chave)}</p>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-[10px] text-white/20 mt-4">
                    Para alterar dados bancários, acesse Meu Perfil → Conta Bancária
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center text-white/30">
                  <Landmark className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum dado bancário cadastrado</p>
                  <p className="text-xs mt-1">Complete seu onboarding para adicionar dados bancários</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
