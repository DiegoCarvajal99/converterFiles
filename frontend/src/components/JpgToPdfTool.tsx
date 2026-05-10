import React, { useState, useCallback } from 'react';
import { Loader2, Download, Trash2, GripVertical, PlusCircle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import client from '../api/client';

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

interface ImageFile {
  id: string;
  file: File;
  name: string;
  sizeMB: string;
  url: string;
}

interface JpgToPdfToolProps {
  colorHex: string;
}

const SortableImageCard = ({
  imgFile, index, colorHex, onRemove
}: {
  imgFile: ImageFile; index: number; colorHex: string; onRemove: (id: string) => void;
}) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: imgFile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="ilovepdf-file-card" {...attributes} {...listeners}>
      <div className="ilovepdf-card-badge" style={{ backgroundColor: colorHex }}>
        {index + 1}
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(imgFile.id); }} 
        className="ilovepdf-card-delete"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="ilovepdf-card-grip">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="ilovepdf-card-thumb">
        <img src={imgFile.url} alt={imgFile.name} draggable={false} className="object-contain" />
      </div>

      <div className="ilovepdf-card-info">
        <p className="ilovepdf-card-name" title={imgFile.name}>{imgFile.name}</p>
        <p className="ilovepdf-card-meta">{imgFile.sizeMB} MB</p>
      </div>
    </div>
  );
};

const JpgToPdfTool: React.FC<JpgToPdfToolProps> = ({ colorHex }) => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setResultBlob(null);
    const arr = Array.from(newFiles).filter(f =>
      f.type.startsWith('image/')
    );
    for (const file of arr) {
      const id = crypto.randomUUID();
      const imgFile: ImageFile = {
        id, file, name: file.name,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        url: URL.createObjectURL(file),
      };
      setFiles(prev => [...prev, imgFile]);
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return filtered;
    });
    setResultBlob(null);
  };

  const handleDragStart = (event: any) => setActiveId(event.active.id);
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
  const handleDragCancel = () => setActiveId(null);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setResultBlob(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));
      const resp = await client.post('/tools/jpg-to-pdf', formData, { responseType: 'blob' });
      setResultBlob(resp.data);
    } catch (err: any) {
      alert('Error al convertir las imágenes.');
    } finally { setProcessing(false); }
  };

  const activeFile = activeId ? files.find(f => f.id === activeId) : null;

  if (files.length === 0) {
    return (
      <div className="ilovepdf-upload-screen">
        <div className="ilovepdf-dropzone">
          <input type="file" id="jpg-input" className="hidden" accept="image/*" multiple
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
          <label htmlFor="jpg-input" className="ilovepdf-upload-btn" style={{ backgroundColor: colorHex }}>
            Seleccionar imágenes
          </label>
          <p className="text-sm text-slate-400 mt-3">o arrastra las fotos aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ilovepdf-workspace jpg-to-pdf-workspace">
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
              {files.map((imgFile, index) => (
                <SortableImageCard 
                  key={imgFile.id} 
                  imgFile={imgFile} 
                  index={index} 
                  colorHex={colorHex} 
                  onRemove={removeFile} 
                />
              ))}
            </SortableContext>

            <label htmlFor="jpg-input-more" className="ilovepdf-add-card">
              <input type="file" id="jpg-input-more" className="hidden" accept="image/*" multiple
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
              />
              <PlusCircle className="w-8 h-8" style={{ color: colorHex }} />
              <span>Agregar más</span>
            </label>
          </div>

          <DragOverlay adjustScale={true}>
            {activeFile ? (
              <div className="ilovepdf-file-card shadow-2xl scale-105" style={{ zIndex: 9999 }}>
                <div className="ilovepdf-card-badge" style={{ backgroundColor: colorHex }}>#</div>
                <div className="ilovepdf-card-thumb">
                  <img src={activeFile.url} alt="" className="object-contain" />
                </div>
                <div className="ilovepdf-card-info">
                  <p className="ilovepdf-card-name">{activeFile.name}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Panel lateral de acción - Mobile friendly */}
      <div className="ilovepdf-side-panel mobile-friendly">
        <div className="ilovepdf-side-info flex-row lg:flex-col gap-4 lg:gap-2">
          <div className="flex flex-col items-center">
            <span className="text-xl lg:text-2xl font-black text-slate-800">{files.length}</span>
            <span className="text-[10px] lg:text-sm text-slate-500 uppercase font-bold">imágenes</span>
          </div>
          <div className="w-px h-8 bg-slate-200 lg:hidden"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-indigo-500">
              <ImageIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider">A PDF</span>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:block mt-8">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ajustes de imagen</h4>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            Las imágenes se convertirán manteniendo su tamaño original y orientación.
          </div>
        </div>

        <div className="mt-4 lg:mt-auto pt-4 lg:pt-8 border-t border-slate-100 lg:border-none">
          {!resultBlob ? (
            <button
              onClick={handleProcess}
              disabled={files.length === 0 || processing}
              className="ilovepdf-action-btn"
              style={{ backgroundColor: files.length > 0 && !processing ? colorHex : '#94a3b8' }}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Convirtiendo...</>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Convertir a PDF</span>
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
                a.download = 'imagenes_convertidas.pdf';
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

export default JpgToPdfTool;
