# 📁 Estrutura do Projeto

```
backend/
│
├── 📄 main.py                          # Aplicação FastAPI principal
├── 📄 requirements.txt                 # Dependências Python
├── 📄 .env.example                     # Exemplo de variáveis de ambiente
├── 📄 .gitignore                       # Arquivos ignorados pelo Git
├── 📄 README.md                        # Documentação principal
├── 📄 start.sh                         # Script de inicialização
├── 📄 package.json                     # Metadados do projeto
│
├── 📂 src/                             # Código fonte
│   ├── 📄 __init__.py
│   │
│   ├── 📂 domain/                      # 🎯 CAMADA DE DOMÍNIO
│   │   ├── 📄 __init__.py
│   │   ├── 📂 entities/                # Entidades de negócio
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 cotacao.py          # Entidade Cotacao e Beneficiario
│   │   └── 📂 value_objects/           # Objetos de valor
│   │       ├── 📄 __init__.py
│   │       └── 📄 operadora.py        # Enums de Operadora e TipoContratacao
│   │
│   ├── 📂 application/                 # 🚀 CAMADA DE APLICAÇÃO
│   │   ├── 📄 __init__.py
│   │   ├── 📂 use_cases/               # Casos de uso
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 calcular_cotacao_use_case.py  # Use case de cálculo
│   │   └── 📂 dtos/                    # Data Transfer Objects
│   │       ├── 📄 __init__.py
│   │       └── 📄 cotacao_dto.py      # DTOs de entrada e saída
│   │
│   ├── 📂 infrastructure/              # 🔧 CAMADA DE INFRAESTRUTURA
│   │   ├── 📄 __init__.py
│   │   ├── 📂 services/                # Serviços
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 servico_calculo_cotacao.py  # Serviço de cálculo (Pandas)
│   │   └── 📂 repositories/            # Repositórios (para futuro)
│   │       └── 📄 __init__.py
│   │
│   └── 📂 presentation/                # 🌐 CAMADA DE APRESENTAÇÃO
│       ├── 📄 __init__.py
│       ├── 📂 controllers/             # Controllers
│       │   ├── 📄 __init__.py
│       │   └── 📄 cotacao_controller.py  # Controller de cotação
│       └── 📂 routers/                 # Routers FastAPI
│           ├── 📄 __init__.py
│           └── 📄 cotacao_router.py   # Rotas de cotação
│
└── 📂 tests/                           # 🧪 TESTES
    ├── 📄 __init__.py
    └── 📄 test_cotacao.py             # Testes da API de cotação
```

## 🏗️ Arquitetura Clean Architecture

### 1. **Domain Layer** (Domínio)
   - **Propósito**: Regras de negócio puras
   - **Contém**: Entidades, Value Objects
   - **Não depende**: De nenhuma outra camada
   - **Exemplo**: `Cotacao`, `Beneficiario`, `Operadora`

### 2. **Application Layer** (Aplicação)
   - **Propósito**: Casos de uso e lógica de aplicação
   - **Contém**: Use Cases, DTOs
   - **Depende**: Apenas do Domain
   - **Exemplo**: `CalcularCotacaoUseCase`

### 3. **Infrastructure Layer** (Infraestrutura)
   - **Propósito**: Implementações técnicas
   - **Contém**: Serviços, Repositórios, Integrações
   - **Depende**: Domain e Application
   - **Exemplo**: `ServicoCalculoCotacao` (usa Pandas)

### 4. **Presentation Layer** (Apresentação)
   - **Propósito**: Interface com o mundo externo
   - **Contém**: Controllers, Routers (FastAPI)
   - **Depende**: Todas as camadas acima
   - **Exemplo**: `CotacaoController`, `cotacao_router`

## 🔄 Fluxo de Dados

```
HTTP Request → Router → Controller → Use Case → Service → Entity
                  ↓         ↓           ↓          ↓         ↓
               FastAPI   Orchestr.   Business   Calculation  Domain
                                      Logic       Logic      Rules
```

## 📝 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `main.py` | Ponto de entrada da aplicação FastAPI |
| `cotacao_router.py` | Define rotas REST da API |
| `cotacao_controller.py` | Orquestra requisições |
| `calcular_cotacao_use_case.py` | Lógica de negócio de cotação |
| `servico_calculo_cotacao.py` | Cálculos com tabelas (Pandas) |
| `cotacao.py` | Entidade de domínio |
| `cotacao_dto.py` | Validação de entrada/saída (Pydantic) |

## 🎯 Benefícios desta Arquitetura

✅ **Testabilidade**: Cada camada pode ser testada isoladamente  
✅ **Manutenibilidade**: Código organizado e fácil de manter  
✅ **Escalabilidade**: Fácil adicionar novas features  
✅ **Independência**: Frameworks podem ser trocados sem afetar o domínio  
✅ **Clareza**: Separação clara de responsabilidades
