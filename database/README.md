# 🗄️ Banco de Dados - Humano Saúde

## 📋 Visão Geral

Este diretório contém os scripts SQL para configurar o banco de dados PostgreSQL no Supabase.

---

## 🚀 Setup Rápido

### 1️⃣ Acesse o Supabase

1. Faça login em: https://supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)

### 2️⃣ Execute o Script

1. Clique em **New Query**
2. Copie todo o conteúdo de `supabase_schema.sql`
3. Cole no editor
4. Clique em **RUN** ou pressione `Ctrl+Enter`

### 3️⃣ Verifique a Instalação

Execute no SQL Editor:

```sql
-- Ver tabela criada
SELECT * FROM public.insurance_leads LIMIT 5;

-- Ver estatísticas
SELECT * FROM public.dashboard_stats;
```

---

## 📊 Estrutura do Banco

### **Tabela: `insurance_leads`**

Armazena todos os leads captados pela IA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único (auto) |
| `created_at` | TIMESTAMPTZ | Data de criação (auto) |
| `updated_at` | TIMESTAMPTZ | Última atualização (auto) |
| `nome` | VARCHAR(255) | Nome completo do lead |
| `whatsapp` | VARCHAR(20) | Telefone/WhatsApp |
| `email` | VARCHAR(255) | E-mail (opcional) |
| `operadora_atual` | VARCHAR(100) | Operadora atual do plano |
| `valor_atual` | DECIMAL(10,2) | Valor mensal atual |
| `idades` | JSONB | Array de idades `[35, 32]` |
| `economia_estimada` | DECIMAL(10,2) | Economia calculada |
| `valor_proposto` | DECIMAL(10,2) | Valor da proposta |
| `tipo_contratacao` | VARCHAR(50) | Tipo: PF ou PME |
| `status` | VARCHAR(50) | Status do lead (default: 'novo') |
| `origem` | VARCHAR(50) | Origem: scanner_pdf, meta_ads, manual |
| `prioridade` | VARCHAR(20) | baixa, media, alta |
| `observacoes` | TEXT | Observações gerais |
| `dados_pdf` | JSONB | Dados brutos extraídos do PDF |
| `historico` | JSONB | Array de eventos `[{...}]` |
| `atribuido_a` | UUID | ID do corretor responsável |
| `arquivado` | BOOLEAN | Lead arquivado (default: false) |

#### **Status Possíveis:**
- `novo` - Lead acabou de chegar
- `contatado` - Primeiro contato feito
- `negociacao` - Em negociação
- `proposta_enviada` - Proposta formal enviada
- `ganho` - Cliente fechado! 🎉
- `perdido` - Lead perdido
- `pausado` - Temporariamente pausado

---

### **VIEW: `dashboard_stats`**

Estatísticas gerais do dashboard.

```sql
SELECT * FROM dashboard_stats;
```

**Retorna:**
- `total_leads` - Total de leads
- `leads_mes_atual` - Leads dos últimos 30 dias
- `leads_semana_atual` - Leads dos últimos 7 dias
- `leads_hoje` - Leads de hoje
- `leads_novos` - Leads com status 'novo'
- `leads_ganhos` - Leads convertidos
- `economia_total` - Soma de toda economia gerada
- `economia_mes_atual` - Economia do mês
- `taxa_conversao` - % de conversão
- `tempo_medio_conversao_dias` - Tempo médio até fechar
- E mais...

---

### **VIEW: `leads_por_operadora`**

Agrupa leads por operadora.

```sql
SELECT * FROM leads_por_operadora;
```

**Retorna:**
- Operadora
- Total de leads
- Ticket médio
- Economia total
- Leads convertidos

---

### **VIEW: `pipeline_vendas`**

Visão do funil de vendas.

```sql
SELECT * FROM pipeline_vendas;
```

**Retorna:**
- Status
- Quantidade de leads
- Valor total
- Ticket médio
- Percentual do total

---

## 🔧 Funções SQL

### **1. Adicionar Lead do Scanner**

```sql
SELECT adicionar_lead_scanner(
  'João Silva',                    -- nome
  '+5511999999999',                -- whatsapp
  'joao@email.com',                -- email
  'Unimed',                        -- operadora_atual
  1200.00,                         -- valor_atual
  '[35, 32]'::jsonb,              -- idades
  250.00,                          -- economia_estimada
  950.00,                          -- valor_proposto
  '{"confianca": "alta"}'::jsonb  -- dados_pdf
);
```

**Retorna:** UUID do lead criado

---

### **2. Atualizar Status**

```sql
SELECT atualizar_status_lead(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- lead_id
  'contatado',                                     -- novo_status
  'Primeira ligação feita, cliente interessado'   -- observacao
);
```

**Retorna:** `true` se atualizado com sucesso

---

## 📝 Exemplos de Queries

### Listar leads novos

```sql
SELECT 
  id,
  nome,
  whatsapp,
  operadora_atual,
  valor_atual,
  economia_estimada,
  created_at
FROM insurance_leads
WHERE status = 'novo'
  AND arquivado = FALSE
ORDER BY created_at DESC;
```

### Buscar por WhatsApp

```sql
SELECT * FROM insurance_leads
WHERE whatsapp = '+5511999999999';
```

### Leads criados hoje

```sql
SELECT * FROM insurance_leads
WHERE DATE(created_at) = CURRENT_DATE;
```

### Top 10 maiores economias

```sql
SELECT 
  nome,
  whatsapp,
  economia_estimada,
  status
FROM insurance_leads
WHERE economia_estimada IS NOT NULL
ORDER BY economia_estimada DESC
LIMIT 10;
```

### Histórico de um lead

```sql
SELECT 
  nome,
  jsonb_pretty(historico) as historico_formatado
FROM insurance_leads
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

---

## 🔐 Segurança (RLS)

O script inclui políticas de Row Level Security **comentadas**.

Para ativar segurança por usuário:

1. Descomente as linhas de RLS no script
2. Configure autenticação no Supabase
3. Os usuários verão apenas:
   - Leads atribuídos a eles
   - Leads não atribuídos
   - Admins veem tudo

---

## 🧪 Dados de Teste

Para popular com dados de exemplo:

```sql
INSERT INTO public.insurance_leads (
  nome, whatsapp, email, operadora_atual, valor_atual, 
  idades, economia_estimada, valor_proposto, status
) VALUES
  ('João Silva', '+5511999999999', 'joao@email.com', 'Unimed', 1200.00, 
   '[35, 32]'::jsonb, 250.00, 950.00, 'novo'),
  ('Maria Santos', '+5511988888888', 'maria@email.com', 'Bradesco', 1500.00, 
   '[42, 40, 10]'::jsonb, 300.00, 1200.00, 'contatado'),
  ('Pedro Costa', '+5511977777777', 'pedro@email.com', 'Amil', 980.00, 
   '[28]'::jsonb, 150.00, 830.00, 'negociacao');
```

---

## 📊 Monitoramento

### Ver últimos 10 leads

```sql
SELECT 
  id,
  nome,
  status,
  economia_estimada,
  created_at
FROM insurance_leads
ORDER BY created_at DESC
LIMIT 10;
```

### Dashboard Stats em Tempo Real

```sql
SELECT 
  total_leads,
  leads_hoje,
  leads_novos,
  economia_total,
  taxa_conversao
FROM dashboard_stats;
```

---

## 🔄 Manutenção

### Limpar leads arquivados antigos (>90 dias)

```sql
DELETE FROM insurance_leads
WHERE arquivado = TRUE
  AND updated_at < NOW() - INTERVAL '90 days';
```

### Backup da tabela

```sql
-- Via Supabase Dashboard:
-- Database > Backups > Create Backup
```

---

## 🚨 Troubleshooting

### Erro: "relation already exists"

```sql
DROP TABLE IF EXISTS insurance_leads CASCADE;
-- Execute o script novamente
```

### Ver tamanho da tabela

```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('insurance_leads')) as tamanho_total;
```

### Reindexar

```sql
REINDEX TABLE insurance_leads;
```

---

## 📞 Suporte

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## ✅ Checklist de Instalação

- [ ] Criou conta no Supabase
- [ ] Criou projeto no Supabase
- [ ] Executou `supabase_schema.sql` no SQL Editor
- [ ] Verificou tabela: `SELECT * FROM insurance_leads`
- [ ] Verificou view: `SELECT * FROM dashboard_stats`
- [ ] Testou função: `SELECT adicionar_lead_scanner(...)`
- [ ] Configurou variáveis de ambiente no backend
- [ ] Integrou com API do backend

---

🎉 **Banco configurado com sucesso!** Agora os leads podem ser salvos e gerenciados.
