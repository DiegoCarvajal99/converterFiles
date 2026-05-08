import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Zap } from 'lucide-react';
import { categories, getToolsByCategory, type ToolCategory, type ToolCategoryInfo } from '../config/tools';
import MobileMenu from './MobileMenu';

const Navbar: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<ToolCategory | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  // Cerrar dropdown al cambiar de ruta
  useEffect(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleMouseEnter = (categoryId: ToolCategory) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  // Agrupar categorías en 2 filas para el mega-menu "Convertir"
  const convertCategories = categories.filter(
    c => c.id === 'convert-to-pdf' || c.id === 'convert-from-pdf'
  );
  const otherCategories = categories.filter(
    c => c.id !== 'convert-to-pdf' && c.id !== 'convert-from-pdf'
  );

  return (
    <>
      <nav className="navbar-main">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="navbar-logo-text">ConverterFiles</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="navbar-links">
            {/* Categorías individuales (no convertir) */}
            {otherCategories.map(cat => (
              <NavDropdown
                key={cat.id}
                category={cat}
                isOpen={activeDropdown === cat.id}
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onMouseLeave={handleMouseLeave}
                currentPath={location.pathname}
              />
            ))}

            {/* Convertir — dropdown combinado */}
            <div
              className="navbar-item-wrapper"
              onMouseEnter={() => handleMouseEnter('convert-to-pdf')}
              onMouseLeave={handleMouseLeave}
            >
              <button className={`navbar-item ${activeDropdown === 'convert-to-pdf' ? 'active' : ''}`}>
                Convertir
                <ChevronDown className={`navbar-chevron ${activeDropdown === 'convert-to-pdf' ? 'rotate' : ''}`} />
              </button>

              {activeDropdown === 'convert-to-pdf' && (
                <div className="mega-dropdown convert-dropdown">
                  <div className="mega-dropdown-inner">
                    {convertCategories.map(cat => (
                      <div key={cat.id} className="mega-dropdown-section">
                        <h3 className="mega-dropdown-title" style={{ color: cat.colorHex }}>
                          {cat.label}
                        </h3>
                        <div className="mega-dropdown-grid">
                          {getToolsByCategory(cat.id).map(tool => {
                            const Icon = tool.icon;
                            const isActive = location.pathname === tool.route;
                            return (
                              <Link
                                key={tool.id}
                                to={tool.route}
                                className={`mega-dropdown-link ${isActive ? 'active' : ''}`}
                                style={{ '--cat-color': cat.colorHex } as React.CSSProperties}
                              >
                                <div className="mega-dropdown-link-icon" style={{ backgroundColor: `${cat.colorHex}14`, color: cat.colorHex }}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="mega-dropdown-link-name">{tool.name}</span>
                                  <span className="mega-dropdown-link-desc">{tool.description}</span>
                                </div>
                                {!tool.implemented && (
                                  <span className="mega-dropdown-badge">Pronto</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botón "Todas las herramientas" */}
          <div className="navbar-actions">
            <Link to="/" className="navbar-all-tools-btn">
              Todas las herramientas
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Spacer para compensar navbar fijo */}
      <div className="h-16" />

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

// ─── Dropdown individual por categoría ─────────────────────────
interface NavDropdownProps {
  category: ToolCategoryInfo;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  currentPath: string;
}

const NavDropdown: React.FC<NavDropdownProps> = ({
  category, isOpen, onMouseEnter, onMouseLeave, currentPath
}) => {
  const toolsInCat = getToolsByCategory(category.id);

  return (
    <div
      className="navbar-item-wrapper"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button className={`navbar-item ${isOpen ? 'active' : ''}`}>
        {category.label}
        <ChevronDown className={`navbar-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="mega-dropdown">
          <div className="mega-dropdown-inner single">
            <div className="mega-dropdown-grid">
              {toolsInCat.map(tool => {
                const Icon = tool.icon;
                const isActive = currentPath === tool.route;
                return (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    className={`mega-dropdown-link ${isActive ? 'active' : ''}`}
                    style={{ '--cat-color': category.colorHex } as React.CSSProperties}
                  >
                    <div
                      className="mega-dropdown-link-icon"
                      style={{
                        backgroundColor: `${category.colorHex}14`,
                        color: category.colorHex,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="mega-dropdown-link-name">{tool.name}</span>
                      <span className="mega-dropdown-link-desc">{tool.description}</span>
                    </div>
                    {!tool.implemented && (
                      <span className="mega-dropdown-badge">Pronto</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
