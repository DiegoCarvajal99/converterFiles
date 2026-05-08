import { create } from 'zustand';

export interface ProcessedFile {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'success' | 'error';
  html: string | null;
  metadata: Record<string, any> | null;
  errorMessage: string | null;
}

interface ConversionState {
  files: ProcessedFile[];
  activePreviewId: string | null;
  activePreviewFormat: 'html' | 'epub';
  isConvertingGlobal: boolean;
  
  addFiles: (newFiles: File[]) => void;
  updateFileStatus: (id: string, status: ProcessedFile['status'], error?: string) => void;
  setFileResult: (id: string, html: string, metadata: Record<string, any>) => void;
  removeFile: (id: string) => void;
  setActivePreview: (id: string | null, format?: 'html' | 'epub') => void;
  setIsConvertingGlobal: (isConverting: boolean) => void;
  reset: () => void;
}

export const useStore = create<ConversionState>((set) => ({
  files: [],
  activePreviewId: null,
  activePreviewFormat: 'html',
  isConvertingGlobal: false,

  addFiles: (newFiles) => set((state) => {
    const newProcessedFiles = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'pending' as const,
      html: null,
      metadata: null,
      errorMessage: null
    }));
    return { files: [...state.files, ...newProcessedFiles] };
  }),

  updateFileStatus: (id, status, error) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, status, errorMessage: error ?? null } : f)
  })),

  setFileResult: (id, html, metadata) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, status: 'success', html, metadata } : f)
  })),

  removeFile: (id) => set((state) => ({
    files: state.files.filter(f => f.id !== id),
    activePreviewId: state.activePreviewId === id ? null : state.activePreviewId
  })),

  setActivePreview: (id, format = 'html') => set({ activePreviewId: id, activePreviewFormat: format }),
  
  setIsConvertingGlobal: (isConverting) => set({ isConvertingGlobal: isConverting }),

  reset: () => set({ files: [], activePreviewId: null, isConvertingGlobal: false }),
}));
