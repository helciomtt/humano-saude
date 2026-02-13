# 🗄️ GUIA: APLICAR SCHEMA NO SUPABASE

## ✅ MÉTODO RECOMENDADO: SQL Editor (Manual)

### 📝 Passo a Passo:

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/tcfwuykrzeialpakfdkc/sql/new
   ```

2. **Abra o arquivo do schema:**
   - Arquivo: `database/humano_saude_complete_schema.sql`
   - Tamanho: ~25 KB

3. **Copie TODO o conteúdo do arquivo**

4. **Cole no SQL Editor do Supabase**

5. **Clique em "Run" (ou pressione Ctrl+Enter)**

6. **Aguarde 30-60 segundos** para criar:
   - 14 tabelas
   - 6 views
   - 15+ triggers
   - 50+ índices

---

## 🔍 VERIFICAÇÃO PÓS-INSTALAÇÃO

### 1. Verificar Tabelas Criadas

No SQL Editor, execute:

```sql
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado (14 tabelas):**
- ads_audiences
- ads_campaigns
- ads_creatives
- analytics_visits
- comissoes
- cotacoes
- insurance_leads
- integration_settings
- operadoras
- planos
- propostas
- webhook_logs
- whatsapp_contacts
- whatsapp_messages

---

### 2. Verificar Views Criadas

```sql
SELECT 
  viewname,
  schemaname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;
```

**Resultado esperado (6 views):**
- analise_campanhas
- dashboard_stats
- desempenho_operadoras
- leads_por_operadora
- pipeline_completo
- pipeline_vendas

---

### 3. Testar Dashboard Stats

```sql
SELECT * FROM public.dashboard_stats;
```

**Resultado esperado:**
- Todas as colunas com valor `0` ou `NULL` (ainda sem dados)

---

### 4. Verificar Operadoras Iniciais

```sql
SELECT nome, ativa FROM public.operadoras ORDER BY nome;
```

**Resultado esperado (8 operadoras):**
- Amil
- Bradesco Saúde
- Hapvida
- NotreDame Intermédica
- Porto Seguro
- Prevent Senior
- SulAmérica
- Unimed

---

## 🧪 TESTAR INSERÇÃO DE LEAD

Após verificar que tudo foi criado, teste inserir um lead:

```sql
-- Inserir lead de teste
INSERT INTO public.insurance_leads (
  nome,
  whatsapp,
  email,
  operadora_atual,
  valor_atual,
  idades,
  economia_estimada,
  valor_proposto,
  status,
  origem
) VALUES (
  'João Silva Teste',
  '+5511999999999',
  'joao@teste.com',
  'Unimed',
  1200.00,
  '[35, 32]'::jsonb,
  250.00,
  950.00,
  'novo',
  'scanner_pdf'
);

-- Verificar se foi criado
SELECT * FROM public.insurance_leads WHERE nome = 'João Silva Teste';

-- Verificar dashboard stats atualizado
SELECT 
  total_leads,
  leads_novos,
  economia_total,
  taxa_conversao
FROM public.dashboard_stats;
```

---

## 🔧 TROUBLESHOOTING

### Erro: "relation already exists"

**Causa:** Algumas tabelas já existem (insurance_leads, por exemplo)

**Solução:** Ignore o erro. O schema usa `CREATE TABLE IF NOT EXISTS`, então é seguro.

---

### Erro: "permission denied"

**Causa:** Service Role Key não tem permissão

**Solução:** 
1. Vá em Settings > API
2. Verifique se RLS está desabilitado nas tabelas
3. Ou execute como admin no SQL Editor (recomendado)

---

### Erro: "syntax error"

**Causa:** Algum caractere especial foi corrompido ao copiar

**Solução:** 
1. Baixe o arquivo SQL diretamente
2. Use "Upload SQL" no SQL Editor ao invés de copiar/colar

---

## ✅ CHECKLIST FINAL

Após executar o schema, confirme:

- [ ] 14 tabelas criadas
- [ ] 6 views funcionando
- [ ] Operadoras inseridas (8 registros)
- [ ] Dashboard stats retorna dados (mesmo que zeros)
- [ ] Consegue inserir lead de teste
- [ ] Views retornam dados do lead de teste

---

## 🚀 PRÓXIMOS PASSOS

Após confirmar que o schema foi aplicado:

1. **Reiniciar servidor Next.js:**
   ```bash
   cd frontend && npm run dev
   ```

2. **Testar Dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

3. **Verificar métricas:**
   - Leads Captados: 1 (se inseriu lead de teste)
   - Economia Total: R$ 250,00
   - Taxa de Conversão: 0%

4. **Testar Scanner PDF:**
   - Upload de PDF com dados do plano
   - Verificar se lead é criado automaticamente

---

## 📞 SUPORTE

Se encontrar problemas:

1. Compartilhe a mensagem de erro completa
2. Informe qual SQL estava executando
3. Verifique os logs no Supabase Dashboard > Logs

---

**Criado em:** 09/02/2026  
**Versão do Schema:** 1.0.0  
**Compatibilidade:** Supabase PostgreSQL 15+
