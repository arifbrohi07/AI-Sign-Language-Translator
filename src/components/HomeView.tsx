import React from 'react';
import { Camera, ShieldCheck, Cpu, Volume2, Sparkles, ArrowRight, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { NavPage } from './Navbar';

interface HomeViewProps {
  onNavigate: (page: NavPage) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="relative min-h-[380px] md:min-h-[460px] flex items-center">
          {/* Background Hero Image with Measured Contrast Scrim */}
          <img
            src="/src/assets/images/hero_hand_gesture_1791097849724.jpg"
            alt="Hand gesture tracked by computer vision nodes"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl p-6 sm:p-10 lg:p-12 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <span>Computer Vision</span>
              <span aria-hidden="true">·</span>
              <span>MediaPipe 21-Landmark</span>
              <span aria-hidden="true">·</span>
              <span>Random Forest ML</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Real-Time Sign Language Translation to Text & Speech
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Detect human hand gestures through your optical camera in real time, extract scale-invariant anatomical coordinates, classify ASL alphabet letters with machine learning, assemble sentences, and synthesize immediate verbal speech.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('translator')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <Camera className="w-4 h-4" />
                <span>Launch Translator</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => onNavigate('alphabet')}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Sign Alphabet (A–Z)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Scope & Privacy Disclosures */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-lg border border-slate-800 bg-slate-900/30 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-200">100% Client-Side Privacy</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camera frames are processed strictly locally by the application via WebAssembly and WebGL. No video feeds or hand telemetry are uploaded to external servers.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-lg border border-slate-800 bg-slate-900/30 flex items-start gap-3.5">
          <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-200">Scope & Gesture Boundaries</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This version recognizes predefined static hand signs (ASL alphabet A–Z, SPACE, DELETE). Full continuous sign-language understanding requires temporal gesture recognition and a larger video corpus.
            </p>
          </div>
        </div>
      </section>

      {/* 5 Core Feature Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">End-to-End System Capabilities</h2>
          <span className="text-xs font-mono text-slate-500">8-STAGE PIPELINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Real-Time Camera</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-throughput 30+ FPS video stream capture with zero cloud roundtrip latency.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">21 Hand Landmarks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MediaPipe neural landmarking tracks 21 anatomical joints in 3D coordinate space.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded bg-blue-950/70 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">AI ML Prediction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Translation and scale-invariant classifier mapping 63 features to 28 sign classes.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded bg-amber-950/70 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Sentence Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rolling-window majority smoothing, auto-add timer, space, backspace, and undo stack.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded bg-purple-950/70 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Speech Output</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browser Web Speech API voice synthesis with custom rate, pitch, and voice controls.
            </p>
          </div>
        </div>
      </section>

      {/* Verification & Performance Highlights */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Measured Classification Benchmark</h2>
            <p className="text-xs text-slate-400">Evaluated on an independent 20% unseen test split across all 28 classes</p>
          </div>
          <button
            onClick={() => onNavigate('performance')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View Full Confusion Matrix & Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded border border-slate-800/60 bg-slate-950/40">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Test Accuracy</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums mt-1">89.58%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">336 test samples</div>
          </div>

          <div className="p-3.5 rounded border border-slate-800/60 bg-slate-950/40">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Weighted Precision</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">92.72%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">False-positive filtered</div>
          </div>

          <div className="p-3.5 rounded border border-slate-800/60 bg-slate-950/40">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Weighted Recall</div>
            <div className="text-2xl font-bold font-mono text-blue-400 tabular-nums mt-1">89.58%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Sensitivity rate</div>
          </div>

          <div className="p-3.5 rounded border border-slate-800/60 bg-slate-950/40">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Weighted F1 Score</div>
            <div className="text-2xl font-bold font-mono text-purple-400 tabular-nums mt-1">88.64%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Harmonic balance</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Wrist-origin $(0,0,0)$ invariant coordinate translation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Scale normalization by maximum Euclidean hand span</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sliding window majority voting to suppress jitter</span>
          </div>
        </div>
      </section>
    </div>
  );
};
