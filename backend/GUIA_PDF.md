# 📄 Guia de Uso - Extração de PDF com IA

## 🎯 Endpoint: POST /api/v1/pdf/extrair

### Descrição
Faz upload de um PDF de apólice ou proposta de plano de saúde e extrai automaticamente dados estruturados usando IA (GPT-4o-mini).

### Dados Extraídos
- ✅ **Idades** dos beneficiários
- ✅ **Operadora** (AMIL, BRADESCO, etc)
- ✅ **Valor atual** do plano
- ✅ **Tipo de contratação** (ADESAO, PME, EMPRESARIAL)
- ✅ **Nomes** dos beneficiários
- ✅ **Observações** relevantes

---

## 🔧 Como Usar

### 1. Via cURL

```bash
curl -X POST "http://localhost:8000/api/v1/pdf/extrair" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/caminho/para/seu/arquivo.pdf"
```

### 2. Via Python (requests)

```python
import requests

url = "http://localhost:8000/api/v1/pdf/extrair"
files = {'file': open('apolice.pdf', 'rb')}

response = requests.post(url, files=files)
dados = response.json()

print(f"Idades: {dados['idades']}")
print(f"Operadora: {dados['operadora']}")
print(f"Valor: R$ {dados['valor_atual']}")
```

### 3. Via JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/api/v1/pdf/extrair', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Dados extraídos:', data);
});
```

### 4. Via Swagger UI

1. Acesse: http://localhost:8000/docs
2. Encontre o endpoint **POST /api/v1/pdf/extrair**
3. Clique em "Try it out"
4. Faça upload do PDF
5. Clique em "Execute"

---

## 📤 Exemplo de Resposta

```json
{
  "idades": [30, 28, 5],
  "operadora": "AMIL",
  "valor_atual": 1250.50,
  "tipo_plano": "ADESAO",
  "nome_beneficiarios": [
    "João Silva",
    "Maria Silva",
    "Pedro Silva"
  ],
  "observacoes": "Plano com cobertura nacional. Carência de 24 meses para cirurgias.",
  "confianca": "alta",
  "texto_extraido_preview": "PROPOSTA DE ADESÃO - PLANO DE SAÚDE\nOperadora: AMIL...",
  "total_caracteres": 2543
}
```

---

## ⚠️ Validações

| Validação | Descrição |
|-----------|-----------|
| **Tipo de arquivo** | Apenas `.pdf` |
| **Tamanho máximo** | 10 MB |
| **Conteúdo mínimo** | Pelo menos 50 caracteres |

---

## ❌ Possíveis Erros

### 400 - Bad Request
```json
{
  "detail": "Apenas arquivos PDF são aceitos"
}
```

### 413 - Request Entity Too Large
```json
{
  "detail": "Arquivo muito grande. Máximo: 10MB"
}
```

### 500 - Internal Server Error
```json
{
  "detail": "Erro ao processar PDF: [detalhes do erro]"
}
```

---

## 🧠 Como Funciona (Pipeline)

```
1. Upload do PDF
   ↓
2. Validação (tipo e tamanho)
   ↓
3. Extração de texto (PyPDF)
   ↓
4. Análise com IA (OpenAI GPT-4o-mini)
   ↓
5. Validação e normalização dos dados
   ↓
6. Retorno JSON estruturado
```

---

## 🔐 Configuração da API Key

A chave da OpenAI deve estar no arquivo `.env`:

```bash
OPENAI_API_KEY=sk-proj-...
```

⚠️ **IMPORTANTE**: Nunca commit o arquivo `.env` no Git!

---

## 💡 Dicas de Uso

### Para melhorar a precisão:
- ✅ Use PDFs com texto (não imagens escaneadas)
- ✅ PDFs com layout organizado
- ✅ Informações claras e legíveis

### Para testar:
1. Crie um PDF simples com dados de teste
2. Use o Swagger UI para upload interativo
3. Verifique o campo `confianca` na resposta

---

## 🔄 Integração com Fluxo de Cotação

Você pode usar os dados extraídos para gerar cotação automaticamente:

```python
# 1. Extrair dados do PDF
response_pdf = requests.post(
    'http://localhost:8000/api/v1/pdf/extrair',
    files={'file': open('apolice.pdf', 'rb')}
)
dados_pdf = response_pdf.json()

# 2. Usar dados para calcular nova cotação
payload_cotacao = {
    "idades": dados_pdf['idades'],
    "tipo": dados_pdf['tipo_plano'] or "ADESAO",
    "operadora": dados_pdf['operadora']
}

response_cotacao = requests.post(
    'http://localhost:8000/api/v1/cotacao/calcular',
    json=payload_cotacao
)

nova_cotacao = response_cotacao.json()
print(f"Valor atual: R$ {dados_pdf['valor_atual']}")
print(f"Nova cotação: R$ {nova_cotacao['valor_final']}")
```

---

## 🎨 Exemplo de Interface Frontend

```typescript
async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/pdf/extrair', {
    method: 'POST',
    body: formData
  });

  const dados = await response.json();
  
  // Preencher formulário automaticamente
  setIdades(dados.idades);
  setOperadora(dados.operadora);
  setValorAtual(dados.valor_atual);
}
```

---

## 📊 Métricas e Custos (OpenAI)

### Custo Estimado por Análise:
- Modelo: `gpt-4o-mini`
- Custo: ~$0.01 - $0.05 por PDF (dependendo do tamanho)
- Tempo: 2-5 segundos

### Otimizações:
- ✅ Temperatura baixa (0.1) para consistência
- ✅ Response format JSON forçado
- ✅ Cache de resultados (futuro)

---

## 🚀 Próximas Features

- [ ] Suporte a múltiplos PDFs em batch
- [ ] OCR para PDFs escaneados
- [ ] Cache de resultados
- [ ] Comparação de apólices
- [ ] Extração de histórico de sinistros
- [ ] Análise de cobertura do plano

---

**🏥 Humano Saúde - Extração Inteligente de Documentos com IA**
