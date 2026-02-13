'use client';

import { useState } from 'react';
import { MessageSquare, Send, Users, Search, Circle, Phone, Video } from 'lucide-react';

type ChatUser = {
  id: number;
  nome: string;
  cargo: string;
  avatar: string;
  online: boolean;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
};

type Mensagem = {
  id: number;
  de: string;
  texto: string;
  hora: string;
  minha: boolean;
};

const EQUIPE: ChatUser[] = [
  { id: 1, nome: 'Ana Silva', cargo: 'Corretora Sênior', avatar: 'AS', online: true, ultimaMensagem: 'Fechei a proposta do cliente Oliveira!', hora: '14:32', naoLidas: 2 },
  { id: 2, nome: 'Carlos Mendes', cargo: 'Analista Comercial', avatar: 'CM', online: true, ultimaMensagem: 'Preciso dos dados da Unimed SP', hora: '14:15', naoLidas: 0 },
  { id: 3, nome: 'Juliana Costa', cargo: 'Gestora de Ads', avatar: 'JC', online: false, ultimaMensagem: 'Campanha nova ativa amanhã', hora: '13:45', naoLidas: 1 },
  { id: 4, nome: 'Roberto Almeida', cargo: 'Financeiro', avatar: 'RA', online: false, ultimaMensagem: 'Comissões de janeiro prontas', hora: '12:20', naoLidas: 0 },
  { id: 5, nome: 'Maria Fernanda', cargo: 'Atendimento', avatar: 'MF', online: true, ultimaMensagem: 'Cliente pediu reagendamento', hora: '11:50', naoLidas: 0 },
];

const MENSAGENS: Mensagem[] = [
  { id: 1, de: 'Ana Silva', texto: 'Oi! Consegui fechar a proposta do cliente Oliveira', hora: '14:28', minha: false },
  { id: 2, de: 'Eu', texto: 'Ótimo! Qual operadora ficou?', hora: '14:29', minha: true },
  { id: 3, de: 'Ana Silva', texto: 'Bradesco Saúde Top Nacional, plano familiar com 4 vidas', hora: '14:30', minha: false },
  { id: 4, de: 'Ana Silva', texto: 'Valor ficou R$ 2.847/mês, economia de 18% em relação ao anterior', hora: '14:31', minha: false },
  { id: 5, de: 'Eu', texto: 'Excelente! Manda a proposta pra eu aprovar', hora: '14:31', minha: true },
  { id: 6, de: 'Ana Silva', texto: 'Fechei a proposta do cliente Oliveira!', hora: '14:32', minha: false },
];

export default function ChatPage() {
  const [selected, setSelected] = useState<ChatUser>(EQUIPE[0]);
  const [mensagem, setMensagem] = useState('');
  const [busca, setBusca] = useState('');

  const filteredEquipe = busca
    ? EQUIPE.filter((u) => u.nome.toLowerCase().includes(busca.toLowerCase()))
    : EQUIPE;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CHAT DA EQUIPE
        </h1>
        <p className="mt-2 text-gray-400">Comunicação interna em tempo real</p>
      </div>

      {/* Online count */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Users className="h-4 w-4" />
        <span>{EQUIPE.filter((u) => u.online).length} online de {EQUIPE.length} membros</span>
      </div>

      {/* Chat Layout */}
      <div className="grid grid-cols-12 gap-0 rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden" style={{ height: '520px' }}>
        {/* Sidebar de contatos */}
        <div className="col-span-4 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar membro..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#151515] pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredEquipe.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelected(user)}
                className={`w-full p-3 text-left hover:bg-[#151515] transition-colors border-b border-white/5 ${
                  selected.id === user.id ? 'bg-[#151515] border-l-2 border-l-[#D4AF37]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#bf953f] flex items-center justify-center text-xs font-bold text-black">
                      {user.avatar}
                    </div>
                    <Circle className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 ${
                      user.online ? 'text-emerald-400 fill-emerald-400' : 'text-gray-600 fill-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">{user.nome}</span>
                      <span className="text-[10px] text-gray-500">{user.hora}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.ultimaMensagem}</p>
                  </div>
                  {user.naoLidas > 0 && (
                    <span className="h-5 w-5 rounded-full bg-[#D4AF37] flex items-center justify-center text-[10px] font-bold text-black">
                      {user.naoLidas}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Area de chat */}
        <div className="col-span-8 flex flex-col">
          {/* Header do chat */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#bf953f] flex items-center justify-center text-xs font-bold text-black">
                {selected.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selected.nome}</p>
                <p className="text-xs text-gray-500">{selected.cargo} • {selected.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg p-2 hover:bg-white/10 transition-colors"><Phone className="h-4 w-4 text-gray-400" /></button>
              <button className="rounded-lg p-2 hover:bg-white/10 transition-colors"><Video className="h-4 w-4 text-gray-400" /></button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {MENSAGENS.map((msg) => (
              <div key={msg.id} className={`flex ${msg.minha ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  msg.minha
                    ? 'bg-[#D4AF37] text-black rounded-br-md'
                    : 'bg-[#1a1a1a] text-white rounded-bl-md border border-white/10'
                }`}>
                  <p className="text-sm">{msg.texto}</p>
                  <p className={`text-[10px] mt-1 ${msg.minha ? 'text-black/50' : 'text-gray-500'}`}>{msg.hora}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-white placeholder:text-gray-600"
              />
              <button className="rounded-lg bg-[#D4AF37] p-2.5 text-black hover:bg-[#F6E05E] transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
