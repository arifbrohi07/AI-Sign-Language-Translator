import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Database,
  Camera,
  CameraOff,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { HandDetectorService } from '../services/handDetector';
import { FeatureExtractor } from '../services/featureExtractor';
import { DataStorage, CustomSample } from '../services/dataStorage';
import { ASL_DICTIONARY } from '../utils/aslDictionary';

interface DataCollectorViewProps {
  handDetector: HandDetectorService;
}

export const DataCollectorView: React.FC<DataCollectorViewProps> = ({ handDetector }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const [selectedSign, setSelectedSign] = useState<string>('A');
  const [samples, setSamples] = useState<CustomSample[]>([]);
  const [hasHand, setHasHand] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const classes = Object.keys(ASL_DICTIONARY);

  // Load existing collected samples
  useEffect(() => {
    setSamples(DataStorage.loadCustomSamples());
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      await handDetector.initialize();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraRunning(true);
    } catch (err) {
      console.error('Camera error in collector:', err);
    }
  };

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraRunning(false);
    setHasHand(false);
  }, []);

  // Frame processing loop
  const currentFeaturesRef = useRef<number[] | null>(null);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraRunning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const landmarks = handDetector.detect(video);

    if (landmarks && landmarks.length === 21) {
      setHasHand(true);
      handDetector.drawSkeleton(ctx, landmarks, canvas.width, canvas.height, {
        drawBones: true,
        drawJoints: true,
        primaryColor: '#06b6d4',
        jointColor: '#10b981',
      });

      try {
        const norm = FeatureExtractor.normalizeLandmarks(landmarks);
        currentFeaturesRef.current = norm;
      } catch (e) {
        currentFeaturesRef.current = null;
      }
    } else {
      setHasHand(false);
      currentFeaturesRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isCameraRunning, handDetector]);

  useEffect(() => {
    if (isCameraRunning) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCameraRunning, processFrame]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Capture Sample
  const handleCaptureSample = () => {
    if (!currentFeaturesRef.current) {
      setFeedback('Error: Hand must be clearly detected in camera before capturing.');
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const newSample = DataStorage.saveCustomSample(selectedSign, currentFeaturesRef.current);
    setSamples((prev) => [...prev, newSample]);
    setFeedback(`Captured sample for Sign ${selectedSign}!`);
    setTimeout(() => setFeedback(null), 1800);
  };

  // Export CSV
  const handleDownloadCSV = () => {
    if (samples.length === 0) return;
    const csvContent = DataStorage.exportSamplesToCSV(samples);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `landmarks_custom_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear samples
  const handleClearSamples = () => {
    if (confirm('Are you sure you want to clear all recorded samples?')) {
      DataStorage.clearCustomSamples();
      setSamples([]);
    }
  };

  // Count per sign
  const sampleCounts: Record<string, number> = {};
  for (const s of samples) {
    sampleCounts[s.sign] = (sampleCounts[s.sign] || 0) + 1;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-cyan-400" />
            <span>Landmark Dataset Collection Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record real webcam landmark samples (63 features per sample) into normalized CSV format
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            disabled={samples.length === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({samples.length})</span>
          </button>

          {samples.length > 0 && (
            <button
              onClick={handleClearSamples}
              className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/50 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Webcam Capture Stage (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
            />

            {!isCameraRunning ? (
              <div className="relative z-20 text-center p-6 space-y-3">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  Start Webcam for Data Collection
                </button>
              </div>
            ) : (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-xs font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasHand ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span className="text-slate-300">
                  {hasHand ? 'HAND LOCKED' : 'NO HAND'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isCameraRunning ? (
              <button
                onClick={startCamera}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCaptureSample}
                  disabled={!hasHand}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Capture Sample for Sign '{selectedSign}'</span>
                </button>

                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors cursor-pointer"
                >
                  <CameraOff className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Target Sign Selector & Recorded Samples Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Select Target Sign to Collect
            </h2>

            <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
              {classes.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedSign(c)}
                  className={`py-2 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                    selectedSign === c
                      ? 'bg-cyan-400 text-slate-950 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-400">Target: {selectedSign}</div>
              <p className="text-slate-400 text-[11px]">
                {ASL_DICTIONARY[selectedSign]?.description || ''}
              </p>
            </div>
          </div>

          {/* Sample Counts Table */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Collected Samples Distribution
              </h3>
              <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
                Total: {samples.length}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono">
              {classes.map((c) => {
                const count = sampleCounts[c] || 0;
                return (
                  <div
                    key={c}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-850"
                  >
                    <span className="text-slate-300 font-bold">Sign {c}</span>
                    <span
                      className={`tabular-nums ${
                        count > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {count} samples
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
