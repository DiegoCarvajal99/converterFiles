import React, { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import ArticlePreview from './ArticlePreview';
import EpubPreview from './EpubPreview';
import { generateFullHtmlDocument } from '../utils/htmlGenerator';

const PreviewModal: React.FC = () => {
  const { files, activePreviewId, activePreviewFormat, setActivePreview } = useStore();
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [epubBlob, setEpubBlob] = useState<Blob | null>(null);
  const [loadingEpub, setLoadingEpub] = useState(false);
  const [epubError, setEpubError] = useState<string | null>(null);

  const activeFile = files.find(f => f.id === activePreviewId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePreview(null);
      }
    };
    
    if (activeFile) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFile, setActivePreview]);

  // Cargar EPUB si es el formato activo
  useEffect(() => {
    if (activePreviewId && activePreviewFormat === 'epub' && activeFile?.html) {
      const loadEpub = async () => {
        setLoadingEpub(true);
        setEpubError(null);
        setEpubData(null);
        setEpubBlob(null);
        try {
          const response = await axios.post('/api/v1/epub', {
            html: activeFile.html,
            metadata: activeFile.metadata
          }, {
            responseType: 'arraybuffer'  // ArrayBuffer para epub.js
          });
          setEpubData(response.data);
          // Guardamos el blob solo para descarga
          setEpubBlob(new Blob([response.data], { type: 'application/epub+zip' }));
        } catch (err: any) {
          console.error('Error loading EPUB for preview:', err);
          let msg = 'Error al generar el libro electrónico.';
          if (err.response?.data) {
            try {
              const decoder = new TextDecoder();
              const text = decoder.decode(err.response.data);
              const json = JSON.parse(text);
              msg = json.detail || msg;
            } catch { }
          }
          setEpubError(msg);
        } finally {
          setLoadingEpub(false);
        }
      };
      loadEpub();
    } else {
      setEpubError(null);
      setEpubData(null);
      setEpubBlob(null);
    }
  }, [activePreviewId, activePreviewFormat]);

  if (!activePreviewId || !activeFile || !activeFile.html) {
    return null;
  }

  const handleDownload = async () => {
    if (activePreviewFormat === 'html') {
      const isPdfClone = activeFile.metadata?.extra?.engine === 'pymupdf-visual-clone';
      const fullHtml = generateFullHtmlDocument(activeFile.html!, isPdfClone);
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeFile.file.name.replace(/\.[^/.]+$/, "")}_convertido.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      if (epubBlob) {
        const url = URL.createObjectURL(epubBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeFile.file.name.replace(/\.[^/.]+$/, "")}.epub`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const isPdfClone = activeFile.metadata?.extra?.engine === 'pymupdf-visual-clone';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header — barra compacta superior */}
      <div className="bg-slate-800 px-5 py-3 flex items-center justify-between shrink-0 min-w-0 border-b border-slate-700">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-white truncate pr-4">{activeFile.file.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {activePreviewFormat === 'html' ? 'Previsualización HTML' : 'Previsualización EPUB (Libro Electrónico)'}
            {activePreviewFormat === 'html' && ` — ${isPdfClone ? 'Clon Visual Estricto' : 'Documento Semántico'}`}
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg font-medium transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar {activePreviewFormat.toUpperCase()}
          </button>
          <button
            onClick={() => setActivePreview(null)}
            className="p-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area — ocupa todo el espacio restante */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center" style={{ background: '#1e293b' }}>
        {loadingEpub ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Generando libro electrónico...</p>
          </div>
        ) : activePreviewFormat === 'html' ? (
          <div className="w-full h-full max-w-6xl flex flex-col overflow-auto">
            <ArticlePreview 
              htmlContent={activeFile.html} 
              isPdfClone={isPdfClone} 
            />
          </div>
        ) : epubData ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <EpubPreview epubData={epubData} />
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <p className="text-red-400 font-bold mb-2">Error al cargar la previsualización.</p>
            <p className="text-slate-400 text-sm">{epubError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
