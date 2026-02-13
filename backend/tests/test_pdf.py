"""
Testes para o serviço de extração de PDF
"""
import pytest
from src.infrastructure.services.ai_service import AIService
import io
from pypdf import PdfWriter


def criar_pdf_teste() -> bytes:
    """Cria um PDF de teste simples"""
    writer = PdfWriter()
    # Em um cenário real, você adicionaria páginas com conteúdo
    # Para testes, isso seria mockado
    return b"%PDF-1.4 test content"


def test_ai_service_inicializacao():
    """Testa inicialização do serviço de IA"""
    service = AIService()
    assert service.model == "gpt-4o-mini"
    assert service.client is not None


def test_validar_dados_extraidos():
    """Testa validação de dados extraídos"""
    service = AIService()
    
    dados_brutos = {
        "idades": [30, "5", 45.0],
        "operadora": "amil",
        "valor_atual": "1250,50",
        "tipo_plano": "adesao"
    }
    
    resultado = service._validar_dados_extraidos(dados_brutos)
    
    assert resultado["idades"] == [30, 5, 45]
    assert resultado["operadora"] == "AMIL"
    assert resultado["valor_atual"] == 1250.50
    assert resultado["tipo_plano"] == "ADESAO"
    assert resultado["confianca"] == "alta"


def test_validar_dados_invalidos():
    """Testa validação com dados inválidos"""
    service = AIService()
    
    dados_brutos = {
        "idades": ["abc", None, ""],
        "operadora": "",
        "valor_atual": "invalid"
    }
    
    resultado = service._validar_dados_extraidos(dados_brutos)
    
    assert resultado["idades"] == []
    assert resultado["operadora"] is None
    assert resultado["valor_atual"] is None
