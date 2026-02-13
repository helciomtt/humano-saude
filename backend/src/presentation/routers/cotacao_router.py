"""
Router de Cotação
Define as rotas da API relacionadas a cotações
"""
from fastapi import APIRouter, status
from ..controllers.cotacao_controller import CotacaoController
from ...application.dtos.cotacao_dto import CotacaoInputDTO, CotacaoOutputDTO

# Criar router
router = APIRouter(
    prefix="/cotacao",
    tags=["Cotação"]
)

# Instanciar controller
cotacao_controller = CotacaoController()


@router.post(
    "/calcular",
    response_model=CotacaoOutputDTO,
    status_code=status.HTTP_200_OK,
    summary="Calcular Cotação de Plano de Saúde",
    description="""
    Calcula o valor de uma cotação de plano de saúde baseado em:
    - Idades dos beneficiários
    - Tipo de contratação (ADESAO, PME, EMPRESARIAL)
    - Operadora escolhida
    
    Retorna valores individuais e total com descontos aplicados.
    """
)
async def calcular_cotacao(input_dto: CotacaoInputDTO):
    """
    Endpoint POST /cotacao/calcular
    
    Body exemplo:
    ```json
    {
        "idades": [30, 5],
        "tipo": "ADESAO",
        "operadora": "AMIL"
    }
    ```
    """
    return await cotacao_controller.calcular_cotacao(input_dto)


@router.get(
    "/operadoras",
    status_code=status.HTTP_200_OK,
    summary="Listar Operadoras Disponíveis",
    description="Retorna a lista de operadoras disponíveis para cotação"
)
async def listar_operadoras():
    """
    Endpoint GET /cotacao/operadoras
    """
    return await cotacao_controller.listar_operadoras()


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Verifica se o serviço de cotação está funcionando"
)
async def health_check():
    """Health check do serviço de cotação"""
    return {
        "status": "healthy",
        "service": "cotacao",
        "message": "Serviço de cotação operacional"
    }
