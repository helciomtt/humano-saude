"""
Router para gerenciar leads
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from src.presentation.controllers import lead_controller

router = APIRouter(
    prefix="/api/v1/leads",
    tags=["Leads"]
)


# ==========================================
# DTOs
# ==========================================

class CriarLeadRequest(BaseModel):
    """Request para criar um lead"""
    nome: str = Field(..., min_length=3, max_length=255, description="Nome completo")
    whatsapp: str = Field(..., min_length=10, max_length=20, description="WhatsApp com DDD")
    email: Optional[str] = Field(None, description="E-mail opcional")
    operadora_atual: Optional[str] = Field(None, description="Operadora atual")
    valor_atual: Optional[float] = Field(None, gt=0, description="Valor mensal atual")
    idades: List[int] = Field(default_factory=list, description="Idades dos beneficiários")
    economia_estimada: Optional[float] = Field(None, description="Economia calculada")
    valor_proposto: Optional[float] = Field(None, description="Valor da proposta")
    tipo_contratacao: Optional[str] = Field(None, description="PF ou PME")
    observacoes: Optional[str] = Field(None, description="Observações gerais")
    dados_pdf: Optional[dict] = Field(None, description="Dados do PDF")


class AtualizarStatusRequest(BaseModel):
    """Request para atualizar status do lead"""
    novo_status: str = Field(
        ..., 
        description="Status: novo, contatado, negociacao, proposta_enviada, ganho, perdido, pausado"
    )
    observacao: Optional[str] = Field(None, description="Observação sobre a mudança")


# ==========================================
# Endpoints
# ==========================================

@router.post("/", summary="Criar Lead")
async def criar_lead(lead: CriarLeadRequest):
    """
    Cria um novo lead no banco de dados
    
    **Exemplo:**
    ```json
    {
      "nome": "João Silva",
      "whatsapp": "+5511999999999",
      "email": "joao@email.com",
      "operadora_atual": "Unimed",
      "valor_atual": 1200.00,
      "idades": [35, 32],
      "economia_estimada": 250.00,
      "valor_proposto": 950.00,
      "tipo_contratacao": "PF"
    }
    ```
    """
    return await lead_controller.criar_lead_do_pdf(
        nome=lead.nome,
        whatsapp=lead.whatsapp,
        email=lead.email,
        operadora_atual=lead.operadora_atual,
        valor_atual=lead.valor_atual,
        idades=lead.idades,
        economia_estimada=lead.economia_estimada,
        valor_proposto=lead.valor_proposto,
        tipo_contratacao=lead.tipo_contratacao,
        observacoes=lead.observacoes,
        dados_pdf=lead.dados_pdf
    )


@router.get("/", summary="Listar Leads")
async def listar_leads(
    status: Optional[str] = Query(None, description="Filtrar por status"),
    limite: int = Query(50, ge=1, le=100, description="Número de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginação")
):
    """
    Lista leads com filtros opcionais
    
    **Status válidos:**
    - novo
    - contatado
    - negociacao
    - proposta_enviada
    - ganho
    - perdido
    - pausado
    """
    return await lead_controller.listar_todos_leads(
        status=status,
        limite=limite,
        offset=offset
    )


@router.get("/{lead_id}", summary="Buscar Lead por ID")
async def buscar_lead_por_id(lead_id: str):
    """Busca um lead específico pelo ID"""
    return await lead_controller.buscar_lead(lead_id)


@router.patch("/{lead_id}/status", summary="Atualizar Status")
async def atualizar_status_lead(lead_id: str, request: AtualizarStatusRequest):
    """
    Atualiza o status de um lead
    
    **Exemplo:**
    ```json
    {
      "novo_status": "contatado",
      "observacao": "Primeira ligação feita, cliente interessado"
    }
    ```
    """
    return await lead_controller.atualizar_status(
        lead_id=lead_id,
        novo_status=request.novo_status,
        observacao=request.observacao
    )


@router.get("/estatisticas/dashboard", summary="Estatísticas do Dashboard")
async def obter_estatisticas_dashboard():
    """
    Obtém estatísticas completas do dashboard
    
    **Retorna:**
    - Total de leads (geral, mês, semana, hoje)
    - Leads por status
    - Economia total e média
    - Taxa de conversão
    - E mais...
    """
    return await lead_controller.obter_estatisticas()


@router.get("/estatisticas/pipeline", summary="Funil de Vendas")
async def obter_pipeline_vendas():
    """
    Obtém visão do funil de vendas (pipeline)
    
    **Retorna:**
    - Quantidade de leads por status
    - Valor total por status
    - Percentual do funil
    """
    return await lead_controller.obter_pipeline()
