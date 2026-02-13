'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// LISTAR CONTATOS WHATSAPP
// ========================================

export async function getWhatsAppContacts(filters?: {
  search?: string;
  is_blocked?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('whatsapp_contacts')
      .select('*, insurance_leads(nome, status)')
      .order('last_message_at', { ascending: false });

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    if (filters?.is_blocked !== undefined) {
      query = query.eq('is_blocked', filters.is_blocked);
    }

    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar contatos WhatsApp:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// BUSCAR MENSAGENS DE UM CONTATO
// ========================================

export async function getWhatsAppMessages(contactId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('❌ Erro ao buscar mensagens:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// ENVIAR MENSAGEM (salva no banco + trigger externo)
// ========================================

export async function sendWhatsAppMessage(phone: string, content: string) {
  try {
    // Buscar ou criar contato
    let { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('id')
      .eq('phone', phone)
      .single();

    if (!contact) {
      const { data: newContact, error: createErr } = await supabase
        .from('whatsapp_contacts')
        .insert({ phone, name: phone })
        .select('id')
        .single();

      if (createErr) return { success: false, error: createErr.message };
      contact = newContact;
    }

    // Salvar mensagem
    const { data: message, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        contact_id: contact!.id,
        phone,
        direction: 'outbound',
        type: 'text',
        content,
        status: 'sent',
      })
      .select('id')
      .single();

    if (error) {
      logger.error('❌ Erro ao salvar mensagem:', error);
      return { success: false, error: error.message };
    }

    // Atualizar contato
    await supabase
      .from('whatsapp_contacts')
      .update({
        last_message_at: new Date().toISOString(),
        messages_sent: (contact as any).messages_sent + 1 || 1,
      })
      .eq('id', contact!.id);

    revalidatePath(`${PORTAL}/whatsapp`);
    return { success: true, data: message, message: 'Mensagem enviada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// STATS WHATSAPP
// ========================================

export async function getWhatsAppStats() {
  try {
    const { data: contacts, error: errContacts } = await supabase
      .from('whatsapp_contacts')
      .select('id, messages_sent, messages_received, is_blocked');

    const { data: messages, error: errMessages } = await supabase
      .from('whatsapp_messages')
      .select('direction, status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (errContacts || errMessages) {
      return {
        success: false,
        data: null,
        error: errContacts?.message || errMessages?.message,
      };
    }

    const stats = {
      total_contatos: contacts?.length || 0,
      contatos_ativos: contacts?.filter((c: any) => !c.is_blocked).length || 0,
      mensagens_enviadas_30d: messages?.filter((m: any) => m.direction === 'outbound').length || 0,
      mensagens_recebidas_30d: messages?.filter((m: any) => m.direction === 'inbound').length || 0,
      total_enviadas: contacts?.reduce((sum: number, c: any) => sum + (c.messages_sent || 0), 0) || 0,
      total_recebidas: contacts?.reduce((sum: number, c: any) => sum + (c.messages_received || 0), 0) || 0,
    };

    return { success: true, data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}
