"""
DTOs para extração de dados de PDF
"""
from pydantic import BaseModel
from typing import List, Optional


class PDFExtraidoDTO(BaseModel):
    """DTO para dados extraídos de PDF"""
    idades: List[int]
    operadora: Optional[str] = None
    valor_atual: Optional[float] = None
    tipo_plano: Optional[str] = None
    nome_beneficiarios: List[str] = []
    observacoes: Optional[str] = None
    confianca: str = "alta"
    texto_extraido_preview: Optional[str] = None
    total_caracteres: int = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "idades": [30, 5, 35],
                "operadora": "AMIL",
                "valor_atual": 1250.50,
                "tipo_plano": "ADESAO",
                "nome_beneficiarios": ["João Silva", "Maria Silva", "Pedro Silva"],
                "observacoes": "Plano com cobertura nacional",
                "confianca": "alta",
                "texto_extraido_preview": "PROPOSTA DE ADESÃO...",
                "total_caracteres": 2500
            }
        }
