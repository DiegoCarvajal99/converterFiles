import React from 'react';
import axios from 'axios';
import { FileText, Eye, Download, Trash2, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { useStore, ProcessedFile } from '../store/useStore';
import { generateFullHtmlDocument } from '../utils/htmlGenerator';

const FileList: React.FC = () => {
  const { files, removeFile, setActivePreview } = useStore();

  if (files.length === 0) {
    return null;
  }

  const handleDownload = async (file: ProcessedFile, format: 'html' | 'epub') => {
    if (!file.html) return;
    
    if (format === 'html') {
      // Determinar si es un clon estricto PDF
      const isPdfClone = file.metadata?.extra?.engine === 'pymupdf-visual-clone';
      
      // Generamos el documento HTML completo con todos los estilos incrustados
      const fullHtml = generateFullHtmlDocument(file.html, isPdfClone);
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.file.name.replace(/\.[^/.]+$/, "")}_convertido.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // EPUB Download
      try {
        const response = await axios.post('/api/v1/epub', {
          html: file.html,
          metadata: file.metadata
        }, {
          responseType: 'blob'
        });
        
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.file.name.replace(/\.[^/.]+$/, "")}.epub`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading EPUB:', err);
        alert('Error al descargar el EPUB');
      }
    }
  };

  const getStatusBadge = (file: ProcessedFile) => {
    switch (file.status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Pendiente</span>;
      case 'converting':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Procesando</span>;
      case 'success':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Listo</span>;
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Error</span>;
    }
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
      <div className="">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamaño</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="flex-shrink-0 h-5 w-5 text-indigo-400 mr-3" />
                    <div className="text-sm font-medium text-slate-900 max-w-xs truncate" title={file.file.name}>
                      {file.file.name}
                    </div>
                  </div>
                  {file.errorMessage && (
                    <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={file.errorMessage}>
                      {file.errorMessage}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500">{(file.file.size / 1024 / 1024).toFixed(2)} MB</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(file)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-3">
                    {/* Grupo HTML */}
                    <div className="relative group">
                      <button
                        disabled={file.status !== 'success'}
                        className={`flex items-center px-3 py-1.5 rounded-lg border border-slate-200 transition-all ${file.status === 'success' ? 'bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 shadow-sm' : 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100'}`}
                      >
                        <span className="font-bold">HTML</span>
                        <ChevronDown className="w-4 h-4 ml-1.5 opacity-60" />
                      </button>
                      {file.status === 'success' && (
                        <div className="absolute right-0 top-full hidden group-hover:block z-[100] pt-1">
                          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 min-w-[130px] animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => setActivePreview(file.id, 'html')}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2 opacity-70" />
                              Visualizar
                            </button>
                            <button
                              onClick={() => handleDownload(file, 'html')}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center transition-colors"
                            >
                              <Download className="w-4 h-4 mr-2 opacity-70" />
                              Descargar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grupo EPUB */}
                    <div className="relative group">
                      <button
                        disabled={file.status !== 'success'}
                        className={`flex items-center px-3 py-1.5 rounded-lg border border-slate-200 transition-all ${file.status === 'success' ? 'bg-white text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 shadow-sm' : 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100'}`}
                      >
                        <span className="font-bold">EPUB</span>
                        <ChevronDown className="w-4 h-4 ml-1.5 opacity-60" />
                      </button>
                      {file.status === 'success' && (
                        <div className="absolute right-0 top-full hidden group-hover:block z-[100] pt-1">
                          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 min-w-[130px] animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => setActivePreview(file.id, 'epub')}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2 opacity-70" />
                              Visualizar
                            </button>
                            <button
                              onClick={() => handleDownload(file, 'epub')}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center transition-colors"
                            >
                              <Download className="w-4 h-4 mr-2 opacity-70" />
                              Descargar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors ml-2"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;
