import React from 'react';
import { Info, ShieldCheck, Github, GraduationCap, Award, ExternalLink, CheckCircle } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Info className="w-6 h-6 text-cyan-400" />
          <span>About AI Sign Language Translator</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Academic credentials, technical implementation details, project scope, and future research directions
        </p>
      </div>

      {/* University & Portfolio Showcase Badge */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">University Final Project & AI Portfolio</h2>
            <div className="text-xs text-slate-400">
              Department of Computer Science & Artificial Intelligence · Real-Time Computer Vision
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Designed and engineered as a comprehensive portfolio capstone project demonstrating production competencies in Computer Vision, Machine Learning, real-time video processing, mathematical normalization, accessible UI engineering, and Text-to-Speech synthesis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase">Core Domains</span>
            <div className="text-xs text-slate-200 font-medium">CV, ML & Web Speech API</div>
          </div>
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase">Latency Target</span>
            <div className="text-xs text-slate-200 font-medium">Sub-30ms frame inference</div>
          </div>
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase">Supported Vocabulary</span>
            <div className="text-xs text-slate-200 font-medium">28 Classes (A–Z, Space, Del)</div>
          </div>
        </div>
      </section>

      {/* Mandatory Scope & Limitation Disclosure */}
      <section className="p-6 rounded-xl border border-amber-900/60 bg-amber-950/15 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm font-mono uppercase tracking-wide">
          <Award className="w-4 h-4" />
          <span>Academic Integrity & Scope Disclosure</span>
        </div>
        <blockquote className="text-xs text-slate-300 italic border-l-2 border-amber-500 pl-3 leading-relaxed">
          "This version recognizes predefined static hand signs. Full continuous sign-language understanding requires temporal gesture recognition and a larger dataset."
        </blockquote>
        <p className="text-xs text-slate-400 leading-relaxed">
          While isolated alphabet recognition enables finger-spelling communication, conversational American Sign Language relies extensively on dynamic gestures, two-handed configurations, facial syntax, and spatial grammar.
        </p>
      </section>

      {/* Local Privacy Guarantee */}
      <section className="p-6 rounded-xl border border-emerald-900/60 bg-emerald-950/15 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm font-mono uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4" />
          <span>Local Camera Privacy Guarantee</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Camera frames are processed strictly locally by the application via WebAssembly and WebGL acceleration. No webcam streams, snapshots, or biometric hand coordinate vectors are ever transmitted to or stored on external cloud servers.
        </p>
      </section>

      {/* Technology Specifications Table */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
        <h2 className="text-base font-bold text-white">Full-Stack Technology Stack</h2>
        <div className="overflow-x-auto rounded border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 font-semibold">Subsystem</th>
                <th className="py-2 px-3 font-semibold">Technologies</th>
                <th className="py-2 px-3 font-semibold">Implementation Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2 px-3 text-cyan-400 font-semibold">Hand Landmark Detection</td>
                <td className="py-2 px-3">Google MediaPipe Tasks Vision</td>
                <td className="py-2 px-3 text-slate-400">21 3D points per frame at 30+ FPS</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400 font-semibold">Feature Engineering</td>
                <td className="py-2 px-3">NumPy / TypeScript Linear Algebra</td>
                <td className="py-2 px-3 text-slate-400">Wrist-origin translation & scale normalization</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400 font-semibold">Classification Model</td>
                <td className="py-2 px-3">Scikit-learn / Bayesian Ensemble</td>
                <td className="py-2 px-3 text-slate-400">Random Forest & covariance decision profiles</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400 font-semibold">Web Interface</td>
                <td className="py-2 px-3">React 19 + Streamlit + Tailwind CSS</td>
                <td className="py-2 px-3 text-slate-400">Dual web/desktop multi-page application</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400 font-semibold">Audio Output</td>
                <td className="py-2 px-3">Web Speech API & pyttsx3</td>
                <td className="py-2 px-3 text-slate-400">Client-side low-latency speech synthesis</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
        <h2 className="text-base font-bold text-white">Future Research & Development Roadmap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Temporal Gesture Recognition:</strong>
              <p>Integration of LSTM and Transformer attention layers for movement-based signs like J, Z, and greetings.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Continuous Sign Sentence Translation:</strong>
              <p>Connectionist Temporal Classification (CTC) for natural continuous signing sequences.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Dual-Hand Signing:</strong>
              <p>Bimanual tracking for signs requiring interaction between both left and right hands.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Multi-Language Translation:</strong>
              <p>Extending lexical coverage to British Sign Language (BSL), Urdu Sign Language (PSL), and regional dialects.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
