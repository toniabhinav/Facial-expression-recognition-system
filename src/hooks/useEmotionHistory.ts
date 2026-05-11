import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TRACKED_EMOTIONS,
  createEmotionSample,
  formatDuration,
  type AnalyticsSnapshot,
  type Emotion,
  type EmotionSample,
  type EmotionSource,
} from "@/utils/emotion";

const STORAGE_KEY = "emotion-wellness-history-v1";
const MAX_HISTORY = 650;

const buildEmptyFrequency = () =>
  TRACKED_EMOTIONS.reduce(
    (acc, emotion) => {
      acc[emotion] = 0;
      return acc;
    },
    {} as Record<Emotion, number>
  );

const toBucketLabel = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(timestamp);

export const useEmotionHistory = () => {
  const sessionStartedAt = useRef(Date.now());
  const [samples, setSamples] = useState<EmotionSample[]>([]);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as EmotionSample[];
        if (Array.isArray(parsed)) setSamples(parsed.slice(-MAX_HISTORY));
      }
    } catch {
      setSamples([]);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStartedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(samples.slice(-MAX_HISTORY)));
  }, [samples]);

  const addSample = useCallback(
    (source: EmotionSource, emotion: Emotion, confidence: number, focusScore?: number) => {
      const sample = createEmotionSample(source, emotion, confidence, focusScore);
      setSamples((current) => [...current, sample].slice(-MAX_HISTORY));
      return sample;
    },
    []
  );

  const clearHistory = useCallback(() => {
    sessionStartedAt.current = Date.now();
    setSamples([]);
  }, []);

  const analytics = useMemo<AnalyticsSnapshot>(() => {
    const frequency = buildEmptyFrequency();
    samples.forEach((sample) => {
      frequency[sample.emotion] = (frequency[sample.emotion] ?? 0) + 1;
    });

    const totalSamples = samples.length;
    const percentages = buildEmptyFrequency();
    TRACKED_EMOTIONS.forEach((emotion) => {
      percentages[emotion] = totalSamples > 0 ? Math.round((frequency[emotion] / totalSamples) * 100) : 0;
    });

    const mostDetectedEmotion =
      totalSamples === 0
        ? null
        : TRACKED_EMOTIONS.reduce((winner, emotion) =>
            frequency[emotion] > frequency[winner] ? emotion : winner
          );

    const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 6;
    const weeklySamples = samples.filter((sample) => sample.timestamp >= sevenDaysAgo);
    const groupedTrend = new Map<string, { positive: number; strained: number; neutral: number }>();
    weeklySamples.forEach((sample) => {
      const label = toBucketLabel(sample.timestamp);
      const current = groupedTrend.get(label) ?? { positive: 0, strained: 0, neutral: 0 };
      const strained = ["sad", "angry", "fearful", "disgusted", "stressed"].includes(sample.emotion);
      const positive = ["happy", "excited", "surprised"].includes(sample.emotion);
      if (positive) current.positive += 1;
      else if (strained) current.strained += 1;
      else current.neutral += 1;
      groupedTrend.set(label, current);
    });

    return {
      sessionDurationSeconds: sessionSeconds,
      totalSamples,
      mostDetectedEmotion,
      frequency,
      percentages,
      timeline: samples.slice(-30).map((sample) => ({
        time: new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(sample.timestamp),
        emotion: sample.emotion,
        confidence: Math.round(sample.confidence * 100),
        source: sample.source,
      })),
      trend: Array.from(groupedTrend.entries()).map(([label, value]) => ({
        label,
        ...value,
      })),
    };
  }, [samples, sessionSeconds]);

  const exportReport = useCallback(() => {
    const payload = {
      generatedAt: new Date().toISOString(),
      sessionDuration: formatDuration(sessionSeconds),
      analytics,
      samples,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `emotion-wellness-report-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [analytics, samples, sessionSeconds]);

  return {
    samples,
    analytics,
    sessionSeconds,
    addSample,
    clearHistory,
    exportReport,
  };
};
