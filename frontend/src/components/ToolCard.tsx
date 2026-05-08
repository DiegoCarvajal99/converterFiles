import React from 'react';
import { Link } from 'react-router-dom';
import { type Tool, getCategoryInfo } from '../config/tools';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const cat = getCategoryInfo(tool.category);
  const Icon = tool.icon;

  return (
    <Link
      to={tool.route}
      className="tool-card group"
      style={{ '--card-color': cat.colorHex } as React.CSSProperties}
    >
      {/* Icono */}
      <div
        className="tool-card-icon"
        style={{
          backgroundColor: `${cat.colorHex}12`,
          color: cat.colorHex,
        }}
      >
        <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Contenido */}
      <h3 className="tool-card-title">{tool.name}</h3>
      <p className="tool-card-desc">{tool.description}</p>

      {/* Badge */}
      {!tool.implemented && (
        <span className="tool-card-badge">Próximamente</span>
      )}

      {/* Borde inferior con color */}
      <div
        className="tool-card-bottom-bar"
        style={{ backgroundColor: cat.colorHex }}
      />
    </Link>
  );
};

export default ToolCard;
