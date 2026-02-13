"""
Router para processamento de PDFs
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from ...application.dtos.pdf_dto import PDFExtraidoDTO
from ...infrastructure.services.ai_service import ai_service

# Criar router
router = APIRouter(
    prefix="/pdf",
    tags=["PDF"]
)


@router.post(
    "/extrair",
    response_model=PDFExtraidoDTO,
    status_code=status.HTTP_200_OK,
    summary="Extrair Dados de PDF",
    description="""
    Faz upload de um PDF de apólice ou proposta de plano de saúde
    e extrai automaticamente:
    - Idades dos beneficiários
    - Nome da operadora
    - Valor do plano
    - Tipo de contratação
    - Nomes dos beneficiários
    
    Utiliza IA (GPT-4) para análise inteligente do documento.
    """
)
async def extrair_dados_pdf(
    file: UploadFile = File(..., description="Arquivo PDF da apólice ou proposta")
):
    """
    Endpoint POST /api/v1/pdf/extrair
    
    Aceita upload de arquivo PDF e retorna dados extraídos.
    """
    # Validar tipo de arquivo
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas arquivos PDF são aceitos"
        )
    
    # Validar tamanho (máximo 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo muito grande. Máximo: 10MB"
        )
    
    try:
        # Processar PDF com IA
        dados_extraidos = await ai_service.processar_pdf_completo(content)
        
        return PDFExtraidoDTO(**dados_extraidos)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar PDF: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health Check PDF Service"
)
async def health_check_pdf():
    """Health check do serviço de PDF"""
    return {
        "status": "healthy",
        "service": "pdf-extraction",
        "ai_model": "gpt-4o-mini",
        "max_file_size": "10MB"
    }
