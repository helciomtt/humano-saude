import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiLeadSchema } from '@/lib/validations';
import { checkRateLimit, leadsLimiter } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 leads/min por IP
    const blocked = await checkRateLimit(request, leadsLimiter);
    if (blocked) return blocked;

    const body = await request.json();
    
    // Validar dados
    const validatedData = apiLeadSchema.parse(body);
    
    // Converter top_3_planos array para string se necessário
    const top_3_planos = Array.isArray(validatedData.top_3_planos)
      ? validatedData.top_3_planos.join(', ')
      : validatedData.top_3_planos || null;
    
    // Capturar IP e User-Agent
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // ✅ Tabela unificada: insurance_leads (antes era leads_landing)
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('insurance_leads')
      .insert([
        {
          nome: validatedData.nome,
          email: validatedData.email,
          whatsapp: validatedData.telefone,
          telefone: validatedData.telefone,
          perfil: validatedData.perfil,
          tipo_contratacao: validatedData.tipo_contratacao || null,
          cnpj: validatedData.cnpj || null,
          acomodacao: validatedData.acomodacao || null,
          idades_beneficiarios: validatedData.idades_beneficiarios || null,
          bairro: validatedData.bairro || null,
          top_3_planos,
          ip_address: ip,
          user_agent: userAgent,
          status: 'novo',
          origem: 'landing',
          utm_source: validatedData.utm_source || null,
          utm_medium: validatedData.utm_medium || null,
          utm_campaign: validatedData.utm_campaign || null,
          historico: [
            {
              timestamp: new Date().toISOString(),
              evento: 'lead_criado',
              origem: 'landing_page',
              detalhes: 'Lead criado via formulário da landing page',
            },
          ],
          arquivado: false,
        },
      ])
      .select()
      .single();
    
    if (error) {
      logger.error('Erro ao inserir lead', error as Error, { origem: 'landing' });
      return NextResponse.json(
        { error: 'Erro ao salvar lead', details: error.message },
        { status: 500 }
      );
    }
    
    logger.info('Lead criado com sucesso', { lead_id: data.id, origem: 'landing' });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead criado com sucesso!',
        leadId: data.id 
      },
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    logger.error('Erro no servidor (leads)', error as Error, { path: '/api/leads' });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
