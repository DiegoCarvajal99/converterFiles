import React, { useCallback } from 'react';
import { Upload, Loader2, PlusCircle } from 'lucide-react';
import client from '../api/client';
import { useStore } from '../store/useStore';

const FileUploader: React.FC = () => {
  const { files, addFiles, updateFileStatus, setFileResult, isConvertingGlobal, setIsConvertingGlobal } = useStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateAndAddFiles = (selectedFiles: FileList | File[]) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];
    
    const validFiles: File[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      addFiles(validFiles);
    } else {
      alert('Solo se permiten archivos .docx o .pdf');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      // Reset input to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  const handleProcessBatch = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsConvertingGlobal(true);

    for (const pFile of pendingFiles) {
      updateFileStatus(pFile.id, 'converting');
      const formData = new FormData();
      formData.append('file', pFile.file);

      try {
        const response = await client.post('/convert', formData);
        setFileResult(pFile.id, response.data.html_content, response.data.metadata);
      } catch (err: any) {
        updateFileStatus(pFile.id, 'error', err.message || 'Error al convertir el archivo');
      }
    }

    setIsConvertingGlobal(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer
          ${isConvertingGlobal ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/30'}`}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".docx,.pdf"
          multiple
          onChange={handleFileChange}
          disabled={isConvertingGlobal}
        />
        <label htmlFor="fileInput" className={isConvertingGlobal ? "cursor-not-allowed" : "cursor-pointer"}>
          <div className="flex flex-col items-center space-y-4">
            <Upload className="w-16 h-16 text-indigo-400" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-slate-700">Arrastra tus artículos aquí</p>
              <p className="text-sm text-slate-500">Soporta formatos .DOCX y .PDF (Puedes seleccionar varios)</p>
            </div>
            <div className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-medium text-sm hover:bg-indigo-700 transition-colors inline-flex items-center">
              <PlusCircle className="w-4 h-4 mr-2" />
              Seleccionar Archivos
            </div>
          </div>
        </label>
      </div>

      <button
        onClick={handleProcessBatch}
        disabled={pendingCount === 0 || isConvertingGlobal}
        className={`mt-8 w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center text-lg
          ${pendingCount === 0 || isConvertingGlobal 
            ? 'bg-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'}`}
      >
        {isConvertingGlobal ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Procesando documentos...
          </>
        ) : (
          `Convertir ${pendingCount} archivo${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
        )}
      </button>
    </div>
  );
};

export default FileUploader;

