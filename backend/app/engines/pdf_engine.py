import fitz  # PyMuPDF
import base64
import re
from .base import BaseConverter
from typing import Dict, Any

class PDFConverter(BaseConverter):
    @property
    def supported_extension(self) -> str:
        return "pdf"

    async def convert(self, file_content: bytes) -> Dict[str, Any]:
        """
        Extrae texto de PDF usando clonación visual exacta (Rasterización Alta Calidad).
        Garantiza que el HTML muestre todas las imágenes y gráficas sin fallos.
        """
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            html_pages = []
            
            pdf_metadata = doc.metadata
            title = pdf_metadata.get("title") or "Documento PDF"
            author = pdf_metadata.get("author") or ""
            date = pdf_metadata.get("creationDate") or None

            zoom = 2.0  # Alta resolución para nitidez perfecta
            mat = fitz.Matrix(zoom, zoom)

            for page in doc:
                # get_pixmap() toma una "fotografía" exacta de la página
                # Esto resuelve cualquier fallo de imágenes ocultas, capas de transparencia o máscaras de SVG
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img_data = pix.tobytes("jpeg", 85) # JPEG calidad 85 para balancear peso y calidad
                b64_encoded = base64.b64encode(img_data).decode('utf-8')
                
                img_html = f"<img src='data:image/jpeg;base64,{b64_encoded}' style='width:100%; height:auto; display:block;' alt='Página del PDF' />"
                
                # Extraer enlaces
                links_html = ""
                page_width = page.rect.width
                page_height = page.rect.height
                
                # 1. Enlaces explícitos en los metadatos del PDF
                for link in page.get_links():
                    if link.get("kind") == 2 and "uri" in link:
                        rect = link["from"]
                        left_pct = (rect.x0 / page_width) * 100
                        top_pct = (rect.y0 / page_height) * 100
                        width_pct = ((rect.x1 - rect.x0) / page_width) * 100
                        height_pct = ((rect.y1 - rect.y0) / page_height) * 100
                        uri = link["uri"]
                        links_html += f"<a href='{uri}' target='_blank' style='position:absolute; left:{left_pct}%; top:{top_pct}%; width:{width_pct}%; height:{height_pct}%; display:block; z-index:10; cursor:pointer;' title='{uri}'></a>\n"

                # 2. Heurística: Enlaces en texto plano
                page_text = page.get_text("text")
                url_pattern = re.compile(r'(https?://[^\s<>"\']+|(?:www\.)[^\s<>"\']+|doi\.org/[^\s<>"\']+)')
                found_urls = set(url_pattern.findall(page_text))
                
                for url in found_urls:
                    clean_url = url.rstrip('.,;:)')
                    full_url = clean_url if clean_url.startswith('http') else 'https://' + clean_url
                    
                    rects = page.search_for(clean_url)
                    for rect in rects:
                        left_pct = (rect.x0 / page_width) * 100
                        top_pct = (rect.y0 / page_height) * 100
                        width_pct = ((rect.x1 - rect.x0) / page_width) * 100
                        height_pct = ((rect.y1 - rect.y0) / page_height) * 100
                        links_html += f"<a href='{full_url}' target='_blank' style='position:absolute; left:{left_pct}%; top:{top_pct}%; width:{width_pct}%; height:{height_pct}%; display:block; z-index:10; cursor:pointer;' title='{full_url}'></a>\n"

                # Contenedor relativo para que los enlaces absolutos se posicionen correctamente sobre la imagen
                page_wrapper = f"<div class='pdf-page-wrapper' style='position:relative; display:inline-block; max-width:100%; width:100%;'>\n{img_html}\n{links_html}</div>"
                
                html_pages.append(f"<div class='pdf-page-svg'>{page_wrapper}</div>")

            page_count = len(doc)
            doc.close()

            # Envolvemos las páginas
            final_html = "<div class='pdf-visual-clone'>\n" + "\n".join(html_pages) + "\n</div>"

            return {
                "html_content": final_html,
                "metadata": {
                    "title": title,
                    "authors": [author] if author else [],
                    "date": date,
                    "extra": {
                        "page_count": page_count,
                        "engine": "pymupdf-visual-clone",
                        "format": pdf_metadata.get("format")
                    }
                },
                "status": "success"
            }
        except Exception as e:
            raise ValueError(f"Error al procesar el archivo PDF: {str(e)}")
