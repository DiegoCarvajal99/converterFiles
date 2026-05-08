import React from 'react';
import { categories, getToolsByCategory } from '../config/tools';
import ToolCard from '../components/ToolCard';
import { Zap } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-badge">
            <Zap className="w-4 h-4" />
            <span>Todas las herramientas PDF que necesitas</span>
          </div>
          <h1 className="home-hero-title">
            Convierte, edita y optimiza
            <span className="home-hero-title-accent"> tus archivos PDF</span>
          </h1>
          <p className="home-hero-subtitle">
            Herramientas online gratuitas para trabajar con PDF. Unir, dividir, comprimir, convertir, editar, firmar y mucho más.
          </p>
        </div>
      </section>

      {/* Grid de herramientas por categoría */}
      <section className="home-tools-section">
        {categories.map(cat => {
          const toolsInCat = getToolsByCategory(cat.id);
          return (
            <div key={cat.id} className="home-category-block">
              <div className="home-category-header">
                <div
                  className="home-category-dot"
                  style={{ backgroundColor: cat.colorHex }}
                />
                <h2 className="home-category-title">{cat.label}</h2>
                <div
                  className="home-category-line"
                  style={{ backgroundColor: `${cat.colorHex}25` }}
                />
              </div>
              <div className="home-tools-grid">
                {toolsInCat.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Home;
