import { Mic, MicOff, RadioTower, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getEmotionMeta, type EmotionReading } from "@/utils/emotion";

type VoiceEmotionPanelProps = {
  running: boolean;
  error: string | null;
  waveform: number[];
  reading: EmotionReading | null;
  transcript: string;
  summary: string;
  speechSupported: boolean;
  onStart: () => void;
  onStop: () => void;
};

export const VoiceEmotionPanel = ({
  running,
  error,
  waveform,
  reading,
  transcript,
  summary,
  speechSupported,
  onStart,
  onStop,
}: VoiceEmotionPanelProps) => {
  const meta = getEmotionMeta(reading?.emotion ?? "neutral");

  return (
    <section className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Voice AI</p>
          <h2 className="mt-1 text-xl font-semibold">Speech emotion analysis</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tone, energy, transcript hints, and audio waveform fusion.</p>
        </div>
        {running ? (
          <Button onClick={onStop} variant="destructive" className="rounded-md">
            <MicOff className="mr-2 h-4 w-4" />
            Stop Voice
          </Button>
        ) : (
          <Button onClick={onStart} className="rounded-md bg-gradient-primary text-primary-foreground">
            <Mic className="mr-2 h-4 w-4" />
            Start Voice
          </Button>
        )}
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-background/35 p-4">
        <div className="flex h-24 items-end gap-1">
          {waveform.map((value, index) => (
            <motion.span
              key={index}
              className="flex-1 rounded-full"
              animate={{ height: `${Math.max(8, Math.min(92, value * 92))}%` }}
              transition={{ duration: 0.18 }}
              style={{ background: `linear-gradient(180deg, ${meta.color}, hsl(var(--theme-b) / 0.45))` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RadioTower className="h-4 w-4 text-primary" />
            Vocal State
          </div>
          <p className="mt-3 text-2xl font-semibold">{reading?.label ?? "Neutral"}</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((reading?.confidence ?? 0.5) * 100)}%`,
                backgroundColor: meta.color,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.round((reading?.confidence ?? 0.5) * 100)}% confidence
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Summary
          </div>
          <p className="mt-3 text-sm leading-6">{summary}</p>
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
            {transcript || (speechSupported ? "Transcript will appear when speech is detected." : "Speech recognition is unavailable; waveform analysis remains active.")}
          </p>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</p>}
    </section>
  );
};
