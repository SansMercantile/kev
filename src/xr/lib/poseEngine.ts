/**
 * Connection-adaptive pose engine — one landmark stream, two model tiers.
 *
 * The user requirement: students *online* get the heavier, more accurate
 * option; students *offline* still get a real pose. So the engine detects
 * connectivity and picks its tier:
 *
 *   • Online  → **TF.js PoseNet** (heavier, higher-confidence 17-keypoint
 *     skeleton). Its weights stream at runtime, so it needs a connection.
 *   • Offline → **MediaPipe Pose Landmarker Lite** (5.5 MB model bundled in
 *     `public/models/`, WASM inside `@mediapipe/tasks-vision`) — a real
 *     33-point pose with zero network.
 *
 * Both normalise to the same `PoseLandmark[]` shape (x, y in 0..1 frame
 * space, z, confidence) so the game layer never cares which tier answered.
 * If the online tier fails to load (CDN blocked, flaky connection), the
 * engine falls back to the offline tier rather than dying — a student on a
 * school network that blocks CDNs still gets a pose.
 *
 * Privacy: every frame is analysed in-page; nothing leaves the device. The
 * model files are the only things fetched, and only the offline model is
 * bundled in the PWA precache.
 */

export interface PoseLandmark {
  /** Frame-space position, 0..1. */
  x: number;
  y: number;
  /** Depth (rough, model-relative). */
  z: number;
  /** Model confidence 0..1 (PoseNet score / MediaPipe visibility). */
  confidence: number;
}

export interface PoseFrame {
  landmarks: PoseLandmark[];
  /** Which model produced this frame. */
  tier: 'posenet' | 'mediapipe';
  /** Center of the pose in frame space (0..1). */
  centroidX: number;
  centroidY: number;
  /** Aggregate confidence across visible landmarks. */
  confidence: number;
}

export type PoseTier = 'posenet' | 'mediapipe';

export interface PoseEngineHandle {
  tier: PoseTier;
  /** Detect pose on the current video frame; null when no person is found. */
  detect(video: HTMLVideoElement, timestampMs: number): PoseFrame | null;
  dispose(): void;
}

// PoseNet keypoint names -> a small canonical set we actually use for games.
// MediaPipe has 33 points; PoseNet 17. We map both onto the union index below.
export const POSE_PARTS = {
  nose: 0,
  leftWrist: 1,
  rightWrist: 2,
  leftElbow: 3,
  rightElbow: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftHip: 7,
  rightHip: 8,
} as const;

// PoseNet keypoint order (17).
const POSENET_INDEX: Record<string, number> = {
  nose: 0, leftEye: 1, rightEye: 2, leftEar: 3, rightEar: 4,
  leftShoulder: 5, rightShoulder: 6, leftElbow: 7, rightElbow: 8,
  leftWrist: 9, rightWrist: 10, leftHip: 11, rightHip: 12,
  leftKnee: 13, rightKnee: 14, leftAnkle: 15, rightAnkle: 16,
};

// MediaPipe pose landmark indices (33) for the parts we use.
const MEDIAPIPE_INDEX: Record<string, number> = {
  nose: 0, leftShoulder: 11, rightShoulder: 12, leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16, leftHip: 23, rightHip: 24,
};

function centroidOf(landmarks: PoseLandmark[]): { x: number; y: number; confidence: number } {
  let sx = 0, sy = 0, sc = 0, n = 0;
  for (const l of landmarks) {
    if (l.confidence > 0.3) {
      sx += l.x; sy += l.y; sc += l.confidence; n++;
    }
  }
  if (n === 0) return { x: 0.5, y: 0.5, confidence: 0 };
  return { x: sx / n, y: sy / n, confidence: sc / n };
}

// ---------------------------------------------------------------------------
// Online tier: TF.js PoseNet (async detect, heavy accurate model)
// ---------------------------------------------------------------------------

export interface PoseNetHandle {
  tier: 'posenet';
  detectAsync(video: HTMLVideoElement): Promise<PoseFrame | null>;
  dispose(): void;
}

async function createPoseNetEngine(): Promise<PoseNetHandle | null> {
  try {
    const [posenet, tf] = await Promise.all([
      import('@tensorflow-models/posenet'),
      import('@tensorflow/tfjs'),
    ]);
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.ready();
    const net = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 257, height: 257 },
      multiplier: 0.75,
    });
    return {
      tier: 'posenet',
      async detectAsync(video) {
        const pose = await net.estimateSinglePose(video, { flipHorizontal: true });
        if (!pose || !pose.keypoints || pose.score < 0.25) return null;
        const w = video.videoWidth || 1;
        const h = video.videoHeight || 1;
        const landmarks: PoseLandmark[] = pose.keypoints.map((kp) => ({
          x: Math.min(1, Math.max(0, kp.position.x / w)),
          y: Math.min(1, Math.max(0, kp.position.y / h)),
          z: 0,
          confidence: kp.score,
        }));
        const c = centroidOf(landmarks);
        return { landmarks, tier: 'posenet', centroidX: c.x, centroidY: c.y, confidence: pose.score };
      },
      dispose() {},
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Offline tier: MediaPipe Pose Landmarker Lite (bundled model + package WASM)
// ---------------------------------------------------------------------------

async function createMediaPipeEngine(): Promise<PoseEngineHandle | null> {
  try {
    const vision = await import('@mediapipe/tasks-vision');
    const { FilesetResolver, PoseLandmarker } = vision as any;
    // WASM is bundled in public/pose-wasm (copied from the package at build
    // time) so no CDN and no node_modules path is needed, offline included.
    const wasmFileset = await FilesetResolver.forVisionTasks('/pose-wasm');
    const landmarker = await PoseLandmarker.createFromOptions(wasmFileset, {
      baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task' },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return {
      tier: 'mediapipe',
      detect(video, timestampMs) {
        const res = landmarker.detectForVideo(video, timestampMs);
        const lms = res?.landmarks?.[0];
        if (!lms || lms.length === 0) return null;
        const landmarks: PoseLandmark[] = lms.map((lm: any) => ({
          x: Math.min(1, Math.max(0, lm.x)),
          y: Math.min(1, Math.max(0, lm.y)),
          z: lm.z ?? 0,
          confidence: lm.visibility ?? 0.5,
        }));
        const c = centroidOf(landmarks);
        const conf = c.confidence;
        return { landmarks, tier: 'mediapipe', centroidX: c.x, centroidY: c.y, confidence: conf };
      },
      dispose() {
        try { landmarker.close(); } catch { /* already closed */ }
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The adaptive engine
// ---------------------------------------------------------------------------

export interface AdaptivePoseEngine {
  /** The tier actually in use ('posenet' online, 'mediapipe' offline). */
  tier: PoseTier;
  /** Human label for the active model (shown in the UI). */
  label: string;
  /** True when the offline (bundled) tier is the active one. */
  offlineCapable: boolean;
  posenet: PoseNetHandle | null;
  mediapipe: PoseEngineHandle | null;
  dispose(): void;
}

/**
 * Create the connection-adaptive engine. Online → PoseNet (heavy), offline →
 * MediaPipe lite (bundled). If the online load fails (CDN blocked), silently
 * fall back to the offline tier so the student always gets a pose.
 */
export async function createAdaptivePoseEngine(opts?: { forceOffline?: boolean }): Promise<AdaptivePoseEngine> {
  const online = !opts?.forceOffline && typeof navigator !== 'undefined' && navigator.onLine;

  let posenet: PoseNetHandle | null = null;
  let mediapipe: PoseEngineHandle | null = null;

  if (online) {
    posenet = await createPoseNetEngine();
    if (!posenet) {
      // CDN blocked / load failed -> fall back to the bundled tier.
      mediapipe = await createMediaPipeEngine();
    }
  } else {
    mediapipe = await createMediaPipeEngine();
  }

  const tier: PoseTier = posenet ? 'posenet' : 'mediapipe';
  return {
    tier,
    label: posenet
      ? 'TF.js PoseNet (online, high-accuracy)'
      : mediapipe
        ? 'MediaPipe Pose Lite (offline, on-device)'
        : 'No pose model',
    offlineCapable: Boolean(mediapipe),
    posenet,
    mediapipe,
    dispose() {
      posenet?.dispose();
      mediapipe?.dispose();
    },
  };
}
