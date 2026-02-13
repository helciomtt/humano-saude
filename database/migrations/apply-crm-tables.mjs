#!/usr/bin/env node

/**
 * Aplica a migration CRM no Supabase usando a SQL API
 * 
 * Uso:
 *   node database/migrations/apply-crm-tables.mjs
 * 
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no frontend/.env.local
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar credenciais
const envPath = join(__dirname, '../../frontend/.env.local');
const envContent = readFileSync(envPath, 'utf8');

const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)?.[1]?.trim();
const SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/)?.[1]?.trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL ou SERVICE_ROLE_KEY não encontradas no .env.local');
  process.exit(1);
}

console.log('');
console.log('========================================');
console.log('🗄️  CRIANDO TABELAS CRM NO SUPABASE');
console.log('========================================');
console.log('');
console.log(`URL: ${SUPABASE_URL}`);
console.log('');

// Ler o SQL da migration
const sqlPath = join(__dirname, '20260211_create_crm_tables.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log(`📄 Migration: 20260211_create_crm_tables.sql`);
console.log(`📊 Tamanho: ${(sql.length / 1024).toFixed(2)} KB`);
console.log('');

// Executar via Supabase Management API (SQL endpoint)
async function executeSQL() {
  try {
    // Usar o endpoint /rest/v1/rpc se houver uma RPC, 
    // ou a Management API diretamente
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({}),
    });

    // A REST API não suporta DDL, então vamos orientar o usuário
    console.log('⚠️  A REST API do Supabase não executa DDL (CREATE TABLE).');
    console.log('');
    console.log('📋 COPIE E COLE o SQL abaixo no SQL Editor do Supabase:');
    console.log('');
    console.log(`🔗 https://supabase.com/dashboard/project/${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}/sql/new`);
    console.log('');
    console.log('─'.repeat(60));
    console.log('');
    console.log(sql);
    console.log('');
    console.log('─'.repeat(60));
    console.log('');
    console.log('✅ Após executar, recarregue a página do CRM no navegador.');
    console.log('');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

executeSQL();
