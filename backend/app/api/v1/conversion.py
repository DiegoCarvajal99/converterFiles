from fastapi import APIRouter, UploadFile, File, HTTPException, status, Response
from ...schemas.conversion import ConversionResponse, ErrorResponse, EpubRequest
from ...services.conversion_service import conversion_manager
from ...engines.epub_engine import EpubGenerator

router = APIRouter()

@router.post(
    "/convert", 
    response_model=ConversionResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def convert_file(file: UploadFile = File(...)):
    """
    Recibe un archivo (.docx o .pdf), lo procesa y devuelve HTML semántico.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No se proporcionó un nombre de archivo válido."
        )

    try:
        # El manager decide qué motor usar y extrae el contenido
        result = await conversion_manager.process_file(file)
        return result
    except ValueError as e:
        # Errores de validación de formato o archivo no soportado
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )
    except Exception as e:
        # Errores internos de procesamiento de los motores
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error crítico durante la conversión: {str(e)}"
        )

@router.post("/epub", response_class=Response)
async def convert_to_epub(request: EpubRequest):
    """
    Recibe el HTML y metadatos, y retorna un archivo EPUB binario.
    """
    try:
        generator = EpubGenerator()
        epub_bytes = generator.generate(request.html, request.metadata.dict())
        
        return Response(
            content=epub_bytes,
            media_type="application/epub+zip",
            headers={
                "Content-Disposition": f'attachment; filename="{request.metadata.title or "documento"}.epub"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar EPUB: {str(e)}"
        )
