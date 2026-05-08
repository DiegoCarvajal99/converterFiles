import {
  Combine, Scissors, Trash2, FileOutput, ArrowUpDown, ScanLine,
  Minimize2, Wrench, ScanText,
  Image, FileText, Presentation, Sheet, Code,
  BookOpen,
  PenTool, RotateCw, Hash, Droplets, Crop,
  Lock, Unlock, PenLine, EyeOff, GitCompareArrows,
  Sparkles, Languages,
  type LucideIcon
} from 'lucide-react';

export type ToolCategory =
  | 'organize'
  | 'optimize'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'edit'
  | 'security'
  | 'ai';

export interface Tool {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: LucideIcon;
  category: ToolCategory;
  implemented: boolean;
  acceptedFormats?: string[];  // e.g. ['.pdf', '.docx']
}

export interface ToolCategoryInfo {
  id: ToolCategory;
  label: string;
  color: string;         // tailwind color name
  colorHex: string;       // hex value
  bgLight: string;        // light bg class
  textColor: string;      // text class
  borderColor: string;    // border class
  hoverBg: string;        // hover bg class
}

// ─── Categorías ───────────────────────────────────────────────
export const categories: ToolCategoryInfo[] = [
  {
    id: 'organize',
    label: 'Organizar PDF',
    color: 'indigo',
    colorHex: '#6366f1',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    hoverBg: 'hover:bg-indigo-50',
  },
  {
    id: 'optimize',
    label: 'Optimizar PDF',
    color: 'emerald',
    colorHex: '#10b981',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    hoverBg: 'hover:bg-emerald-50',
  },
  {
    id: 'convert-to-pdf',
    label: 'Convertir a PDF',
    color: 'amber',
    colorHex: '#f59e0b',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-50',
  },
  {
    id: 'convert-from-pdf',
    label: 'Convertir desde PDF',
    color: 'blue',
    colorHex: '#3b82f6',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-50',
  },
  {
    id: 'edit',
    label: 'Editar PDF',
    color: 'violet',
    colorHex: '#8b5cf6',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    hoverBg: 'hover:bg-violet-50',
  },
  {
    id: 'security',
    label: 'Seguridad',
    color: 'red',
    colorHex: '#ef4444',
    bgLight: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    hoverBg: 'hover:bg-red-50',
  },
  {
    id: 'ai',
    label: 'IA',
    color: 'pink',
    colorHex: '#ec4899',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-50',
  },
];

export function getCategoryInfo(id: ToolCategory): ToolCategoryInfo {
  return categories.find(c => c.id === id)!;
}

// ─── Herramientas ─────────────────────────────────────────────
export const tools: Tool[] = [
  // ── Organizar PDF ──
  { id: 'merge-pdf',      name: 'Unir PDF',           description: 'Combina múltiples PDFs en uno solo',               route: '/merge-pdf',      icon: Combine,       category: 'organize', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'split-pdf',      name: 'Dividir PDF',        description: 'Separa un PDF en varios archivos',                 route: '/split-pdf',      icon: Scissors,      category: 'organize', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'remove-pages',   name: 'Eliminar páginas',   description: 'Quita páginas específicas de un PDF',              route: '/remove-pages',   icon: Trash2,        category: 'organize', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'extract-pages',  name: 'Extraer páginas',    description: 'Extrae páginas seleccionadas como nuevo PDF',      route: '/extract-pages',  icon: FileOutput,    category: 'organize', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'organize-pdf',   name: 'Ordenar PDF',        description: 'Reorganiza el orden de las páginas',               route: '/organize-pdf',   icon: ArrowUpDown,   category: 'organize', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'scan-to-pdf',    name: 'Escanear a PDF',     description: 'Crea un PDF desde imágenes escaneadas',            route: '/scan-to-pdf',    icon: ScanLine,      category: 'organize', implemented: false, acceptedFormats: ['.jpg', '.png', '.jpeg'] },

  // ── Optimizar PDF ──
  { id: 'compress-pdf',   name: 'Comprimir PDF',      description: 'Reduce el tamaño del archivo PDF',                 route: '/compress-pdf',   icon: Minimize2,     category: 'optimize', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'repair-pdf',     name: 'Reparar PDF',        description: 'Repara archivos PDF dañados o corruptos',          route: '/repair-pdf',     icon: Wrench,        category: 'optimize', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'ocr-pdf',        name: 'OCR PDF',            description: 'Reconoce texto en PDFs escaneados',                route: '/ocr-pdf',        icon: ScanText,      category: 'optimize', implemented: false, acceptedFormats: ['.pdf'] },

  // ── Convertir a PDF ──
  { id: 'jpg-to-pdf',     name: 'JPG a PDF',          description: 'Convierte imágenes JPG a documento PDF',           route: '/jpg-to-pdf',     icon: Image,         category: 'convert-to-pdf', implemented: true, acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'] },
  { id: 'word-to-pdf',    name: 'Word a PDF',         description: 'Convierte documentos Word a PDF',                  route: '/word-to-pdf',    icon: FileText,      category: 'convert-to-pdf', implemented: false, acceptedFormats: ['.docx', '.doc'] },
  { id: 'pptx-to-pdf',    name: 'PowerPoint a PDF',   description: 'Convierte presentaciones a PDF',                   route: '/pptx-to-pdf',    icon: Presentation,  category: 'convert-to-pdf', implemented: false, acceptedFormats: ['.pptx', '.ppt'] },
  { id: 'excel-to-pdf',   name: 'Excel a PDF',        description: 'Convierte hojas de cálculo a PDF',                 route: '/excel-to-pdf',   icon: Sheet,         category: 'convert-to-pdf', implemented: false, acceptedFormats: ['.xlsx', '.xls', '.csv'] },
  { id: 'html-to-pdf',    name: 'HTML a PDF',         description: 'Convierte páginas HTML a PDF',                     route: '/html-to-pdf',    icon: Code,          category: 'convert-to-pdf', implemented: false, acceptedFormats: ['.html', '.htm'] },

  // ── Convertir desde PDF ──
  { id: 'pdf-to-jpg',     name: 'PDF a JPG',          description: 'Convierte cada página del PDF en imagen',          route: '/pdf-to-jpg',     icon: Image,         category: 'convert-from-pdf', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'pdf-to-word',    name: 'PDF a Word',         description: 'Convierte PDF a documento Word editable',          route: '/pdf-to-word',    icon: FileText,      category: 'convert-from-pdf', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'pdf-to-pptx',    name: 'PDF a PowerPoint',   description: 'Convierte PDF a presentación editable',            route: '/pdf-to-pptx',    icon: Presentation,  category: 'convert-from-pdf', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'pdf-to-excel',   name: 'PDF a Excel',        description: 'Extrae tablas del PDF a hoja de cálculo',          route: '/pdf-to-excel',   icon: Sheet,         category: 'convert-from-pdf', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'pdf-to-html',    name: 'PDF a HTML',         description: 'Convierte PDF a HTML semántico',                   route: '/pdf-to-html',    icon: Code,          category: 'convert-from-pdf', implemented: true,  acceptedFormats: ['.pdf'] },
  { id: 'pdf-to-epub',    name: 'PDF a EPUB',         description: 'Convierte PDF a libro electrónico',                route: '/pdf-to-epub',    icon: BookOpen,      category: 'convert-from-pdf', implemented: true,  acceptedFormats: ['.pdf'] },

  // ── Editar PDF ──
  { id: 'edit-pdf',       name: 'Editar PDF',         description: 'Agrega texto, imágenes y formas al PDF',           route: '/edit-pdf',       icon: PenTool,       category: 'edit', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'rotate-pdf',     name: 'Rotar PDF',          description: 'Gira las páginas del PDF',                         route: '/rotate-pdf',     icon: RotateCw,      category: 'edit', implemented: true, acceptedFormats: ['.pdf'] },
  { id: 'page-numbers',   name: 'Números de página',  description: 'Inserta numeración automática de páginas',         route: '/page-numbers',   icon: Hash,          category: 'edit', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'watermark',      name: 'Marca de agua',      description: 'Agrega texto o imagen como watermark',             route: '/watermark',      icon: Droplets,      category: 'edit', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'crop-pdf',       name: 'Recortar PDF',       description: 'Recorta los márgenes o áreas del PDF',             route: '/crop-pdf',       icon: Crop,          category: 'edit', implemented: false, acceptedFormats: ['.pdf'] },

  // ── Seguridad ──
  { id: 'protect-pdf',    name: 'Proteger PDF',       description: 'Agrega contraseña y permisos al PDF',              route: '/protect-pdf',    icon: Lock,          category: 'security', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'unlock-pdf',     name: 'Desbloquear PDF',    description: 'Quita la contraseña de un PDF protegido',          route: '/unlock-pdf',     icon: Unlock,        category: 'security', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'sign-pdf',       name: 'Firmar PDF',         description: 'Agrega tu firma digital al documento',             route: '/sign-pdf',       icon: PenLine,       category: 'security', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'redact-pdf',     name: 'Censurar PDF',       description: 'Oculta información sensible del PDF',              route: '/redact-pdf',     icon: EyeOff,        category: 'security', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'compare-pdf',    name: 'Comparar PDF',       description: 'Compara dos versiones de un documento',            route: '/compare-pdf',    icon: GitCompareArrows, category: 'security', implemented: false, acceptedFormats: ['.pdf'] },

  // ── IA ──
  { id: 'ai-summary',     name: 'Resumir con IA',     description: 'Genera un resumen automático del documento',       route: '/ai-summary',     icon: Sparkles,      category: 'ai', implemented: false, acceptedFormats: ['.pdf'] },
  { id: 'translate-pdf',  name: 'Traducir PDF',       description: 'Traduce el contenido del PDF automáticamente',     route: '/translate-pdf',  icon: Languages,     category: 'ai', implemented: false, acceptedFormats: ['.pdf'] },
];

export function getToolsByCategory(categoryId: ToolCategory): Tool[] {
  return tools.filter(t => t.category === categoryId);
}

export function getToolByRoute(route: string): Tool | undefined {
  return tools.find(t => t.route === route);
}

export function getToolById(id: string): Tool | undefined {
  return tools.find(t => t.id === id);
}
