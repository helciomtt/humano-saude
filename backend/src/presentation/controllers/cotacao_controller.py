"""
Controller de Cotação
Gerencia as requisições relacionadas a cotações
"""
from fastapi import HTTPException
from ...application.use_cases.calcular_cotacao_use_case import CalcularCotacaoUseCase
from ...application.dtos.cotacao_dto import CotacaoInputDTO, CotacaoOutputDTO
from ...infrastructure.services.servico_calculo_cotacao import ServicoCalculoCotacao


class CotacaoController:
    """Controller para operações de cotação"""
    
    def __init__(self):
        """Inicializa o controller com suas dependências"""
        self.servico_calculo = ServicoCalculoCotacao()
        self.use_case = CalcularCotacaoUseCase(self.servico_calculo)
    
    async def calcular_cotacao(self, input_dto: CotacaoInputDTO) -> CotacaoOutputDTO:
        """
        Endpoint para calcular cotação
        
        Args:
            input_dto: Dados de entrada da cotação
            
        Returns:
            CotacaoOutputDTO: Resultado do cálculo
        """
        try:
            resultado = await self.use_case.execute(input_dto)
            return resultado
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao calcular cotação: {str(e)}")
    
    async def listar_operadoras(self):
        """Lista operadoras disponíveis"""
        try:
            operadoras = self.servico_calculo.obter_operadoras_disponiveis()
            return {"operadoras": operadoras}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao listar operadoras: {str(e)}")
