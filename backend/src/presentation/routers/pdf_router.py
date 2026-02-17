"""
Router para processamento de documentos
"""
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, status

from ...application.dtos.pdf_dto import PDFExtraidoDTO
from ...infrastructure.services.ai_service import ai_service

# Criar router
router = APIRouter(
    prefix="/pdf",
    tags=["Documentos"]
)

ALLOWED_EXTENSIONS = {
    '.pdf',
    '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff',
    '.docx',
    '.txt', '.csv', '.json', '.xml', '.html', '.htm', '.md',
}


@router.post(
    "/extrair",
    response_model=PDFExtraidoDTO,
    status_code=status.HTTP_200_OK,
    summary="Extrair Dados de Documento",
    description="""
    Faz upload de um documento de plano de saúde
    (PDF, imagem, DOCX ou arquivo textual) e extrai automaticamente:
    - Idades dos beneficiários
    - Nome da operadora
    - Valor do plano
    - Tipo de contratação
    - Nomes dos beneficiários

    Utiliza IA (GPT-4) para análise inteligente do documento.
    """
)
async def extrair_dados_documento(
    file: UploadFile = File(..., description="Documento da proposta/apólice")
):
    """
    Endpoint POST /api/v1/pdf/extrair

    Aceita upload de documentos e retorna dados extraídos.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome do arquivo é obrigatório"
        )

    ext = Path(file.filename).suffix.lower()
    is_image_content_type = bool(file.content_type and file.content_type.startswith('image/'))

    if ext not in ALLOWED_EXTENSIONS and not is_image_content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Formato não suportado. Use PDF, imagem (PNG/JPG/JPEG/WEBP/BMP/TIFF), "
                "DOCX ou texto (TXT/CSV/JSON/XML/HTML/MD)."
            )
        )

    # Validar tamanho (máximo 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo muito grande. Máximo: 10MB"
        )

    try:
        dados_extraidos = await ai_service.processar_documento_completo(
            content,
            filename=file.filename,
            content_type=file.content_type,
        )

        return PDFExtraidoDTO(**dados_extraidos)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar documento: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health Check Document Service"
)
async def health_check_documentos():
    """Health check do serviço de documentos"""
    return {
        "status": "healthy",
        "service": "document-extraction",
        "ai_model": "gpt-4o-mini",
        "max_file_size": "10MB"
    }
