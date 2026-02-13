'use client';

import { useState } from 'react';
import { Shield, Key, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { changeAdminPassword } from '@/app/actions/auth';

export default function SegurancaPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [twoFactor, setTwoFactor] = useState(false);
  const [changing, setChanging] = useState(false);

  async function handleChangePassword() {
    if (!passwords.current || !passwords.new || !passwords.confirm) return;
    if (passwords.new !== passwords.confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setChanging(true);
    try {
      const result = await changeAdminPassword(passwords.current, passwords.new);
      if (result.success) {
        toast.success(result.message || 'Senha alterada com sucesso');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        toast.error(result.error || 'Erro ao alterar senha');
      }
    } catch {
      toast.error('Erro inesperado ao alterar senha');
    } finally {
      setChanging(false);
    }
  }

  const sessions = [
    { device: 'Chrome — macOS', ip: '189.***.***.42', lastActive: 'Agora', current: true },
    { device: 'Safari — iPhone', ip: '189.***.***.42', lastActive: '2h atrás', current: false },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          SEGURANÇA
        </h1>
        <p className="mt-2 text-gray-400">Segurança e privacidade da conta</p>
      </div>

      {/* Alterar Senha */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-[#D4AF37]" /> Alterar Senha
        </h2>
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha Atual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 pr-10 text-white focus:border-[#D4AF37]/50 focus:outline-none"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
            />
            {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
              <p className="text-xs text-red-400 mt-1">As senhas não coincidem</p>
            )}
          </div>
          <button
            onClick={handleChangePassword}
            disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm || changing}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {changing ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h2 className="text-lg font-semibold text-white">Autenticação de 2 Fatores</h2>
              <p className="text-sm text-gray-400">Adicione uma camada extra de segurança</p>
            </div>
          </div>
          <button
            onClick={() => setTwoFactor(!twoFactor)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              twoFactor ? 'bg-[#D4AF37]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                twoFactor ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        {twoFactor && (
          <div className="mt-4 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
            <p className="text-sm text-gray-300">
              Configure um app autenticador (Google Authenticator, Authy) para gerar códigos de verificação.
            </p>
          </div>
        )}
      </div>

      {/* Sessões Ativas */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#D4AF37]" /> Sessões Ativas
        </h2>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 p-4 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${s.current ? 'bg-green-500/10' : 'bg-white/5'}`}>
                  {s.current ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Clock className="h-4 w-4 text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm text-white">{s.device}</p>
                  <p className="text-xs text-gray-500">IP: {s.ip} • {s.lastActive}</p>
                </div>
              </div>
              {s.current ? (
                <span className="text-xs text-green-400 font-medium">Sessão atual</span>
              ) : (
                <button className="text-xs text-red-400 hover:text-red-300">Encerrar</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
