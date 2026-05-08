import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';
import { tools } from './config/tools';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            {tools.map(tool => (
              <Route
                key={tool.id}
                path={tool.route}
                element={<ToolPage />}
              />
            ))}
            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <div className="app-footer-inner">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} ConverterFiles — Herramientas de conversión de archivos
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
