#!/usr/bin/env npx tsx
/**
 * Gera um hash bcrypt para a senha do admin.
 *
 * Uso:
 *   npx tsx scripts/generate-password-hash.ts
 *
 * O script pede a senha no terminal e imprime o hash bcrypt.
 * Cole o resultado na env var ADMIN_PASSWORD_HASH.
 */

import bcrypt from 'bcrypt';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log('\n🔐 Gerador de Hash bcrypt — Humano Saúde\n');

  const password = await ask('Digite a senha do admin: ');
  if (!password || password.length < 8) {
    console.error('❌ Senha deve ter no mínimo 8 caracteres.');
    process.exit(1);
  }

  const confirm = await ask('Confirme a senha: ');
  if (password !== confirm) {
    console.error('❌ As senhas não coincidem.');
    process.exit(1);
  }

  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  console.log('\n✅ Hash gerado com sucesso!\n');
  console.log('Adicione no .env.local:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  console.log('⚠️  Remova ADMIN_PASSWORD do .env.local após configurar o hash.\n');

  rl.close();
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
