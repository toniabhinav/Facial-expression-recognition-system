import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectFaceEmotions,
  drawEmotionOverlay,
  loadFaceEmotionModels,
  resizeFaceDetections,
  topExpressionFromDetection,
} from "@/services/faceEmotionService";
import type { Emotion, EmotionReading } from "@/utils/emotion";

type UseFaceEmotionDetectionOptions = {
  sampleIntervalMs?: number;
  onSample?: (emotion: Emotion, confidence: number) => void;
  onEmotionChange?: (emotion: Emotion | null) => void;
};

export const useFaceEmotionDetection = ({
  sampleIntervalMs = 3500,
  onSample,
  onEmotionChange,
}: UseFaceEmotionDetectionOptions = {}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectRef = useRef(0);
  const lastSampleRef = useRef(0);
  const detectLoopRef = useRef<() => void>(() => undefined);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [readings, setReadings] = useState<EmotionReading[]>([]);
  const [activeEmotion, setActiveEmotion] = useState<Emotion | null>(null);

  useEffect(() => {
    let mounted = true;
    loadFaceEmotionModels()
      .then(() => {
        if (mounted) setModelsLoaded(true);
      })
      .catch((loadError) => {
        console.error(loadError);
        if (mounted) setError("Failed to load face emotion models. Refresh the page and try again.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setRunning(false);
    setReadings([]);
    setFps(0);
    setActiveEmotion(null);
    onEmotionChange?.(null);
  }, [onEmotionChange]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const detectLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) {
      rafRef.current = window.requestAnimationFrame(detectLoopRef.current);
      return;
    }

    const now = performance.now();
    const elapsed = now - lastDetectRef.current;
    const minInterval = 1000 / 12;

    if (elapsed >= minInterval && video.readyState >= 3) {
      lastDetectRef.current = now;
      const width = video.clientWidth;
      const height = video.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      try {
        const detections = await detectFaceEmotions(video);
        const resized = resizeFaceDetections(detections, width, height);
        drawEmotionOverlay(canvas, resized);
        const nextReadings = resized.map(topExpressionFromDetection);
        const top = nextReadings[0] ?? null;

        setReadings(nextReadings);
        setFps(Math.round(1000 / Math.max(1, elapsed)));
        setActiveEmotion(top?.emotion ?? null);
        onEmotionChange?.(top?.emotion ?? null);

        if (top && now - lastSampleRef.current >= sampleIntervalMs) {
          lastSampleRef.current = now;
          onSample?.(top.emotion, top.confidence);
        }
      } catch (detectError) {
        console.error("Face detection error", detectError);
      }
    }

    rafRef.current = window.requestAnimationFrame(detectLoopRef.current);
  }, [onEmotionChange, onSample, sampleIntervalMs]);

  useEffect(() => {
    detectLoopRef.current = detectLoop;
  }, [detectLoop]);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!modelsLoaded) {
      setError("Face models are still loading. Please try again in a moment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 960, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setRunning(true);
      lastDetectRef.current = 0;
      lastSampleRef.current = 0;
      rafRef.current = window.requestAnimationFrame(detectLoopRef.current);
    } catch (cameraError) {
      console.error(cameraError);
      const name = cameraError instanceof DOMException ? cameraError.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera access was denied. Allow webcam permission and try again."
          : name === "NotFoundError"
            ? "No webcam was found on this device."
            : "Could not access the webcam. Check your device and browser permissions."
      );
      setRunning(false);
    }
  }, [modelsLoaded]);

  return {
    videoRef,
    canvasRef,
    modelsLoaded,
    running,
    error,
    fps,
    readings,
    activeEmotion,
    startCamera,
    stopCamera,
  };
};
