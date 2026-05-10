import React, { useState, useCallback } from 'react';
import { Loader2, Download, Trash2, FileText, CheckCircle2, PlusCircle } from 'lucide-react';
import client from '../api/client';

type ToolType = 'single-to-single' | 'single-to-zip' | 'multi-to-single';

interface ToolUploaderProps {
  toolId: string;
  endpoint: string;
  acceptedFormats: string;
  acceptLabel: string;
  toolType: ToolType;
  colorHex: string;
  extraFields?: React.ReactNode;
  getExtraFormData?: () => Record<string, string>;
}

interface UploadedFile {
  id: string;
  file: File;
}

const ToolUploader: React.FC<ToolUploaderProps> = ({
  toolId, endpoint, acceptedFormats, acceptLabel, toolType, colorHex,
  extraFields, getExtraFormData,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('resultado');
  const [resultInfo, setResultInfo] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).map(f => ({
      id: crypto.randomUUID(),
      file: f,
    }));
    if (toolType === 'multi-to-single') {
      setFiles(prev => [...prev, ...arr]);
    } else {
      // Solo un archivo para single-to-*
      setFiles(arr.slice(0, 1));
    }
    setResultBlob(null);
    setResultInfo(null);
  }, [toolType]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResultBlob(null);
  };

  const handleZoneDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleZoneDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setResultBlob(null);
    setResultInfo(null);

    try {
      const formData = new FormData();
      if (toolType === 'multi-to-single') {
        files.forEach(f => formData.append('files', f.file));
      } else {
        formData.append('file', files[0].file);
      }
      if (getExtraFormData) {
        const extra = getExtraFormData();
        Object.entries(extra).forEach(([k, v]) => formData.append(k, v));
      }

      const resp = await client.post(`/tools${endpoint}`, formData, { responseType: 'blob' });

      const contentDisp = resp.headers['content-disposition'] || '';
      const match = contentDisp.match(/filename="?([^"]+)"?/);
      const fname = match ? match[1] : `resultado.${toolType === 'single-to-zip' ? 'zip' : 'pdf'}`;

      // Info de compresión
      const origSize = resp.headers['x-original-size'];
      const compSize = resp.headers['x-compressed-size'];
      if (origSize && compSize) {
        const orig = parseInt(origSize);
        const comp = parseInt(compSize);
        const pct = ((1 - comp / orig) * 100).toFixed(1);
        setResultInfo(`Reducido ${pct}% — De ${(orig / 1024 / 1024).toFixed(2)} MB a ${(comp / 1024 / 1024).toFixed(2)} MB`);
      }

      setResultBlob(resp.data);
      setResultName(fname);
    } catch (err: any) {
      let msg = 'Error al procesar el archivo.';
      try { const t = await err.response?.data?.text(); msg = JSON.parse(t).detail || msg; } catch {}
      alert(msg);
    } finally { setProcessing(false); }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url; a.download = resultName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const isMulti = toolType === 'multi-to-single';

  // ─── Estado 1: Sin archivos → pantalla de upload estilo iLovePDF ──────
  if (files.length === 0) {
    return (
      <div className="ilovepdf-upload-screen">
        <div onDragOver={handleZoneDragOver} onDrop={handleZoneDrop} className="ilovepdf-dropzone">
          <input type="file" id={`input-${toolId}`} className="hidden"
            accept={acceptedFormats} multiple={isMulti}
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
          <label htmlFor={`input-${toolId}`} className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivo{isMulti ? 's' : ''}
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra {isMulti ? 'los archivos' : 'el archivo'} aquí</p>
          <p className="text-xs text-slate-300 mt-1">{acceptLabel}</p>
        </div>
      </div>
    );
  }

  // ─── Estado 2: Archivos cargados → workspace con panel lateral ────────
  return (
    <div className="ilovepdf-workspace">
      {/* Área principal */}
      <div className="ilovepdf-main-area">
        {/* Lista de archivos */}
        <div className="ilovepdf-file-list">
          {files.map(f => (
            <div key={f.id} className="ilovepdf-file-row">
              <FileText className="w-5 h-5 shrink-0" style={{ color: colorHex }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{f.file.name}</p>
                <p className="text-xs text-slate-400">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!processing && (
                <button onClick={() => removeFile(f.id)} className="ilovepdf-file-delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Agregar más (solo multi) */}
        {isMulti && (
          <label htmlFor={`input-more-${toolId}`} className="ilovepdf-add-more-btn" style={{ color: colorHex, borderColor: `${colorHex}40` }}>
            <input type="file" id={`input-more-${toolId}`} className="hidden"
              accept={acceptedFormats} multiple
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
            />
            <PlusCircle className="w-5 h-5 mr-2" />
            Agregar más archivos
          </label>
        )}

        {/* Resultado de compresión */}
        {resultInfo && (
          <div className="ilovepdf-result-info">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium text-emerald-700">{resultInfo}</span>
          </div>
        )}
      </div>

      {/* Panel lateral - Responsive fix */}
      <div className="ilovepdf-side-panel mobile-friendly">
        {/* Opciones extra */}
        {extraFields && !resultBlob && (
          <div className="ilovepdf-side-options">
            {extraFields}
          </div>
        )}

        {/* Botón de acción */}
        <div className="mt-auto pt-4 border-t border-slate-100 lg:border-none">
          {!resultBlob ? (
            <button
              onClick={handleProcess}
              disabled={processing || files.length === 0}
              className="ilovepdf-action-btn"
              style={{ backgroundColor: !processing ? colorHex : '#94a3b8' }}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Procesando...</>
              ) : (
                'Procesar ahora'
              )}
            </button>
          ) : (
            <button onClick={handleDownload} className="ilovepdf-action-btn download">
              <Download className="w-5 h-5 mr-2" />
              Descargar archivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolUploader;
