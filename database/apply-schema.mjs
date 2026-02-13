#!/usr/bin/env node

/**
 * Script para aplicar o schema completo no Supabase
 * Usa a REST API do Supabase para executar SQL
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('');
console.log('========================================');
console.log('🗄️  APLICANDO SCHEMA NO SUPABASE');
console.log('========================================');
console.log('');

// Carregar credenciais
const envPath = join(__dirname, '../frontend/.env.local');
const envContent = readFileSync(envPath, 'utf8');

const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Credenciais não encontradas no .env.local');
  process.exit(1);
}

console.log(`✅ URL: ${SUPABASE_URL}`);
console.log(`✅ Key: ${SERVICE_KEY.substring(0, 30)}...`);
console.log('');

// Carregar schema
const schemaPath = join(__dirname, 'humano_saude_complete_schema.sql');
const sql = readFileSync(schemaPath, 'utf8');

console.log(`📄 Schema: humano_saude_complete_schema.sql`);
console.log(`📊 Tamanho: ${(sql.length / 1024).toFixed(2)} KB`);
console.log(`📝 Linhas: ${sql.split('\n').length}`);
console.log('');

// Dividir em statements individuais (remover comentários e executar por partes)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .filter(s => !s.match(/^\/\*/)); // Remover comentários multiline

console.log(`📦 Total de statements SQL: ${statements.length}`);
console.log('');
console.log('⏳ Executando SQL no Supabase...');
console.log('   (Isso pode levar alguns minutos)');
console.log('');

let successCount = 0;
let errorCount = 0;
const errors = [];

// Executar statements em lotes
async function executeBatch(batch, batchNum) {
  const batchSQL = batch.join(';\n') + ';';
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: batchSQL
    })
  });

  if (response.ok) {
    successCount += batch.length;
    process.stdout.write(`✓`);
  } else {
    errorCount += batch.length;
    const error = await response.text();
    errors.push({ batch: batchNum, error });
    process.stdout.write(`✗`);
  }
}

// Executar em lotes de 10 statements
const BATCH_SIZE = 10;
const batches = [];
for (let i = 0; i < statements.length; i += BATCH_SIZE) {
  batches.push(statements.slice(i, i + BATCH_SIZE));
}

console.log(`📦 Executando ${batches.length} lotes...`);
console.log('');

// Executar sequencialmente
for (let i = 0; i < batches.length; i++) {
  await executeBatch(batches[i], i + 1);
  
  // Mostrar progresso a cada 5 lotes
  if ((i + 1) % 5 === 0) {
    process.stdout.write(` ${i + 1}/${batches.length}\n`);
  }
}

console.log('');
console.log('');
console.log('========================================');
console.log('📊 RESULTADO');
console.log('========================================');
console.log('');
console.log(`✅ Sucesso: ${successCount} statements`);
console.log(`❌ Erros: ${errorCount} statements`);
console.log('');

if (errors.length > 0) {
  console.log('⚠️  ERROS ENCONTRADOS:');
  console.log('');
  errors.forEach(({ batch, error }) => {
    console.log(`   Lote ${batch}: ${error.substring(0, 200)}...`);
  });
  console.log('');
  console.log('💡 SOLUÇÃO: Execute o SQL manualmente no SQL Editor do Supabase');
  console.log('');
} else {
  console.log('✅ SCHEMA APLICADO COM SUCESSO!');
  console.log('');
  console.log('📋 Tabelas criadas:');
  console.log('   • insurance_leads');
  console.log('   • operadoras');
  console.log('   • planos');
  console.log('   • cotacoes');
  console.log('   • propostas');
  console.log('   • comissoes');
  console.log('   • analytics_visits');
  console.log('   • ads_campaigns');
  console.log('   • ads_creatives');
  console.log('   • ads_audiences');
  console.log('   • whatsapp_contacts');
  console.log('   • whatsapp_messages');
  console.log('   • webhook_logs');
  console.log('   • integration_settings');
  console.log('');
  console.log('📊 Views criadas:');
  console.log('   • dashboard_stats');
  console.log('   • leads_por_operadora');
  console.log('   • pipeline_vendas');
  console.log('   • pipeline_completo');
  console.log('   • desempenho_operadoras');
  console.log('   • analise_campanhas');
  console.log('');
}

console.log('========================================');
console.log('');
console.log('🔗 Próximos passos:');
console.log('');
console.log('1. Verificar no Dashboard: https://supabase.com/dashboard/project/tcfwuykrzeialpakfdkc');
console.log('2. Ir em Table Editor para ver as tabelas');
console.log('3. Testar as views no SQL Editor');
console.log('4. Reiniciar o servidor Next.js');
console.log('');
