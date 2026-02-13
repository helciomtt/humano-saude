# 🚀 Exemplos de Uso da API

## 📌 Base URL
```
http://localhost:8000
```

## 🔗 Endpoints Disponíveis

### 1. Health Check

```bash
GET /health
```

**Resposta:**
```json
{
  "status": "healthy",
  "service": "humano-saude-backend",
  "architecture": "Clean Architecture",
  "framework": "FastAPI"
}
```

---

### 2. Informações da API

```bash
GET /api/v1/info
```

**Resposta:**
```json
{
  "name": "Humano Saúde Backend",
  "version": "1.0.0",
  "endpoints": {
    "cotacao": "/api/v1/cotacao",
    "health": "/health",
    "docs": "/docs"
  },
  "features": [
    "Cálculo de cotações de planos de saúde",
    "Processamento de documentos (futuro)",
    "Integração com OpenAI (futuro)"
  ]
}
```

---

### 3. Listar Operadoras

```bash
GET /api/v1/cotacao/operadoras
```

**Resposta:**
```json
{
  "operadoras": [
    "AMIL",
    "BRADESCO",
    "SULAMERICA",
    "UNIMED",
    "NOTREDAME",
    "HAPVIDA"
  ]
}
```

---

### 4. Calcular Cotação

```bash
POST /api/v1/cotacao/calcular
Content-Type: application/json
```

#### Exemplo 1: Casal com 1 filho

**Request:**
```json
{
  "idades": [30, 28, 5],
  "tipo": "ADESAO",
  "operadora": "AMIL"
}
```

**Response:**
```json
{
  "operadora": "AMIL",
  "tipo_contratacao": "ADESAO",
  "plano": "PLANO_PADRAO",
  "quantidade_beneficiarios": 3,
  "valores_individuais": [
    {
      "idade": 30,
      "valor": 402.50,
      "faixa_etaria": "30-39 anos"
    },
    {
      "idade": 28,
      "valor": 287.50,
      "faixa_etaria": "18-29 anos"
    },
    {
      "idade": 5,
      "valor": 172.50,
      "faixa_etaria": "0-17 anos"
    }
  ],
  "valor_total": 862.50,
  "desconto_aplicado": 43.13,
  "valor_final": 819.37,
  "observacoes": [
    "Cotação inclui criança(s) - verificar cobertura pediátrica",
    "Desconto de 5% aplicado"
  ]
}
```

#### Exemplo 2: Família numerosa

**Request:**
```json
{
  "idades": [45, 42, 18, 15, 10],
  "tipo": "PME",
  "operadora": "UNIMED"
}
```

**Response:**
```json
{
  "operadora": "UNIMED",
  "tipo_contratacao": "PME",
  "plano": "PLANO_PADRAO",
  "quantidade_beneficiarios": 5,
  "valores_individuais": [
    {
      "idade": 45,
      "valor": 546.00,
      "faixa_etaria": "40-49 anos"
    },
    {
      "idade": 42,
      "valor": 546.00,
      "faixa_etaria": "40-49 anos"
    },
    {
      "idade": 18,
      "valor": 294.00,
      "faixa_etaria": "18-29 anos"
    },
    {
      "idade": 15,
      "valor": 189.00,
      "faixa_etaria": "0-17 anos"
    },
    {
      "idade": 10,
      "valor": 189.00,
      "faixa_etaria": "0-17 anos"
    }
  ],
  "valor_total": 1764.00,
  "desconto_aplicado": 176.40,
  "valor_final": 1587.60,
  "observacoes": [
    "Cotação inclui criança(s) - verificar cobertura pediátrica",
    "Desconto de 10% aplicado por família numerosa"
  ]
}
```

#### Exemplo 3: Idoso

**Request:**
```json
{
  "idades": [65],
  "tipo": "ADESAO",
  "operadora": "SULAMERICA"
}
```

**Response:**
```json
{
  "operadora": "SULAMERICA",
  "tipo_contratacao": "ADESAO",
  "plano": "PLANO_PADRAO",
  "quantidade_beneficiarios": 1,
  "valores_individuais": [
    {
      "idade": 65,
      "valor": 1020.00,
      "faixa_etaria": "60+ anos"
    }
  ],
  "valor_total": 1020.00,
  "desconto_aplicado": 0.00,
  "valor_final": 1020.00,
  "observacoes": [
    "Cotação inclui beneficiário(s) idoso(s) - pode requerer carência"
  ]
}
```

---

## 🧪 Testando com cURL

### Exemplo completo com cURL:

```bash
curl -X POST "http://localhost:8000/api/v1/cotacao/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "idades": [30, 5],
    "tipo": "ADESAO",
    "operadora": "AMIL"
  }'
```

---

## 🔧 Testando com HTTPie

```bash
http POST http://localhost:8000/api/v1/cotacao/calcular \
  idades:='[30, 5]' \
  tipo="ADESAO" \
  operadora="AMIL"
```

---

## 🐍 Testando com Python

```python
import requests

url = "http://localhost:8000/api/v1/cotacao/calcular"

payload = {
    "idades": [30, 5],
    "tipo": "ADESAO",
    "operadora": "AMIL"
}

response = requests.post(url, json=payload)
print(response.json())
```

---

## 🌐 Testando com JavaScript (Fetch)

```javascript
fetch('http://localhost:8000/api/v1/cotacao/calcular', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    idades: [30, 5],
    tipo: 'ADESAO',
    operadora: 'AMIL'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## ❌ Tratamento de Erros

### Idade inválida

**Request:**
```json
{
  "idades": [150],
  "tipo": "ADESAO",
  "operadora": "AMIL"
}
```

**Response (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "idades", 0],
      "msg": "Idade deve estar entre 0 e 120 anos",
      "type": "value_error"
    }
  ]
}
```

### Tipo de contratação inválido

**Request:**
```json
{
  "idades": [30],
  "tipo": "INVALIDO",
  "operadora": "AMIL"
}
```

**Response (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "tipo"],
      "msg": "Tipo deve ser um de: ['ADESAO', 'PME', 'EMPRESARIAL']",
      "type": "value_error"
    }
  ]
}
```

---

## 📚 Documentação Interativa

Acesse a documentação interativa Swagger em:
```
http://localhost:8000/docs
```

Ou a documentação ReDoc:
```
http://localhost:8000/redoc
```

---

## 🎯 Regras de Desconto

- **3-4 beneficiários**: 5% de desconto
- **5+ beneficiários**: 10% de desconto

## 🏥 Operadoras Disponíveis

| Operadora | Multiplicador |
|-----------|---------------|
| HAPVIDA | 1.00x (base) |
| UNIMED | 1.05x |
| BRADESCO | 1.10x |
| AMIL | 1.15x |
| NOTREDAME | 1.18x |
| SULAMERICA | 1.20x |

## 📊 Faixas Etárias

| Faixa | Idade |
|-------|-------|
| 0-17 anos | Crianças e adolescentes |
| 18-29 anos | Jovens adultos |
| 30-39 anos | Adultos |
| 40-49 anos | Meia idade |
| 50-59 anos | Pré-idosos |
| 60+ anos | Idosos |
