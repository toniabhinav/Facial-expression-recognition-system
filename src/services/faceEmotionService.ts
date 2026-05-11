import * as faceapi from "face-api.js";
import { EMOTION_META, type Emotion, type EmotionReading, type FaceEmotion } from "@/utils/emotion";

export type FaceDetectionResult = faceapi.WithFaceExpressions<{
  detection: faceapi.FaceDetection;
}>;

const FACE_EMOTIONS: FaceEmotion[] = [
  "happy",
  "sad",
  "angry",
  "surprised",
  "neutral",
  "fearful",
  "disgusted",
];

export const loadFaceEmotionModels = async () => {
  const modelUrl = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
  ]);
};

export const detectFaceEmotions = async (video: HTMLVideoElement) =>
  faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceExpressions();

export const resizeFaceDetections = (
  detections: FaceDetectionResult[],
  width: number,
  height: number
) => faceapi.resizeResults(detections, { width, height }) as FaceDetectionResult[];

export const topExpressionFromDetection = (detection: FaceDetectionResult): EmotionReading => {
  const sorted = (Object.entries(detection.expressions) as [string, number][])
    .filter(([key]) => FACE_EMOTIONS.includes(key as FaceEmotion))
    .sort((a, b) => b[1] - a[1]);

  const [key, confidence] = sorted[0] ?? ["neutral", 0];
  const emotion = key as Emotion;
  const meta = EMOTION_META[emotion] ?? EMOTION_META.neutral;

  return {
    emotion,
    label: meta.label,
    confidence,
    color: meta.color,
  };
};

export const drawEmotionOverlay = (
  canvas: HTMLCanvasElement,
  detections: FaceDetectionResult[]
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  detections.forEach((detection) => {
    const { x, y, width, height } = detection.detection.box;
    const top = topExpressionFromDetection(detection);
    const color = top.color;

    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    drawRoundRect(ctx, x, y, width, height, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const label = `${top.label} ${(top.confidence * 100).toFixed(0)}%`;
    ctx.font = "700 15px Inter, system-ui, sans-serif";
    const paddingX = 12;
    const textWidth = ctx.measureText(label).width;
    const pillWidth = textWidth + paddingX * 2;
    const pillHeight = 28;
    const pillY = Math.max(8, y - pillHeight - 10);

    ctx.fillStyle = color;
    drawRoundRect(ctx, x, pillY, pillWidth, pillHeight, 8);
    ctx.fill();

    ctx.fillStyle = "#070711";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + paddingX, pillY + pillHeight / 2 + 1);
  });
};

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};
