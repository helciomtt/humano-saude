#!/usr/bin/env node

/**
 * Script para executar o schema SQL no Supabase
 * 
 * IMPORTANTE: Você precisa adicionar a SUPABASE_SERVICE_ROLE_KEY no .env.local
 * 
 * Para obter a Service Role Key:
 * 1. Acesse https://supabase.com/dashboard/project/tcfwuykrzeialpakfdkc
 * 2. Vá em Settings > API
 * 3. Copie a "service_role" key (secret)
 * 4. Adicione no .env.local:
 *    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('========================================');
console.log('🗄️  EXECUTAR SCHEMA NO SUPABASE');
console.log('========================================');
console.log('');

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL não encontrada no .env.local');
  process.exit(1);
}

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
  console.error('');
  console.error('📝 PRÓXIMOS PASSOS:');
  console.error('');
  console.error('1. Acesse o dashboard do Supabase:');
  console.error(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}`);
  console.error('');
  console.error('2. Vá em Settings > API');
  console.error('');
  console.error('3. Copie a "service_role" key (secret)');
  console.error('');
  console.error('4. Adicione no frontend/.env.local:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.error('');
  console.error('5. Execute este script novamente');
  console.error('');
  process.exit(1);
}

console.log(`✅ Supabase URL: ${SUPABASE_URL}`);
console.log(`✅ Service Key: ${SERVICE_KEY.substring(0, 20)}...`);
console.log('');

// Ler schema SQL
const schemaPath = path.join(__dirname, 'humano_saude_complete_schema.sql');
const sqlContent = fs.readFileSync(schemaPath, 'utf8');

console.log(`📄 Schema carregado: ${schemaPath}`);
console.log(`📊 Tamanho: ${(sqlContent.length / 1024).toFixed(2)} KB`);
console.log('');

console.log('⏳ Executando SQL no Supabase...');
console.log('   (Isso pode levar alguns segundos)');
console.log('');

// Executar via REST API
const postgrestUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

fetch(postgrestUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({
    query: sqlContent
  })
})
.then(response => {
  if (!response.ok) {
    return response.text().then(text => {
      throw new Error(`HTTP ${response.status}: ${text}`);
    });
  }
  return response.json();
})
.then(data => {
  console.log('✅ Schema executado com sucesso!');
  console.log('');
  console.log('📊 Resultado:', data);
  console.log('');
  console.log('========================================');
  console.log('✅ CONCLUÍDO!');
  console.log('========================================');
  console.log('');
  console.log('Próximos passos:');
  console.log('1. Verificar tabelas no dashboard do Supabase');
  console.log('2. Testar as views: dashboard_stats, pipeline_completo');
  console.log('3. Reiniciar o servidor Next.js');
  console.log('');
})
.catch(error => {
  console.error('❌ Erro ao executar schema:');
  console.error(error.message);
  console.error('');
  console.error('💡 SOLUÇÃO ALTERNATIVA:');
  console.error('');
  console.error('Execute o SQL manualmente:');
  console.error('1. Acesse o SQL Editor do Supabase');
  console.error('2. Copie o conteúdo de humano_saude_complete_schema.sql');
  console.error('3. Cole e execute (Run)');
  console.error('');
  process.exit(1);
});
