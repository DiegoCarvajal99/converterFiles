import React, { useState } from 'react';
import { Loader2, Download, Trash2, PlusCircle, Scissors, FileStack, CheckCircle2, X } from 'lucide-react';
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

interface SplitRange {
  id: string;
  start: number;
  end: number;
}

interface SplitPdfToolProps {
  colorHex: string;
}

const SplitPdfTool: React.FC<SplitPdfToolProps> = ({ colorHex }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  
  // Modos y Opciones
  const [activeTab, setActiveTab] = useState<'ranges' | 'extract'>('ranges');
  const [ranges, setRanges] = useState<SplitRange[]>([{ id: crypto.randomUUID(), start: 1, end: 1 }]);
  const [extractMode, setExtractMode] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState('');
  const [mergeAll, setMergeAll] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Cargar PDF y generar miniaturas
  const loadPdf = async (f: File) => {
    setFile(f);
    setLoadingThumbnails(true);
    setThumbnails([]);
    setResultBlob(null);
    
    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);
      
      // Ajustar rango inicial si el PDF tiene más de 1 página
      setRanges([{ id: crypto.randomUUID(), start: 1, end: numPages }]);

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
        // Actualizar parcialmente para mostrar progreso
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

  const addRange = () => {
    setRanges([...ranges, { id: crypto.randomUUID(), start: 1, end: totalPages }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) setRanges(ranges.filter(r => r.id !== id));
  };

  const updateRange = (id: string, field: 'start' | 'end', value: number) => {
    setRanges(ranges.map(r => {
      if (r.id === id) {
        const val = Math.max(1, Math.min(totalPages, value));
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      let rangesPayload: any[] = [];
      if (activeTab === 'ranges') {
        rangesPayload = ranges.map(r => ({ start: r.start, end: r.end }));
      } else {
        if (extractMode === 'all') {
          for (let i = 1; i <= totalPages; i++) {
            rangesPayload.push({ start: i, end: i });
          }
        } else {
          // Parse custom pages (e.g. "1, 3, 5-8")
          const parts = customPages.split(',');
          parts.forEach(p => {
            const range = p.trim().split('-');
            if (range.length === 2) {
              rangesPayload.push({ start: parseInt(range[0]), end: parseInt(range[1]) });
            } else if (range[0]) {
              rangesPayload.push({ start: parseInt(range[0]), end: parseInt(range[0]) });
            }
          });
        }
      }

      formData.append('ranges', JSON.stringify(rangesPayload));
      formData.append('merge_all', mergeAll.toString());

      const resp = await client.post('/tools/advanced-split', formData, { responseType: 'blob' });
      setResultBlob(resp.data);
    } catch (err) {
      alert("Error al procesar el PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const isPageSelected = (pageNum: number) => {
    if (activeTab === 'ranges') {
      return ranges.some(r => pageNum >= r.start && pageNum <= r.end);
    } else {
      if (extractMode === 'all') return true;
      // Basic check for custom pages (could be more robust)
      return customPages.includes(pageNum.toString()); 
    }
  };

  if (!file) {
    return (
      <div className="ilovepdf-upload-screen">
        <div className="ilovepdf-dropzone">
          <input type="file" id="split-input" className="hidden" accept=".pdf" onChange={handleFileChange} />
          <label htmlFor="split-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivo PDF
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra el archivo aquí</p>
        </div>
      </div>
    );
  }

  // Componente para renderizar una página individual en la vista de rangos
  const PagePreview = ({ pageNum }: { pageNum: number }) => {
    const thumb = thumbnails.find(t => t.pageNumber === pageNum);
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-28 sm:w-32 aspect-[1/1.4] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex items-center justify-center">
          {thumb ? (
            <img src={thumb.url} alt={`Página ${pageNum}`} className="w-full h-full object-cover" />
          ) : (
            <div className="animate-pulse bg-slate-100 w-full h-full" />
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-500">{pageNum}</span>
      </div>
    );
  };

  return (
    <div className="ilovepdf-workspace split-pdf-workspace">
      {/* Workspace Principal */}
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
                <p className="text-slate-500 font-medium">Cargando previsualizaciones...</p>
              </div>
            ) : activeTab === 'ranges' ? (
              /* VISTA DE RANGOS (Estilo iLovePDF solicitado) */
              <div className="flex flex-wrap justify-center gap-12 py-8">
                {ranges.map((range, idx) => (
                  <div key={range.id} className="flex flex-col items-center animate-in zoom-in duration-300">
                    <span className="text-sm font-bold text-slate-400 mb-4">Rango {idx + 1}</span>
                    <div className="split-range-card group">
                      <PagePreview pageNum={range.start} />
                      
                      {range.start !== range.end && (
                        <>
                          <div className="flex flex-col gap-1.5 pb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          </div>
                          <PagePreview pageNum={range.end} />
                        </>
                      )}

                      {/* Botón rápido para eliminar rango */}
                      {ranges.length > 1 && (
                        <button 
                          onClick={() => removeRange(range.id)}
                          className="absolute -top-3 -right-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Botón rápido para añadir rango desde el workspace */}
                <button 
                  onClick={addRange}
                  className="flex flex-col items-center group animate-in zoom-in duration-300"
                >
                  <span className="text-sm font-bold text-transparent mb-4">Añadir</span>
                  <div className="w-[180px] h-[220px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-500 group-hover:bg-indigo-50/30 transition-all">
                    <PlusCircle className="w-8 h-8" />
                    <span className="text-xs font-bold uppercase tracking-widest">Añadir rango</span>
                  </div>
                </button>
              </div>
            ) : (
              /* VISTA DE EXTRACCIÓN (Grid de todas las páginas) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-8 px-4">
                {thumbnails.map((thumb) => {
                  const selected = isPageSelected(thumb.pageNumber);
                  return (
                    <div 
                      key={thumb.pageNumber} 
                      onClick={() => {
                        if (activeTab === 'extract' && extractMode === 'custom') {
                          // Lógica simple para añadir/quitar de la lista customPages
                          const pagesArr = customPages.split(',').map(p => p.trim()).filter(p => p);
                          const pStr = thumb.pageNumber.toString();
                          if (pagesArr.includes(pStr)) {
                            setCustomPages(pagesArr.filter(p => p !== pStr).join(', '));
                          } else {
                            setCustomPages([...pagesArr, pStr].join(', '));
                          }
                        }
                      }}
                      className={`relative group transition-all duration-300 cursor-pointer ${selected ? 'scale-[0.98]' : ''}`}
                    >
                      <div className={`aspect-[1/1.4] rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                        selected ? 'border-indigo-500 shadow-xl shadow-indigo-100' : 'border-slate-100 hover:border-slate-300'
                      }`}>
                        <img src={thumb.url} alt={`Página ${thumb.pageNumber}`} className="w-full h-full object-cover" />
                        {selected && (
                          <div className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full p-1.5 shadow-md animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className={`mt-3 text-center text-xs font-black transition-colors ${selected ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {thumb.pageNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Lateral: Opciones de Dividir - Mobile friendly */}
      <div className="ilovepdf-side-panel split-options-panel mobile-friendly">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 lg:mb-6">
          <button 
            onClick={() => setActiveTab('ranges')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ranges' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Dividir
          </button>
          <button 
            onClick={() => setActiveTab('extract')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'extract' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Extraer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col max-h-[300px] lg:max-h-none">
          {activeTab === 'ranges' ? (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Rangos de páginas</h4>
                <button 
                  onClick={addRange}
                  className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {ranges.map((range, idx) => (
                  <div key={range.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rango {idx + 1}</span>
                      {ranges.length > 1 && (
                        <button onClick={() => removeRange(range.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Desde</label>
                        <input 
                          type="number" 
                          value={range.start} 
                          onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Hasta</label>
                        <input 
                          type="number" 
                          value={range.end} 
                          onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors group">
                <input 
                  type="checkbox" 
                  checked={mergeAll} 
                  onChange={(e) => setMergeAll(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                />
                <div>
                  <span className="text-sm font-bold text-slate-700 block">Unir todos los rangos</span>
                  <span className="text-[11px] text-indigo-400 font-medium">Generar un único archivo PDF</span>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              <div className="space-y-3">
                <button 
                  onClick={() => setExtractMode('all')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    extractMode === 'all' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700">Extraer todas las páginas</span>
                    {extractMode === 'all' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">Cada página del PDF se convertirá en un archivo PDF separado.</p>
                </button>

                <button 
                  onClick={() => setExtractMode('custom')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    extractMode === 'custom' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700">Seleccionar páginas</span>
                    {extractMode === 'custom' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">Elige exactamente qué páginas quieres extraer.</p>
                  
                  {extractMode === 'custom' && (
                    <div className="mt-4" onClick={e => e.stopPropagation()}>
                      <input 
                        type="text" 
                        placeholder="Ej: 1, 3, 5-8" 
                        value={customPages}
                        onChange={(e) => setCustomPages(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}
                </button>
              </div>

              <label className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors group">
                <input 
                  type="checkbox" 
                  checked={mergeAll} 
                  onChange={(e) => setMergeAll(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                />
                <div>
                  <span className="text-sm font-bold text-slate-700 block">Unir páginas extraídas</span>
                  <span className="text-[11px] text-indigo-400 font-medium">Combinar selección en un único PDF</span>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 lg:mt-8">
          {!resultBlob ? (
            <button
              onClick={handleProcess}
              disabled={processing || (activeTab === 'extract' && extractMode === 'custom' && !customPages)}
              className="ilovepdf-action-btn"
              style={{ backgroundColor: colorHex }}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Procesando...</>
              ) : (
                <>{activeTab === 'ranges' ? 'Dividir PDF' : 'Extraer páginas'}</>
              )}
            </button>
          ) : (
            <button 
              onClick={() => {
                const url = URL.createObjectURL(resultBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = mergeAll ? `${file.name.replace('.pdf', '')}_extraido.pdf` : `${file.name.replace('.pdf', '')}_dividido.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }} 
              className="ilovepdf-action-btn download"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar resultado
            </button>
          )}
        </div>
      </div>

      <style>{`
        .split-pdf-workspace {
          height: calc(100vh - 120px);
          max-height: 900px;
        }
        .split-options-panel {
          background: white;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default SplitPdfTool;
