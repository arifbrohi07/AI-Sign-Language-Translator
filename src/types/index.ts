export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type LandmarkList = Landmark[];

export interface PredictionResult {
  sign: string;
  confidence: number;
  rawSign: string;
  isUncertain: boolean;
  probabilities: Record<string, number>;
}

export interface HandBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SignAlphabetInfo {
  letter: string;
  name: string;
  description: string;
  fingers: {
    thumb: string;
    index: string;
    middle: string;
    ring: string;
    pinky: string;
  };
  category: 'fist' | 'open' | 'pointing' | 'curved' | 'crossing' | 'special';
  mnemonic: string;
}

export interface ModelMetrics {
  model_type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  train_samples: number;
  test_samples: number;
  num_classes: number;
  classes: string[];
  confusion_matrix: number[][];
  per_class: Record<
    string,
    {
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    }
  >;
}

export interface AppSettings {
  confidenceThreshold: number; // 0.50 - 0.95
  smoothingWindowSize: number; // 1 - 15
  autoAddDelayMs: number; // 0 (off) or 800 - 2500 ms
  showLandmarks: boolean;
  showSkeleton: boolean;
  showBBox: boolean;
  showFps: boolean;
  mirrorCamera: boolean;
  speechRate: number; // 0.5 - 2.0
  speechPitch: number; // 0.5 - 1.5
  speechVoiceURI: string;
  autoSpeakOnSpace: boolean;
}
