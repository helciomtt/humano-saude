"""
Serviço de Cálculo de Cotação
Implementa a lógica de cálculo de valores de planos de saúde
"""
import pandas as pd
from decimal import Decimal
from typing import Dict, List
from ...domain.entities.cotacao import Cotacao


class ServicoCalculoCotacao:
    """
    Serviço responsável por calcular valores de cotações.
    Utiliza tabelas de preços (pandas) para cálculos complexos.
    """
    
    def __init__(self):
        """Inicializa o serviço com tabelas de preços"""
        self._carregar_tabelas_precos()
    
    def _carregar_tabelas_precos(self):
        """Carrega tabelas de preços fictícias (futuramente pode vir de CSV/DB)"""
        # Tabela de preços base por faixa etária
        self.tabela_precos = pd.DataFrame({
            'faixa_inicio': [0, 18, 30, 40, 50, 60],
            'faixa_fim': [17, 29, 39, 49, 59, 120],
            'valor_base_adesao': [150.00, 250.00, 350.00, 450.00, 600.00, 850.00],
            'valor_base_pme': [180.00, 280.00, 400.00, 520.00, 700.00, 950.00],
            'valor_base_empresarial': [200.00, 300.00, 420.00, 550.00, 750.00, 1000.00]
        })
        
        # Multiplicadores por operadora
        self.multiplicadores_operadora = {
            'AMIL': 1.15,
            'BRADESCO': 1.10,
            'SULAMERICA': 1.20,
            'UNIMED': 1.05,
            'NOTREDAME': 1.18,
            'HAPVIDA': 1.00
        }
    
    async def calcular(self, cotacao: Cotacao) -> Dict:
        """
        Calcula os valores da cotação
        
        Args:
            cotacao: Entidade de domínio Cotacao
            
        Returns:
            Dict com valores_individuais e valor_total
        """
        valores_individuais = []
        
        # Calcular valor para cada beneficiário
        for beneficiario in cotacao.beneficiarios:
            valor = self._calcular_valor_beneficiario(
                idade=beneficiario.idade,
                tipo_contratacao=cotacao.tipo_contratacao,
                operadora=cotacao.operadora
            )
            valores_individuais.append(valor)
        
        valor_total = sum(valores_individuais)
        
        return {
            'valores_individuais': valores_individuais,
            'valor_total': Decimal(str(valor_total))
        }
    
    def _calcular_valor_beneficiario(
        self, 
        idade: int, 
        tipo_contratacao: str, 
        operadora: str
    ) -> Decimal:
        """
        Calcula o valor para um beneficiário específico
        
        Args:
            idade: Idade do beneficiário
            tipo_contratacao: Tipo de contratação
            operadora: Nome da operadora
            
        Returns:
            Decimal: Valor calculado
        """
        # Encontrar faixa etária
        faixa = self.tabela_precos[
            (self.tabela_precos['faixa_inicio'] <= idade) & 
            (self.tabela_precos['faixa_fim'] >= idade)
        ]
        
        if faixa.empty:
            raise ValueError(f"Faixa etária não encontrada para idade {idade}")
        
        # Obter valor base
        coluna_tipo = f'valor_base_{tipo_contratacao.lower()}'
        valor_base = float(faixa.iloc[0][coluna_tipo])
        
        # Aplicar multiplicador da operadora
        multiplicador = self.multiplicadores_operadora.get(operadora, 1.0)
        valor_final = valor_base * multiplicador
        
        return Decimal(str(round(valor_final, 2)))
    
    def obter_faixas_etarias(self) -> pd.DataFrame:
        """Retorna as faixas etárias disponíveis"""
        return self.tabela_precos[['faixa_inicio', 'faixa_fim']].copy()
    
    def obter_operadoras_disponiveis(self) -> List[str]:
        """Retorna lista de operadoras disponíveis"""
        return list(self.multiplicadores_operadora.keys())
