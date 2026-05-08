# 🗺️ Roadmap de Herramientas — ConverterFiles

> Guía de implementación ordenada por dificultad.  
> Marcar con ✅ conforme se vayan completando.

---

## 🟢 Nivel 1 — Muy Fácil (< 1 hora c/u)
Todas usan **PyMuPDF** (`fitz`) que ya está instalado.

| Estado | Herramienta | Ruta | Cómo implementar |
|--------|-------------|------|-------------------|
| ✅ | Rotar PDF | `/rotate-pdf` | `page.set_rotation(angle)` por cada página |
| ✅ | Unir PDFs | `/merge-pdf` | Loop con `output.insert_pdf(src)` por cada archivo |
| ✅ | Dividir PDF | `/split-pdf` | Crear nuevo doc por cada página o rango |
| ✅ | Extraer páginas | `/extract-pages` | Igual que dividir pero con páginas seleccionadas por el usuario |
| ✅ | Eliminar páginas | `/remove-pages` | `doc.delete_page(index)` en loop inverso |
| ✅ | PDF a JPG | `/pdf-to-jpg` | `page.get_pixmap(dpi=200).save("page.png")` — devolver ZIP |
| ✅ | JPG a PDF | `/jpg-to-pdf` | `doc.new_page()` + `page.insert_image(rect, filename)` |
| ✅ | Comprimir PDF | `/compress-pdf` | `doc.save(deflate=True, garbage=4, clean=True)` |

**Librerías:** Solo `PyMuPDF` (ya instalado)

---

## 🟡 Nivel 2 — Fácil (1-2 horas c/u)
Usan PyMuPDF + algo de lógica extra.

| Estado | Herramienta | Ruta | Cómo implementar |
|--------|-------------|------|-------------------|
| ⬜ | Proteger PDF | `/protect-pdf` | `doc.save(encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=..., owner_pw=...)` |
| ⬜ | Desbloquear PDF | `/unlock-pdf` | `fitz.open(path, password=pw)` + guardar sin encryption |
| ⬜ | Ordenar páginas | `/organize-pdf` | `doc.move_page(from_idx, to_idx)` según array del frontend |
| ⬜ | Números de página | `/page-numbers` | `page.insert_text(point, str(num), fontsize=11)` en cada página |
| ⬜ | Marca de agua | `/watermark` | `page.insert_text()` con opacity o `page.insert_image()` con alpha |
| ⬜ | Escanear a PDF | `/scan-to-pdf` | `Pillow` para procesar imágenes → PyMuPDF para armar el PDF |
| ⬜ | Recortar PDF | `/crop-pdf` | `page.set_cropbox(fitz.Rect(x0, y0, x1, y1))` |

**Librerías:** `PyMuPDF` + `Pillow` (`pip install Pillow`)

---

## 🟠 Nivel 3 — Moderado (2-4 horas c/u)
Requieren librerías adicionales especializadas.

| Estado | Herramienta | Ruta | Librería | Notas |
|--------|-------------|------|----------|-------|
| ⬜ | PDF a Word | `/pdf-to-word` | `pdf2docx` | `pip install pdf2docx` — conversión automática con layout |
| ⬜ | Word a PDF | `/word-to-pdf` | `LibreOffice` headless | `soffice --convert-to pdf file.docx` — necesita LibreOffice instalado |
| ⬜ | Excel a PDF | `/excel-to-pdf` | `LibreOffice` headless | Mismo approach que Word→PDF |
| ⬜ | PowerPoint a PDF | `/pptx-to-pdf` | `LibreOffice` headless | Mismo approach |
| ⬜ | HTML a PDF | `/html-to-pdf` | `weasyprint` | `pip install weasyprint` — renderiza CSS/HTML a PDF |
| ⬜ | Reparar PDF | `/repair-pdf` | `PyMuPDF` | Abrir con tolerancia a errores + re-guardar limpio |
| ⬜ | PDF a PDF/A | `/pdf-to-pdfa` | `PyMuPDF` | Embeber fuentes + metadata XMP de conformidad |

**Instalar:**
```bash
pip install pdf2docx weasyprint
# + LibreOffice instalado en el sistema para Word/Excel/PPT → PDF
```

---

## 🔴 Nivel 4 — Difícil (4-8 horas c/u)
Procesamiento complejo o dependencias del sistema.

| Estado | Herramienta | Ruta | Librería | Dificultad |
|--------|-------------|------|----------|------------|
| ⬜ | PDF a Excel | `/pdf-to-excel` | `tabula-py` o `camelot` | Extraer tablas con estructura — necesita Java (tabula) |
| ⬜ | PDF a PowerPoint | `/pdf-to-pptx` | `python-pptx` + PyMuPDF | No hay librería directa: PDF→imágenes→slides |
| ⬜ | OCR PDF | `/ocr-pdf` | `pytesseract` + `tesseract` | Necesita Tesseract OCR instalado en el sistema |
| ⬜ | Censurar PDF | `/redact-pdf` | `PyMuPDF` | `page.add_redact_annot()` + `page.apply_redactions()` — UI para seleccionar áreas |
| ⬜ | Comparar PDF | `/compare-pdf` | `PyMuPDF` + `difflib` | Diff de texto o comparación visual página a página |
| ⬜ | Firmar PDF | `/sign-pdf` | `endesive` o canvas frontend | Firma visual (dibujo) + posicionamiento en el PDF |
| ⬜ | Editar PDF | `/edit-pdf` | Canvas JS + PyMuPDF | Editor interactivo: agregar texto, imágenes, formas |

**Instalar:**
```bash
pip install tabula-py python-pptx pytesseract endesive
# + Tesseract OCR instalado: https://github.com/tesseract-ocr/tesseract
# + Java JRE para tabula-py
```

---

## 🔵 Nivel 5 — Requiere IA / API Externa

| Estado | Herramienta | Ruta | Requiere | Notas |
|--------|-------------|------|----------|-------|
| ⬜ | Resumir con IA | `/ai-summary` | API OpenAI / Gemini | Extraer texto → enviar a LLM → devolver resumen |
| ⬜ | Traducir PDF | `/translate-pdf` | API de traducción | Extraer texto → traducir → reconstruir PDF con layout |
| ⬜ | Formularios PDF | `/pdf-forms` | Frontend complejo | Editor drag-and-drop de campos de formulario |

**Requiere:** Claves API de OpenAI/Google/DeepL

---

## 📊 Resumen

| Nivel | Cantidad | Tiempo estimado total |
|-------|----------|----------------------|
| 🟢 Muy Fácil | 8 | ~4 horas |
| 🟡 Fácil | 7 | ~8 horas |
| 🟠 Moderado | 7 | ~18 horas |
| 🔴 Difícil | 7 | ~40 horas |
| 🔵 IA/API | 3 | ~12 horas |
| **Total** | **32** | **~82 horas** |

---

## ✅ Ya implementadas

| Herramienta | Ruta |
|-------------|------|
| PDF a HTML | `/pdf-to-html` |
| PDF a EPUB | `/pdf-to-epub` |
| Word a HTML | (integrado en PDF a HTML) |
| Rotar PDF | `/rotate-pdf` |
| Unir PDFs | `/merge-pdf` |
| Dividir PDF | `/split-pdf` |
| Extraer páginas | `/extract-pages` |
| Eliminar páginas | `/remove-pages` |
| PDF a JPG | `/pdf-to-jpg` |
| JPG a PDF | `/jpg-to-pdf` |
| Comprimir PDF | `/compress-pdf` |
