'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  User, Camera, Trash2, Save, Loader2, Mail, Lock, LogOut, Eye, EyeOff,
  MapPin, Phone, Building2, Plus, Pencil, X, CreditCard, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCorretorEnderecos,
  upsertCorretorEndereco,
  deleteCorretorEndereco,
  getCorretorTelefones,
  upsertCorretorTelefone,
  deleteCorretorTelefone,
} from '@/app/actions/corretor-financeiro';
import type { CorretorEndereco, CorretorTelefone } from '@/app/actions/corretor-financeiro';

type ActiveSection = 'perfil' | 'enderecos' | 'telefones' | 'bancario' | 'seguranca';

interface EnderecoForm {
  id?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  padrao?: boolean;
}

interface TelefoneForm {
  id?: string;
  numero: string;
  tipo: string;
  whatsapp: boolean;
  padrao?: boolean;
}

interface DadosBancarios {
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  titular: string;
  pix_tipo: string;
  pix_chave: string;
}

const emptyEndereco: EnderecoForm = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
const emptyTelefone: TelefoneForm = { numero: '', tipo: 'celular', whatsapp: false };

export default function PerfilPage() {
  const [profile, setProfile] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('perfil');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Email edit
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Password
  const [showPassForm, setShowPassForm] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Enderecos
  const [enderecos, setEnderecos] = useState<CorretorEndereco[]>([]);
  const [editEndereco, setEditEndereco] = useState<EnderecoForm | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  // Telefones
  const [telefones, setTelefones] = useState<CorretorTelefone[]>([]);
  const [editTelefone, setEditTelefone] = useState<TelefoneForm | null>(null);

  // Bank
  const [dadosBancarios, setDadosBancarios] = useState<DadosBancarios>({
    banco: '', agencia: '', conta: '', tipo_conta: 'corrente', titular: '', pix_tipo: '', pix_chave: '',
  });
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ ...dadosBancarios, motivo: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/corretor/perfil');
      const data = await res.json();
      if (data.success) {
        setProfile(data.corretor);
        setNewEmail(data.corretor.email || '');
        if (data.corretor.dados_bancarios) {
          const db = typeof data.corretor.dados_bancarios === 'string'
            ? JSON.parse(data.corretor.dados_bancarios) : data.corretor.dados_bancarios;
          setDadosBancarios((p) => ({ ...p, ...db }));
          setBankForm((p) => ({ ...p, ...db }));
        }
      }
    } catch { /* ignore */ }
  }, []);

  const fetchEnderecos = useCallback(async (id?: string) => {
    const cid = id || profile.id;
    if (!cid) return;
    const res = await getCorretorEnderecos(cid);
    if (res.success) setEnderecos(res.data || []);
  }, [profile.id]);

  const fetchTelefones = useCallback(async (id?: string) => {
    const cid = id || profile.id;
    if (!cid) return;
    const res = await getCorretorTelefones(cid);
    if (res.success) setTelefones(res.data || []);
  }, [profile.id]);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchEnderecos(), fetchTelefones()]).finally(() => setLoading(false));
  }, [fetchProfile, fetchEnderecos, fetchTelefones]);

  // ── Photo ──
  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const res = await fetch('/api/corretor/foto', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setProfile((p) => ({ ...p, foto_url: data.foto_url }));
        toast.success('Foto atualizada!');
      } else toast.error(data.error || 'Erro');
    } catch { toast.error('Erro ao enviar foto'); }
    finally { setUploadingFoto(false); if (fotoInputRef.current) fotoInputRef.current.value = ''; }
  }

  async function handleFotoRemove() {
    setUploadingFoto(true);
    try {
      const res = await fetch('/api/corretor/foto', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setProfile((p) => ({ ...p, foto_url: null })); toast.success('Foto removida'); }
      else toast.error(data.error || 'Erro');
    } catch { toast.error('Erro ao remover foto'); }
    finally { setUploadingFoto(false); }
  }

  // ── Email ──
  async function handleSaveEmail() {
    setSaving(true);
    try {
      const res = await fetch('/api/corretor/perfil', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (data.success) { setProfile((p) => ({ ...p, email: newEmail })); setEditingEmail(false); toast.success('Email atualizado'); }
      else toast.error(data.error || 'Erro');
    } catch { toast.error('Erro'); }
    finally { setSaving(false); }
  }

  // ── Password ──
  async function handleChangePassword() {
    if (novaSenha !== confirmSenha) { toast.error('Senhas não conferem'); return; }
    if (novaSenha.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/corretor/perfil', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Senha alterada'); setShowPassForm(false); setSenhaAtual(''); setNovaSenha(''); setConfirmSenha(''); }
      else toast.error(data.error || 'Erro');
    } catch { toast.error('Erro'); }
    finally { setSaving(false); }
  }

  // ── CEP Lookup ──
  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro && editEndereco) {
        setEditEndereco({ ...editEndereco, logradouro: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || '' });
      }
    } catch { /* ignore */ }
    finally { setLoadingCep(false); }
  }

  // ── Endereço CRUD ──
  async function handleSaveEndereco() {
    if (!editEndereco || !profile.id) return;
    setSaving(true);
    const res = await upsertCorretorEndereco(profile.id, editEndereco);
    setSaving(false);
    if (res.success) { toast.success('Endereço salvo'); setEditEndereco(null); fetchEnderecos(); }
    else toast.error(res.error || 'Erro');
  }

  async function handleDeleteEndereco(id: string) {
    if (!confirm('Remover endereço?')) return;
    const res = await deleteCorretorEndereco(id);
    if (res.success) { toast.success('Removido'); fetchEnderecos(); }
    else toast.error(res.error || 'Erro');
  }

  // ── Telefone CRUD ──
  async function handleSaveTelefone() {
    if (!editTelefone || !profile.id) return;
    setSaving(true);
    const res = await upsertCorretorTelefone(profile.id, editTelefone);
    setSaving(false);
    if (res.success) { toast.success('Telefone salvo'); setEditTelefone(null); fetchTelefones(); }
    else toast.error(res.error || 'Erro');
  }

  async function handleDeleteTelefone(id: string) {
    if (!confirm('Remover telefone?')) return;
    const res = await deleteCorretorTelefone(id);
    if (res.success) { toast.success('Removido'); fetchTelefones(); }
    else toast.error(res.error || 'Erro');
  }

  // ── Bank Modal ──
  async function handleBankAlteration() {
    if (!bankForm.motivo.trim()) { toast.error('Informe o motivo'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/corretor/alteracao-bancaria', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (data.success) { toast.success('Solicitação enviada'); setShowBankModal(false); }
      else toast.error(data.error || 'Erro');
    } catch { toast.error('Erro'); }
    finally { setSaving(false); }
  }

  function handleLogout() {
    document.cookie = 'corretor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/dashboard/corretor/login';
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;

  const tabs: { key: ActiveSection; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Dados', icon: User },
    { key: 'enderecos', label: 'Endereços', icon: MapPin },
    { key: 'telefones', label: 'Telefones', icon: Phone },
    { key: 'bancario', label: 'Bancário', icon: CreditCard },
    { key: 'seguranca', label: 'Segurança', icon: Lock },
  ];

  const inputClass = 'w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none text-sm';
  const labelClass = 'block text-xs text-gray-400 mb-1';
  const btnGold = 'flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] transition-colors disabled:opacity-50';

  return (
    <div className="space-y-6">
      {/* Header + Avatar */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37] to-[#F6E05E] flex items-center justify-center">
              {profile.foto_url ? (
                <Image src={profile.foto_url} alt="Foto" width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-black" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              {uploadingFoto ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : (
                <>
                  <button onClick={() => fotoInputRef.current?.click()} className="rounded-full bg-[#D4AF37] p-1.5 text-black hover:bg-[#F6E05E]" title="Alterar foto"><Camera className="h-3 w-3" /></button>
                  {profile.foto_url && <button onClick={handleFotoRemove} className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-500" title="Remover"><Trash2 className="h-3 w-3" /></button>}
                </>
              )}
            </div>
            <input ref={fotoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFotoUpload} className="hidden" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#D4AF37]">{profile.nome || 'Corretor'}</h1>
            <p className="text-sm text-gray-400">{profile.email}</p>
            <p className="text-xs text-gray-500 mt-1">SUSEP: {profile.susep || '—'} • {profile.role || 'corretor'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveSection(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeSection === t.key ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══════ PERFIL TAB ═══════ */}
      {activeSection === 'perfil' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dados Pessoais</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Nome', value: profile.nome },
                { label: 'CPF', value: profile.cpf },
                { label: 'SUSEP', value: profile.susep },
                { label: 'Status', value: profile.status },
              ].map((f) => (
                <div key={f.label}>
                  <label className={labelClass}>{f.label}</label>
                  <div className="rounded-lg border border-white/5 bg-[#111] px-4 py-2 text-sm text-gray-300">{f.value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Mail className="h-5 w-5 text-[#D4AF37]" />Email</h2>
              {!editingEmail && <button onClick={() => setEditingEmail(true)} className="text-xs text-[#D4AF37] hover:underline">Editar</button>}
            </div>
            {editingEmail ? (
              <div className="flex gap-2">
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} />
                <button onClick={handleSaveEmail} disabled={saving} className={btnGold}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar</button>
                <button onClick={() => { setEditingEmail(false); setNewEmail(profile.email || ''); }} className="px-3 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              </div>
            ) : (
              <p className="text-sm text-gray-300">{profile.email || '—'}</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════ ENDEREÇOS TAB ═══════ */}
      {activeSection === 'enderecos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Endereços</h2>
            <button onClick={() => setEditEndereco({ ...emptyEndereco })} className={btnGold}><Plus className="h-4 w-4" />Adicionar</button>
          </div>
          {enderecos.length === 0 && !editEndereco && <p className="text-sm text-gray-500">Nenhum endereço cadastrado</p>}
          {enderecos.map((end) => (
            <div key={end.id} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
              <div className="flex justify-between items-start">
                <div>
                  {end.padrao && <span className="text-xs uppercase text-[#D4AF37] font-medium">Principal</span>}
                  <p className="text-sm text-white mt-1">{end.logradouro}, {end.numero} {end.complemento}</p>
                  <p className="text-xs text-gray-400">{end.bairro} — {end.cidade}/{end.uf} • CEP {end.cep}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditEndereco({ id: end.id, cep: end.cep || '', logradouro: end.logradouro || '', numero: end.numero || '', complemento: end.complemento || '', bairro: end.bairro || '', cidade: end.cidade || '', uf: end.uf || '', padrao: end.padrao })} className="text-gray-400 hover:text-[#D4AF37]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => end.id && handleDeleteEndereco(end.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {editEndereco && (
            <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0a0a0a] p-6 space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-white font-medium">{editEndereco.id ? 'Editar' : 'Novo'} Endereço</h3><button onClick={() => setEditEndereco(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button></div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelClass}>CEP</label>
                  <input value={editEndereco.cep} onChange={(e) => { setEditEndereco({ ...editEndereco, cep: e.target.value }); if (e.target.value.replace(/\D/g, '').length === 8) lookupCep(e.target.value); }} className={inputClass} placeholder="00000-000" />
                  {loadingCep && <span className="text-xs text-[#D4AF37]">Buscando...</span>}
                </div>
                <div className="md:col-span-2"><label className={labelClass}>Logradouro</label><input value={editEndereco.logradouro} onChange={(e) => setEditEndereco({ ...editEndereco, logradouro: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Número</label><input value={editEndereco.numero} onChange={(e) => setEditEndereco({ ...editEndereco, numero: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Complemento</label><input value={editEndereco.complemento} onChange={(e) => setEditEndereco({ ...editEndereco, complemento: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Bairro</label><input value={editEndereco.bairro} onChange={(e) => setEditEndereco({ ...editEndereco, bairro: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Cidade</label><input value={editEndereco.cidade} onChange={(e) => setEditEndereco({ ...editEndereco, cidade: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>UF</label><input value={editEndereco.uf} onChange={(e) => setEditEndereco({ ...editEndereco, uf: e.target.value })} className={inputClass} maxLength={2} /></div>
              </div>
              <button onClick={handleSaveEndereco} disabled={saving} className={btnGold}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar Endereço</button>
            </div>
          )}
        </div>
      )}

      {/* ═══════ TELEFONES TAB ═══════ */}
      {activeSection === 'telefones' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Telefones</h2>
            <button onClick={() => setEditTelefone({ ...emptyTelefone })} className={btnGold}><Plus className="h-4 w-4" />Adicionar</button>
          </div>
          {telefones.length === 0 && !editTelefone && <p className="text-sm text-gray-500">Nenhum telefone cadastrado</p>}
          {telefones.map((tel) => (
            <div key={tel.id} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase text-[#D4AF37] font-medium">{tel.tipo}</span>
                <p className="text-sm text-white mt-1">{tel.numero} {tel.whatsapp && <span className="text-xs text-green-400 ml-2">WhatsApp</span>}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditTelefone({ id: tel.id, numero: tel.numero, tipo: tel.tipo, whatsapp: tel.whatsapp, padrao: tel.padrao })} className="text-gray-400 hover:text-[#D4AF37]"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => tel.id && handleDeleteTelefone(tel.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {editTelefone && (
            <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0a0a0a] p-6 space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-white font-medium">{editTelefone.id ? 'Editar' : 'Novo'} Telefone</h3><button onClick={() => setEditTelefone(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button></div>
              <div className="grid gap-3 md:grid-cols-3">
                <div><label className={labelClass}>Número</label><input value={editTelefone.numero} onChange={(e) => setEditTelefone({ ...editTelefone, numero: e.target.value })} className={inputClass} placeholder="(11) 99999-9999" /></div>
                <div><label className={labelClass}>Tipo</label><select value={editTelefone.tipo} onChange={(e) => setEditTelefone({ ...editTelefone, tipo: e.target.value })} className={inputClass}><option value="celular">Celular</option><option value="fixo">Fixo</option><option value="comercial">Comercial</option></select></div>
                <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={editTelefone.whatsapp} onChange={(e) => setEditTelefone({ ...editTelefone, whatsapp: e.target.checked })} className="accent-[#D4AF37]" />WhatsApp</label></div>
              </div>
              <button onClick={handleSaveTelefone} disabled={saving} className={btnGold}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar Telefone</button>
            </div>
          )}
        </div>
      )}

      {/* ═══════ BANCÁRIO TAB ═══════ */}
      {activeSection === 'bancario' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Building2 className="h-5 w-5 text-[#D4AF37]" />Dados Bancários</h2>
              <button onClick={() => { setBankForm({ ...dadosBancarios, motivo: '' }); setShowBankModal(true); }} className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Solicitar Alteração</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Banco', value: dadosBancarios.banco },
                { label: 'Agência', value: dadosBancarios.agencia },
                { label: 'Conta', value: dadosBancarios.conta },
                { label: 'Tipo', value: dadosBancarios.tipo_conta },
                { label: 'Titular', value: dadosBancarios.titular },
                { label: 'PIX', value: dadosBancarios.pix_chave ? `${dadosBancarios.pix_tipo}: ${dadosBancarios.pix_chave}` : '—' },
              ].map((f) => (
                <div key={f.label}><label className={labelClass}>{f.label}</label><div className="rounded-lg border border-white/5 bg-[#111] px-4 py-2 text-sm text-gray-300">{f.value || '—'}</div></div>
              ))}
            </div>
          </div>

          {/* Bank Modal */}
          {showBankModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/30 bg-[#0a0a0a] p-6 space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-[#D4AF37]">Solicitar Alteração Bancária</h3><button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div><label className={labelClass}>Banco</label><input value={bankForm.banco} onChange={(e) => setBankForm({ ...bankForm, banco: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Agência</label><input value={bankForm.agencia} onChange={(e) => setBankForm({ ...bankForm, agencia: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Conta</label><input value={bankForm.conta} onChange={(e) => setBankForm({ ...bankForm, conta: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Tipo</label><select value={bankForm.tipo_conta} onChange={(e) => setBankForm({ ...bankForm, tipo_conta: e.target.value })} className={inputClass}><option value="corrente">Corrente</option><option value="poupanca">Poupança</option></select></div>
                  <div className="md:col-span-2"><label className={labelClass}>Titular</label><input value={bankForm.titular} onChange={(e) => setBankForm({ ...bankForm, titular: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Tipo PIX</label><select value={bankForm.pix_tipo} onChange={(e) => setBankForm({ ...bankForm, pix_tipo: e.target.value })} className={inputClass}><option value="">Selecione</option><option value="cpf">CPF</option><option value="email">Email</option><option value="telefone">Telefone</option><option value="aleatoria">Aleatória</option></select></div>
                  <div><label className={labelClass}>Chave PIX</label><input value={bankForm.pix_chave} onChange={(e) => setBankForm({ ...bankForm, pix_chave: e.target.value })} className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Motivo da Alteração *</label><textarea value={bankForm.motivo} onChange={(e) => setBankForm({ ...bankForm, motivo: e.target.value })} className={inputClass} rows={2} placeholder="Descreva o motivo..." /></div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowBankModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                  <button onClick={handleBankAlteration} disabled={saving} className={btnGold}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Enviar Solicitação</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ SEGURANÇA TAB ═══════ */}
      {activeSection === 'seguranca' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Lock className="h-5 w-5 text-[#D4AF37]" />Alterar Senha</h2>
            {!showPassForm ? (
              <button onClick={() => setShowPassForm(true)} className={btnGold}>Alterar Senha</button>
            ) : (
              <div className="space-y-3 max-w-md">
                <div><label className={labelClass}>Senha Atual</label><div className="relative"><input type={showPass ? 'text' : 'password'} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className={inputClass} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2 text-gray-400">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                <div><label className={labelClass}>Nova Senha</label><input type={showPass ? 'text' : 'password'} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Confirmar Nova Senha</label><input type={showPass ? 'text' : 'password'} value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} className={inputClass} /></div>
                <div className="flex gap-2">
                  <button onClick={handleChangePassword} disabled={saving} className={btnGold}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar</button>
                  <button onClick={() => { setShowPassForm(false); setSenhaAtual(''); setNovaSenha(''); setConfirmSenha(''); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-lg border border-red-500/20 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Sair da Conta</h2>
            <p className="text-sm text-gray-400 mb-4">Você será desconectado e redirecionado para a tela de login.</p>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"><LogOut className="h-4 w-4" />Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}
