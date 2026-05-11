export type FaceEmotion =
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | "neutral"
  | "fearful"
  | "disgusted";

export type VoiceEmotion = "happy" | "sad" | "angry" | "neutral" | "stressed" | "excited";

export type Emotion = FaceEmotion | VoiceEmotion;

export type EmotionSource = "face" | "voice" | "fusion";

export type EmotionReading = {
  emotion: Emotion;
  label: string;
  confidence: number;
  color: string;
};

export type EmotionSample = {
  id: string;
  timestamp: number;
  source: EmotionSource;
  emotion: Emotion;
  confidence: number;
  focusScore?: number;
};

export type AnalyticsSnapshot = {
  sessionDurationSeconds: number;
  totalSamples: number;
  mostDetectedEmotion: Emotion | null;
  frequency: Record<Emotion, number>;
  percentages: Record<Emotion, number>;
  timeline: Array<{
    time: string;
    emotion: Emotion;
    confidence: number;
    source: EmotionSource;
  }>;
  trend: Array<{
    label: string;
    positive: number;
    strained: number;
    neutral: number;
  }>;
};

export const EMOTION_META: Record<Emotion, { label: string; color: string; tone: "positive" | "strained" | "neutral" }> = {
  happy: { label: "Happy", color: "hsl(var(--emotion-happy))", tone: "positive" },
  sad: { label: "Sad", color: "hsl(var(--emotion-sad))", tone: "strained" },
  angry: { label: "Angry", color: "hsl(var(--emotion-angry))", tone: "strained" },
  surprised: { label: "Surprise", color: "hsl(var(--emotion-surprised))", tone: "positive" },
  neutral: { label: "Neutral", color: "hsl(var(--emotion-neutral))", tone: "neutral" },
  fearful: { label: "Fearful", color: "hsl(var(--emotion-fearful))", tone: "strained" },
  disgusted: { label: "Disgusted", color: "hsl(var(--emotion-disgusted))", tone: "strained" },
  stressed: { label: "Stressed", color: "hsl(var(--emotion-stressed))", tone: "strained" },
  excited: { label: "Excited", color: "hsl(var(--emotion-excited))", tone: "positive" },
};

export const TRACKED_EMOTIONS: Emotion[] = [
  "happy",
  "neutral",
  "excited",
  "surprised",
  "sad",
  "stressed",
  "angry",
  "fearful",
  "disgusted",
];

export const getEmotionMeta = (emotion: Emotion) => EMOTION_META[emotion] ?? EMOTION_META.neutral;

export const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export const createEmotionSample = (
  source: EmotionSource,
  emotion: Emotion,
  confidence: number,
  focusScore?: number
): EmotionSample => ({
  id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  timestamp: Date.now(),
  source,
  emotion,
  confidence: Number(Math.min(1, Math.max(0, confidence)).toFixed(4)),
  focusScore,
});
