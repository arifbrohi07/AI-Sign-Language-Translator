import { PredictionResult } from '../types';
import { MODEL_WEIGHTS } from '../utils/modelData';

export class SignClassifier {
  private smoothingWindow: string[] = [];
  private smoothingSize: number = 5;
  private confidenceThreshold: number = 0.75;

  constructor(confidenceThreshold: number = 0.75, smoothingSize: number = 5) {
    this.confidenceThreshold = confidenceThreshold;
    this.smoothingSize = smoothingSize;
  }

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.min(Math.max(threshold, 0), 1);
  }

  public setSmoothingWindowSize(size: number): void {
    this.smoothingSize = Math.max(1, size);
    this.smoothingWindow = this.smoothingWindow.slice(-this.smoothingSize);
  }

  public clearBuffer(): void {
    this.smoothingWindow = [];
  }

  /**
   * Predicts ASL sign from 63-dimensional normalized landmark vector.
   */
  public predict(features: number[]): PredictionResult {
    const classes = MODEL_WEIGHTS.classes;
    const profiles = MODEL_WEIGHTS.profiles;

    if (!classes || classes.length === 0 || features.length !== 63) {
      return {
        sign: 'UNCERTAIN',
        rawSign: 'UNCERTAIN',
        confidence: 0,
        isUncertain: true,
        probabilities: {},
      };
    }

    const scores: Record<string, number> = {};
    let minScore = Infinity;
    let bestRawSign = classes[0];

    // Compute weighted Mahalanobis distance across all classes
    for (const cls of classes) {
      const profile = profiles[cls];
      if (!profile) continue;

      const { mean, var: variance } = profile;
      let dist = 0;

      for (let d = 0; d < 63; d++) {
        const diff = features[d] - mean[d];
        const v = variance[d] > 1e-4 ? variance[d] : 1e-4;
        dist += (diff * diff) / v;
      }

      scores[cls] = dist;
      if (dist < minScore) {
        minScore = dist;
        bestRawSign = cls;
      }
    }

    // Convert negative distances to Softmax probabilities
    const temp = 0.12; // Temperature scaling
    let expSum = 0;
    const expScores: Record<string, number> = {};

    for (const cls of classes) {
      const normalizedScore = scores[cls] - minScore;
      const val = Math.exp(-temp * normalizedScore);
      expScores[cls] = val;
      expSum += val;
    }

    const probabilities: Record<string, number> = {};
    for (const cls of classes) {
      probabilities[cls] = expSum > 0 ? expScores[cls] / expSum : 0;
    }

    const rawConfidence = probabilities[bestRawSign] ?? 0;

    // Confidence threshold validation
    const passesThreshold = rawConfidence >= this.confidenceThreshold;
    const candidateSign = passesThreshold ? bestRawSign : 'UNCERTAIN';

    // Rolling window buffer update
    this.smoothingWindow.push(candidateSign);
    if (this.smoothingWindow.length > this.smoothingSize) {
      this.smoothingWindow.shift();
    }

    // Majority voting across the smoothing window
    const counts: Record<string, number> = {};
    for (const s of this.smoothingWindow) {
      counts[s] = (counts[s] || 0) + 1;
    }

    let smoothedSign = 'UNCERTAIN';
    let maxCount = 0;
    for (const [sign, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        smoothedSign = sign;
      }
    }

    // Strict majority check (must have > 50% consensus)
    const requiredVotes = Math.floor(this.smoothingWindow.length / 2) + 1;
    if (maxCount < requiredVotes || smoothedSign === 'UNCERTAIN') {
      smoothedSign = 'UNCERTAIN';
    }

    return {
      sign: smoothedSign,
      rawSign: bestRawSign,
      confidence: Number(rawConfidence.toFixed(4)),
      isUncertain: smoothedSign === 'UNCERTAIN',
      probabilities,
    };
  }
}
