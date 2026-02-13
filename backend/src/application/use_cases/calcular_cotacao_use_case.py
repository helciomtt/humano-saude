"""
Use Case: Calcular Cotação
Caso de uso responsável por calcular o valor de uma cotação de plano de saúde
"""
from typing import List
from decimal import Decimal
from ..dtos.cotacao_dto import CotacaoInputDTO, CotacaoOutputDTO, ValorBeneficiarioDTO
from ...domain.entities.cotacao import Cotacao, Beneficiario


class CalcularCotacaoUseCase:
    """
    Caso de uso para calcular cotação de plano de saúde.
    Aplica regras de negócio e utiliza serviços de cálculo.
    """
    
    def __init__(self, servico_calculo):
        """
        Args:
            servico_calculo: Serviço responsável pelo cálculo dos valores
        """
        self.servico_calculo = servico_calculo
    
    async def execute(self, input_dto: CotacaoInputDTO) -> CotacaoOutputDTO:
        """
        Executa o caso de uso de cálculo de cotação
        
        Args:
            input_dto: Dados de entrada da cotação
            
        Returns:
            CotacaoOutputDTO: Resultado do cálculo
        """
        # Converter idades para beneficiários
        beneficiarios = [
            Beneficiario(idade=idade, tipo_vinculo="TITULAR" if i == 0 else "DEPENDENTE")
            for i, idade in enumerate(input_dto.idades)
        ]
        
        # Criar entidade de domínio
        cotacao = Cotacao(
            beneficiarios=beneficiarios,
            tipo_contratacao=input_dto.tipo,
            operadora=input_dto.operadora,
            plano=input_dto.plano
        )
        
        # Calcular valores usando o serviço
        resultado = await self.servico_calculo.calcular(cotacao)
        
        # Aplicar regras de desconto
        desconto = self._calcular_desconto(cotacao, resultado['valor_total'])
        valor_final = resultado['valor_total'] - desconto
        
        # Gerar observações
        observacoes = self._gerar_observacoes(cotacao)
        
        # Montar DTO de saída
        valores_individuais = [
            ValorBeneficiarioDTO(
                idade=ben.idade,
                valor=val,
                faixa_etaria=self._definir_faixa_etaria(ben.idade)
            )
            for ben, val in zip(beneficiarios, resultado['valores_individuais'])
        ]
        
        return CotacaoOutputDTO(
            operadora=cotacao.operadora,
            tipo_contratacao=cotacao.tipo_contratacao,
            plano=cotacao.plano or "PLANO_PADRAO",
            quantidade_beneficiarios=cotacao.quantidade_beneficiarios,
            valores_individuais=valores_individuais,
            valor_total=resultado['valor_total'],
            desconto_aplicado=desconto,
            valor_final=valor_final,
            observacoes=observacoes
        )
    
    def _calcular_desconto(self, cotacao: Cotacao, valor_total: Decimal) -> Decimal:
        """Calcula desconto baseado em regras de negócio"""
        desconto = Decimal("0.00")
        
        # Desconto progressivo por quantidade de beneficiários
        if cotacao.quantidade_beneficiarios >= 5:
            desconto = valor_total * Decimal("0.10")  # 10% de desconto
        elif cotacao.quantidade_beneficiarios >= 3:
            desconto = valor_total * Decimal("0.05")  # 5% de desconto
        
        return desconto
    
    def _gerar_observacoes(self, cotacao: Cotacao) -> List[str]:
        """Gera observações sobre a cotação"""
        observacoes = []
        
        if cotacao.possui_idoso:
            observacoes.append("Cotação inclui beneficiário(s) idoso(s) - pode requerer carência")
        
        if cotacao.possui_crianca:
            observacoes.append("Cotação inclui criança(s) - verificar cobertura pediátrica")
        
        if cotacao.quantidade_beneficiarios >= 5:
            observacoes.append("Desconto de 10% aplicado por família numerosa")
        elif cotacao.quantidade_beneficiarios >= 3:
            observacoes.append("Desconto de 5% aplicado")
        
        return observacoes
    
    def _definir_faixa_etaria(self, idade: int) -> str:
        """Define a faixa etária do beneficiário"""
        if idade < 18:
            return "0-17 anos"
        elif idade < 30:
            return "18-29 anos"
        elif idade < 40:
            return "30-39 anos"
        elif idade < 50:
            return "40-49 anos"
        elif idade < 60:
            return "50-59 anos"
        else:
            return "60+ anos"
