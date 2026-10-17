import { ModelMetrics } from '../types';
import rawMetrics from '../../models/evaluation_metrics.json';
import rawWeights from '../../models/sign_language_model.json';

export const EVALUATION_METRICS: ModelMetrics = rawMetrics as unknown as ModelMetrics;

export interface ModelProfile {
  mean: number[];
  var: number[];
}

export interface ModelProfilesData {
  classes: string[];
  profiles: Record<string, ModelProfile>;
}

export const MODEL_WEIGHTS: ModelProfilesData = rawWeights as unknown as ModelProfilesData;
