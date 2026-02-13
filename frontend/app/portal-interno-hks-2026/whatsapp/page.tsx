'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Send, Phone, User, Clock, CheckCheck } from 'lucide-react';
import { getWhatsAppContacts, getWhatsAppMessages, sendWhatsAppMessage, getWhatsAppStats } from '@/app/actions/whatsapp';

export default function WhatsAppPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [cRes, sRes] = await Promise.all([
        getWhatsAppContacts(),
        getWhatsAppStats(),
      ]);
      if (cRes.success) setContacts(cRes.data || []);
      if (sRes.success) setStats(sRes.data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedContact) return;
    async function loadMessages() {
      const res = await getWhatsAppMessages(selectedContact!);
      if (res.success) setMessages(res.data || []);
    }
    loadMessages();
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || !selectedContact) return;
    const phone = selectedContactData?.telefone || '';
    await sendWhatsAppMessage(phone, newMessage);
    setNewMessage('');
    const res = await getWhatsAppMessages(selectedContact);
    if (res.success) setMessages(res.data || []);
  }

  const selectedContactData = contacts.find((c) => c.id === selectedContact);
  const filteredContacts = contacts.filter((c) =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          WHATSAPP
        </h1>
        <p className="mt-2 text-gray-400">Central de mensagens WhatsApp</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
              <p className="text-2xl font-bold text-white">{stats?.total_contatos || 0}</p>
              <p className="text-xs text-gray-400">Contatos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
              <p className="text-2xl font-bold text-green-400">{stats?.mensagens_hoje || 0}</p>
              <p className="text-xs text-gray-400">Mensagens Hoje</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
              <p className="text-2xl font-bold text-blue-400">{stats?.mensagens_enviadas || 0}</p>
              <p className="text-xs text-gray-400">Enviadas (Total)</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
              <p className="text-2xl font-bold text-[#D4AF37]">{stats?.mensagens_recebidas || 0}</p>
              <p className="text-xs text-gray-400">Recebidas (Total)</p>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="grid gap-0 md:grid-cols-[350px_1fr] rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden" style={{ height: '500px' }}>
            {/* Contact List */}
            <div className="border-r border-white/10 flex flex-col">
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar contato..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#111] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContact(c.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors ${
                      selectedContact === c.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.nome}</p>
                      <p className="text-xs text-gray-400 truncate">{c.telefone}</p>
                    </div>
                    {c.ultima_mensagem && (
                      <span className="text-[10px] text-gray-500">{new Date(c.ultima_mensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-8">Nenhum contato</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col">
              {selectedContactData ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
                    <div className="h-9 w-9 rounded-full bg-green-500/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{selectedContactData.nome}</p>
                      <p className="text-xs text-gray-400">{selectedContactData.telefone}</p>
                    </div>
                    <a
                      href={`https://wa.me/${selectedContactData.telefone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-green-400 hover:text-green-300"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            m.direcao === 'saida'
                              ? 'bg-[#D4AF37]/20 text-white'
                              : 'bg-white/10 text-gray-200'
                          }`}
                        >
                          <p className="text-sm">{m.mensagem}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-gray-500">
                              {m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {m.direcao === 'saida' && <CheckCheck className="h-3 w-3 text-blue-400" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-center text-sm text-gray-500 py-8">Nenhuma mensagem</p>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-white/10 flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-black hover:bg-[#F6E05E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">Selecione um contato para ver as mensagens</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
