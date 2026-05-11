import type { Emotion } from "@/utils/emotion";

export type EmotionTheme = {
  name: string;
  emotion: Emotion;
  variables: Record<string, string>;
  aura: string;
};

const neutralVariables = {
  "--primary": "280 95% 65%",
  "--primary-glow": "280 100% 75%",
  "--secondary": "200 95% 60%",
  "--accent": "160 90% 55%",
  "--ring": "280 95% 65%",
  "--theme-a": "280 95% 65%",
  "--theme-b": "200 95% 60%",
  "--theme-c": "160 90% 55%",
};

export const emotionThemes: Record<Emotion, EmotionTheme> = {
  happy: {
    name: "Solar Flow",
    emotion: "happy",
    variables: {
      "--primary": "42 100% 62%",
      "--primary-glow": "32 100% 70%",
      "--secondary": "18 100% 63%",
      "--accent": "156 90% 54%",
      "--ring": "42 100% 62%",
      "--theme-a": "42 100% 62%",
      "--theme-b": "18 100% 63%",
      "--theme-c": "156 90% 54%",
    },
    aura: "radial-gradient(circle at 20% 0%, hsl(42 100% 62% / 0.25), transparent 34%), radial-gradient(circle at 85% 20%, hsl(18 100% 63% / 0.18), transparent 38%)",
  },
  sad: {
    name: "Calm Drift",
    emotion: "sad",
    variables: {
      "--primary": "214 92% 67%",
      "--primary-glow": "245 90% 75%",
      "--secondary": "268 78% 66%",
      "--accent": "190 90% 58%",
      "--ring": "214 92% 67%",
      "--theme-a": "214 92% 67%",
      "--theme-b": "268 78% 66%",
      "--theme-c": "190 90% 58%",
    },
    aura: "radial-gradient(circle at 18% 8%, hsl(214 92% 67% / 0.22), transparent 34%), radial-gradient(circle at 82% 12%, hsl(268 78% 66% / 0.2), transparent 38%)",
  },
  angry: {
    name: "Redline",
    emotion: "angry",
    variables: {
      "--primary": "0 92% 62%",
      "--primary-glow": "344 100% 70%",
      "--secondary": "22 100% 58%",
      "--accent": "190 92% 58%",
      "--ring": "0 92% 62%",
      "--theme-a": "0 92% 62%",
      "--theme-b": "22 100% 58%",
      "--theme-c": "190 92% 58%",
    },
    aura: "radial-gradient(circle at 16% 8%, hsl(0 92% 62% / 0.24), transparent 34%), radial-gradient(circle at 86% 16%, hsl(22 100% 58% / 0.18), transparent 38%)",
  },
  surprised: {
    name: "Violet Surge",
    emotion: "surprised",
    variables: {
      "--primary": "286 100% 70%",
      "--primary-glow": "265 100% 78%",
      "--secondary": "195 100% 62%",
      "--accent": "322 92% 68%",
      "--ring": "286 100% 70%",
      "--theme-a": "286 100% 70%",
      "--theme-b": "195 100% 62%",
      "--theme-c": "322 92% 68%",
    },
    aura: "radial-gradient(circle at 18% 6%, hsl(286 100% 70% / 0.28), transparent 34%), radial-gradient(circle at 86% 18%, hsl(195 100% 62% / 0.2), transparent 40%)",
  },
  neutral: {
    name: "Deep Focus",
    emotion: "neutral",
    variables: neutralVariables,
    aura: "radial-gradient(circle at 20% 0%, hsl(280 95% 65% / 0.18), transparent 34%), radial-gradient(circle at 84% 18%, hsl(200 95% 60% / 0.16), transparent 40%)",
  },
  fearful: {
    name: "Soft Guard",
    emotion: "fearful",
    variables: {
      "--primary": "270 78% 68%",
      "--primary-glow": "306 90% 74%",
      "--secondary": "206 95% 62%",
      "--accent": "145 86% 56%",
      "--ring": "270 78% 68%",
      "--theme-a": "270 78% 68%",
      "--theme-b": "206 95% 62%",
      "--theme-c": "145 86% 56%",
    },
    aura: "radial-gradient(circle at 18% 8%, hsl(270 78% 68% / 0.2), transparent 34%), radial-gradient(circle at 84% 18%, hsl(206 95% 62% / 0.15), transparent 38%)",
  },
  disgusted: {
    name: "Reset Green",
    emotion: "disgusted",
    variables: {
      "--primary": "116 66% 58%",
      "--primary-glow": "150 84% 62%",
      "--secondary": "198 92% 60%",
      "--accent": "42 100% 62%",
      "--ring": "116 66% 58%",
      "--theme-a": "116 66% 58%",
      "--theme-b": "198 92% 60%",
      "--theme-c": "42 100% 62%",
    },
    aura: "radial-gradient(circle at 18% 8%, hsl(116 66% 58% / 0.2), transparent 34%), radial-gradient(circle at 84% 18%, hsl(198 92% 60% / 0.14), transparent 38%)",
  },
  stressed: {
    name: "Breathline",
    emotion: "stressed",
    variables: {
      "--primary": "350 92% 65%",
      "--primary-glow": "286 96% 72%",
      "--secondary": "38 100% 60%",
      "--accent": "178 92% 56%",
      "--ring": "350 92% 65%",
      "--theme-a": "350 92% 65%",
      "--theme-b": "38 100% 60%",
      "--theme-c": "178 92% 56%",
    },
    aura: "radial-gradient(circle at 18% 8%, hsl(350 92% 65% / 0.22), transparent 34%), radial-gradient(circle at 84% 18%, hsl(38 100% 60% / 0.15), transparent 38%)",
  },
  excited: {
    name: "Launch Mode",
    emotion: "excited",
    variables: {
      "--primary": "176 95% 54%",
      "--primary-glow": "42 100% 65%",
      "--secondary": "322 96% 67%",
      "--accent": "48 100% 62%",
      "--ring": "176 95% 54%",
      "--theme-a": "176 95% 54%",
      "--theme-b": "322 96% 67%",
      "--theme-c": "48 100% 62%",
    },
    aura: "radial-gradient(circle at 18% 8%, hsl(176 95% 54% / 0.22), transparent 34%), radial-gradient(circle at 84% 18%, hsl(322 96% 67% / 0.18), transparent 38%)",
  },
};

export const getEmotionTheme = (emotion: Emotion | null | undefined) => {
  if (!emotion) return emotionThemes.neutral;
  return emotionThemes[emotion] ?? emotionThemes.neutral;
};
