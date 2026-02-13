"""
Entidade Cotação - Representa uma cotação de seguro saúde
"""
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from decimal import Decimal


@dataclass
class Beneficiario:
    """Representa um beneficiário do plano de saúde"""
    idade: int
    tipo_vinculo: str  # TITULAR, DEPENDENTE, AGREGADO
    
    def __post_init__(self):
        if self.idade < 0 or self.idade > 120:
            raise ValueError("Idade deve estar entre 0 e 120 anos")


@dataclass
class Cotacao:
    """
    Entidade principal de Cotação
    Representa uma cotação de plano de saúde
    """
    beneficiarios: List[Beneficiario]
    tipo_contratacao: str  # ADESAO, PME, EMPRESARIAL
    operadora: str  # AMIL, BRADESCO, SULAMERICA, etc
    plano: Optional[str] = None
    valor_total: Optional[Decimal] = None
    valores_individuais: Optional[List[Decimal]] = None
    data_cotacao: datetime = None
    
    def __post_init__(self):
        if not self.beneficiarios:
            raise ValueError("Cotação deve ter pelo menos um beneficiário")
        
        if self.data_cotacao is None:
            self.data_cotacao = datetime.now()
        
        # Validar tipo de contratação
        tipos_validos = ["ADESAO", "PME", "EMPRESARIAL"]
        if self.tipo_contratacao not in tipos_validos:
            raise ValueError(f"Tipo de contratação deve ser um de: {tipos_validos}")
    
    @property
    def quantidade_beneficiarios(self) -> int:
        """Retorna a quantidade de beneficiários"""
        return len(self.beneficiarios)
    
    @property
    def idade_media(self) -> float:
        """Calcula a idade média dos beneficiários"""
        if not self.beneficiarios:
            return 0
        return sum(b.idade for b in self.beneficiarios) / len(self.beneficiarios)
    
    @property
    def possui_idoso(self) -> bool:
        """Verifica se há beneficiário idoso (60+)"""
        return any(b.idade >= 60 for b in self.beneficiarios)
    
    @property
    def possui_crianca(self) -> bool:
        """Verifica se há criança (0-17)"""
        return any(b.idade < 18 for b in self.beneficiarios)
