export const LIP_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
];

export const LIP_START_THRESHOLD = 0.045;
export const ACTIVITY_THRESHOLD = 0.008;
export const EMA_ALPHA = 0.15;
export const START_DELAY_FRAMES = 3;
export const MAX_FRAMES = 90;
export const CAPTURE_DURATION_MS = 5000;
export const FEATURES_PER_FRAME = LIP_INDICES.length * 2;
export const HISTORY_STORAGE_KEY = 'lip_history';
export const HISTORY_LIMIT = 5;

export function normalizeLandmarks(points) {
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const centered = points.map((point) => ({ x: point.x - meanX, y: point.y - meanY }));
  const maxDist = Math.max(...centered.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)]));

  return maxDist > 0
    ? centered.flatMap((point) => [point.x / maxDist, point.y / maxDist])
    : centered.flatMap((point) => [point.x, point.y]);
}

export function calculateLipDistance(landmarks) {
  const p13 = landmarks[13];
  const p14 = landmarks[14];
  const p10 = landmarks[10];
  const p152 = landmarks[152];
  const faceHeight = Math.sqrt((p10.x - p152.x) ** 2 + (p10.y - p152.y) ** 2);
  const dist = Math.sqrt((p13.x - p14.x) ** 2 + (p13.y - p14.y) ** 2);
  return faceHeight > 0 ? dist / faceHeight : 0;
}

export function vectorizeLipFrame(landmarks) {
  const lipPoints = LIP_INDICES.map((idx) => ({ x: landmarks[idx].x, y: landmarks[idx].y }));
  return normalizeLandmarks(lipPoints);
}

function getFrameVector(frame) {
  return Array.isArray(frame) ? frame : frame.vector;
}

function getFrameTime(frame, index) {
  return Array.isArray(frame) ? index : frame.at;
}

function interpolateVectors(start, end, ratio) {
  return start.map((value, index) => value + ((end[index] - value) * ratio));
}

export function fitLandmarkFramesToModelInput(frames) {
  if (frames.length === 0) return [];
  if (frames.length === 1) {
    const onlyFrame = getFrameVector(frames[0]);
    return Array.from({ length: MAX_FRAMES }, () => onlyFrame);
  }

  const firstTime = getFrameTime(frames[0], 0);
  const lastTime = getFrameTime(frames[frames.length - 1], frames.length - 1);
  const duration = Math.max(lastTime - firstTime, frames.length - 1);
  const sampledFrames = [];
  let sourceIndex = 0;

  for (let i = 0; i < MAX_FRAMES; i += 1) {
    const targetTime = firstTime + ((duration * i) / (MAX_FRAMES - 1));

    while (
      sourceIndex < frames.length - 2
      && getFrameTime(frames[sourceIndex + 1], sourceIndex + 1) < targetTime
    ) {
      sourceIndex += 1;
    }

    const currentFrame = frames[sourceIndex];
    const nextFrame = frames[Math.min(sourceIndex + 1, frames.length - 1)];
    const currentTime = getFrameTime(currentFrame, sourceIndex);
    const nextTime = getFrameTime(nextFrame, sourceIndex + 1);
    const span = Math.max(nextTime - currentTime, 1);
    const ratio = Math.min(Math.max((targetTime - currentTime) / span, 0), 1);

    sampledFrames.push(interpolateVectors(getFrameVector(currentFrame), getFrameVector(nextFrame), ratio));
  }

  return sampledFrames;
}

export function buildLandmarkPayload(frames) {
  return fitLandmarkFramesToModelInput(frames).flat();
}
