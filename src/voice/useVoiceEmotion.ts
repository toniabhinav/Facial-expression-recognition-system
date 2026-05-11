import { useCallback, useMemo, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { EMOTION_META, type EmotionReading, type VoiceEmotion } from "@/utils/emotion";

type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type BrowserWindowWithSpeech = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const supportedVoiceEmotions: VoiceEmotion[] = ["happy", "sad", "angry", "neutral", "stressed", "excited"];

type VoiceFeatures = {
  energy: number;
  brightness: number;
  variation: number;
  speechDetected: boolean;
};

type VoiceClassification = VoiceFeatures & {
  emotion: VoiceEmotion;
  confidence: number;
};

const keywordScores: Record<VoiceEmotion, Array<{ pattern: RegExp; weight: number }>> = {
  happy: [
    { pattern: /\b(love|lovely|loving|beautiful|sweet|kind|grateful|thankful|great|good|nice|happy|calm|peaceful)\b/i, weight: 1.15 },
    { pattern: /\b(i love you|love this|feel good|so good|very happy)\b/i, weight: 1.45 },
  ],
  sad: [
    { pattern: /\b(sad|tired|low|hurt|lonely|upset|down|cry|crying|lost|hopeless)\b/i, weight: 1.05 },
    { pattern: /\b(feel bad|not okay|so tired|very low)\b/i, weight: 1.25 },
  ],
  angry: [
    { pattern: /\b(angry|annoyed|mad|furious|irritated|frustrated|hate|shut up|stupid|nonsense|damn|blocked)\b/i, weight: 1.25 },
    { pattern: /\b(what the|stop it|leave me|you are wrong|this is terrible)\b/i, weight: 1.35 },
  ],
  neutral: [
    { pattern: /\b(okay|fine|normal|next|today|describe|continue|explain)\b/i, weight: 0.35 },
  ],
  stressed: [
    { pattern: /\b(stress|stressed|urgent|deadline|overwhelmed|pressure|panic|worried|anxious|too much)\b/i, weight: 1.2 },
    { pattern: /\b(i can't|cannot handle|running out of time|need this now)\b/i, weight: 1.35 },
  ],
  excited: [
    { pattern: /\b(excited|launch|awesome|amazing|ready|energy|fast|lets go|let's go|boost|win|next level)\b/i, weight: 1.05 },
    { pattern: /\b(keep going|we got this|super ready|so excited)\b/i, weight: 1.25 },
  ],
};

const buildTextScores = (text: string) =>
  supportedVoiceEmotions.reduce(
    (scores, emotion) => {
      scores[emotion] = keywordScores[emotion].reduce(
        (total, matcher) => total + (matcher.pattern.test(text) ? matcher.weight : 0),
        0
      );
      return scores;
    },
    {} as Record<VoiceEmotion, number>
  );

const extractVoiceFeatures = (timeData: Uint8Array, freqData: Uint8Array): VoiceFeatures => {
  const centered = Array.from(timeData, (value) => (value - 128) / 128);
  const energy = Math.sqrt(centered.reduce((total, value) => total + value * value, 0) / Math.max(1, centered.length));
  const mean = centered.reduce((total, value) => total + value, 0) / Math.max(1, centered.length);
  const variation = Math.sqrt(
    centered.reduce((total, value) => total + (value - mean) * (value - mean), 0) / Math.max(1, centered.length)
  );
  const spectralTotal = freqData.reduce((total, value) => total + value, 0);
  const brightness =
    freqData.reduce((total, value, index) => total + value * (index / Math.max(1, freqData.length - 1)), 0) /
    Math.max(1, spectralTotal);

  return {
    energy,
    brightness,
    variation,
    speechDetected: energy > 0.018 || spectralTotal > 900,
  };
};

const normalizeScores = (scores: Record<VoiceEmotion, number>) => {
  const values = supportedVoiceEmotions.map((emotion) => scores[emotion]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = Math.max(0.001, max - min);
  return { max, spread };
};

export const useVoiceEmotion = (onSample?: (emotion: VoiceEmotion, confidence: number) => void) => {
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef(0);
  const lastHistorySampleRef = useRef(0);
  const transcriptRef = useRef("");
  const latestFeaturesRef = useRef<VoiceFeatures>({
    energy: 0,
    brightness: 0,
    variation: 0,
    speechDetected: false,
  });

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(Array.from({ length: 44 }, () => 0.18));
  const [reading, setReading] = useState<EmotionReading | null>(null);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("Voice analysis is ready when you enable the microphone.");

  const speechSupported = useMemo(() => {
    const win = window as BrowserWindowWithSpeech;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }, []);

  const classifyVoice = useCallback((features: VoiceFeatures, text: string): VoiceClassification => {
    const cleanText = text.trim();
    const textScores = buildTextScores(cleanText);
    const speechPresence = cleanText.length > 0 || features.speechDetected ? 1 : 0;

    const acousticScores = tf.tidy(() => {
      const input = tf.tensor2d(
        [[features.energy, features.brightness, features.variation, speechPresence]],
        [1, 4]
      );
      const weights = tf.tensor2d(
        [
          [1.1, -0.15, 1.28, 0.08, 1.18, 1.22],
          [0.62, -0.08, 0.75, 0.02, 0.55, 0.96],
          [0.65, 0.18, 1.05, 0.05, 1.22, 0.72],
          [0.18, 0.08, 0.12, 0.22, 0.1, 0.14],
        ],
        [4, 6]
      );
      return Array.from(input.matMul(weights).dataSync());
    });

    const scores = supportedVoiceEmotions.reduce(
      (acc, emotion, index) => {
        acc[emotion] = acousticScores[index] + textScores[emotion];
        return acc;
      },
      {} as Record<VoiceEmotion, number>
    );

    if (!features.speechDetected && cleanText.length === 0) {
      scores.neutral += 1.2;
      scores.happy -= 0.2;
      scores.angry -= 0.25;
      scores.stressed -= 0.25;
      scores.excited -= 0.25;
    }

    if (features.energy > 0.12 && features.variation > 0.09) {
      scores.angry += features.brightness < 0.42 ? 0.9 : 0.35;
      scores.stressed += 0.45;
      scores.excited += features.brightness > 0.45 ? 0.65 : 0.15;
    }

    if (features.energy > 0.065 && features.brightness > 0.48 && textScores.angry < 0.5) {
      scores.excited += 0.55;
    }

    if (textScores.happy > 0.9 && textScores.angry === 0 && textScores.stressed === 0) {
      scores.happy += 0.65;
      scores.neutral -= 0.25;
    }

    const bestEmotion = supportedVoiceEmotions.reduce((winner, emotion) =>
      scores[emotion] > scores[winner] ? emotion : winner
    );
    const { max, spread } = normalizeScores(scores);
    const confidence = Math.min(0.97, Math.max(0.52, 0.54 + spread * 0.2 + Math.max(0, max) * 0.08));

    return {
      emotion: bestEmotion,
      confidence,
      ...features,
    };
  }, []);

  const applyClassification = useCallback(
    (classification: VoiceClassification) => {
      const meta = EMOTION_META[classification.emotion];
      setReading({
        emotion: classification.emotion,
        label: meta.label,
        confidence: classification.confidence,
        color: meta.color,
      });
      setSummary(
        classification.emotion === "angry"
          ? "Voice tone sounds harsh or frustrated. A slower pace and shorter next action will help."
          : classification.emotion === "happy"
            ? "Voice tone sounds warm and positive. This is a good moment for creative momentum."
            : classification.emotion === "stressed"
              ? "Voice tone suggests elevated pressure. Pair the next sprint with a short breathing reset."
              : classification.emotion === "excited"
                ? "Voice energy is high. This is a strong window for execution or creative work."
                : `Voice tone is reading as ${meta.label.toLowerCase()} with ${Math.round(
                    classification.confidence * 100
                  )}% confidence.`
      );

      const now = performance.now();
      if (now - lastHistorySampleRef.current > 2200) {
        lastHistorySampleRef.current = now;
        onSample?.(classification.emotion, classification.confidence);
      }
    },
    [onSample]
  );

  const analyse = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const timeData = new Uint8Array(analyser.fftSize);
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);
    analyser.getByteFrequencyData(freqData);

    const bars = Array.from({ length: 44 }, (_, index) => {
      const start = Math.floor((index / 44) * timeData.length);
      const end = Math.floor(((index + 1) / 44) * timeData.length);
      const slice = timeData.slice(start, Math.max(start + 1, end));
      const energy = slice.reduce((total, value) => total + Math.abs(value - 128), 0) / Math.max(1, slice.length) / 128;
      return Math.min(1, energy * 9);
    });
    setWaveform(bars);

    const features = extractVoiceFeatures(timeData, freqData);
    latestFeaturesRef.current = features;
    const now = performance.now();
    if (now - lastUiUpdateRef.current > 420) {
      lastUiUpdateRef.current = now;
      applyClassification(classifyVoice(features, transcriptRef.current));
    }

    rafRef.current = window.requestAnimationFrame(analyse);
  }, [applyClassification, classifyVoice]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.58;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      if (typeof MediaRecorder !== "undefined") {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start(1000);
      }

      const win = window as BrowserWindowWithSpeech;
      const SpeechRecognitionApi = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognitionApi) {
        const recognition = new SpeechRecognitionApi();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          const text = Array.from(event.results)
            .map((result) => result[0]?.transcript ?? "")
            .join(" ")
            .trim();
          transcriptRef.current = text;
          setTranscript(text);
          applyClassification(classifyVoice(latestFeaturesRef.current, text));
        };
        recognition.onerror = () => undefined;
        recognition.start();
        recognitionRef.current = recognition;
      }

      setRunning(true);
      setSummary("Listening for speech tone and vocal energy in real time.");
      applyClassification(classifyVoice(latestFeaturesRef.current, transcriptRef.current));
      rafRef.current = window.requestAnimationFrame(analyse);
    } catch (voiceError) {
      console.error(voiceError);
      const name = voiceError instanceof DOMException ? voiceError.name : "";
      setError(
        name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone permission and try again."
          : "Could not start voice analysis on this browser."
      );
      setRunning(false);
    }
  }, [analyse, applyClassification, classifyVoice]);

  const stop = useCallback(() => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRunning(false);
    setWaveform(Array.from({ length: 44 }, () => 0.18));
    setSummary("Voice analysis is paused.");
  }, []);

  return {
    running,
    error,
    waveform,
    reading,
    transcript,
    summary,
    speechSupported,
    start,
    stop,
  };
};
