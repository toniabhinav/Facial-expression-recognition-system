import { motion } from "framer-motion";
import { Activity, AlertCircle, Camera, CameraOff, Loader2, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmotionMeta, type Emotion, type EmotionReading } from "@/utils/emotion";

type EmotionCameraProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  modelsLoaded: boolean;
  running: boolean;
  error: string | null;
  fps: number;
  readings: EmotionReading[];
  activeEmotion: Emotion | null;
  onStart: () => void;
  onStop: () => void;
};

export const EmotionCamera = ({
  videoRef,
  canvasRef,
  modelsLoaded,
  running,
  error,
  fps,
  readings,
  activeEmotion,
  onStart,
  onStop,
}: EmotionCameraProps) => {
  const meta = getEmotionMeta(activeEmotion ?? "neutral");

  return (
    <section className="glass-panel relative overflow-hidden rounded-lg border border-white/10 bg-card/55 p-3 shadow-card backdrop-blur-xl">
      <div
        className="absolute inset-x-8 top-0 h-px opacity-80"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--theme-a)), transparent)" }}
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-muted/35">
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

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg"
          animate={{
            boxShadow: running
              ? `inset 0 0 0 1px ${meta.color}, 0 0 48px hsl(var(--theme-a) / 0.34)`
              : "inset 0 0 0 1px hsl(var(--border))",
          }}
          transition={{ duration: 0.6 }}
        />

        {!modelsLoaded && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 p-6 backdrop-blur-md">
            <div className="w-full max-w-sm space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading face expression models
              </div>
              <Skeleton className="h-3 w-full bg-white/10" />
              <Skeleton className="h-3 w-3/4 bg-white/10" />
            </div>
          </div>
        )}

        {modelsLoaded && !running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 p-6 text-center backdrop-blur-md">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <ScanFace className="h-9 w-9 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium">Camera AI is ready</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Start the webcam to stream face emotion analytics locally in your browser.
              </p>
            </div>
          </div>
        )}

        {running && (
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-background/65 px-3 py-2 text-xs font-semibold backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            LIVE
            <span className="flex items-center gap-1 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {fps} FPS
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-medium">
            {running ? `${readings.length || 0} detected face${readings.length === 1 ? "" : "s"}` : "Face stream idle"}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeEmotion ? `Theme and productivity logic are synced to ${meta.label}.` : "Inference is throttled for smooth webcam rendering."}
          </p>
        </div>
        {running ? (
          <Button onClick={onStop} variant="destructive" className="rounded-md">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Camera
          </Button>
        ) : (
          <Button onClick={onStart} disabled={!modelsLoaded} className="rounded-md bg-gradient-primary text-primary-foreground shadow-glow">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        )}
      </div>

      {readings.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {readings.slice(0, 2).map((reading, index) => (
            <div key={`${reading.emotion}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Face #{index + 1}</span>
                <span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ backgroundColor: reading.color, color: "#070711" }}>
                  {reading.label}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(reading.confidence * 100)}%`, backgroundColor: reading.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
};
