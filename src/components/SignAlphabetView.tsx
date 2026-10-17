import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, Hand } from 'lucide-react';
import { ASL_DICTIONARY } from '../utils/aslDictionary';
import { SignAlphabetInfo } from '../types';
import { NavPage } from './Navbar';

interface SignAlphabetViewProps {
  onNavigate: (page: NavPage) => void;
}

export const SignAlphabetView: React.FC<SignAlphabetViewProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSign, setActiveSign] = useState<SignAlphabetInfo | null>(null);

  const signs = Object.values(ASL_DICTIONARY);

  const categories = [
    { id: 'all', label: 'All Signs' },
    { id: 'fist', label: 'Fist Shapes' },
    { id: 'open', label: 'Open Palms' },
    { id: 'pointing', label: 'Pointing Fingers' },
    { id: 'curved', label: 'Curved Shapes' },
    { id: 'crossing', label: 'Crossing' },
    { id: 'special', label: 'Control Commands' },
  ];

  const filteredSigns = signs.filter((sign) => {
    const matchesCategory =
      selectedCategory === 'all' || sign.category === selectedCategory;
    const matchesSearch =
      sign.letter.toLowerCase().includes(search.toLowerCase()) ||
      sign.name.toLowerCase().includes(search.toLowerCase()) ||
      sign.description.toLowerCase().includes(search.toLowerCase()) ||
      sign.mnemonic.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span>American Sign Language Alphabet</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual reference guide for standard ASL static hand shapes (A–Z) and system control signs
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sign, finger, mnemonic..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 focus:outline-none rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Interactive Category Filter Tabs (Zero-pill compliant segmented buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sign Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredSigns.map((sign) => {
          const isSelected = activeSign?.letter === sign.letter;
          return (
            <div
              key={sign.letter}
              onClick={() => setActiveSign(sign)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'border-cyan-400 bg-slate-900/90 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-400/50'
                  : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-cyan-400">
                    {sign.letter}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {sign.name}
                  </span>
                </div>
                <div className="text-[10px] font-mono uppercase text-slate-500 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                  {sign.category}
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {sign.description}
              </p>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono italic truncate max-w-[170px]">
                  💡 {sign.mnemonic}
                </span>
                <span className="text-cyan-400 font-medium hover:underline shrink-0">
                  Inspect
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal / Drawer for Selected Sign */}
      {activeSign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl font-black font-mono text-cyan-400 shadow-inner">
                  {activeSign.letter}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{activeSign.name}</h2>
                  <div className="text-xs text-slate-400 capitalize">
                    Category: {activeSign.category}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveSign(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Hand Anatomy & Execution
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {activeSign.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Finger Position Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-500">Thumb: </span>
                    <span className="text-slate-200">{activeSign.fingers.thumb}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-500">Index: </span>
                    <span className="text-slate-200">{activeSign.fingers.index}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-500">Middle: </span>
                    <span className="text-slate-200">{activeSign.fingers.middle}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-500">Ring: </span>
                    <span className="text-slate-200">{activeSign.fingers.ring}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800 sm:col-span-2">
                    <span className="text-slate-500">Pinky: </span>
                    <span className="text-slate-200">{activeSign.fingers.pinky}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-xs text-cyan-300">
                <span className="font-semibold">Mnemonic: </span>
                <span>{activeSign.mnemonic}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveSign(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setActiveSign(null);
                  onNavigate('translator');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Practice '{activeSign.letter}' in Camera</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
