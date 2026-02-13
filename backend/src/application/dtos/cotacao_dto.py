"""
DTOs para Cotação
Data Transfer Objects para entrada e saída de dados
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from decimal import Decimal


class BeneficiarioInputDTO(BaseModel):
    """DTO para entrada de dados de beneficiário"""
    idade: int = Field(..., ge=0, le=120, description="Idade do beneficiário")
    tipo_vinculo: str = Field(default="TITULAR", description="TITULAR, DEPENDENTE ou AGREGADO")
    
    @validator('idade')
    def validar_idade(cls, v):
        if v < 0 or v > 120:
            raise ValueError('Idade deve estar entre 0 e 120 anos')
        return v


class CotacaoInputDTO(BaseModel):
    """DTO para entrada de dados de cotação"""
    idades: List[int] = Field(..., min_items=1, description="Lista de idades dos beneficiários")
    tipo: str = Field(..., description="Tipo de contratação: ADESAO, PME ou EMPRESARIAL")
    operadora: str = Field(..., description="Nome da operadora")
    plano: Optional[str] = Field(None, description="Nome do plano (opcional)")
    
    @validator('tipo')
    def validar_tipo(cls, v):
        tipos_validos = ["ADESAO", "PME", "EMPRESARIAL"]
        if v.upper() not in tipos_validos:
            raise ValueError(f'Tipo deve ser um de: {tipos_validos}')
        return v.upper()
    
    @validator('idades')
    def validar_idades(cls, v):
        if not v:
            raise ValueError('Deve haver pelo menos um beneficiário')
        for idade in v:
            if idade < 0 or idade > 120:
                raise ValueError('Todas as idades devem estar entre 0 e 120 anos')
        return v


class ValorBeneficiarioDTO(BaseModel):
    """DTO para valor individual de beneficiário"""
    idade: int
    valor: Decimal
    faixa_etaria: str


class CotacaoOutputDTO(BaseModel):
    """DTO para saída de dados de cotação"""
    operadora: str
    tipo_contratacao: str
    plano: Optional[str] = None
    quantidade_beneficiarios: int
    valores_individuais: List[ValorBeneficiarioDTO]
    valor_total: Decimal
    desconto_aplicado: Decimal = Decimal("0.00")
    valor_final: Decimal
    observacoes: Optional[List[str]] = []
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }
