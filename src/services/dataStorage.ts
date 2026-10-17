import { AppSettings } from '../types';

const SETTINGS_KEY = 'asl_translator_settings_v1';
const SAMPLES_KEY = 'asl_custom_samples_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  confidenceThreshold: 0.75,
  smoothingWindowSize: 5,
  autoAddDelayMs: 1200, // 1.2s sustained hold to auto-add
  showLandmarks: true,
  showSkeleton: true,
  showBBox: true,
  showFps: true,
  mirrorCamera: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVoiceURI: '',
  autoSpeakOnSpace: false,
};

export interface CustomSample {
  id: string;
  sign: string;
  timestamp: number;
  features: number[]; // 63 normalized coordinates
}

export class DataStorage {
  public static loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public static loadCustomSamples(): CustomSample[] {
    try {
      const stored = localStorage.getItem(SAMPLES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load custom samples:', e);
    }
    return [];
  }

  public static saveCustomSample(sign: string, features: number[]): CustomSample {
    const samples = this.loadCustomSamples();
    const newSample: CustomSample = {
      id: `${sign}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sign,
      timestamp: Date.now(),
      features,
    };
    samples.push(newSample);
    try {
      localStorage.setItem(SAMPLES_KEY, JSON.stringify(samples));
    } catch (e) {
      console.warn('Failed to save sample:', e);
    }
    return newSample;
  }

  public static clearCustomSamples(): void {
    try {
      localStorage.removeItem(SAMPLES_KEY);
    } catch (e) {
      console.warn('Failed to clear samples:', e);
    }
  }

  public static exportSamplesToCSV(samples: CustomSample[]): string {
    const headers: string[] = [];
    for (let i = 1; i <= 21; i++) {
      headers.push(`x${i}`, `y${i}`, `z${i}`);
    }
    headers.push('label');

    const lines = [headers.join(',')];
    for (const sample of samples) {
      const row = [...sample.features, sample.sign].join(',');
      lines.push(row);
    }
    return lines.join('\n');
  }
}
