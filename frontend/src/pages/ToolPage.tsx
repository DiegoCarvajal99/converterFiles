import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { tools, getCategoryInfo } from '../config/tools';
import FileUploader from '../components/FileUploader';
import FileList from '../components/FileList';
import PreviewModal from '../components/PreviewModal';
import ToolUploader from '../components/ToolUploader';
import MergePdfTool from '../components/MergePdfTool';
import SplitPdfTool from '../components/SplitPdfTool';
import RotatePdfTool from '../components/RotatePdfTool';
import RemovePagesTool from '../components/RemovePagesTool';
import JpgToPdfTool from '../components/JpgToPdfTool';
import CompressPdfTool from '../components/CompressPdfTool';
import PdfToJpgTool from '../components/PdfToJpgTool';

// ─── Configuración de cada herramienta Nivel 1 ─────────────────
interface ToolUIConfig {
  endpoint: string;
  acceptedFormats: string;
  acceptLabel: string;
  toolType: 'single-to-single' | 'single-to-zip' | 'multi-to-single';
  hasExtraFields?: boolean;
}

const toolUIConfigs: Record<string, ToolUIConfig> = {
  'rotate-pdf': {
    endpoint: '/advanced-rotate',
    acceptedFormats: '.pdf',
    acceptLabel: 'Archivo PDF',
    toolType: 'single-to-single',
    hasExtraFields: true,
  },
  // merge-pdf uses its own dedicated MergePdfTool component
  'split-pdf': {
    endpoint: '/advanced-split',
    acceptedFormats: '.pdf',
    acceptLabel: 'Archivo PDF a dividir en páginas',
    toolType: 'single-to-zip',
  },
  'extract-pages': {
    endpoint: '/extract',
    acceptedFormats: '.pdf',
    acceptLabel: 'Archivo PDF',
    toolType: 'single-to-single',
    hasExtraFields: true,
  },
  'remove-pages': {
    endpoint: '/remove-pages',
    acceptedFormats: '.pdf',
    acceptLabel: 'Archivo PDF',
    toolType: 'single-to-single',
    hasExtraFields: true,
  },
  'pdf-to-jpg': {
    endpoint: '/pdf-to-jpg',
    acceptedFormats: '.pdf',
    acceptLabel: 'Archivo PDF a convertir en imágenes',
    toolType: 'single-to-zip',
    hasExtraFields: true,
  },
  'jpg-to-pdf': {
    endpoint: '/jpg-to-pdf',
    acceptedFormats: '.jpg,.jpeg,.png,.webp,.bmp',
    acceptLabel: 'Imágenes JPG, PNG, WEBP',
    toolType: 'multi-to-single',
  },
  'compress-pdf': {
    endpoint: '/compress',
    acceptedFormats: '.pdf',
    acceptLabel: 'Archivo PDF a comprimir',
    toolType: 'single-to-single',
    hasExtraFields: true,
  },
};

// ─── Extra Fields Components ────────────────────────────────────
const RotateFields: React.FC<{ angle: string; setAngle: (a: string) => void }> = ({ angle, setAngle }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <label className="text-sm font-medium text-slate-600">Ángulo de rotación:</label>
    {['90', '180', '270'].map(a => (
      <button
        key={a}
        onClick={() => setAngle(a)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          angle === a
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {a}°
      </button>
    ))}
  </div>
);

const PagesField: React.FC<{ pages: string; setPages: (p: string) => void; label: string }> = ({ pages, setPages, label }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <label className="text-sm font-medium text-slate-600 shrink-0">{label}:</label>
    <input
      type="text"
      value={pages}
      onChange={(e) => setPages(e.target.value)}
      placeholder="Ej: 1, 3, 5-7"
      className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 flex-1 max-w-xs"
    />
  </div>
);

const DpiField: React.FC<{ dpi: string; setDpi: (d: string) => void }> = ({ dpi, setDpi }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <label className="text-sm font-medium text-slate-600">Calidad:</label>
    {[{ v: '150', l: 'Normal' }, { v: '200', l: 'Alta' }, { v: '300', l: 'Máxima' }].map(opt => (
      <button
        key={opt.v}
        onClick={() => setDpi(opt.v)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          dpi === opt.v
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {opt.l} ({opt.v} DPI)
      </button>
    ))}
  </div>
);

const CompressField: React.FC<{ level: string; setLevel: (l: string) => void }> = ({ level, setLevel }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <label className="text-sm font-medium text-slate-600">Nivel de compresión:</label>
    {[{ v: 'low', l: '🟢 Baja', d: 'Menor reducción, mayor calidad' },
      { v: 'medium', l: '🟡 Media', d: 'Balance recomendado' },
      { v: 'high', l: '🔴 Alta', d: 'Máxima reducción' }].map(opt => (
      <button
        key={opt.v}
        onClick={() => setLevel(opt.v)}
        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
          level === opt.v
            ? 'bg-emerald-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <span className="block">{opt.l}</span>
        <span className={`block text-xs mt-0.5 ${level === opt.v ? 'text-emerald-100' : 'text-slate-400'}`}>{opt.d}</span>
      </button>
    ))}
  </div>
);

// ─── ToolPage Component ─────────────────────────────────────────
const ToolPage: React.FC = () => {
  const location = useLocation();
  const tool = tools.find(t => t.route === location.pathname);

  // State para campos extra
  const [angle, setAngle] = useState('90');
  const [pages, setPages] = useState('');
  const [dpi, setDpi] = useState('200');
  const [compressLevel, setCompressLevel] = useState('medium');

  if (!tool) {
    return (
      <div className="tool-page-not-found">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Herramienta no encontrada</h2>
        <p className="text-slate-500 mb-6">La herramienta que buscas no existe.</p>
        <Link to="/" className="tool-page-back-link">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>
      </div>
    );
  }

  const cat = getCategoryInfo(tool.category);
  const Icon = tool.icon;
  const uiConfig = toolUIConfigs[tool.id];

  // Herramientas legacy (pdf-to-html, pdf-to-epub) usan el flujo antiguo
  const isLegacyTool = tool.id === 'pdf-to-html' || tool.id === 'pdf-to-epub';

  if (isLegacyTool) {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader"><FileUploader /></section>
          <section><FileList /></section>
        </main>
        <PreviewModal />
      </div>
    );
  }

  // Merge PDF — componente dedicado con thumbnails y drag
  if (tool.id === 'merge-pdf') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <MergePdfTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // Split PDF — componente dedicado con thumbnails y rangos
  if (tool.id === 'split-pdf') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <SplitPdfTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // Rotate PDF — componente dedicado con thumbnails
  if (tool.id === 'rotate-pdf') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <RotatePdfTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // Remove Pages — componente dedicado con thumbnails
  if (tool.id === 'remove-pages') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <RemovePagesTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // JPG to PDF — componente dedicado reordenable
  if (tool.id === 'jpg-to-pdf') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <JpgToPdfTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // Compress PDF — componente dedicado
  if (tool.id === 'compress-pdf') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <CompressPdfTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // PDF to JPG — componente dedicado
  if (tool.id === 'pdf-to-jpg') {
    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <PdfToJpgTool colorHex={cat.colorHex} />
          </section>
        </main>
      </div>
    );
  }

  // Herramientas del Nivel 1 con ToolUploader
  if (uiConfig) {
    const getExtraFormData = (): Record<string, string> => {
      switch (tool.id) {
        case 'rotate-pdf':
          return { angle };
        case 'extract-pages':
        case 'remove-pages':
          return { pages };
        case 'pdf-to-jpg':
          return { dpi, quality: '90' };
        case 'compress-pdf':
          return { level: compressLevel };
        default:
          return {};
      }
    };

    const extraFields = (() => {
      switch (tool.id) {
        case 'rotate-pdf':
          return <RotateFields angle={angle} setAngle={setAngle} />;
        case 'extract-pages':
          return <PagesField pages={pages} setPages={setPages} label="Páginas a extraer" />;
        case 'remove-pages':
          return <PagesField pages={pages} setPages={setPages} label="Páginas a eliminar" />;
        case 'pdf-to-jpg':
          return <DpiField dpi={dpi} setDpi={setDpi} />;
        case 'compress-pdf':
          return <CompressField level={compressLevel} setLevel={setCompressLevel} />;
        default:
          return undefined;
      }
    })();

    return (
      <div className="tool-page">
        <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
          <div className="tool-page-hero-inner">
            <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="tool-page-title">{tool.name}</h1>
            <p className="tool-page-desc">{tool.description}</p>
          </div>
        </section>
        <main className="tool-page-workspace">
          <section className="tool-page-uploader">
            <ToolUploader
              toolId={tool.id}
              endpoint={uiConfig.endpoint}
              acceptedFormats={uiConfig.acceptedFormats}
              acceptLabel={uiConfig.acceptLabel}
              toolType={uiConfig.toolType}
              colorHex={cat.colorHex}
              extraFields={extraFields}
              getExtraFormData={getExtraFormData}
            />
          </section>
        </main>
      </div>
    );
  }

  // Herramienta no implementada — "coming soon"
  return (
    <div className="tool-page">
      <section className="tool-page-hero" style={{ '--tool-color': cat.colorHex } as React.CSSProperties}>
        <div className="tool-page-hero-inner">
          <div className="tool-page-icon" style={{ backgroundColor: `${cat.colorHex}18`, color: cat.colorHex }}>
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="tool-page-title">{tool.name}</h1>
          <p className="tool-page-desc">{tool.description}</p>
        </div>
      </section>
      <main className="tool-page-workspace">
        <div className="tool-page-coming-soon">
          <Construction className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-700 mb-2">En construcción</h2>
          <p className="text-slate-500 max-w-md text-center mb-6">
            Esta herramienta estará disponible próximamente.
          </p>
          <Link to="/" className="tool-page-back-btn" style={{ backgroundColor: cat.colorHex }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver todas las herramientas
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ToolPage;
