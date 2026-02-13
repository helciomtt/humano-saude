# 🏥 HUMANO SAÚDE - BACKEND PYTHON/FASTAPI
## Projeto Completo - Clean Architecture

---

## ✅ ESTRUTURA CRIADA

```
backend/
├── 📄 main.py                    ← Aplicação FastAPI principal
├── 📄 requirements.txt           ← Dependências Python
├── 📄 .env.example               ← Variáveis de ambiente
├── 📄 .gitignore                 ← Git ignore
├── 📄 README.md                  ← Documentação
├── 📄 STRUCTURE.md               ← Detalhes da arquitetura
├── 📄 API_EXAMPLES.md            ← Exemplos de uso
├── 📄 start.sh                   ← Script de inicialização
├── 📄 Dockerfile                 ← Container Docker
├── 📄 docker-compose.yml         ← Orquestração
│
├── 📂 src/
│   ├── 📂 domain/                ← CAMADA DE DOMÍNIO
│   │   ├── entities/
│   │   │   └── cotacao.py       ← Entidades Cotacao, Beneficiario
│   │   └── value_objects/
│   │       └── operadora.py     ← Enums Operadora, TipoContratacao
│   │
│   ├── 📂 application/           ← CAMADA DE APLICAÇÃO
│   │   ├── use_cases/
│   │   │   └── calcular_cotacao_use_case.py  ← Caso de uso
│   │   └── dtos/
│   │       └── cotacao_dto.py   ← DTOs (Pydantic)
│   │
│   ├── 📂 infrastructure/        ← CAMADA DE INFRAESTRUTURA
│   │   ├── services/
│   │   │   └── servico_calculo_cotacao.py   ← Cálculos (Pandas)
│   │   └── repositories/
│   │
│   └── 📂 presentation/          ← CAMADA DE APRESENTAÇÃO
│       ├── controllers/
│       │   └── cotacao_controller.py        ← Controller
│       └── routers/
│           └── cotacao_router.py            ← Rotas FastAPI
│
└── 📂 tests/
    └── test_cotacao.py           ← Testes automatizados
```

---

## 🚀 COMANDOS PARA INICIAR

### 1️⃣ Opção 1: Script Automático (Recomendado)
```bash
cd backend
./start.sh
```

### 2️⃣ Opção 2: Manual
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python main.py
```

### 3️⃣ Opção 3: Docker
```bash
cd backend
docker-compose up --build
```

---

## 📡 ENDPOINTS DISPONÍVEIS

### ✅ Health Check
```bash
GET http://localhost:8000/health
```

### 📊 Calcular Cotação
```bash
POST http://localhost:8000/api/v1/cotacao/calcular

Body:
{
  "idades": [30, 5],
  "tipo": "ADESAO",
  "operadora": "AMIL"
}
```

### 🏥 Listar Operadoras
```bash
GET http://localhost:8000/api/v1/cotacao/operadoras
```

### 📚 Documentação Swagger
```
http://localhost:8000/docs
```

---

## 🧪 EXEMPLO DE RESPOSTA

```json
{
  "operadora": "AMIL",
  "tipo_contratacao": "ADESAO",
  "plano": "PLANO_PADRAO",
  "quantidade_beneficiarios": 2,
  "valores_individuais": [
    {
      "idade": 30,
      "valor": 402.50,
      "faixa_etaria": "30-39 anos"
    },
    {
      "idade": 5,
      "valor": 172.50,
      "faixa_etaria": "0-17 anos"
    }
  ],
  "valor_total": 575.00,
  "desconto_aplicado": 0.00,
  "valor_final": 575.00,
  "observacoes": [
    "Cotação inclui criança(s) - verificar cobertura pediátrica"
  ]
}
```

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

```
fastapi          → Framework web
uvicorn          → ASGI server
pydantic         → Validação de dados
pandas           → Tabelas de preços
pypdf            → Leitura de PDFs
openai           → Integração IA (futuro)
pytest           → Testes
```

---

## 🏗️ CLEAN ARCHITECTURE

```
HTTP Request
    ↓
Router (FastAPI)
    ↓
Controller
    ↓
Use Case ← Domain Entities
    ↓
Service (Infrastructure)
    ↓
Response (DTO)
```

### Camadas:
1. **Domain**: Regras de negócio puras (Entidades)
2. **Application**: Casos de uso (CalcularCotacao)
3. **Infrastructure**: Implementações técnicas (Pandas)
4. **Presentation**: API REST (FastAPI)

---

## 🎯 FUNCIONALIDADES

✅ Cálculo de cotações por idade  
✅ Múltiplas operadoras (AMIL, BRADESCO, etc)  
✅ Tipos de contratação (ADESAO, PME, EMPRESARIAL)  
✅ Descontos progressivos  
✅ Validação com Pydantic  
✅ Documentação automática  
✅ Testes automatizados  
✅ Docker ready  
✅ CORS configurado  

---

## 🔜 PRÓXIMAS FEATURES

- [ ] Processamento de PDFs de apólices
- [ ] Integração com OpenAI
- [ ] Autenticação JWT
- [ ] Banco de dados PostgreSQL
- [ ] Cache Redis
- [ ] Logs estruturados
- [ ] CI/CD Pipeline

---

## 📝 ARQUIVOS IMPORTANTES

| Arquivo | Função |
|---------|--------|
| `main.py` | Ponto de entrada FastAPI |
| `requirements.txt` | Dependências |
| `README.md` | Documentação completa |
| `API_EXAMPLES.md` | Exemplos de uso |
| `STRUCTURE.md` | Detalhes da arquitetura |
| `start.sh` | Script de inicialização |

---

## 🧪 RODAR TESTES

```bash
cd backend
source venv/bin/activate
pytest
```

Com cobertura:
```bash
pytest --cov=src tests/
```

---

## 🌐 ACESSAR APLICAÇÃO

Após iniciar:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/health

---

## ✨ DESTAQUES DO PROJETO

🎯 **Clean Architecture**: Código organizado e escalável  
🚀 **FastAPI**: Performance e documentação automática  
📊 **Pandas**: Cálculos complexos com tabelas  
✅ **Validação**: Pydantic para entrada/saída  
🧪 **Testes**: Cobertura de testes automatizados  
🐳 **Docker**: Containerizado e pronto para deploy  
📚 **Documentação**: Swagger/ReDoc automático  

---

## 🎓 CONCEITOS APLICADOS

- Clean Architecture
- SOLID Principles
- Dependency Injection
- DTO Pattern
- Use Case Pattern
- Repository Pattern
- RESTful API Design
- Test-Driven Development (TDD)

---

**🏥 Humano Saúde - Revolucionando o mercado de seguros © 2026**
