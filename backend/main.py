"""
HUMANO SAÚDE - Backend API
FastAPI application para cálculos de seguros e processamento de documentos

Arquitetura: Clean Architecture
- Domain: Entidades e Value Objects
- Application: Use Cases e DTOs
- Infrastructure: Serviços e Repositórios
- Presentation: Controllers e Routers (FastAPI)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from src.presentation.routers import cotacao_router, pdf_router, lead_router

# Configuração da aplicação
app = FastAPI(
    title="Humano Saúde API",
    description="API para cálculo de cotações e processamento de documentos de seguros",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração de CORS para integração com frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend local
        "http://localhost:5173",  # Vite
        "http://localhost:8080",  # Vue
        "*"  # Permitir todas as origens (ajustar em produção)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(cotacao_router.router, prefix="/api/v1")
app.include_router(pdf_router.router, prefix="/api/v1")
app.include_router(lead_router.router)  # Já tem prefix="/api/v1/leads" no router


# Rotas principais
@app.get("/", tags=["Root"])
async def root():
    """Endpoint raiz da API"""
    return {
        "message": "Humano Saúde API - Backend Python",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "operational"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check geral da aplicação"""
    return {
        "status": "healthy",
        "service": "humano-saude-backend",
        "architecture": "Clean Architecture",
        "framework": "FastAPI"
    }


@app.get("/api/v1/info", tags=["Info"])
async def api_info():
    """Informações sobre a API"""
    return {
        "name": "Humano Saúde Backend",
        "version": "1.0.0",
        "endpoints": {
            "cotacao": "/api/v1/cotacao",
            "pdf": "/api/v1/pdf",
            "health": "/health",
            "docs": "/docs"
        },
        "features": [
            "Cálculo de cotações de planos de saúde",
            "Extração inteligente de dados de PDF com IA",
            "Processamento de documentos (OpenAI GPT-4)",
            "Integração com OpenAI"
        ]
    }


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handler para rotas não encontradas"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint não encontrado",
            "path": str(request.url),
            "message": "Verifique a documentação em /docs"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handler para erros internos"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "message": "Entre em contato com o suporte"
        }
    )


# Execução direta
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Hot reload durante desenvolvimento
        log_level="info"
    )
