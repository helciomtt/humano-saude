'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mail,
  Clock,
  CheckCircle,
  UserPlus,
  Search,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Filter,
  Calendar,
  User,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────
interface ConviteCorretor {
  id: string;
  email_convidado: string;
  nome_convidante: string;
  origem: string;
  id_convidante: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  cadastro: {
    status: string;
    created_at: string;
    nome: string;
  } | null;
}

// ─── Status Config ─────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Send }> = {
  enviado: { label: 'Enviado', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Send },
  cadastrado: { label: 'Cadastrado', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
};

// ─── Page ──────────────────────────────────────
export default function ConvitesEnviadosPage() {
  const [convites, setConvites] = useState<ConviteCorretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [tableExists, setTableExists] = useState(true);

  const fetchConvites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/corretor/convites?status=${filtro}`);
      const data = await res.json();

      if (data.message && data.message.includes('não existe')) {
        setTableExists(false);
        setConvites([]);
      } else {
        setTableExists(true);
        setConvites(data.convites || []);
      }
    } catch {
      toast.error('Erro ao carregar convites');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    fetchConvites();
  }, [fetchConvites]);

  const convitesFiltrados = convites.filter((c) => {
    if (!busca) return true;
    const term = busca.toLowerCase();
    return (
      c.email_convidado.toLowerCase().includes(term) ||
      c.nome_convidante.toLowerCase().includes(term) ||
      (c.cadastro?.nome || '').toLowerCase().includes(term)
    );
  });

  const stats = {
    total: convites.length,
    enviados: convites.filter((c) => !c.cadastro).length,
    cadastrados: convites.filter((c) => c.cadastro).length,
    aprovados: convites.filter((c) => c.cadastro?.status === 'aprovado').length,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/portal-interno-hks-2026/corretores"
            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Convites enviados</h1>
            <p className="text-sm text-white/40 mt-1">
              Acompanhe os convites enviados e quem se cadastrou
            </p>
          </div>
          <button
            onClick={fetchConvites}
            className="ml-auto h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('h-4 w-4 text-white/60', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Aviso se tabela não existe */}
        {!tableExists && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-400">
              <strong>Atenção:</strong> A tabela de convites ainda não foi criada no banco de dados.
              Execute a migration no SQL Editor do Supabase para ativar este recurso.
            </p>
          </div>
        )}

        {/* Big Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total enviados', value: stats.total, icon: Send, color: 'text-[#D4AF37]' },
            { label: 'Aguardando', value: stats.enviados, icon: Clock, color: 'text-blue-400' },
            { label: 'Se cadastraram', value: stats.cadastrados, icon: UserPlus, color: 'text-green-400' },
            { label: 'Aprovados', value: stats.aprovados, icon: CheckCircle, color: 'text-emerald-400' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('h-4 w-4', s.color)} />
                  <span className="text-xs text-white/40">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por email ou nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'enviado', label: 'Enviados' },
              { value: 'cadastrado', label: 'Cadastrados' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  filtro === f.value
                    ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white/70'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : convitesFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">
              {busca ? 'Nenhum convite encontrado para esta busca' : 'Nenhum convite enviado ainda'}
            </p>
            <p className="text-white/20 text-xs mt-1">
              Use o botão &quot;Convidar corretor&quot; no menu lateral para enviar convites
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {convitesFiltrados.map((convite, i) => {
                const seCadastrou = !!convite.cadastro;
                const statusCadastro = convite.cadastro?.status;

                return (
                  <motion.div
                    key={convite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'bg-white/[0.02] border rounded-xl p-4 transition-all',
                      seCadastrou ? 'border-green-500/10' : 'border-white/[0.06]'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          seCadastrou ? 'bg-green-500/10' : 'bg-blue-500/10'
                        )}
                      >
                        {seCadastrou ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Mail className="h-5 w-5 text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white truncate">
                            {convite.email_convidado}
                          </p>
                          {seCadastrou && (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                statusCadastro === 'aprovado'
                                  ? 'bg-green-500/10 text-green-400'
                                  : statusCadastro === 'pendente'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : statusCadastro === 'rejeitado'
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-blue-500/10 text-blue-400'
                              )}
                            >
                              {statusCadastro === 'aprovado'
                                ? 'Aprovado'
                                : statusCadastro === 'pendente'
                                ? 'Pendente'
                                : statusCadastro === 'rejeitado'
                                ? 'Rejeitado'
                                : statusCadastro}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/30">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Enviado por {convite.nome_convidante}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(convite.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            {convite.origem === 'admin' ? 'Admin' : 'Corretor'}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="text-right flex-shrink-0">
                        {seCadastrou ? (
                          <div>
                            <p className="text-xs text-green-400 font-semibold">Cadastrou-se</p>
                            <p className="text-[10px] text-white/20">
                              {convite.cadastro?.nome}
                            </p>
                            <p className="text-[10px] text-white/20">
                              {new Date(convite.cadastro!.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-blue-400 font-semibold">Aguardando</p>
                            <p className="text-[10px] text-white/20">Ainda não se cadastrou</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
