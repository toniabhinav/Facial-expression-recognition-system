import { EMOTION_META, type Emotion, type EmotionSample } from "@/utils/emotion";

export type ProductivityState = {
  focusScore: number;
  stateLabel: string;
  mode: "deep-work" | "reset" | "breathing" | "boost";
  summary: string;
  recommendations: string[];
  music: Array<{ title: string; detail: string }>;
};

const focusWeights: Record<Emotion, number> = {
  happy: 86,
  neutral: 82,
  excited: 78,
  surprised: 70,
  sad: 52,
  stressed: 43,
  angry: 38,
  fearful: 45,
  disgusted: 48,
};

export const calculateFocusScore = (samples: EmotionSample[], activeEmotion: Emotion | null) => {
  if (samples.length === 0 && !activeEmotion) return 72;

  const recent = samples.slice(-20);
  const weightedScores = recent.map((sample, index) => {
    const recency = (index + 1) / Math.max(1, recent.length);
    return (focusWeights[sample.emotion] ?? 70) * sample.confidence * (0.7 + recency * 0.3);
  });
  const sampleScore =
    weightedScores.length > 0
      ? weightedScores.reduce((total, value) => total + value, 0) / weightedScores.length
      : focusWeights[activeEmotion ?? "neutral"];

  const activeBoost = activeEmotion ? focusWeights[activeEmotion] * 0.35 : 24;
  return Math.round(Math.min(98, Math.max(18, sampleScore * 0.75 + activeBoost)));
};

export const buildProductivityState = (
  samples: EmotionSample[],
  activeEmotion: Emotion | null
): ProductivityState => {
  const focusScore = calculateFocusScore(samples, activeEmotion);
  const emotion = activeEmotion ?? "neutral";
  const tone = EMOTION_META[emotion].tone;

  if (emotion === "stressed" || emotion === "fearful" || (tone === "strained" && focusScore < 50)) {
    return {
      focusScore,
      stateLabel: "Breathing reset",
      mode: "breathing",
      summary: "Your signals look elevated. A short reset will protect the next block of work.",
      recommendations: [
        "Run a 60-second box breathing break before the next task.",
        "Move one low-urgency tab or notification out of sight.",
        "Choose a single next action and timebox it to 15 minutes.",
      ],
      music: [
        { title: "Low pulse ambient", detail: "Soft pads, no lyrics, 60-70 BPM" },
        { title: "Brown noise bed", detail: "Steady texture for nervous-system downshift" },
      ],
    };
  }

  if (emotion === "sad" || emotion === "disgusted" || focusScore < 58) {
    return {
      focusScore,
      stateLabel: "Gentle recovery",
      mode: "reset",
      summary: "Focus is available, but the system is asking for a kinder ramp.",
      recommendations: [
        "Take a short walk or stretch before returning to the screen.",
        "Start with a two-minute task to rebuild momentum.",
        "Use a 20-minute Pomodoro instead of a full deep-work block.",
      ],
      music: [
        { title: "Warm piano focus", detail: "Sparse, steady, low dynamic range" },
        { title: "Rain + synth wash", detail: "Soft masking without heavy rhythm" },
      ],
    };
  }

  if (emotion === "happy" || emotion === "excited") {
    return {
      focusScore,
      stateLabel: "Productivity boost",
      mode: "boost",
      summary: "Energy is high. This is a good window for creative or demanding work.",
      recommendations: [
        "Batch the most important task while momentum is available.",
        "Set a clear finish line so excitement turns into output.",
        "Use a 25-minute sprint, then capture follow-up ideas quickly.",
      ],
      music: [
        { title: "Instrumental pulse", detail: "Upbeat electronic, 90-110 BPM" },
        { title: "Cinematic momentum", detail: "Light percussion with broad stereo space" },
      ],
    };
  }

  return {
    focusScore,
    stateLabel: "Deep work ready",
    mode: "deep-work",
    summary: "Emotional signals are stable enough for sustained concentration.",
    recommendations: [
      "Start a 25-minute Pomodoro and keep the task scope narrow.",
      "Use focus mode if your confidence readings drop for two samples.",
      "Review progress at the end of the block, not during it.",
    ],
    music: [
      { title: "Minimal techno focus", detail: "Low-variance rhythm, no vocals" },
      { title: "Quiet room tone", detail: "Clean ambience for analytical tasks" },
    ],
  };
};
