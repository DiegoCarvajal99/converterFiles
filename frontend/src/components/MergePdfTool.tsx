import React, { useState, useCallback } from 'react';
import { Loader2, Download, Trash2, GripVertical, PlusCircle } from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// Smooth Drag & Drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Vite worker initialization para PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfFile {
  id: string;
  file: File;
  name: string;
  pages: number;
  sizeMB: string;
  thumbnailUrl: string | null;
}

interface MergePdfToolProps {
  colorHex: string;
}

// ─── Componente Sortable Card ──────────────────────────────────────
const SortablePdfCard = ({
  pdfFile, index, colorHex, onRemove
}: {
  pdfFile: PdfFile; index: number; colorHex: string; onRemove: (id: string) => void;
}) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: pdfFile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="ilovepdf-file-card" {...attributes} {...listeners}>
      {/* Badge de orden */}
      <div className="ilovepdf-card-badge" style={{ backgroundColor: colorHex }}>
        {index + 1}
      </div>

      {/* Botón eliminar */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(pdfFile.id); }} 
        className="ilovepdf-card-delete"
        onPointerDown={(e) => e.stopPropagation()} // Prevenir arrastre al hacer clic en borrar
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Grip */}
      <div className="ilovepdf-card-grip">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Thumbnail */}
      <div className="ilovepdf-card-thumb">
        {pdfFile.thumbnailUrl ? (
          <img src={pdfFile.thumbnailUrl} alt={pdfFile.name} draggable={false} />
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        )}
      </div>

      {/* Info */}
      <div className="ilovepdf-card-info">
        <p className="ilovepdf-card-name" title={pdfFile.name}>{pdfFile.name}</p>
        <p className="ilovepdf-card-meta">
          {pdfFile.pages > 0 && `${pdfFile.pages} pág. • `}{pdfFile.sizeMB} MB
        </p>
      </div>
    </div>
  );
};

// ─── Componente Principal ──────────────────────────────────────────
const MergePdfTool: React.FC<MergePdfToolProps> = ({ colorHex }) => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const generateThumbnail = async (file: File): Promise<{ url: string; pages: number }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const scale = 0.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const url = canvas.toDataURL('image/jpeg', 0.7);
      const pages = pdf.numPages;
      pdf.destroy();
      return { url, pages };
    } catch (error) {
      console.error("PDF.js Thumbnail error:", error);
      throw error;
    }
  };

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    setResultBlob(null);
    const arr = Array.from(newFiles).filter(f =>
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    for (const file of arr) {
      const id = crypto.randomUUID();
      const pdfFile: PdfFile = {
        id, file, name: file.name, pages: 0,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        thumbnailUrl: null,
      };
      setFiles(prev => [...prev, pdfFile]);
      try {
        const { url, pages } = await generateThumbnail(file);
        setFiles(prev => prev.map(f => f.id === id ? { ...f, thumbnailUrl: url, pages } : f));
      } catch (err) {
        console.error("No se pudo generar miniatura para:", file.name, err);
      }
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResultBlob(null);
  };

  // dnd-kit handlers
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleZoneDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleZoneDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleProcess = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setResultBlob(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));
      const resp = await axios.post('/api/v1/tools/merge', formData, { responseType: 'blob' });
      setResultBlob(resp.data);
    } catch (err: any) {
      let msg = 'Error al unir los archivos.';
      try { const t = await err.response?.data?.text(); msg = JSON.parse(t).detail || msg; } catch {}
      alert(msg);
    } finally { setProcessing(false); }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url; a.download = 'documentos_unidos.pdf';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const totalPages = files.reduce((sum, f) => sum + f.pages, 0);
  const activeFile = activeId ? files.find(f => f.id === activeId) : null;

  // ─── Estado 1: No hay archivos → pantalla de upload ───
  if (files.length === 0) {
    return (
      <div className="ilovepdf-upload-screen">
        <div onDragOver={handleZoneDragOver} onDrop={handleZoneDrop} className="ilovepdf-dropzone">
          <input type="file" id="merge-input" className="hidden" accept=".pdf" multiple
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
          <label htmlFor="merge-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar archivos PDF
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra los archivos aquí</p>
        </div>
      </div>
    );
  }

  // ─── Estado 2: Archivos cargados → grid con dnd-kit ─────────
  return (
    <div className="ilovepdf-workspace">
      {/* Área principal con thumbnails */}
      <div className="ilovepdf-main-area">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="ilovepdf-files-grid">
            <SortableContext items={files.map(f => f.id)} strategy={rectSortingStrategy}>
              {files.map((pdfFile, index) => (
                <SortablePdfCard 
                  key={pdfFile.id} 
                  pdfFile={pdfFile} 
                  index={index} 
                  colorHex={colorHex} 
                  onRemove={removeFile} 
                />
              ))}
            </SortableContext>

            {/* Botón agregar más */}
            <label htmlFor="merge-input-more" className="ilovepdf-add-card">
              <input type="file" id="merge-input-more" className="hidden" accept=".pdf" multiple
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
              />
              <PlusCircle className="w-8 h-8" style={{ color: colorHex }} />
              <span>Agregar más</span>
            </label>
          </div>

          {/* Overlay para el drag state (lo que ves flotando mientras arrastras) */}
          <DragOverlay adjustScale={true}>
            {activeFile ? (
              <div className="ilovepdf-file-card shadow-2xl scale-105" style={{ zIndex: 9999 }}>
                <div className="ilovepdf-card-badge" style={{ backgroundColor: colorHex }}>#</div>
                <div className="ilovepdf-card-thumb">
                  {activeFile.thumbnailUrl ? (
                    <img src={activeFile.thumbnailUrl} alt="" />
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  )}
                </div>
                <div className="ilovepdf-card-info">
                  <p className="ilovepdf-card-name">{activeFile.name}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Panel lateral de acción */}
      <div className="ilovepdf-side-panel">
        <div className="ilovepdf-side-info">
          <span className="text-2xl font-black text-slate-800">{files.length}</span>
          <span className="text-sm text-slate-500">archivos</span>
          <span className="text-2xl font-black text-slate-800 mt-2">{totalPages}</span>
          <span className="text-sm text-slate-500">páginas totales</span>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4 mb-4">
          Arrastra las tarjetas para cambiar el orden
        </p>
        {!resultBlob ? (
          <button
            onClick={handleProcess}
            disabled={files.length < 2 || processing}
            className="ilovepdf-action-btn"
            style={{ backgroundColor: files.length >= 2 && !processing ? colorHex : '#94a3b8' }}
          >
            {processing ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" />Uniendo...</>
            ) : (
              'Unir PDF'
            )}
          </button>
        ) : (
          <button onClick={handleDownload} className="ilovepdf-action-btn download">
            <Download className="w-5 h-5 mr-2" />
            Descargar
          </button>
        )}
      </div>
    </div>
  );
};

export default MergePdfTool;
