"""
Endpoints para herramientas PDF de Nivel 1.
Todas usan PyMuPDF (fitz) — ya instalado.
"""
import io
import zipfile
import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Response
from typing import List, Optional
import json

router = APIRouter()


# ─── Utilidad ──────────────────────────────────────────────────
async def read_pdf(file: UploadFile) -> fitz.Document:
    """Lee un UploadFile y retorna un documento fitz."""
    data = await file.read()
    try:
        return fitz.open(stream=data, filetype="pdf")
    except Exception:
        raise HTTPException(400, "El archivo no es un PDF válido.")


def pdf_response(doc: fitz.Document, filename: str) -> Response:
    """Genera una Response con el PDF en memoria."""
    buf = io.BytesIO()
    doc.save(buf, deflate=True)
    doc.close()
    buf.seek(0)
    return Response(
        content=buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


def zip_response(zip_buf: io.BytesIO, filename: str) -> Response:
    """Genera una Response con un ZIP en memoria."""
    zip_buf.seek(0)
    return Response(
        content=zip_buf.read(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ─── 1. Rotar PDF ─────────────────────────────────────────────
@router.post("/rotate")
async def rotate_pdf(
    file: UploadFile = File(...),
    angle: int = Form(90),  # 90, 180, 270
    pages: Optional[str] = Form(None),  # "0,1,3" o null para todas
):
    """Rota las páginas del PDF. angle: 90, 180 o 270."""
    if angle not in (90, 180, 270):
        raise HTTPException(400, "El ángulo debe ser 90, 180 o 270.")

    doc = await read_pdf(file)
    
    if pages:
        page_indices = [int(p.strip()) for p in pages.split(",")]
    else:
        page_indices = list(range(len(doc)))

    for i in page_indices:
        if 0 <= i < len(doc):
            page = doc[i]
            page.set_rotation(page.rotation + angle)

    name = file.filename.replace(".pdf", "") if file.filename else "documento"
    return pdf_response(doc, f"{name}_rotado.pdf")


@router.post("/advanced-rotate")
async def advanced_rotate(
    file: UploadFile = File(...),
    rotations: str = Form(...),  # JSON: [{"index": 0, "rotation": 90}, ...]
):
    """Rota páginas individuales con ángulos específicos."""
    doc = await read_pdf(file)
    
    try:
        data = json.loads(rotations)
    except Exception:
        raise HTTPException(400, "Formato de rotaciones inválido.")

    for item in data:
        idx = item.get("index")
        rot = item.get("rotation", 0)
        if 0 <= idx < len(doc):
            # En PyMuPDF, set_rotation establece el ángulo ABSOLUTO (0, 90, 180, 270)
            # o relativo si lo sumamos. iLovePDF suele enviar el estado final.
            # Vamos a asumir que enviamos el ángulo final deseado.
            doc[idx].set_rotation(rot % 360)

    name = file.filename.replace(".pdf", "") if file.filename else "documento"
    return pdf_response(doc, f"{name}_rotado.pdf")


# ─── 2. Unir PDFs ─────────────────────────────────────────────
@router.post("/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Combina múltiples PDFs en uno solo."""
    if len(files) < 2:
        raise HTTPException(400, "Se necesitan al menos 2 archivos PDF.")

    output = fitz.open()
    for f in files:
        data = await f.read()
        try:
            src = fitz.open(stream=data, filetype="pdf")
            output.insert_pdf(src)
            src.close()
        except Exception:
            raise HTTPException(400, f"El archivo '{f.filename}' no es un PDF válido.")

    return pdf_response(output, "documentos_unidos.pdf")


# ─── 3. Dividir PDF Avanzado (Estilo iLovePDF) ────────────────
@router.post("/advanced-split")
async def advanced_split(
    file: UploadFile = File(...),
    ranges: str = Form(...),  # JSON string e.g. [{"start": 1, "end": 4}, {"start": 6, "end": 10}]
    merge_all: str = Form("false")  # "true" or "false"
):
    """
    Divide o extrae páginas de un PDF basado en rangos personalizados.
    Si merge_all es true, une todos los rangos en un solo PDF.
    Si es false, devuelve un ZIP con un PDF por cada rango.
    """
    doc = await read_pdf(file)
    name = file.filename.replace(".pdf", "") if file.filename else "documento"
    should_merge = merge_all.lower() == "true"
    
    try:
        parsed_ranges = json.loads(ranges)
    except json.JSONDecodeError:
        raise HTTPException(400, "El formato de los rangos es inválido. Debe ser JSON.")

    if not parsed_ranges:
        raise HTTPException(400, "Debe proporcionar al menos un rango.")

    if should_merge:
        # Merge all requested pages into a single PDF
        output = fitz.open()
        for r in parsed_ranges:
            start = int(r.get("start", 1)) - 1
            end = int(r.get("end", 1)) - 1
            # Validar limites
            start = max(0, min(start, len(doc) - 1))
            end = max(0, min(end, len(doc) - 1))
            if start <= end:
                output.insert_pdf(doc, from_page=start, to_page=end)
        
        if len(output) == 0:
            raise HTTPException(400, "Los rangos indicados no contienen páginas válidas.")
        
        return pdf_response(output, f"{name}_extraido.pdf")
    
    else:
        # Create a separate PDF for each range and zip them
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, r in enumerate(parsed_ranges):
                start = int(r.get("start", 1)) - 1
                end = int(r.get("end", 1)) - 1
                
                start = max(0, min(start, len(doc) - 1))
                end = max(0, min(end, len(doc) - 1))
                
                if start <= end:
                    single = fitz.open()
                    single.insert_pdf(doc, from_page=start, to_page=end)
                    page_buf = io.BytesIO()
                    single.save(page_buf)
                    single.close()
                    page_buf.seek(0)
                    zf.writestr(f"{name}_rango_{start + 1}-{end + 1}.pdf", page_buf.read())
        
        doc.close()
        return zip_response(zip_buf, f"{name}_dividido.zip")


# ─── 4. Extraer páginas ───────────────────────────────────────
@router.post("/extract")
async def extract_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),  # "1,3,5" (1-indexed desde el frontend)
):
    """Extrae las páginas indicadas y crea un nuevo PDF."""
    doc = await read_pdf(file)
    
    try:
        page_indices = [int(p.strip()) - 1 for p in pages.split(",")]
    except ValueError:
        raise HTTPException(400, "Formato de páginas inválido. Use: 1,3,5")

    output = fitz.open()
    for i in page_indices:
        if 0 <= i < len(doc):
            output.insert_pdf(doc, from_page=i, to_page=i)

    if len(output) == 0:
        raise HTTPException(400, "Ninguna de las páginas indicadas existe en el documento.")

    doc.close()
    name = file.filename.replace(".pdf", "") if file.filename else "documento"
    return pdf_response(output, f"{name}_extraido.pdf")


# ─── 5. Eliminar páginas ──────────────────────────────────────
@router.post("/remove-pages")
async def remove_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),  # "1,3,5" (1-indexed)
):
    """Elimina las páginas indicadas del PDF."""
    doc = await read_pdf(file)

    try:
        page_indices = sorted(
            [int(p.strip()) - 1 for p in pages.split(",")],
            reverse=True  # Eliminar de atrás para adelante
        )
    except ValueError:
        raise HTTPException(400, "Formato de páginas inválido. Use: 1,3,5")

    for i in page_indices:
        if 0 <= i < len(doc):
            doc.delete_page(i)

    if len(doc) == 0:
        raise HTTPException(400, "No se pueden eliminar todas las páginas.")

    name = file.filename.replace(".pdf", "") if file.filename else "documento"
    return pdf_response(doc, f"{name}_sin_paginas.pdf")


# ─── 6. PDF a JPG ─────────────────────────────────────────────
@router.post("/pdf-to-jpg")
async def pdf_to_jpg(
    file: UploadFile = File(...),
    dpi: int = Form(200),
    quality: int = Form(90),
):
    """Convierte cada página del PDF a imagen JPG. Retorna ZIP."""
    doc = await read_pdf(file)
    name = file.filename.replace(".pdf", "") if file.filename else "documento"

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i in range(len(doc)):
            page = doc[i]
            mat = fitz.Matrix(dpi / 72, dpi / 72)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("jpeg")
            zf.writestr(f"{name}_pagina_{i + 1}.jpg", img_bytes)

    doc.close()
    return zip_response(zip_buf, f"{name}_imagenes.zip")


# ─── 7. JPG a PDF ─────────────────────────────────────────────
@router.post("/jpg-to-pdf")
async def jpg_to_pdf(files: List[UploadFile] = File(...)):
    """Convierte múltiples imágenes en un solo PDF."""
    if not files:
        raise HTTPException(400, "Se necesita al menos una imagen.")

    doc = fitz.open()

    for f in files:
        data = await f.read()
        try:
            img = fitz.open(stream=data, filetype=f.filename.split(".")[-1] if f.filename else "png")
            # Obtener dimensiones de la imagen
            img_page = img[0]
            rect = img_page.rect

            # Crear página con las dimensiones de la imagen
            page = doc.new_page(width=rect.width, height=rect.height)
            page.insert_image(rect, stream=data)
            img.close()
        except Exception as e:
            raise HTTPException(400, f"Error al procesar imagen '{f.filename}': {str(e)}")

    return pdf_response(doc, "imagenes_a_pdf.pdf")


# ─── 8. Comprimir PDF ─────────────────────────────────────────
@router.post("/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    level: str = Form("medium"),  # "low", "medium", "high"
):
    """Comprime un PDF reduciendo su tamaño."""
    doc = await read_pdf(file)
    original_data = await file.seek(0) or await file.read()

    buf = io.BytesIO()

    # Configurar según nivel de compresión
    if level == "high":
        # Máxima compresión: recomprimir imágenes + limpiar objetos
        for page in doc:
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                try:
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n >= 4:  # CMYK → RGB
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    # Recomprimir como JPEG con calidad reducida
                    img_bytes = pix.tobytes("jpeg")
                    doc.update_stream(xref, img_bytes)
                    pix = None
                except Exception:
                    pass
        doc.save(buf, garbage=4, deflate=True, clean=True, linear=True)
    elif level == "medium":
        doc.save(buf, garbage=3, deflate=True, clean=True)
    else:  # low
        doc.save(buf, garbage=2, deflate=True)

    doc.close()
    buf.seek(0)
    compressed = buf.read()

    name = file.filename.replace(".pdf", "") if file.filename else "documento"
    return Response(
        content=compressed,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{name}_comprimido.pdf"',
            "X-Original-Size": str(len(original_data)) if isinstance(original_data, bytes) else "0",
            "X-Compressed-Size": str(len(compressed)),
        }
    )
