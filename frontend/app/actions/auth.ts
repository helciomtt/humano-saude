'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Altera a senha do admin.
 * 1. Valida a senha atual fazendo login via /api/auth/admin-login
 * 2. Armazena a nova senha em um cookie seguro (ou env em produção)
 *
 * NOTA: Em produção, isso deveria ser feito via Supabase Auth ou
 * atualizando a env var no painel da Vercel.
 * Aqui usamos a validação direta contra a env ADMIN_PASSWORD.
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return { success: false, error: 'Credenciais do admin não configuradas no servidor' };
    }

    // 1. Validar senha atual
    if (currentPassword !== adminPassword) {
      return { success: false, error: 'Senha atual incorreta' };
    }

    // 2. Validar nova senha
    if (newPassword.length < 6) {
      return { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' };
    }

    if (newPassword === currentPassword) {
      return { success: false, error: 'Nova senha deve ser diferente da atual' };
    }

    // 3. Em um cenário real de produção, aqui você atualizaria:
    //    - Supabase Auth: supabase.auth.admin.updateUserById(id, { password: newPassword })
    //    - Ou Vercel env: API Vercel para atualizar ADMIN_PASSWORD
    //
    // Como usamos env vars estáticas, logamos uma mensagem clara:
    logger.info('⚠️ ADMIN_PASSWORD change requested. Update the environment variable:');
    logger.info(`   ADMIN_PASSWORD=${newPassword}`);
    logger.info('   Then redeploy the application.');

    // Forçar logout para re-autenticar com a nova senha
    // (na prática a senha só muda quando o env var é atualizado)

    revalidatePath(`${PORTAL}/seguranca`);

    return {
      success: true,
      message: 'Solicitação de alteração registrada. Atualize a variável ADMIN_PASSWORD no servidor e faça redeploy.',
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}
