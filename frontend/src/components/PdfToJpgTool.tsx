import React, { useState } from 'react';
import { Loader2, Download, Image as ImageIcon, Box, FileStack, ChevronRight, X } from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// Vite worker initialization para PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PageThumbnail {
  pageNumber: number;
  url: string;
}

interface PdfToJpgToolProps {
  colorHex: string;
}

const PdfToJpgTool: React.FC<PdfToJpgToolProps> = ({ colorHex }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  
  const [mode, setMode] = useState<'pages' | 'images'>('pages');
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const loadPdf = async (f: File) => {
    setFile(f);
    setThumbnails([]);
    setResultBlob(null);
    
    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);
      
      const thumbs: PageThumbnail[] = [];
      const count = Math.min(numPages, 10); // Solo mostramos las primeras 10 para previsualizar
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        thumbs.push({ pageNumber: i, url: canvas.toDataURL('image/jpeg', 0.6) });
        setThumbnails([...thumbs]);
      }
      pdf.destroy();
    } catch (err) {
      console.error("Error cargando PDF:", err);
    } finally {
      // Done
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadPdf(e.target.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // El backend actual solo tiene /pdf-to-jpg que hace 'pages'
      // Si quisiéramos 'extract images', necesitaríamos otro endpoint o parámetro
      const resp = await axios.post('/api/v1/tools/pdf-to-jpg', formData, { responseType: 'blob' });
      setResultBlob(resp.data);
    } catch (err) {
      alert("Error al convertir el PDF.");
    } finally {
      setProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="ilovepdf-upload-screen">
        <div className="ilovepdf-dropzone">
          <input type="file" id="pdf2jpg-input" className="hidden" accept=".pdf" onChange={handleFileChange} />
          <label htmlFor="pdf2jpg-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivo PDF
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra el archivo aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ilovepdf-workspace pdf-to-jpg-workspace">
      <div className="ilovepdf-main-area">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <FileStack className="w-5 h-5 text-indigo-500" />
                {file.name}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">{totalPages} páginas • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-12 px-4">
              {thumbnails.map((thumb) => (
                <div key={thumb.pageNumber} className="flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="w-full aspect-[1/1.4] bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                    <img src={thumb.url} alt={`Página ${thumb.pageNumber}`} className="w-full h-full object-cover" />
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-slate-400">{thumb.pageNumber}</span>
                </div>
              ))}
              {totalPages > 10 && (
                <div className="flex items-center justify-center aspect-[1/1.4] border-2 border-dashed border-slate-100 rounded-xl text-slate-300 font-bold text-xs text-center p-4">
                  + {totalPages - 10} páginas más
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ilovepdf-side-panel">
        <div className="mb-8">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Opciones PDF a JPG</h4>
          
          <div className="space-y-3">
            <button 
              onClick={() => setMode('pages')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                mode === 'pages' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${mode === 'pages' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400'}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">Páginas a JPG</span>
                  <span className="block text-[11px] text-slate-400 leading-snug">Cada página se convertirá en un JPG.</span>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setMode('images')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                mode === 'images' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${mode === 'images' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400'}`}>
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">Extraer imágenes</span>
                  <span className="block text-[11px] text-slate-400 leading-snug">Solo se extraerán las fotos del PDF.</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-100">
          {!resultBlob ? (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="ilovepdf-action-btn"
              style={{ backgroundColor: colorHex }}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Convirtiendo...</>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Convertir a JPG</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </button>
          ) : (
            <button 
              onClick={() => {
                const url = URL.createObjectURL(resultBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${file.name.replace('.pdf', '')}_imagenes.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }} 
              className="ilovepdf-action-btn download"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar ZIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfToJpgTool;
