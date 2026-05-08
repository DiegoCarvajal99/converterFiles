from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class DocumentMetadata(BaseModel):
    title: Optional[str] = Field(None, description="Título extraído del documento")
    authors: List[str] = Field(default_factory=list, description="Lista de autores extraídos")
    date: Optional[str] = Field(None, description="Fecha de publicación o creación")
    extra: Dict[str, Any] = Field(default_factory=dict, description="Metadatos adicionales específicos del formato")

class ConversionResponse(BaseModel):
    html_content: str = Field(..., description="Contenido HTML semántico generado")
    metadata: DocumentMetadata
    status: str = Field(..., description="Estado de la conversión (success/error)")

class ErrorResponse(BaseModel):
    detail: str
    status: str = "error"

class EpubRequest(BaseModel):
    html: str = Field(..., description="Contenido HTML completo o fragmento para el libro")
    metadata: DocumentMetadata
