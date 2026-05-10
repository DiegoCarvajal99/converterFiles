import React, { useState } from 'react';
import { Loader2, Download, Trash2, FileStack, X, ChevronRight } from 'lucide-react';
import client from '../api/client';
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

interface RemovePagesToolProps {
  colorHex: string;
}

const RemovePagesTool: React.FC<RemovePagesToolProps> = ({ colorHex }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  
  // Set de páginas marcadas para ELIMINAR
  const [pagesToRemove, setPagesToRemove] = useState<Set<number>>(new Set());
  
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Cargar PDF y generar miniaturas
  const loadPdf = async (f: File) => {
    setFile(f);
    setLoadingThumbnails(true);
    setThumbnails([]);
    setPagesToRemove(new Set());
    setResultBlob(null);
    
    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);
      
      const thumbs: PageThumbnail[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        thumbs.push({ pageNumber: i, url: canvas.toDataURL('image/jpeg', 0.6) });
        
        if (i % 5 === 0 || i === numPages) {
          setThumbnails([...thumbs]);
        }
      }
      pdf.destroy();
    } catch (err) {
      console.error("Error cargando PDF:", err);
      alert("No se pudo cargar el PDF.");
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadPdf(e.target.files[0]);
  };

  const togglePageRemoval = (pageNum: number) => {
    setPagesToRemove(prev => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  };

  const handleProcess = async () => {
    if (!file || pagesToRemove.size === 0) return;
    if (pagesToRemove.size >= totalPages) {
      alert("No puedes eliminar todas las páginas del PDF.");
      return;
    }
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // El backend actual usa una lista separada por comas
      formData.append('pages', Array.from(pagesToRemove).join(','));

      const resp = await client.post('/tools/remove-pages', formData, { responseType: 'blob' });
      setResultBlob(resp.data);
    } catch (err) {
      alert("Error al eliminar las páginas.");
    } finally {
      setProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="ilovepdf-upload-screen">
        <div className="ilovepdf-dropzone">
          <input type="file" id="remove-input" className="hidden" accept=".pdf" onChange={handleFileChange} />
          <label htmlFor="remove-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivo PDF
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra el archivo aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ilovepdf-workspace remove-pages-workspace">
      {/* Workspace Principal: Cuadrícula de miniaturas */}
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
            {loadingThumbnails && thumbnails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-slate-500 font-medium">Cargando páginas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-12 px-4">
                {thumbnails.map((thumb) => {
                  const isRemoved = pagesToRemove.has(thumb.pageNumber);
                  return (
                    <div 
                      key={thumb.pageNumber} 
                      onClick={() => togglePageRemoval(thumb.pageNumber)}
                      className="flex flex-col items-center animate-in zoom-in duration-300 cursor-pointer"
                    >
                      <div className="relative group">
                        <div className={`w-32 sm:w-40 aspect-[1/1.4] bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                          isRemoved ? 'border-red-400 opacity-40 scale-95 shadow-inner' : 'border-slate-100 shadow-sm group-hover:border-slate-300'
                        }`}>
                          <img src={thumb.url} alt={`Página ${thumb.pageNumber}`} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Indicador de eliminación */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isRemoved ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                          <Trash2 className={`w-12 h-12 ${isRemoved ? 'text-red-600' : 'text-slate-400'}`} />
                        </div>
                        
                        {/* Badge de número de página */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black shadow-sm transition-colors ${
                          isRemoved ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-500'
                        }`}>
                          {thumb.pageNumber}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Lateral: Acciones - Mobile friendly */}
      <div className="ilovepdf-side-panel remove-options-panel mobile-friendly">
        <div className="flex-1 flex flex-col">
          <div className="mb-4 lg:mb-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 lg:mb-6">Páginas a eliminar</h4>
            
            <div className="bg-slate-50 rounded-2xl p-4 lg:p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <span className="text-sm font-bold text-slate-600">Seleccionadas:</span>
                <span className="text-lg font-black text-red-500">{pagesToRemove.size}</span>
              </div>
              <p className="text-[10px] lg:text-[11px] text-slate-400 leading-snug">
                Haz clic sobre las páginas que desees quitar del documento final.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4 lg:pt-8 border-t border-slate-100 lg:border-none">
            {!resultBlob ? (
              <button
                onClick={handleProcess}
                disabled={processing || pagesToRemove.size === 0}
                className="ilovepdf-action-btn"
                style={{ backgroundColor: pagesToRemove.size > 0 && !processing ? colorHex : '#94a3b8' }}
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" />Eliminando...</>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Eliminar páginas</span>
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
                  a.download = `${file.name.replace('.pdf', '')}_final.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }} 
                className="ilovepdf-action-btn download"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .remove-pages-workspace {
          height: calc(100vh - 120px);
          max-height: 900px;
        }
        .remove-options-panel {
          background: white;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default RemovePagesTool;
