# 🚀 Guia de Configuração Supabase - Passo a Passo

## ✅ Checklist Completo

- [ ] **Passo 1:** Criar conta no Supabase
- [ ] **Passo 2:** Criar projeto no Supabase
- [ ] **Passo 3:** Executar script SQL
- [ ] **Passo 4:** Obter credenciais (URL e Keys)
- [ ] **Passo 5:** Configurar backend (.env)
- [ ] **Passo 6:** Testar integração

---

## 📋 Passo 1: Criar Conta no Supabase

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou e-mail
4. Confirme seu e-mail

---

## 🏗️ Passo 2: Criar Projeto

1. No dashboard do Supabase, clique em **"New Project"**
2. Preencha:
   - **Organization:** Escolha ou crie uma organização
   - **Project Name:** `humano-saude` (ou o nome que preferir)
   - **Database Password:** Crie uma senha forte (GUARDE BEM!)
   - **Region:** `South America (São Paulo)` (mais próximo)
   - **Pricing Plan:** `Free` (0$ - até 500MB)

3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos (provisionamento do banco)

---

## 🗄️ Passo 3: Executar Script SQL

### 3.1 Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de banco de dados)
2. Clique em **"New Query"**

### 3.2 Copiar e Executar Script

1. Abra o arquivo: `/database/supabase_schema.sql`
2. **Copie TODO o conteúdo** (Ctrl+A → Ctrl+C)
3. **Cole no SQL Editor** do Supabase
4. Clique em **"RUN"** (ou Ctrl+Enter)

### 3.3 Verificar Sucesso

Você deve ver no resultado:

```
Success. No rows returned
```

Execute para verificar a tabela:

```sql
SELECT * FROM insurance_leads LIMIT 5;
```

Execute para ver as views:

```sql
SELECT * FROM dashboard_stats;
```

---

## 🔑 Passo 4: Obter Credenciais

### 4.1 Encontrar URL e Keys

1. No menu lateral, clique em **"Settings"** (engrenagem)
2. Clique em **"API"** no submenu

### 4.2 Copiar Informações

Você verá 3 informações importantes:

#### **Project URL:**
```
https://xxxxxxxxxxxx.supabase.co
```

#### **anon public (API Key):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **service_role (Secret Key):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE:**
- **anon public**: Use no frontend (segura para expor)
- **service_role**: Use APENAS no backend (NUNCA exponha!)

---

## ⚙️ Passo 5: Configurar Backend

### 5.1 Abrir arquivo .env

No backend, abra: `/backend/.env`

### 5.2 Substituir Valores

```properties
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cole:**
- **SUPABASE_URL:** Project URL
- **SUPABASE_KEY:** anon public key
- **SUPABASE_SERVICE_KEY:** service_role key (opcional)

### 5.3 Salvar e Reiniciar

1. Salve o arquivo (Ctrl+S)
2. Reinicie o servidor backend

---

## 🧪 Passo 6: Testar Integração

### 6.1 Iniciar Backend

```bash
cd backend
source venv/bin/activate  # Mac/Linux
python main.py
```

Você deve ver:

```
✅ Conexão com Supabase estabelecida
INFO: Uvicorn running on http://0.0.0.0:8000
```

### 6.2 Testar Endpoints

Abra: http://localhost:8000/docs

#### **Teste 1: Criar Lead**

Endpoint: `POST /api/v1/leads/`

JSON:
```json
{
  "nome": "João Silva Teste",
  "whatsapp": "+5511999999999",
  "email": "joao@teste.com",
  "operadora_atual": "Unimed",
  "valor_atual": 1200.00,
  "idades": [35, 32],
  "economia_estimada": 250.00,
  "valor_proposto": 950.00,
  "tipo_contratacao": "PF"
}
```

**Resposta esperada:**
```json
{
  "mensagem": "Lead criado com sucesso",
  "lead": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva Teste",
    "status": "novo",
    ...
  }
}
```

#### **Teste 2: Listar Leads**

Endpoint: `GET /api/v1/leads/`

**Resposta esperada:**
```json
{
  "total": 1,
  "limite": 50,
  "offset": 0,
  "leads": [
    {
      "id": "...",
      "nome": "João Silva Teste",
      "status": "novo"
    }
  ]
}
```

#### **Teste 3: Estatísticas**

Endpoint: `GET /api/v1/leads/estatisticas/dashboard`

**Resposta esperada:**
```json
{
  "total_leads": 1,
  "leads_novos": 1,
  "economia_total": 250.00,
  ...
}
```

---

## ✅ Verificação Final

### No Supabase Dashboard

1. Vá em **"Table Editor"** (menu lateral)
2. Selecione a tabela **`insurance_leads`**
3. Você deve ver o lead criado!

---

## 🐛 Troubleshooting

### Erro: "Banco de dados não configurado"

**Causa:** Variáveis SUPABASE_URL ou SUPABASE_KEY não configuradas

**Solução:**
1. Verifique se o .env está correto
2. Reinicie o servidor backend
3. Verifique os logs no terminal

### Erro: "Invalid API key"

**Causa:** Key incorreta no .env

**Solução:**
1. Volte em Settings > API no Supabase
2. Copie novamente a key
3. Cole no .env (sem espaços extras)

### Erro: "relation does not exist"

**Causa:** Script SQL não foi executado

**Solução:**
1. Volte ao SQL Editor
2. Execute o script `supabase_schema.sql` novamente

### Erro: "Connection refused"

**Causa:** Projeto Supabase pausado (inatividade)

**Solução:**
1. Acesse o dashboard do Supabase
2. Clique em "Resume project"

---

## 📊 Monitoramento

### Ver Logs do Supabase

1. Menu lateral: **"Logs"**
2. Selecione: **"Postgres Logs"**
3. Veja as queries em tempo real

### Explorar Dados

1. Menu lateral: **"Table Editor"**
2. Selecione `insurance_leads`
3. Edite, delete, filtre leads manualmente

---

## 🔒 Segurança

### Boas Práticas

✅ **FAÇA:**
- Use `anon public` key no frontend
- Use `service_role` key APENAS no backend
- Adicione `.env` no `.gitignore`
- Ative RLS (Row Level Security) em produção

❌ **NÃO FAÇA:**
- Commitar keys no GitHub
- Compartilhar service_role key
- Expor keys em código frontend

### Ativar RLS (Opcional)

No SQL Editor:

```sql
ALTER TABLE insurance_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo para usuários autenticados"
  ON insurance_leads
  FOR ALL
  USING (auth.uid() IS NOT NULL);
```

---

## 📖 Recursos Adicionais

- **Documentação Supabase:** https://supabase.com/docs
- **SQL Cheat Sheet:** https://supabase.com/docs/guides/database
- **Pydantic Models:** /backend/src/presentation/routers/lead_router.py

---

## 🎉 Tudo Pronto!

Agora você tem:

✅ Banco de dados PostgreSQL configurado
✅ Tabela `insurance_leads` criada
✅ 3 Views analíticas funcionando
✅ Backend integrado com Supabase
✅ 6 endpoints REST operacionais
✅ Sistema pronto para receber leads!

**Próximo passo:** Integrar o frontend para salvar leads automaticamente após o scan do PDF! 🚀
