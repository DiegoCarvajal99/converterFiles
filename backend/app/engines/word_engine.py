import io
import mammoth
from .base import BaseConverter
from typing import Dict, Any

class WordConverter(BaseConverter):
    @property
    def supported_extension(self) -> str:
        return "docx"

    async def convert(self, file_content: bytes) -> Dict[str, Any]:
        """
        Convierte archivos .docx a HTML semántico usando Mammoth.
        """
        try:
            # Configuración de mapeo de estilos para HTML semántico
            style_map = """
            p[style-name='Title'] => h1.article-title:fresh
            p[style-name='Heading 1'] => h2:fresh
            p[style-name='Heading 2'] => h3:fresh
            p[style-name='Quote'] => blockquote:fresh
            """

            # Mammoth convierte a HTML manteniendo una estructura limpia.
            # Por defecto, las imágenes se convierten a base64 (img src="data:image/png;base64,...")
            with io.BytesIO(file_content) as docx_file:
                result = mammoth.convert_to_html(docx_file, style_map=style_map)
                html = result.value
                messages = [str(m) for m in result.messages]

            # Intento básico de extraer metadatos (Mammoth no extrae metadatos core de Word directamente)
            # En una fase futura se podría usar python-docx para metadatos avanzados.
            return {
                "html_content": html,
                "metadata": {
                    "title": "Documento Word", # Placeholder o lógica de extracción
                    "authors": [],
                    "date": None,
                    "extra": {
                        "messages": messages,
                        "engine": "mammoth"
                    }
                },
                "status": "success"
            }
        except Exception as e:
            raise ValueError(f"Error al procesar el archivo Word: {str(e)}")
