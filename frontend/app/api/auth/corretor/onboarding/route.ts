import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { validarDocumento } from '@/lib/validations';
import { enviarEmailAguardeVerificacao, enviarEmailOnboardingConcluidoAdmin } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const supabase = createServiceClient();

    // ─── Etapa: Dados Bancários (JSON) ─────────────────────
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        token,
        etapa,
        banco_codigo,
        banco_nome,
        agencia,
        conta,
        tipo_conta,
        titular_nome,
        titular_documento,
        tipo_chave_pix,
        chave_pix,
      } = body;

      if (etapa !== 'bancario') {
        return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 });
      }

      if (!banco_codigo || !agencia || !conta || !titular_nome || !titular_documento) {
        return NextResponse.json(
          { error: 'Preencha todos os dados bancários obrigatórios' },
          { status: 400 },
        );
      }

      // Validar CPF/CNPJ do titular
      if (!validarDocumento(titular_documento)) {
        return NextResponse.json(
          { error: 'CPF/CNPJ do titular inválido. Verifique os números digitados.' },
          { status: 400 },
        );
      }

      // Buscar corretor pelo token
      let corretorId: string | null = null;
      let solicitacaoId: string | null = null;

      if (token) {
        // Token está armazenado em metadata JSONB
        const { data: corretor } = await supabase
          .from('corretores')
          .select('id, metadata')
          .filter('metadata->>onboarding_token', 'eq', token)
          .single();

        if (corretor) {
          // Verificar se token não expirou
          const meta = corretor.metadata as Record<string, unknown> | null;
          const expira = meta?.onboarding_token_expira as string | undefined;
          if (expira && new Date(expira) < new Date()) {
            return NextResponse.json(
              { error: 'Token de onboarding expirado. Solicite um novo link.' },
              { status: 403 },
            );
          }
          corretorId = corretor.id;
        }
      }

      // Inserir dados bancários
      const insertData: Record<string, unknown> = {
        banco_codigo,
        banco_nome,
        agencia,
        conta,
        tipo_conta: tipo_conta || 'corrente',
        titular_nome,
        titular_documento,
        tipo_chave_pix: tipo_chave_pix || null,
        chave_pix: chave_pix || null,
        ativo: true,
      };

      if (corretorId) insertData.corretor_id = corretorId;
      if (solicitacaoId) insertData.solicitacao_id = solicitacaoId;

      const { error: insertError } = await supabase
        .from('corretor_dados_bancarios')
        .insert(insertData);

      if (insertError) {
        logger.error('[onboarding bancario]', insertError);
        return NextResponse.json(
          { error: `Erro ao salvar dados bancários: ${insertError.message}` },
          { status: 500 },
        );
      }

      // Atualizar etapa do corretor no metadata
      if (corretorId) {
        const { data: corretorAtual } = await supabase
          .from('corretores')
          .select('nome, email, telefone, cpf, metadata')
          .eq('id', corretorId)
          .single();
        
        const metadataAtual = (corretorAtual?.metadata as Record<string, unknown>) || {};
        await supabase
          .from('corretores')
          .update({
            metadata: {
              ...metadataAtual,
              onboarding_etapa: 'completo',
              onboarding_completo: true,
            },
          })
          .eq('id', corretorId);

        // Enviar emails após onboarding completo
        const nomeCorretor = corretorAtual?.nome || 'Corretor';
        const emailCorretor = corretorAtual?.email || '';
        const telefoneCorretor = corretorAtual?.telefone || '';
        const cpfCorretor = corretorAtual?.cpf || '';

        try {
          // Email para o corretor: aguarde verificação
          if (emailCorretor) {
            await enviarEmailAguardeVerificacao({ nome: nomeCorretor, email: emailCorretor });
          }

          // Email para o comercial: onboarding concluído
          await enviarEmailOnboardingConcluidoAdmin({
            corretorNome: nomeCorretor,
            corretorEmail: emailCorretor,
            corretorTelefone: telefoneCorretor,
            corretorCpf: cpfCorretor,
          });
        } catch (emailError) {
          logger.error('[onboarding] Erro ao enviar emails:', emailError);
          // Não retorna erro - os dados bancários já foram salvos
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Dados bancários salvos com sucesso!',
      });
    }

    // ─── Etapa: Documentos (FormData) ──────────────────────
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const etapa = formData.get('etapa') as string;
    const tipoDocIdentidade = formData.get('tipo_doc_identidade') as string;

    if (etapa !== 'documentos') {
      return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 });
    }

    // Buscar corretor pelo token (armazenado em metadata JSONB)
    let corretorId: string | null = null;

    if (token) {
      const { data: corretor } = await supabase
        .from('corretores')
        .select('id, metadata')
        .filter('metadata->>onboarding_token', 'eq', token)
        .single();

      if (corretor) {
        const meta = corretor.metadata as Record<string, unknown> | null;
        const expira = meta?.onboarding_token_expira as string | undefined;
        if (expira && new Date(expira) < new Date()) {
          return NextResponse.json(
            { error: 'Token de onboarding expirado. Solicite um novo link.' },
            { status: 403 },
          );
        }
        corretorId = corretor.id;
      }
    }

    // Coletar arquivos
    const filesMap: { tipo: string; file: File }[] = [];

    if (tipoDocIdentidade === 'cnh') {
      const cnh = formData.get('cnh') as File | null;
      if (cnh) filesMap.push({ tipo: 'cnh', file: cnh });
    } else {
      const rgFrente = formData.get('rg_frente') as File | null;
      const rgVerso = formData.get('rg_verso') as File | null;
      if (rgFrente) filesMap.push({ tipo: 'rg_frente', file: rgFrente });
      if (rgVerso) filesMap.push({ tipo: 'rg_verso', file: rgVerso });
    }

    const selfie = formData.get('selfie') as File | null;
    if (selfie) filesMap.push({ tipo: 'selfie', file: selfie });

    const contratoSocial = formData.get('contrato_social') as File | null;
    if (contratoSocial) filesMap.push({ tipo: 'contrato_social', file: contratoSocial });

    const cartaoCnpj = formData.get('cartao_cnpj') as File | null;
    if (cartaoCnpj) filesMap.push({ tipo: 'cartao_cnpj', file: cartaoCnpj });

    if (filesMap.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 },
      );
    }

    // Upload para Supabase Storage + registro na tabela
    const uploadResults = [];

    for (const { tipo, file } of filesMap) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${corretorId ?? 'pending'}_${tipo}_${Date.now()}.${fileExt}`;
      const storagePath = `corretor-docs/${fileName}`;

      // Upload para storage
      const { error: uploadError } = await supabase
        .storage
        .from('documentos')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        logger.error(`[onboarding upload ${tipo}]`, uploadError);
        // Continuar com os outros uploads
        uploadResults.push({ tipo, success: false, error: uploadError.message });
        continue;
      }

      // URL pública
      const { data: urlData } = supabase
        .storage
        .from('documentos')
        .getPublicUrl(storagePath);

      // Registrar na tabela
      const docInsert: Record<string, unknown> = {
        tipo,
        nome_arquivo: file.name,
        url: urlData?.publicUrl ?? storagePath,
        mime_type: file.type,
        tamanho_bytes: file.size,
        status: 'pendente',
      };

      if (corretorId) docInsert.corretor_id = corretorId;

      const { error: dbError } = await supabase
        .from('corretor_documentos')
        .insert(docInsert);

      if (dbError) {
        logger.error(`[onboarding db ${tipo}]`, dbError);
        uploadResults.push({ tipo, success: false, error: dbError.message });
      } else {
        uploadResults.push({ tipo, success: true });
      }
    }

    // Atualizar etapa do corretor no metadata
    if (corretorId) {
      const { data: corretorAtual } = await supabase
        .from('corretores')
        .select('metadata')
        .eq('id', corretorId)
        .single();
      
      const metadataAtual = (corretorAtual?.metadata as Record<string, unknown>) || {};
      await supabase
        .from('corretores')
        .update({
          metadata: {
            ...metadataAtual,
            onboarding_etapa: 'bancario',
          },
        })
        .eq('id', corretorId);
    }

    const allSuccess = uploadResults.every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess
        ? 'Documentos enviados com sucesso!'
        : 'Alguns documentos não puderam ser enviados. Tente novamente.',
      results: uploadResults,
    });
  } catch (err) {
    logger.error('[onboarding] unexpected', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
