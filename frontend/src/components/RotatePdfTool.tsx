import React, { useState } from 'react';
import { Loader2, Download, RotateCw, RotateCcw, FileStack, CheckCircle2, X, RefreshCw, ChevronRight } from 'lucide-react';
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

interface RotatePdfToolProps {
  colorHex: string;
}

const RotatePdfTool: React.FC<RotatePdfToolProps> = ({ colorHex }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  
  // Rotaciones por página (0, 90, 180, 270)
  const [rotations, setRotations] = useState<Record<number, number>>({});
  
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Cargar PDF y generar miniaturas
  const loadPdf = async (f: File) => {
    setFile(f);
    setLoadingThumbnails(true);
    setThumbnails([]);
    setRotations({});
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

  const rotatePage = (pageNum: number, direction: 'cw' | 'ccw') => {
    setRotations(prev => {
      const current = prev[pageNum] || 0;
      const step = direction === 'cw' ? 90 : -90;
      let next = (current + step) % 360;
      if (next < 0) next += 360;
      return { ...prev, [pageNum]: next };
    });
  };

  const rotateAll = (direction: 'cw' | 'ccw') => {
    setRotations(prev => {
      const newRotations: Record<number, number> = {};
      for (let i = 1; i <= totalPages; i++) {
        const current = prev[i] || 0;
        const step = direction === 'cw' ? 90 : -90;
        let next = (current + step) % 360;
        if (next < 0) next += 360;
        newRotations[i] = next;
      }
      return newRotations;
    });
  };

  const resetAll = () => setRotations({});

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const rotationsPayload = Object.entries(rotations).map(([page, rot]) => ({
        index: parseInt(page) - 1,
        rotation: rot
      }));

      formData.append('rotations', JSON.stringify(rotationsPayload));

      const resp = await axios.post('/api/v1/tools/advanced-rotate', formData, { responseType: 'blob' });
      setResultBlob(resp.data);
    } catch (err) {
      alert("Error al rotar el PDF.");
    } finally {
      setProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="ilovepdf-upload-screen">
        <div className="ilovepdf-dropzone">
          <input type="file" id="rotate-input" className="hidden" accept=".pdf" onChange={handleFileChange} />
          <label htmlFor="rotate-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivo PDF
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra el archivo aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ilovepdf-workspace rotate-pdf-workspace">
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
                  const rotation = rotations[thumb.pageNumber] || 0;
                  return (
                    <div key={thumb.pageNumber} className="flex flex-col items-center animate-in zoom-in duration-300">
                      <div className="relative group">
                        <div 
                          className="w-32 sm:w-40 aspect-[1/1.4] bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden transition-transform duration-300 ease-in-out"
                          style={{ transform: `rotate(${rotation}deg)` }}
                        >
                          <img src={thumb.url} alt={`Página ${thumb.pageNumber}`} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Botón de rotación individual (hover) */}
                        <button 
                          onClick={() => rotatePage(thumb.pageNumber, 'cw')}
                          className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer"
                        >
                          <div className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg text-slate-700 hover:text-indigo-600 transition-colors scale-90 group-hover:scale-100 duration-300">
                            <RotateCw className="w-6 h-6" />
                          </div>
                        </button>
                        
                        {/* Badge de rotación si está rotada */}
                        {rotation !== 0 && (
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full p-1.5 shadow-md z-10">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <span className="mt-4 text-[11px] font-bold text-slate-400">{thumb.pageNumber}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Lateral: Opciones de Rotación */}
      <div className="ilovepdf-side-panel rotate-options-panel">
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Rotación</h4>
            
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => rotateAll('ccw')}
                className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-all flex flex-col items-center gap-2 group"
              >
                <RotateCcw className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
                <span className="text-xs font-bold">Izquierda</span>
              </button>
              <button 
                onClick={() => rotateAll('cw')}
                className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-all flex flex-col items-center gap-2 group"
              >
                <RotateCw className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                <span className="text-xs font-bold">Derecha</span>
              </button>
            </div>

            <button 
              onClick={resetAll}
              className="w-full py-3 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restablecer todas
            </button>
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
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" />Procesando...</>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Rotar PDF</span>
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
                  a.download = `${file.name.replace('.pdf', '')}_rotado.pdf`;
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
        .rotate-pdf-workspace {
          height: calc(100vh - 120px);
          max-height: 900px;
        }
        .rotate-options-panel {
          background: white;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default RotatePdfTool;
