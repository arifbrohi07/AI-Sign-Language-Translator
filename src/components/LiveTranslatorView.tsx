import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HandDetectorService } from '../services/handDetector';
import { FeatureExtractor } from '../services/featureExtractor';
import { SignClassifier } from '../services/classifier';
import { SpeechService } from '../services/speechService';
import { AppSettings, Landmark, PredictionResult } from '../types';
import { ASL_DICTIONARY } from '../utils/aslDictionary';

interface LiveTranslatorViewProps {
  settings: AppSettings;
  handDetector: HandDetectorService;
  onCameraStateChange?: (active: boolean) => void;
}

export const LiveTranslatorView: React.FC<LiveTranslatorViewProps> = ({
  settings,
  handDetector,
  onCameraStateChange,
}) => {
  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Core State
  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [currentLandmarks, setCurrentLandmarks] = useState<Landmark[] | null>(null);

  // Prediction State
  const classifierRef = useRef<SignClassifier>(
    new SignClassifier(settings.confidenceThreshold, settings.smoothingWindowSize)
  );
  const [prediction, setPrediction] = useState<PredictionResult>({
    sign: 'NO HAND',
    rawSign: 'NO HAND',
    confidence: 0,
    isUncertain: true,
    probabilities: {},
  });

  // Sentence Builder State
  const [sentence, setSentence] = useState<string>('');
  const [sentenceHistory, setSentenceHistory] = useState<string[]>(['']);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false);

  // Auto-add Hold Timer State
  const holdSignRef = useRef<string | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%

  // Update classifier settings dynamically
  useEffect(() => {
    classifierRef.current.setConfidenceThreshold(settings.confidenceThreshold);
    classifierRef.current.setSmoothingWindowSize(settings.smoothingWindowSize);
  }, [settings.confidenceThreshold, settings.smoothingWindowSize]);

  // FPS calculation references
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Start Webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      // Ensure MediaPipe is initialized
      await handDetector.initialize();

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraRunning(true);
      onCameraStateChange?.(true);
      lastFrameTimeRef.current = performance.now();
    } catch (err: unknown) {
      console.error('Camera open error:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Could not access camera. Please check browser camera permissions.';
      setCameraError(errMsg);
      setIsCameraRunning(false);
      onCameraStateChange?.(false);
    }
  };

  // Stop Webcam
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    classifierRef.current.clearBuffer();
    setIsCameraRunning(false);
    setCurrentLandmarks(null);
    setPrediction({
      sign: 'NO HAND',
      rawSign: 'NO HAND',
      confidence: 0,
      isUncertain: true,
      probabilities: {},
    });
    setHoldProgress(0);
    holdSignRef.current = null;
    onCameraStateChange?.(false);
  }, [onCameraStateChange]);

  // Sentence Operations with Undo History
  const pushSentenceState = useCallback((newText: string) => {
    setSentence(newText);
    setSentenceHistory((prev) => [...prev, newText]);
  }, []);

  const handleAddSign = useCallback((signToAdd: string) => {
    if (!signToAdd || signToAdd === 'UNCERTAIN' || signToAdd === 'NO HAND') {
      return;
    }

    const clean = signToAdd.trim().toUpperCase();
    if (clean === 'SPACE') {
      handleSpace();
    } else if (clean === 'DELETE') {
      handleDelete();
    } else {
      pushSentenceState(sentence + clean);
    }
  }, [sentence, pushSentenceState]);

  const handleSpace = useCallback(() => {
    if (sentence && !sentence.endsWith(' ')) {
      const updated = sentence + ' ';
      pushSentenceState(updated);
      if (settings.autoSpeakOnSpace) {
        SpeechService.speak(sentence.trim(), {
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          voiceURI: settings.speechVoiceURI,
        });
      }
    }
  }, [sentence, pushSentenceState, settings]);

  const handleDelete = useCallback(() => {
    if (sentence.length > 0) {
      pushSentenceState(sentence.slice(0, -1));
    }
  }, [sentence, pushSentenceState]);

  const handleUndo = useCallback(() => {
    if (sentenceHistory.length > 1) {
      const updatedHistory = [...sentenceHistory];
      updatedHistory.pop(); // Remove current
      const previous = updatedHistory[updatedHistory.length - 1];
      setSentenceHistory(updatedHistory);
      setSentence(previous);
    }
  }, [sentenceHistory]);

  const handleClear = useCallback(() => {
    if (sentence) {
      pushSentenceState('');
    }
  }, [sentence, pushSentenceState]);

  const handleCopy = useCallback(() => {
    if (sentence) {
      navigator.clipboard.writeText(sentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [sentence]);

  const handleSpeak = useCallback(() => {
    if (sentence.trim()) {
      setIsSpeaking(true);
      SpeechService.speak(sentence.trim(), {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        voiceURI: settings.speechVoiceURI,
        onEnd: () => setIsSpeaking(false),
      });
    }
  }, [sentence, settings]);

  // Main Detection Loop
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraRunning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Match canvas dimensions to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    // Measure FPS
    frameCountRef.current += 1;
    const now = performance.now();
    const elapsed = now - lastFrameTimeRef.current;
    if (elapsed >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / elapsed));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Run MediaPipe Landmark Detection
    const landmarks = handDetector.detect(video);

    if (landmarks && landmarks.length === 21) {
      setCurrentLandmarks(landmarks);

      // Render Skeleton on canvas
      if (settings.showLandmarks) {
        handDetector.drawSkeleton(ctx, landmarks, canvas.width, canvas.height, {
          drawBones: settings.showSkeleton,
          drawJoints: true,
          drawLabels: false,
          primaryColor: '#06b6d4',
          jointColor: '#10b981',
        });
      }

      // Render Bounding Box if enabled
      if (settings.showBBox) {
        const bbox = FeatureExtractor.getBoundingBox(landmarks);
        const padding = 16;
        const bx = Math.max(0, bbox.minX * canvas.width - padding);
        const by = Math.max(0, bbox.minY * canvas.height - padding);
        const bw = Math.min(canvas.width - bx, (bbox.maxX - bbox.minX) * canvas.width + padding * 2);
        const bh = Math.min(canvas.height - by, (bbox.maxY - bbox.minY) * canvas.height + padding * 2);

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
      }

      // Extract 63-D Normalized Vector & Classify
      try {
        const features = FeatureExtractor.normalizeLandmarks(landmarks);
        const result = classifierRef.current.predict(features);
        setPrediction(result);

        // Auto-Add Hold Timer Logic
        if (settings.autoAddDelayMs > 0) {
          const currentSign = result.sign;
          if (
            currentSign &&
            currentSign !== 'UNCERTAIN' &&
            currentSign !== 'NO HAND'
          ) {
            if (holdSignRef.current === currentSign) {
              const holdDuration = now - holdStartTimeRef.current;
              const progress = Math.min(100, (holdDuration / settings.autoAddDelayMs) * 100);
              setHoldProgress(progress);

              if (holdDuration >= settings.autoAddDelayMs) {
                // Auto-append sign
                handleAddSign(currentSign);
                // Reset hold timer to prevent immediate re-trigger
                holdStartTimeRef.current = now + 400; // Small refractory period
                setHoldProgress(0);

                // Subtle celebratory visual
                if (currentSign === 'SPACE') {
                  confetti({ particleCount: 15, spread: 40, origin: { y: 0.8 } });
                }
              }
            } else {
              holdSignRef.current = currentSign;
              holdStartTimeRef.current = now;
              setHoldProgress(0);
            }
          } else {
            holdSignRef.current = null;
            setHoldProgress(0);
          }
        }
      } catch (err) {
        console.error('Prediction error:', err);
      }
    } else {
      // No hand in frame
      setCurrentLandmarks(null);
      classifierRef.current.clearBuffer();
      setPrediction({
        sign: 'NO HAND',
        rawSign: 'NO HAND',
        confidence: 0,
        isUncertain: true,
        probabilities: {},
      });
      holdSignRef.current = null;
      setHoldProgress(0);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [
    isCameraRunning,
    handDetector,
    settings.showLandmarks,
    settings.showSkeleton,
    settings.showBBox,
    settings.autoAddDelayMs,
    handleAddSign,
  ]);

  // Start/Stop detection loop when camera state changes
  useEffect(() => {
    if (isCameraRunning) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraRunning, processFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const activeDictionaryInfo =
    prediction.sign && prediction.sign !== 'NO HAND' && prediction.sign !== 'UNCERTAIN'
      ? ASL_DICTIONARY[prediction.sign]
      : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-cyan-400" />
            <span>Live Sign Translator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time hand landmark detection and ML-driven American Sign Language classification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCameraRunning && settings.showFps && (
            <div className="text-xs font-mono text-cyan-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded tabular-nums">
              FPS: {fps}
            </div>
          )}

          {!isCameraRunning ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Start Webcam</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold text-rose-300">Camera Access Error</strong>
            <p>{cameraError}</p>
            <p className="text-slate-400 pt-1">
              Please verify that camera permissions are granted in your browser address bar and no other application is using the webcam.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Video Stage (Left/Center) + Telemetry & Sentence Builder (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Camera Canvas Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center">
            {/* Native Video Feed (hidden or visible beneath canvas) */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                settings.mirrorCamera ? '-scale-x-100' : ''
              } ${isCameraRunning ? 'opacity-90' : 'opacity-0'}`}
            />

            {/* Skeleton & Landmark Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
                settings.mirrorCamera ? '-scale-x-100' : ''
              }`}
            />

            {/* Inactive Camera State Overlay */}
            {!isCameraRunning && (
              <div className="relative z-20 text-center p-8 space-y-4 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-slate-200">Camera Offline</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click "Start Webcam" above to begin detecting hand signs. Video frames are processed locally and never leave your browser.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  Start Webcam
                </button>
              </div>
            )}

            {/* Top HUD Overlay (Active Stream) */}
            {isCameraRunning && (
              <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none text-xs">
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded text-slate-300">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentLandmarks ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span className="font-mono">
                    {currentLandmarks ? 'HAND DETECTED' : 'POSITION HAND'}
                  </span>
                </div>

                {settings.autoAddDelayMs > 0 && holdProgress > 0 && (
                  <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-cyan-800/80 px-2.5 py-1 rounded text-cyan-300 font-mono text-[11px]">
                    <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>HOLDING: {Math.round(holdProgress)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Floating Bar */}
            {isCameraRunning && (
              <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded">
                <span>Threshold: {Math.round(settings.confidenceThreshold * 100)}%</span>
                <span>Smoothing: {settings.smoothingWindowSize} frames</span>
              </div>
            )}
          </div>

          {/* Quick Technical Accordion: 21 Landmarks Coordinates */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/30 overflow-hidden">
            <button
              onClick={() => setShowCoordinates(!showCoordinates)}
              className="w-full px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Landmark Coordinates Inspector (21 Points)</span>
              </span>
              {showCoordinates ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showCoordinates && (
              <div className="p-3 border-t border-slate-800/80 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 bg-slate-950/50">
                {currentLandmarks ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="pb-1">Index</th>
                        <th className="pb-1">Anatomical Landmark</th>
                        <th className="pb-1">X (norm)</th>
                        <th className="pb-1">Y (norm)</th>
                        <th className="pb-1">Z (depth)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {currentLandmarks.map((lm, idx) => {
                        const jointNames = [
                          'Wrist (Origin)',
                          'Thumb CMC', 'Thumb MCP', 'Thumb IP', 'Thumb Tip',
                          'Index MCP', 'Index PIP', 'Index DIP', 'Index Tip',
                          'Middle MCP', 'Middle PIP', 'Middle DIP', 'Middle Tip',
                          'Ring MCP', 'Ring PIP', 'Ring DIP', 'Ring Tip',
                          'Pinky MCP', 'Pinky PIP', 'Pinky DIP', 'Pinky Tip',
                        ];
                        return (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="py-0.5 text-cyan-400">{idx}</td>
                            <td className="py-0.5 text-slate-400">{jointNames[idx] || `Point ${idx}`}</td>
                            <td className="py-0.5 tabular-nums">{lm.x.toFixed(4)}</td>
                            <td className="py-0.5 tabular-nums">{lm.y.toFixed(4)}</td>
                            <td className="py-0.5 tabular-nums">{lm.z.toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-500 py-3 text-center">
                    No hand detected. Position your hand in the camera view to inspect real-time coordinates.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Detection Telemetry + Sentence Builder (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Real-Time Prediction Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Predicted Sign
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-500">Confidence:</span>
                <span
                  className={`font-bold tabular-nums ${
                    prediction.confidence >= 0.75
                      ? 'text-emerald-400'
                      : prediction.confidence >= 0.5
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {(prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Dominant Letter Display */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition-colors ${
                    prediction.sign === 'UNCERTAIN'
                      ? 'text-amber-400/80'
                      : prediction.sign === 'NO HAND'
                      ? 'text-slate-600'
                      : 'text-cyan-400'
                  }`}
                >
                  {prediction.sign}
                </div>
                <div className="text-xs text-slate-400">
                  {prediction.sign === 'NO HAND'
                    ? 'Place hand clearly in camera'
                    : prediction.sign === 'UNCERTAIN'
                    ? 'Confidence below threshold'
                    : activeDictionaryInfo?.name || `Sign ${prediction.sign}`}
                </div>
              </div>

              {/* Progress Ring for Auto-Add */}
              {settings.autoAddDelayMs > 0 && (
                <div className="flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        className="stroke-slate-800 fill-none"
                        strokeWidth="4"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        className="stroke-cyan-400 fill-none transition-all duration-75"
                        strokeWidth="4"
                        strokeDasharray={150.79}
                        strokeDashoffset={150.79 - (150.79 * holdProgress) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-mono text-cyan-300 font-bold">
                      {Math.round(holdProgress)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">HOLD</span>
                </div>
              )}
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    prediction.confidence >= 0.75
                      ? 'bg-emerald-400'
                      : prediction.confidence >= 0.5
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, prediction.confidence * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Raw: {prediction.rawSign}</span>
                <span>Threshold: {Math.round(settings.confidenceThreshold * 100)}%</span>
              </div>
            </div>

            {/* Manual Append Button */}
            <button
              onClick={() => handleAddSign(prediction.sign)}
              disabled={
                !prediction.sign ||
                prediction.sign === 'UNCERTAIN' ||
                prediction.sign === 'NO HAND'
              }
              className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Add Letter '{prediction.sign}' to Sentence</span>
            </button>
          </div>

          {/* Sentence Builder Box */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assembled Sentence</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {sentence.length} {sentence.length === 1 ? 'char' : 'chars'}
              </span>
            </div>

            {/* Sentence Output Display */}
            <div className="relative min-h-[90px] p-3.5 rounded-lg border border-slate-800 bg-slate-950/80 font-mono text-base text-slate-100 break-words leading-relaxed select-all">
              {sentence ? (
                <span>{sentence}</span>
              ) : (
                <span className="text-slate-600 text-sm select-none">
                  (Sentence empty — hold signs in camera or click "Add Letter")
                </span>
              )}
            </div>

            {/* Sentence Action Controls */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleSpace}
                className="py-2 px-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded transition-colors cursor-pointer"
              >
                Space
              </button>

              <button
                onClick={handleDelete}
                className="py-2 px-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded transition-colors cursor-pointer"
              >
                Backspace
              </button>

              <button
                onClick={handleUndo}
                disabled={sentenceHistory.length <= 1}
                className="py-2 px-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/80 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>

              <button
                onClick={handleClear}
                disabled={!sentence}
                className="py-2 px-1 text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-900/50 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Primary Action Buttons: Speak & Copy */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSpeak}
                disabled={!sentence.trim() || isSpeaking}
                className="py-2.5 px-3 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                    <span>Speaking...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak Text</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                disabled={!sentence}
                className="py-2.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
