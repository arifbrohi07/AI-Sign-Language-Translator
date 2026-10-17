import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Landmark } from '../types';

export const HAND_CONNECTIONS: Array<[number, number]> = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20],
  // Palm Base Knuckle Connections
  [5, 9], [9, 13], [13, 17], [0, 17],
];

export class HandDetectorService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private lastVideoTime: number = -1;

  public async initialize(): Promise<boolean> {
    if (this.handLandmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.65,
        minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.60,
      });

      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn('GPU HandLandmarker initialization fallback to CPU:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        this.isInitializing = false;
        return true;
      } catch (cpuErr) {
        console.error('Failed to initialize MediaPipe HandLandmarker:', cpuErr);
        this.isInitializing = false;
        return false;
      }
    }
  }

  public isReady(): boolean {
    return this.handLandmarker !== null;
  }

  /**
   * Detects 21 hand landmarks in real-time from an HTMLVideoElement.
   */
  public detect(video: HTMLVideoElement): Landmark[] | null {
    if (!this.handLandmarker || video.readyState < 2) {
      return null;
    }

    const currentTime = video.currentTime;
    if (currentTime === this.lastVideoTime) {
      return null;
    }
    this.lastVideoTime = currentTime;

    try {
      const result = this.handLandmarker.detectForVideo(video, performance.now());
      if (result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0];
        return rawLandmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        }));
      }
    } catch (err) {
      // Frame skip error or stale frame
      console.debug('Landmark detection pass error:', err);
    }

    return null;
  }

  /**
   * Renders the detected hand skeleton and landmarks onto a canvas.
   */
  public drawSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    width: number,
    height: number,
    options: {
      drawBones?: boolean;
      drawJoints?: boolean;
      drawLabels?: boolean;
      primaryColor?: string;
      jointColor?: string;
    } = {}
  ): void {
    const {
      drawBones = true,
      drawJoints = true,
      drawLabels = false,
      primaryColor = '#06b6d4', // Laser Cyan
      jointColor = '#10b981',   // Emerald
    } = options;

    const pixelPoints = landmarks.map((lm) => ({
      x: lm.x * width,
      y: lm.y * height,
      z: lm.z,
    }));

    // 1. Draw Skeleton Bones
    if (drawBones) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = primaryColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        const p1 = pixelPoints[startIdx];
        const p2 = pixelPoints[endIdx];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // 2. Draw Landmark Joints
    if (drawJoints) {
      for (let i = 0; i < pixelPoints.length; i++) {
        const p = pixelPoints[i];
        const isFingertip = [4, 8, 12, 16, 20].includes(i);
        const isWrist = i === 0;

        ctx.beginPath();
        const radius = isWrist ? 7 : isFingertip ? 5.5 : 4;
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);

        if (isWrist) {
          ctx.fillStyle = '#f59e0b'; // Amber for origin/wrist
        } else if (isFingertip) {
          ctx.fillStyle = '#38bdf8'; // Sky blue for fingertips
        } else {
          ctx.fillStyle = jointColor;
        }

        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        if (drawLabels) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText(`${i}`, p.x + 6, p.y - 4);
        }
      }
    }
  }
}
