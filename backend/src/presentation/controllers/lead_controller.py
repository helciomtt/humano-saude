"""
Controller para gerenciar leads
"""

from typing import Optional, List
from fastapi import HTTPException
from src.infrastructure.services.supabase_service import supabase_service
import logging

logger = logging.getLogger(__name__)


async def criar_lead_do_pdf(
    nome: str,
    whatsapp: str,
    email: Optional[str],
    operadora_atual: Optional[str],
    valor_atual: Optional[float],
    idades: List[int],
    economia_estimada: Optional[float],
    valor_proposto: Optional[float],
    tipo_contratacao: Optional[str],
    observacoes: Optional[str],
    dados_pdf: Optional[dict]
):
    """Cria um lead a partir dos dados extraídos do PDF"""
    
    if not supabase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Banco de dados não configurado. Configure SUPABASE_URL e SUPABASE_KEY no .env"
        )
    
    # Verificar se já existe lead com este WhatsApp
    lead_existente = await supabase_service.buscar_lead_por_whatsapp(whatsapp)
    if lead_existente:
        logger.warning(f"⚠️ Lead já existe: {whatsapp}")
        return {
            "mensagem": "Lead já existe no sistema",
            "lead_existente": lead_existente
        }
    
    # Criar novo lead
    lead_criado = await supabase_service.criar_lead(
        nome=nome,
        whatsapp=whatsapp,
        email=email,
        operadora_atual=operadora_atual,
        valor_atual=valor_atual,
        idades=idades,
        economia_estimada=economia_estimada,
        valor_proposto=valor_proposto,
        tipo_contratacao=tipo_contratacao,
        observacoes=observacoes,
        dados_pdf=dados_pdf
    )
    
    if not lead_criado:
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar lead no banco de dados"
        )
    
    return {
        "mensagem": "Lead criado com sucesso",
        "lead": lead_criado
    }


async def listar_todos_leads(
    status: Optional[str] = None,
    limite: int = 50,
    offset: int = 0
):
    """Lista leads com filtros opcionais"""
    
    if not supabase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Banco de dados não configurado"
        )
    
    leads = await supabase_service.listar_leads(
        status=status,
        limite=limite,
        offset=offset
    )
    
    return {
        "total": len(leads),
        "limite": limite,
        "offset": offset,
        "leads": leads
    }


async def buscar_lead(lead_id: str):
    """Busca um lead específico por ID"""
    
    if not supabase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Banco de dados não configurado"
        )
    
    lead = await supabase_service.buscar_lead_por_id(lead_id)
    
    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead não encontrado"
        )
    
    return lead


async def atualizar_status(
    lead_id: str,
    novo_status: str,
    observacao: Optional[str] = None
):
    """Atualiza o status de um lead"""
    
    if not supabase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Banco de dados não configurado"
        )
    
    # Validar status
    status_validos = [
        'novo', 'contatado', 'negociacao',
        'proposta_enviada', 'ganho', 'perdido', 'pausado'
    ]
    
    if novo_status not in status_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Use: {', '.join(status_validos)}"
        )
    
    sucesso = await supabase_service.atualizar_status_lead(
        lead_id=lead_id,
        novo_status=novo_status,
        observacao=observacao
    )
    
    if not sucesso:
        raise HTTPException(
            status_code=500,
            detail="Erro ao atualizar status do lead"
        )
    
    return {
        "mensagem": "Status atualizado com sucesso",
        "lead_id": lead_id,
        "novo_status": novo_status
    }


async def obter_estatisticas():
    """Obtém estatísticas do dashboard"""
    
    if not supabase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Banco de dados não configurado"
        )
    
    stats = await supabase_service.obter_dashboard_stats()
    
    if not stats:
        return {
            "mensagem": "Nenhuma estatística disponível",
            "stats": {}
        }
    
    return stats


async def obter_pipeline():
    """Obtém visão do funil de vendas"""
    
    if not supabase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Banco de dados não configurado"
        )
    
    pipeline = await supabase_service.obter_pipeline_vendas()
    
    return {
        "pipeline": pipeline
    }
