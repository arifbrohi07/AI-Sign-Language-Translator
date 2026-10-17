import { Landmark, HandBBox } from '../types';

export class FeatureExtractor {
  /**
   * Normalizes 21 3D landmarks relative to wrist (point 0)
   * and scales by maximum Euclidean distance for scale & translation invariance.
   * Produces a 63-element normalized array: [x0, y0, z0, ..., x20, y20, z20]
   */
  public static normalizeLandmarks(landmarks: Landmark[]): number[] {
    if (landmarks.length !== 21) {
      throw new Error(`Expected 21 landmarks, received ${landmarks.length}`);
    }

    const wrist = landmarks[0];
    let maxDist = 0;

    // 1. Calculate distances from wrist
    const translated: Array<[number, number, number]> = [];
    for (let i = 0; i < 21; i++) {
      const lm = landmarks[i];
      const dx = lm.x - wrist.x;
      const dy = lm.y - wrist.y;
      const dz = lm.z - wrist.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > maxDist) {
        maxDist = dist;
      }
      translated.push([dx, dy, dz]);
    }

    if (maxDist < 1e-6) {
      maxDist = 1.0;
    }

    // 2. Scale normalize
    const normalized: number[] = [];
    for (let i = 0; i < 21; i++) {
      const [dx, dy, dz] = translated[i];
      normalized.push(
        Number((dx / maxDist).toFixed(5)),
        Number((dy / maxDist).toFixed(5)),
        Number((dz / maxDist).toFixed(5))
      );
    }

    return normalized;
  }

  /**
   * Calculates 2D bounding box from normalized or pixel landmarks.
   */
  public static getBoundingBox(landmarks: Landmark[]): HandBBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const pt of landmarks) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Computes Euclidean distance between two 3D landmarks.
   */
  public static distance3D(a: Landmark, b: Landmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Analyzes individual finger extension states (open, bent, closed).
   */
  public static getFingerStates(landmarks: Landmark[]) {
    const wrist = landmarks[0];

    // Helper: is finger tip further from wrist than PIP/MCP joint?
    const isExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
      const tipDist = FeatureExtractor.distance3D(landmarks[tipIdx], wrist);
      const pipDist = FeatureExtractor.distance3D(landmarks[pipIdx], wrist);
      const mcpDist = FeatureExtractor.distance3D(landmarks[mcpIdx], wrist);
      return tipDist > pipDist && tipDist > mcpDist * 1.35;
    };

    return {
      thumb: FeatureExtractor.distance3D(landmarks[4], landmarks[9]) > 0.18,
      index: isExtended(8, 6, 5),
      middle: isExtended(12, 10, 9),
      ring: isExtended(16, 14, 13),
      pinky: isExtended(20, 18, 17),
    };
  }
}
