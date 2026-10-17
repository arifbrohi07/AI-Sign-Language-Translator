import React from 'react';
import {
  HelpCircle,
  Camera,
  Sparkles,
  Compass,
  Maximize2,
  Cpu,
  RefreshCw,
  Layers,
  Volume2,
  ArrowDown,
} from 'lucide-react';

export const HowItWorksView: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Optical Frame Capture',
      subtitle: 'OpenCV & Browser getUserMedia',
      icon: <Camera className="w-5 h-5 text-cyan-400" />,
      description:
        'Video stream is acquired from your optical webcam at 30+ frames per second. Individual frames are extracted in BGR/RGB color format with zero network transmission.',
      math: 'F_t \\in \\mathbb{R}^{H \\times W \\times 3}',
    },
    {
      number: '02',
      title: 'Hand Landmark Detection',
      subtitle: 'Google MediaPipe Hand Landmarker',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      description:
        'A lightweight 2-stage neural architecture first locates the hand bounding box and then predicts 21 3D landmarks (wrist, CMC, MCP, PIP, DIP, tips) with sub-pixel precision.',
      math: 'L = \\{ (x_i, y_i, z_i) \\}_{i=0}^{20}, \\quad |L| = 21',
    },
    {
      number: '03',
      title: 'Wrist-Origin Translation',
      subtitle: 'Spatial Invariance',
      icon: <Compass className="w-5 h-5 text-blue-400" />,
      description:
        'The wrist landmark (index 0) is established as the local origin (0, 0, 0). All remaining 20 landmarks are translated relative to the wrist to cancel screen position bias.',
      math: '\\Delta x_i = x_i - x_0, \\quad \\Delta y_i = y_i - y_0, \\quad \\Delta z_i = z_i - z_0',
    },
    {
      number: '04',
      title: 'Scale & Span Normalization',
      subtitle: 'Distance Invariance',
      icon: <Maximize2 className="w-5 h-5 text-purple-400" />,
      description:
        'The maximum Euclidean distance from the wrist to any landmark is measured. All translated coordinates are divided by this scale factor, making signs robust to distance from the lens.',
      math: 'S = \\max_{i} \\sqrt{\\Delta x_i^2 + \\Delta y_i^2 + \\Delta z_i^2}, \\quad \\hat{L}_i = \\frac{\\Delta L_i}{S}',
    },
    {
      number: '05',
      title: '63-Dimensional Feature Vector',
      subtitle: 'Vector Assembly',
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      description:
        'The 21 normalized 3D coordinates are flattened into an ordered 63-element feature vector representing pure hand geometry free of translation, distance, or lighting artefacts.',
      math: '\\mathbf{x} = [\\hat{x}_0, \\hat{y}_0, \\hat{z}_0, \\dots, \\hat{x}_{20}, \\hat{y}_{20}, \\hat{z}_{20}]^T \\in \\mathbb{R}^{63}',
    },
    {
      number: '06',
      title: 'Machine Learning Classification',
      subtitle: 'Random Forest & Gaussian Bayes',
      icon: <Cpu className="w-5 h-5 text-rose-400" />,
      description:
        'A multi-class classifier evaluates the 63D feature vector across trained decision trees and covariance distributions, generating normalized posterior class probabilities.',
      math: 'P(C_k \\mid \\mathbf{x}) = \\frac{\\exp(-\\frac{1}{2} D_k(\\mathbf{x}))}{\\sum_j \\exp(-\\frac{1}{2} D_j(\\mathbf{x}))}',
    },
    {
      number: '07',
      title: 'Rolling-Window Majority Smoother',
      subtitle: 'Temporal Jitter Suppression',
      icon: <RefreshCw className="w-5 h-5 text-teal-400" />,
      description:
        'Raw predictions are buffered over a rolling window of consecutive frames (default N=5). A majority voting filter accepts the sign only when consensus exceeds 50%, eliminating flicker.',
      math: '\\hat{y}_t = \\operatorname{mode}(\\{ y_{t-N+1}, \\dots, y_t \\}) \\quad \\text{if consensus} > 50\\%',
    },
    {
      number: '08',
      title: 'Sentence Assembly & Speech Synthesis',
      subtitle: 'State Machine & Web Speech API',
      icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
      description:
        'Validated characters are appended to an editable sentence buffer with full undo/backspace history. On confirmation or space, text is converted into human voice audio.',
      math: '\\text{SpeechSynth.speak}(\\text{sentence}, \\text{rate}, \\text{pitch})',
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
          <span>System Architecture & Pipeline</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Detailed technical breakdown of how real-time optical frames are transformed into synthesized speech
        </p>
      </div>

      {/* Sequential Pipeline Cards */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 shrink-0">
                    {step.number}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{step.title}</h2>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-cyan-400 font-medium">{step.subtitle}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Mathematical Formula Badge */}
                <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 font-mono text-xs text-cyan-300 whitespace-nowrap self-start md:self-center">
                  <code>{step.math}</code>
                </div>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex justify-center my-1 text-slate-700">
                <ArrowDown className="w-4 h-4" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Technical FAQ & Limitations Card */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/20 space-y-4">
        <h2 className="text-base font-bold text-slate-100">Engineering Trade-offs & Scope Boundaries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="p-3.5 rounded bg-slate-950/40 border border-slate-800/60 space-y-1.5">
            <strong className="text-slate-200">Why Static Alphabet First?</strong>
            <p>
              Alphabet hand signs form the foundational building blocks of finger-spelling in ASL. Establishing scale and rotation invariance on 21 static landmarks provides a solid baseline before moving into complex temporal sequence recognition.
            </p>
          </div>

          <div className="p-3.5 rounded bg-slate-950/40 border border-slate-800/60 space-y-1.5">
            <strong className="text-slate-200">Continuous Sign Language Pathway</strong>
            <p>
              Full dynamic sign language involves temporal motion trajectories, two-handed coordination, and facial expressions. The next phase will pipe landmark sequence embeddings into a Spatio-Temporal Graph CNN or Transformer model.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
