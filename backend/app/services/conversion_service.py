from typing import Dict, Any, Optional
from fastapi import UploadFile
from ..engines.base import BaseConverter
from ..engines.word_engine import WordConverter
from ..engines.pdf_engine import PDFConverter

class ConversionManager:
    def __init__(self) -> None:
        # Registro de estrategias disponibles (Pattern Strategy)
        self._engines: Dict[str, BaseConverter] = {
            "docx": WordConverter(),
            "pdf": PDFConverter()
        }

    async def process_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Orquesta el proceso de conversión identificando el motor adecuado.
        """
        filename = file.filename
        if not filename or "." not in filename:
            raise ValueError("El nombre del archivo no es válido o no tiene extensión.")

        extension = filename.split(".")[-1].lower()
        engine: Optional[BaseConverter] = self._engines.get(extension)
        
        if not engine:
            allowed = ", ".join(self._engines.keys())
            raise ValueError(f"Formato .{extension} no soportado. Formatos permitidos: {allowed}")
            
        # Llamada asíncrona al motor correspondiente
        content = await file.read()
        return await engine.convert(content)

# Instancia singleton para ser inyectada o usada en los endpoints
conversion_manager = ConversionManager()
