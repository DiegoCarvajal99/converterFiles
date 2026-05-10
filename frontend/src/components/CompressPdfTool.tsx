import React, { useState } from 'react';
import { Loader2, Download, Zap, Gauge, ShieldCheck, FileStack, ChevronRight, X } from 'lucide-react';
import client from '../api/client';

interface CompressPdfToolProps {
  colorHex: string;
}

const CompressPdfTool: React.FC<CompressPdfToolProps> = ({ colorHex }) => {
  const [file, setFile] = useState<File | null>(null);
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [compressedInfo, setCompressedInfo] = useState<{ original: number; compressed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResultBlob(null);
      setCompressedInfo(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setResultBlob(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('level', compressLevel);

      const resp = await client.post('/tools/compress', formData, { responseType: 'blob' });
      
      // Obtener tamaños de los headers si el backend los envía
      const origSize = parseInt(resp.headers['x-original-size'] || file.size.toString());
      const compSize = parseInt(resp.headers['x-compressed-size'] || resp.data.size.toString());
      
      setCompressedInfo({ original: origSize, compressed: compSize });
      setResultBlob(resp.data);
    } catch (err) {
      alert("Error al comprimir el PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  if (!file) {
    return (
      <div className="ilovepdf-upload-screen">
        <div className="ilovepdf-dropzone">
          <input type="file" id="compress-input" className="hidden" accept=".pdf" onChange={handleFileChange} />
          <label htmlFor="compress-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivo PDF
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra el archivo aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ilovepdf-workspace compress-pdf-workspace">
      <div className="ilovepdf-main-area">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
            <FileStack className="w-12 h-12 text-indigo-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{file.name}</h3>
          <p className="text-slate-400 font-medium mb-8">{formatSize(file.size)}</p>
          
          {compressedInfo && (
            <div className="w-full max-w-md bg-emerald-50 border border-emerald-100 rounded-2xl p-6 animate-in zoom-in duration-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-emerald-700">¡Compresión completada!</span>
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase">
                  -{Math.round((1 - compressedInfo.compressed / compressedInfo.original) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Original</span>
                  <span className="text-sm font-bold text-slate-500 line-through">{formatSize(compressedInfo.original)}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 text-right">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Comprimido</span>
                  <span className="text-lg font-black text-emerald-700">{formatSize(compressedInfo.compressed)}</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setFile(null)} className="mt-8 text-xs font-bold text-slate-300 hover:text-red-500 transition-colors flex items-center gap-2">
            <X className="w-4 h-4" />
            Cambiar archivo
          </button>
        </div>
      </div>

      <div className="ilovepdf-side-panel mobile-friendly">
        <div className="mb-4 lg:mb-8 overflow-y-auto max-h-[300px] lg:max-h-none pr-1">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 lg:mb-6">Nivel de compresión</h4>
          
          <div className="space-y-3">
            {[
              { id: 'high', label: 'Extrema', desc: 'Menos calidad', icon: Zap, color: 'bg-red-50 text-red-600 border-red-100' },
              { id: 'medium', label: 'Recomendada', desc: 'Buena calidad', icon: Gauge, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
              { id: 'low', label: 'Baja', desc: 'Alta calidad', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
            ].map((opt) => (
              <button 
                key={opt.id}
                onClick={() => setCompressLevel(opt.id as any)}
                className={`w-full p-3 lg:p-4 rounded-2xl border-2 text-left transition-all group ${
                  compressLevel === opt.id 
                    ? `${opt.color.replace('border-', 'border-').split(' ')[2]} shadow-lg shadow-indigo-100` 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${compressLevel === opt.id ? opt.color : 'bg-white text-slate-400'}`}>
                    <opt.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <div>
                    <span className={`block text-xs lg:text-sm font-bold ${compressLevel === opt.id ? 'text-slate-800' : 'text-slate-600'}`}>{opt.label}</span>
                    <span className="block text-[10px] text-slate-400">{opt.desc}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 lg:pt-8 border-t border-slate-100 lg:border-none">
          {!resultBlob ? (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="ilovepdf-action-btn"
              style={{ backgroundColor: colorHex }}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Comprimiendo...</>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Comprimir PDF</span>
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
                a.download = `${file.name.replace('.pdf', '')}_comprimido.pdf`;
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
  );
};

export default CompressPdfTool;
