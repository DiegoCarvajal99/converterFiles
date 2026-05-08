import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { categories, getToolsByCategory, type ToolCategory } from '../config/tools';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const [expandedCat, setExpandedCat] = useState<ToolCategory | null>(null);
  const location = useLocation();

  const toggleCat = (catId: ToolCategory) => {
    setExpandedCat(prev => (prev === catId ? null : catId));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`mobile-menu-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className={`mobile-menu-panel ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h2 className="text-lg font-bold text-white">Herramientas</h2>
        </div>

        <div className="mobile-menu-body">
          {/* Link a home */}
          <Link
            to="/"
            onClick={onClose}
            className="mobile-menu-home-link"
          >
            Todas las herramientas
          </Link>

          {/* Categorías accordion */}
          {categories.map(cat => {
            const toolsInCat = getToolsByCategory(cat.id);
            const isExpanded = expandedCat === cat.id;

            return (
              <div key={cat.id} className="mobile-menu-category">
                <button
                  className="mobile-menu-category-btn"
                  onClick={() => toggleCat(cat.id)}
                >
                  <span
                    className="mobile-menu-category-dot"
                    style={{ backgroundColor: cat.colorHex }}
                  />
                  <span className="flex-1 text-left font-medium text-slate-200">
                    {cat.label}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Herramientas de la categoría */}
                <div className={`mobile-menu-tools ${isExpanded ? 'expanded' : ''}`}>
                  {toolsInCat.map(tool => {
                    const Icon = tool.icon;
                    const isActive = location.pathname === tool.route;
                    return (
                      <Link
                        key={tool.id}
                        to={tool.route}
                        onClick={onClose}
                        className={`mobile-menu-tool-link ${isActive ? 'active' : ''}`}
                      >
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{ color: cat.colorHex }}
                        />
                        <span>{tool.name}</span>
                        {!tool.implemented && (
                          <span className="mobile-menu-badge">Pronto</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
