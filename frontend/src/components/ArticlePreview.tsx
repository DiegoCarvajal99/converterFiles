import React, { useRef, useState } from 'react';
import { Copy, Download, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';

import { generateFullHtmlDocument } from '../utils/htmlGenerator';

interface ArticlePreviewProps {
  htmlContent: string;
  isPdfClone?: boolean;
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ htmlContent, isPdfClone = false }) => {
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generamos el documento completo que se inyecta en el iframe y en la descarga ZIP
  const iframeDocument = generateFullHtmlDocument(htmlContent, isPdfClone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      
      // Estructura base para OJS
      zip.file('index.html', iframeDocument);
      
      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'articulo_cientifico_ojs.zip';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al generar el ZIP:', err);
      alert('Hubo un error al generar el archivo .zip');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 gap-4 shrink-0">
        <h3 className="font-semibold text-slate-800 shrink-0">Previsualización del Artículo</h3>
        <div className="flex space-x-3 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          >
            {copied ? <CheckCircle className="w-4 h-4 mr-2 text-green-500 shrink-0" /> : <Copy className="w-4 h-4 mr-2 shrink-0" />}
            {copied ? 'Copiado' : 'Copiar HTML'}
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Download className="w-4 h-4 mr-2 shrink-0" />
            Descargar .zip
          </button>
        </div>
      </div>
      
      {/* Iframe Safe Preview */}
      <div className="flex-1 min-h-0 w-full bg-slate-100 p-2 sm:p-4 lg:p-8 flex flex-col relative">
        <div className="w-full flex-1 max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden border border-slate-200 flex flex-col min-h-0 relative">
          <iframe
            ref={iframeRef}
            srcDoc={iframeDocument}
            title="Previsualización del Artículo"
            className="w-full h-full border-0 absolute inset-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
