import uuid
import re
import base64
import os
import tempfile
from ebooklib import epub
from bs4 import BeautifulSoup


class EpubGenerator:
    """
    Genera un archivo EPUB válido a partir de HTML con imágenes base64.
    Extrae las imágenes con regex sobre el HTML crudo para evitar
    que BeautifulSoup corrompa los atributos src muy largos.
    """

    def generate(self, html_content: str, metadata: dict) -> bytes:
        try:
            book = epub.EpubBook()

            # --- Metadatos ---
            title = str(metadata.get("title") or "Documento Científico")[:200]
            book.set_identifier(str(uuid.uuid4()))
            book.set_title(title)
            book.set_language('es')

            authors = metadata.get("authors", [])
            if isinstance(authors, list) and authors:
                for a in authors:
                    book.add_author(str(a))
            else:
                book.add_author("Autor Desconocido")

            # --- PASO 1: Extraer imágenes base64 del HTML crudo ---
            # Hacemos esto ANTES de BeautifulSoup para no corromper los datos
            image_map = {}   # placeholder_src -> EpubItem
            img_index = [0]  # uso lista para mutabilidad en closure

            def replace_base64_image(match):
                full_tag = match.group(0)
                mime_type = match.group(1)
                b64_data = match.group(2)

                ext_map = {
                    'image/jpeg': 'jpg',
                    'image/png': 'png',
                    'image/gif': 'gif',
                    'image/webp': 'webp',
                }
                ext = ext_map.get(mime_type, 'jpg')
                idx = img_index[0]
                img_index[0] += 1
                filename = f"images/img_{idx:04d}.{ext}"

                try:
                    # Limpiar posibles espacios o saltos de línea en el base64
                    clean_b64 = re.sub(r'\s+', '', b64_data)
                    img_bytes = base64.b64decode(clean_b64)
                except Exception:
                    return full_tag  # Si falla, dejar el tag original

                epub_img = epub.EpubItem(
                    uid=f"img_{idx}",
                    file_name=filename,
                    media_type=mime_type,
                    content=img_bytes,
                )
                book.add_item(epub_img)
                image_map[filename] = epub_img

                # Reemplazar por referencia interna
                return f'<img src="{filename}" style="max-width:100%;height:auto;display:block;margin:0.5em auto;" alt="Imagen {idx + 1}" />'

            # Regex que captura data URIs de imagen dentro de atributos src
            processed_html = re.sub(
                r'<img[^>]*\ssrc=["\']data:(image/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/=\s]+?)["\'][^>]*>',
                replace_base64_image,
                html_content,
                flags=re.IGNORECASE | re.DOTALL,
            )

            # --- PASO 2: Limpiar con BeautifulSoup (ahora sin base64 gigantes) ---
            soup = BeautifulSoup(processed_html, 'html.parser')

            body_tag = soup.find('body')
            inner_soup = BeautifulSoup(
                "".join(str(c) for c in body_tag.children) if body_tag else processed_html,
                'html.parser'
            )

            for tag in inner_soup(['script', 'link', 'meta', 'iframe', 'button', 'style']):
                tag.decompose()

            body_html = inner_soup.decode(formatter="minimal")

            # --- PASO 3: Construir el XHTML del capítulo ---
            chapter_html = (
                "<?xml version='1.0' encoding='utf-8'?>\n"
                "<html xmlns='http://www.w3.org/1999/xhtml'>\n"
                "<head>\n"
                f"  <title>{title}</title>\n"
                "  <style type='text/css'>\n"
                "    body{font-family:Georgia,serif;padding:4%;line-height:1.6;color:#1a1a1a;}\n"
                "    img{max-width:100%;height:auto;display:block;margin:0.5em auto;}\n"
                "    .pdf-visual-clone,.pdf-page-svg,.pdf-page-wrapper{display:block;margin-bottom:1em;}\n"
                "  </style>\n"
                "</head>\n"
                "<body>\n"
                f"{body_html}\n"
                "</body>\n"
                "</html>"
            )

            c1 = epub.EpubHtml(title=title, file_name='chapter_1.xhtml', lang='es')
            c1.content = chapter_html.encode('utf-8')
            book.add_item(c1)

            # --- Estructura de navegación ---
            book.toc = (c1,)
            book.add_item(epub.EpubNcx())
            book.add_item(epub.EpubNav())
            book.spine = [c1]

            # --- Escribir y leer ---
            with tempfile.NamedTemporaryFile(suffix='.epub', delete=False) as tmp:
                tmp_path = tmp.name

            epub.write_epub(tmp_path, book, {})

            with open(tmp_path, 'rb') as f:
                epub_bytes = f.read()

            try:
                os.remove(tmp_path)
            except OSError:
                pass

            return epub_bytes

        except Exception as e:
            raise ValueError(f"Error al generar EPUB: {str(e)}")
