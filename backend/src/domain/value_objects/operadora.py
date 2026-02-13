"""
Value Object - Operadora
Representa as operadoras de saúde disponíveis
"""
from enum import Enum


class Operadora(str, Enum):
    """Operadoras de saúde disponíveis no sistema"""
    AMIL = "AMIL"
    BRADESCO = "BRADESCO"
    SULAMERICA = "SULAMERICA"
    UNIMED = "UNIMED"
    NOTREDAME = "NOTREDAME"
    HAPVIDA = "HAPVIDA"
    
    @classmethod
    def lista_operadoras(cls) -> list:
        """Retorna lista de todas as operadoras"""
        return [op.value for op in cls]


class TipoContratacao(str, Enum):
    """Tipos de contratação disponíveis"""
    ADESAO = "ADESAO"
    PME = "PME"
    EMPRESARIAL = "EMPRESARIAL"
    
    @classmethod
    def lista_tipos(cls) -> list:
        """Retorna lista de todos os tipos"""
        return [tipo.value for tipo in cls]
