#!/bin/bash

# Script de inicialização do backend Humano Saúde

echo "🏥 Iniciando Backend Humano Saúde..."
echo ""

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale o Python 3.8+"
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"
echo ""

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
    echo "✅ Ambiente virtual criado"
else
    echo "✅ Ambiente virtual já existe"
fi
echo ""

# Ativar ambiente virtual
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📥 Instalando dependências..."
pip install -r requirements.txt
echo "✅ Dependências instaladas"
echo ""

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado (edite conforme necessário)"
else
    echo "✅ Arquivo .env já existe"
fi
echo ""

# Iniciar servidor
echo "🚀 Iniciando servidor FastAPI..."
echo "📍 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo ""
python main.py
