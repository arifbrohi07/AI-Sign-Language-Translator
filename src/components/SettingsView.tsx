import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Volume2, Eye, Cpu, RotateCcw, Check } from 'lucide-react';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS, DataStorage } from '../services/dataStorage';
import { SpeechService } from '../services/speechService';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    const loadVoices = () => {
      const v = SpeechService.getVoices();
      setVoices(v);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    DataStorage.saveSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1200);
  };

  const handleReset = () => {
    if (confirm('Reset all parameters to factory defaults?')) {
      onUpdateSettings(DEFAULT_SETTINGS);
      DataStorage.saveSettings(DEFAULT_SETTINGS);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 1200);
    }
  };

  const handleTestVoice = () => {
    SpeechService.speak('Testing sign language speech synthesis output.', {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.speechVoiceURI,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            <span>System Settings & Calibration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Fine-tune ML inference confidence, smoothing window, visual overlays, and text-to-speech audio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}

          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: ML Inference & Filtering */}
        <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Machine Learning & Filter Thresholds
            </h2>
          </div>

          <div className="space-y-5">
            {/* Confidence Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-200">Confidence Acceptance Threshold</span>
                  <p className="text-slate-400 text-[11px]">
                    Predictions with posterior probability below this value are marked as 'Uncertain'.
                  </p>
                </div>
                <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm">
                  {Math.round(settings.confidenceThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={settings.confidenceThreshold}
                onChange={(e) => handleChange('confidenceThreshold', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>50% (Permissive)</span>
                <span>75% (Recommended Default)</span>
                <span>95% (Strict)</span>
              </div>
            </div>

            {/* Smoothing Window Size */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-200">Prediction Smoothing Window</span>
                  <p className="text-slate-400 text-[11px]">
                    Rolling majority vote buffer across consecutive frames to suppress jitter and tremor.
                  </p>
                </div>
                <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm">
                  {settings.smoothingWindowSize} frames
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={settings.smoothingWindowSize}
                onChange={(e) => handleChange('smoothingWindowSize', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 (Instant, raw)</span>
                <span>5 (Balanced Default)</span>
                <span>15 (Highly stable)</span>
              </div>
            </div>

            {/* Auto-Add Hold Delay */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-200">Auto-Add Gesture Hold Duration</span>
                  <p className="text-slate-400 text-[11px]">
                    Holding a stable sign steadily will automatically append it to the sentence buffer.
                  </p>
                </div>
                <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm">
                  {settings.autoAddDelayMs === 0 ? 'Disabled (Manual Only)' : `${(settings.autoAddDelayMs / 1000).toFixed(1)}s`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2500"
                step="100"
                value={settings.autoAddDelayMs}
                onChange={(e) => handleChange('autoAddDelayMs', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Off (Manual button only)</span>
                <span>1.2s (Default)</span>
                <span>2.5s (Slow)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Visual Overlays */}
        <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Eye className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Camera Viewport & Landmark Overlays
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer">
              <span className="text-xs text-slate-200">Show Hand Skeleton Bones</span>
              <input
                type="checkbox"
                checked={settings.showSkeleton}
                onChange={(e) => handleChange('showSkeleton', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer">
              <span className="text-xs text-slate-200">Show Hand Landmarks (21 Points)</span>
              <input
                type="checkbox"
                checked={settings.showLandmarks}
                onChange={(e) => handleChange('showLandmarks', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer">
              <span className="text-xs text-slate-200">Show Hand Bounding Box</span>
              <input
                type="checkbox"
                checked={settings.showBBox}
                onChange={(e) => handleChange('showBBox', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer">
              <span className="text-xs text-slate-200">Mirror Camera View (Selfie Mode)</span>
              <input
                type="checkbox"
                checked={settings.mirrorCamera}
                onChange={(e) => handleChange('mirrorCamera', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer sm:col-span-2">
              <span className="text-xs text-slate-200">Display Live Measured FPS Counter</span>
              <input
                type="checkbox"
                checked={settings.showFps}
                onChange={(e) => handleChange('showFps', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Section 3: Speech Synthesis (TTS) */}
        <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Speech Output (Text-to-Speech)
              </h2>
            </div>
            <button
              onClick={handleTestVoice}
              className="px-3 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
            >
              Test Voice
            </button>
          </div>

          <div className="space-y-4">
            {/* Voice Dropdown */}
            {voices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">Synthesizer Voice</label>
                <select
                  value={settings.speechVoiceURI}
                  onChange={(e) => handleChange('speechVoiceURI', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                >
                  <option value="">Default System Voice</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speech Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium">Speech Rate</span>
                <span className="font-mono text-cyan-400 tabular-nums">
                  {settings.speechRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Auto-Speak on space */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer pt-2">
              <span className="text-xs text-slate-200">
                Auto-Speak Sentence when Space is Triggered
              </span>
              <input
                type="checkbox"
                checked={settings.autoSpeakOnSpace}
                onChange={(e) => handleChange('autoSpeakOnSpace', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
