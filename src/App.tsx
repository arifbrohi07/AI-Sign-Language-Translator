/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Navbar, NavPage } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { LiveTranslatorView } from './components/LiveTranslatorView';
import { SignAlphabetView } from './components/SignAlphabetView';
import { ModelPerformanceView } from './components/ModelPerformanceView';
import { HowItWorksView } from './components/HowItWorksView';
import { DataCollectorView } from './components/DataCollectorView';
import { SettingsView } from './components/SettingsView';
import { AboutView } from './components/AboutView';
import { HandDetectorService } from './services/handDetector';
import { DataStorage } from './services/dataStorage';
import { AppSettings } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>(() => DataStorage.loadSettings());

  // Instantiate singleton HandDetectorService
  const handDetector = useMemo(() => new HandDetectorService(), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isCameraActive={isCameraActive}
      />

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentPage === 'home' && <HomeView onNavigate={setCurrentPage} />}
        {currentPage === 'translator' && (
          <LiveTranslatorView
            settings={settings}
            handDetector={handDetector}
            onCameraStateChange={setIsCameraActive}
          />
        )}
        {currentPage === 'alphabet' && <SignAlphabetView onNavigate={setCurrentPage} />}
        {currentPage === 'performance' && <ModelPerformanceView />}
        {currentPage === 'how-it-works' && <HowItWorksView />}
        {currentPage === 'collector' && <DataCollectorView handDetector={handDetector} />}
        {currentPage === 'settings' && (
          <SettingsView settings={settings} onUpdateSettings={setSettings} />
        )}
        {currentPage === 'about' && <AboutView />}
      </main>

      {/* Quiet, Professional Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-slate-200">AI Sign Language Translator</span>
            <span className="hidden sm:inline text-slate-700" aria-hidden="true">·</span>
            <span>Real-time ASL Alphabet Detection & Speech Synthesis</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <button
              onClick={() => setCurrentPage('how-it-works')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Pipeline Architecture
            </button>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentPage('performance')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Evaluation Metrics
            </button>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentPage('about')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Academic Portfolio
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-4 mt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Camera frames are processed locally by the application via WebAssembly/WebGL.</span>
          <span>Recognizes predefined static hand signs (A–Z, Space, Delete).</span>
        </div>
      </footer>
    </div>
  );
}
