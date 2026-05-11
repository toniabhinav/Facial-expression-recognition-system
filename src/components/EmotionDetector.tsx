import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Loader2, AlertCircle, Activity } from "lucide-react";

// Map face-api expression keys -> friendly label + token color
const EMOTION_META: Record<string, { label: string; color: string }> = {
  happy: { label: "Happy", color: "hsl(var(--emotion-happy))" },
  sad: { label: "Sad", color: "hsl(var(--emotion-sad))" },
  angry: { label: "Angry", color: "hsl(var(--emotion-angry))" },
  surprised: { label: "Surprise", color: "hsl(var(--emotion-surprised))" },
  neutral: { label: "Neutral", color: "hsl(var(--emotion-neutral))" },
  fearful: { label: "Fearful", color: "hsl(var(--emotion-fearful))" },
  disgusted: { label: "Disgusted", color: "hsl(var(--emotion-disgusted))" },
};

type Reading = { label: string; confidence: number; color: string };

const EmotionDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectRef = useRef<number>(0);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [readings, setReadings] = useState<Reading[]>([]);

  // Load TF models once on mount
  useEffect(() => {
    const load = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error(e);
        setError("Failed to load AI models. Please refresh the page.");
      }
    };
    load();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setRunning(false);
    setReadings([]);
    setFps(0);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!modelsLoaded) {
      setError("Models are still loading, please wait a moment.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 720, height: 540, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      detectLoop();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permission and try again."
          : e?.name === "NotFoundError"
          ? "No webcam found on this device."
          : "Could not access webcam. Please check your device.";
      setError(msg);
      setRunning(false);
    }
  }, [modelsLoaded]);

  // Main detection loop — throttled to ~15 FPS for performance
  const detectLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const now = performance.now();
    const elapsed = now - lastDetectRef.current;
    const minInterval = 1000 / 15; // cap at 15 FPS for smooth UX

    if (elapsed >= minInterval && video.readyState === 4) {
      lastDetectRef.current = now;
      const dispW = video.clientWidth;
      const dispH = video.clientHeight;
      if (canvas.width !== dispW || canvas.height !== dispH) {
        canvas.width = dispW;
        canvas.height = dispH;
      }

      try {
        const detections = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
          )
          .withFaceExpressions();

        const resized = faceapi.resizeResults(detections, { width: dispW, height: dispH });
        drawOverlay(canvas, resized);

        // Update side panel readings
        const newReadings: Reading[] = resized.map((d) => {
          const sorted = (Object.entries(d.expressions) as [string, number][]).sort(
            (a, b) => b[1] - a[1]
          );
          const [key, conf] = sorted[0];
          const meta = EMOTION_META[key] ?? {
            label: key,
            color: "hsl(var(--muted-foreground))",
          };
          return { label: meta.label, confidence: conf, color: meta.color };
        });
        setReadings(newReadings);
        setFps(Math.round(1000 / Math.max(elapsed, 1)));
      } catch (e) {
        console.error("Detection error", e);
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, []);

  // Draw bounding boxes + labels on the overlay canvas
  const drawOverlay = (
    canvas: HTMLCanvasElement,
    detections: faceapi.WithFaceExpressions<{
      detection: faceapi.FaceDetection;
    }>[]
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((d) => {
      const { x, y, width, height } = d.detection.box;
      const sorted = (Object.entries(d.expressions) as [string, number][]).sort(
        (a, b) => b[1] - a[1]
      );
      const [topKey, topConf] = sorted[0];
      const meta = EMOTION_META[topKey] ?? { label: topKey, color: "#ffffff" };

      // Bounding box with neon glow
      ctx.lineWidth = 3;
      ctx.strokeStyle = meta.color;
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 16;
      roundRect(ctx, x, y, width, height, 14);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label pill
      const label = `${meta.label}  ${(topConf * 100).toFixed(0)}%`;
      ctx.font = "600 16px Inter, system-ui, sans-serif";
      const padX = 12;
      const padY = 6;
      const textW = ctx.measureText(label).width;
      const pillW = textW + padX * 2;
      const pillH = 28;
      const pillX = x;
      const pillY = Math.max(0, y - pillH - 8);

      ctx.fillStyle = meta.color;
      roundRect(ctx, pillX, pillY, pillW, pillH, 8);
      ctx.fill();

      ctx.fillStyle = "#0a0a14";
      ctx.textBaseline = "middle";
      ctx.fillText(label, pillX + padX, pillY + pillH / 2 + 1);
    });
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[1fr_320px]">
      {/* Video stage */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-3 shadow-card">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted/40">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Idle / loading state */}
          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 backdrop-blur-sm">
              {!modelsLoaded ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading AI models…</p>
                </>
              ) : (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-pulse-ring">
                    <Camera className="h-9 w-9 text-primary-foreground" />
                  </div>
                  <p className="max-w-xs text-center text-sm text-muted-foreground">
                    Click <span className="font-semibold text-foreground">Start Camera</span> to
                    begin real-time emotion detection.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Live indicator */}
          {running && (
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="text-xs font-semibold tracking-wide">LIVE</span>
              <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" /> {fps} FPS
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-sm text-muted-foreground">
            {running
              ? `Detecting ${readings.length} face${readings.length === 1 ? "" : "s"}`
              : modelsLoaded
              ? "Ready when you are."
              : "Preparing models…"}
          </div>
          {!running ? (
            <Button
              onClick={startCamera}
              disabled={!modelsLoaded}
              size="lg"
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} size="lg" variant="destructive">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Readings panel */}
      <Card className="border-border/60 bg-gradient-card p-5 shadow-card">
        <h2 className="mb-1 text-lg font-semibold">Live Readings</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Top emotion + confidence per detected face.
        </p>

        {readings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            No faces detected yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {readings.map((r, i) => (
              <li
                key={i}
                className="rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Face #{i + 1}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: r.color, color: "#0a0a14" }}
                  >
                    {r.label}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(r.confidence * 100).toFixed(0)}%`,
                      backgroundColor: r.color,
                      boxShadow: `0 0 12px ${r.color}`,
                    }}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {(r.confidence * 100).toFixed(1)}% confidence
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-border/60 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recognized emotions
          </h3>
          <div className="flex flex-wrap gap-2">
            {["happy", "sad", "angry", "surprised", "neutral"].map((k) => (
              <span
                key={k}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: EMOTION_META[k].color }}
                />
                {EMOTION_META[k].label}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmotionDetector;
