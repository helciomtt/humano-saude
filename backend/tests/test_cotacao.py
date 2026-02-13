"""
Testes para o endpoint de cotação
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_calcular_cotacao_sucesso():
    """Testa cálculo de cotação com dados válidos"""
    response = client.post(
        "/api/v1/cotacao/calcular",
        json={
            "idades": [30, 5],
            "tipo": "ADESAO",
            "operadora": "AMIL"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["operadora"] == "AMIL"
    assert data["tipo_contratacao"] == "ADESAO"
    assert data["quantidade_beneficiarios"] == 2
    assert len(data["valores_individuais"]) == 2
    assert data["valor_total"] > 0
    assert data["valor_final"] > 0


def test_calcular_cotacao_idade_invalida():
    """Testa cálculo com idade inválida"""
    response = client.post(
        "/api/v1/cotacao/calcular",
        json={
            "idades": [150],  # Idade inválida
            "tipo": "ADESAO",
            "operadora": "AMIL"
        }
    )
    
    assert response.status_code == 422  # Validation error


def test_calcular_cotacao_tipo_invalido():
    """Testa cálculo com tipo de contratação inválido"""
    response = client.post(
        "/api/v1/cotacao/calcular",
        json={
            "idades": [30],
            "tipo": "INVALIDO",
            "operadora": "AMIL"
        }
    )
    
    assert response.status_code == 422  # Validation error


def test_listar_operadoras():
    """Testa listagem de operadoras"""
    response = client.get("/api/v1/cotacao/operadoras")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "operadoras" in data
    assert len(data["operadoras"]) > 0
    assert "AMIL" in data["operadoras"]


def test_health_check():
    """Testa health check"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "healthy"


def test_root_endpoint():
    """Testa endpoint raiz"""
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "message" in data
    assert "version" in data
