import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Coffee, Headphones, Pause, Play, RotateCcw, Sparkles, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { buildProductivityState } from "@/services/productivityEngine";
import { formatDuration, getEmotionMeta, type Emotion, type EmotionSample } from "@/utils/emotion";

type ProductivityPanelProps = {
  activeEmotion: Emotion | null;
  samples: EmotionSample[];
};

const DEFAULT_POMODORO_SECONDS = 25 * 60;

export const ProductivityPanel = ({ activeEmotion, samples }: ProductivityPanelProps) => {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_POMODORO_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [deepWorkSeconds, setDeepWorkSeconds] = useState(0);

  const productivity = useMemo(() => buildProductivityState(samples, activeEmotion), [activeEmotion, samples]);
  const emotionMeta = getEmotionMeta(activeEmotion ?? "neutral");
  const timerProgress = ((DEFAULT_POMODORO_SECONDS - secondsLeft) / DEFAULT_POMODORO_SECONDS) * 100;

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setTimerRunning(false);
          return DEFAULT_POMODORO_SECONDS;
        }
        return value - 1;
      });
      setDeepWorkSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (productivity.mode === "boost" || productivity.mode === "deep-work") {
      setTimerRunning((current) => current || productivity.focusScore > 76);
    }
  }, [productivity.focusScore, productivity.mode]);

  return (
    <section className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Productivity Mode</p>
          <h2 className="mt-1 text-xl font-semibold">AI focus assistant</h2>
          <p className="mt-1 text-sm text-muted-foreground">{productivity.summary}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
          <p className="text-muted-foreground">Active signal</p>
          <p className="font-semibold" style={{ color: emotionMeta.color }}>{emotionMeta.label}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-white/10 bg-background/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Focus Score</p>
              <p className="text-4xl font-semibold">{productivity.focusScore}</p>
            </div>
            <div className="relative grid h-28 w-28 place-items-center">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="hsl(var(--theme-a))"
                  strokeLinecap="round"
                  strokeWidth="10"
                  initial={false}
                  animate={{ pathLength: productivity.focusScore / 100 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ pathLength: productivity.focusScore / 100 }}
                />
              </svg>
              <Brain className="absolute h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
            {productivity.stateLabel}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-background/35 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Smart Pomodoro</p>
              <p className="text-3xl font-semibold tabular-nums">{formatDuration(secondsLeft)}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setTimerRunning((value) => !value)} className="rounded-md bg-gradient-primary text-primary-foreground">
                {timerRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {timerRunning ? "Pause" : "Start"}
              </Button>
              <Button
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(DEFAULT_POMODORO_SECONDS);
                }}
                variant="outline"
                className="rounded-md border-white/10 bg-white/[0.03]"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={timerProgress} className="mt-4 h-2" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatusTile icon={Sparkles} label="Mode" value={productivity.mode.replace("-", " ")} />
            <StatusTile icon={Coffee} label="Deep Work" value={formatDuration(deepWorkSeconds)} />
            <StatusTile icon={Wind} label="Break Cue" value={productivity.mode === "breathing" ? "Now" : "Queued"} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Recommendations
          </h3>
          <div className="space-y-2">
            {productivity.recommendations.map((recommendation) => (
              <p key={recommendation} className="rounded-md border border-white/10 bg-background/30 p-3 text-sm text-muted-foreground">
                {recommendation}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Headphones className="h-4 w-4 text-primary" />
            Focus Music
          </h3>
          <div className="space-y-2">
            {productivity.music.map((track) => (
              <div key={track.title} className="rounded-md border border-white/10 bg-background/30 p-3">
                <p className="text-sm font-medium">{track.title}</p>
                <p className="text-xs text-muted-foreground">{track.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

type StatusTileProps = {
  icon: typeof Brain;
  label: string;
  value: string;
};

const StatusTile = ({ icon: Icon, label, value }: StatusTileProps) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
    <Icon className="mb-2 h-4 w-4 text-primary" />
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="truncate text-sm font-semibold capitalize">{value}</p>
  </div>
);
