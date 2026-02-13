# 🏥 Humano Saúde - Backend API

Backend Python do projeto **Humano Saúde** construído com **FastAPI** seguindo os princípios de **Clean Architecture**.

## 🏗️ Arquitetura

O projeto segue Clean Architecture com 4 camadas principais:

```
backend/
├── src/
│   ├── domain/              # Camada de Domínio
│   │   ├── entities/        # Entidades de negócio
│   │   └── value_objects/   # Objetos de valor
│   ├── application/         # Camada de Aplicação
│   │   ├── use_cases/       # Casos de uso
│   │   └── dtos/            # Data Transfer Objects
│   ├── infrastructure/      # Camada de Infraestrutura
│   │   ├── services/        # Serviços (cálculos, integrações)
│   │   └── repositories/    # Repositórios (dados)
│   └── presentation/        # Camada de Apresentação
│       ├── controllers/     # Controllers
│       └── routers/         # Routers FastAPI
├── tests/                   # Testes
├── main.py                  # Aplicação principal
└── requirements.txt         # Dependências
```

## 🚀 Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **Uvicorn** - ASGI server
- **Pydantic** - Validação de dados
- **Pandas** - Processamento de tabelas de preços
- **PyPDF** - Leitura de documentos PDF
- **OpenAI** - Integração com IA (futuro)

## 📦 Instalação

### 1. Criar ambiente virtual

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## ▶️ Execução

### Modo desenvolvimento (com hot reload)

```bash
python main.py
```

ou

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Modo produção

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

A API estará disponível em:
- **API**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **Documentação ReDoc**: http://localhost:8000/redoc

## 📋 Endpoints Principais

### Cotação

- **POST** `/api/v1/cotacao/calcular` - Calcular cotação
- **GET** `/api/v1/cotacao/operadoras` - Listar operadoras
- **GET** `/api/v1/cotacao/health` - Health check

### PDF (Novo! 🆕)

- **POST** `/api/v1/pdf/extrair` - Extrair dados de PDF com IA
- **GET** `/api/v1/pdf/health` - Health check PDF service

### Exemplo de Requisição

```bash
curl -X POST "http://localhost:8000/api/v1/cotacao/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "idades": [30, 5],
    "tipo": "ADESAO",
    "operadora": "AMIL"
  }'
```

### Exemplo de Resposta

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

## 🧪 Testes

```bash
pytest
```

Com cobertura:

```bash
pytest --cov=src tests/
```

## 📊 Regras de Negócio

### Faixas Etárias

- 0-17 anos
- 18-29 anos
- 30-39 anos
- 40-49 anos
- 50-59 anos
- 60+ anos

### Tipos de Contratação

- **ADESAO**: Planos individuais
- **PME**: Pequenas e médias empresas
- **EMPRESARIAL**: Grandes empresas

### Descontos

- 3-4 beneficiários: 5% de desconto
- 5+ beneficiários: 10% de desconto

### Operadoras Disponíveis

- AMIL
- BRADESCO
- SULAMERICA
- UNIMED
- NOTREDAME
- HAPVIDA

## 🔄 Próximas Funcionalidades

- [ ] Processamento de PDFs de apólices
- [ ] Integração com OpenAI para análise de documentos
- [ ] Autenticação JWT
- [ ] Banco de dados PostgreSQL
- [ ] Cache com Redis
- [ ] Testes automatizados completos
- [ ] CI/CD Pipeline
- [ ] Docker/Kubernetes

## 📝 Convenções de Código

- Seguir PEP 8
- Docstrings em português
- Type hints obrigatórios
- Testes para casos de uso críticos

## 🤝 Contribuição

1. Criar branch feature
2. Implementar mudanças
3. Adicionar testes
4. Submeter Pull Request

## 📄 Licença

Projeto proprietário - Humano Saúde © 2026

---

**Desenvolvido com ❤️ para revolucionar o mercado de seguros de saúde**
