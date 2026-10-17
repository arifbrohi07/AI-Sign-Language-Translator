import React from 'react';
import { Camera, BookOpen, BarChart3, HelpCircle, Database, Settings, Info } from 'lucide-react';

export type NavPage =
  | 'home'
  | 'translator'
  | 'alphabet'
  | 'performance'
  | 'how-it-works'
  | 'collector'
  | 'settings'
  | 'about';

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isCameraActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  isCameraActive,
}) => {
  const navItems: Array<{ id: NavPage; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Overview', icon: null },
    { id: 'translator', label: 'Live Translator', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'alphabet', label: 'Alphabet', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'performance', label: 'Performance', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'how-it-works', label: 'How It Works', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'collector', label: 'Data Studio', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'About', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="text-left font-bold tracking-tight text-slate-100 hover:text-white transition-colors cursor-pointer text-base sm:text-lg flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>AI Sign Language Translator</span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer pb-0.5 border-b-2 ${
                  isActive
                    ? 'text-cyan-400 border-cyan-400 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action / Status */}
        <div className="flex items-center gap-3">
          {isCameraActive && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>CAM ACTIVE</span>
            </div>
          )}

          {currentPage !== 'translator' ? (
            <button
              onClick={() => onNavigate('translator')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch Translator</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              Calibrate
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pt-2.5 pb-1 border-t border-slate-900 mt-2 text-xs no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              currentPage === item.id
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
