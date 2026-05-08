"""
Script de prueba para verificar que el motor EPUB embebe imágenes correctamente.
Ejecutar con: python test_epub_images.py
"""
import sys
import base64
import zipfile
import io

sys.path.insert(0, '.')

# Crear una imagen JPEG roja 10x10 usando bytes directos
tiny_jpg_b64 = (
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U"
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN"
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy"
    "MjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EACMQ"
    "AAIBBAMBAQEAAAAAAAAAAAECAwAEBREhMUFREv/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAU"
    "EQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCw19Xl1ZW13I8jRxMIE3MSoHfzk7AD"
    "e/cAZqzWt+srJdRRMiTIHBUgg5GfBBzx+GrGgoAKKKKA/9k="
)

html = (
    '<div class="pdf-visual-clone">'
    '<div class="pdf-page-svg">'
    '<div class="pdf-page-wrapper">'
    f'<img src="data:image/jpeg;base64,{tiny_jpg_b64}" style="width:100%" alt="Pagina del PDF" />'
    '</div>'
    '</div>'
    '</div>'
)

from app.engines.epub_engine import EpubGenerator

gen = EpubGenerator()
epub_bytes = gen.generate(html, {'title': 'Test Imagen', 'authors': ['Autor']})

print(f"EPUB generado: {len(epub_bytes)} bytes")

# Inspeccionar el contenido del ZIP (EPUB es un ZIP)
with zipfile.ZipFile(io.BytesIO(epub_bytes)) as zf:
    names = zf.namelist()
    print("\nArchivos dentro del EPUB:")
    for name in names:
        info = zf.getinfo(name)
        print(f"  {name:40s} {info.file_size:>8d} bytes")
    
    # Verificar si hay imágenes
    images = [n for n in names if n.startswith('images/') or n.endswith(('.jpg', '.jpeg', '.png'))]
    if images:
        print(f"\n✅ IMÁGENES EMBEBIDAS CORRECTAMENTE: {images}")
    else:
        print("\n❌ NO SE ENCONTRARON IMÁGENES EN EL EPUB")
        
    # Mostrar el XHTML del capítulo
    xhtml_files = [n for n in names if n.endswith('.xhtml') and 'nav' not in n.lower()]
    if xhtml_files:
        content = zf.read(xhtml_files[0]).decode('utf-8', errors='replace')
        print(f"\nContenido del capítulo (primeros 500 chars):\n{content[:500]}")
