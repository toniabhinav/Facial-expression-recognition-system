import { useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { AnalyticsDashboard } from "@/analytics/AnalyticsDashboard";
import { EmotionCamera } from "@/components/EmotionCamera";
import { MetricCard } from "@/components/MetricCard";
import { useEmotionHistory } from "@/hooks/useEmotionHistory";
import { useFaceEmotionDetection } from "@/hooks/useFaceEmotionDetection";
import { ProductivityPanel } from "@/productivity/ProductivityPanel";
import { AdaptiveTheme } from "@/themes/AdaptiveTheme";
import { getEmotionTheme } from "@/themes/emotionThemes";
import { getEmotionMeta, type Emotion, type EmotionReading } from "@/utils/emotion";
import { useVoiceEmotion } from "@/voice/useVoiceEmotion";
import { VoiceEmotionPanel } from "@/voice/VoiceEmotionPanel";

const mergeReadings = (
  faceReading: EmotionReading | null,
  voiceReading: EmotionReading | null
): EmotionReading | null => {
  if (!faceReading && !voiceReading) return null;
  if (faceReading && !voiceReading) return faceReading;
  if (!faceReading && voiceReading) return voiceReading;

  const face = faceReading as EmotionReading;
  const voice = voiceReading as EmotionReading;
  const voicePriority = ["stressed", "excited", "angry"].includes(voice.emotion);
  const emotion = voicePriority && voice.confidence > 0.62 ? voice.emotion : face.emotion;
  const confidence = Math.min(
    0.98,
    face.confidence * 0.58 + voice.confidence * 0.42 + (face.emotion === voice.emotion ? 0.08 : 0)
  );
  const meta = getEmotionMeta(emotion);

  return {
    emotion,
    label: meta.label,
    confidence,
    color: meta.color,
  };
};

const Index = () => {
  const { samples, analytics, addSample, clearHistory, exportReport } = useEmotionHistory();
  const lastFusionRef = useRef(0);

  const addFaceSample = useCallback(
    (emotion: Emotion, confidence: number) => addSample("face", emotion, confidence),
    [addSample]
  );
  const addVoiceSample = useCallback(
    (emotion: Emotion, confidence: number) => addSample("voice", emotion, confidence),
    [addSample]
  );

  const face = useFaceEmotionDetection({ onSample: addFaceSample });
  const voice = useVoiceEmotion(addVoiceSample);
  const faceReading = face.readings[0] ?? null;

  const fusedReading = useMemo(() => mergeReadings(faceReading, voice.reading), [faceReading, voice.reading]);
  const activeEmotion = fusedReading?.emotion ?? face.activeEmotion ?? voice.reading?.emotion ?? null;
  const theme = getEmotionTheme(activeEmotion);

  useEffect(() => {
    if (!fusedReading) return;
    const now = performance.now();
    if (now - lastFusionRef.current < 4500) return;
    lastFusionRef.current = now;
    addSample("fusion", fusedReading.emotion, fusedReading.confidence);
  }, [addSample, fusedReading]);

  return (
    <main className="min-h-screen w-full overflow-hidden px-4 py-6 md:px-8">
      <AdaptiveTheme emotion={activeEmotion} />
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI wellness cockpit - private browser inference
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
              <span className="text-gradient">EmotionOS</span> for focus, mood, and deep work
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Real-time face and voice emotion intelligence with adaptive themes, analytics, and productivity coaching.
            </p>
          </div>
          <motion.div
            className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current Theme</p>
            <p className="mt-1 text-lg font-semibold">{theme.name}</p>
            <p className="text-sm text-muted-foreground">
              {getEmotionMeta(activeEmotion ?? "neutral").label} driven interface
            </p>
          </motion.div>
        </header>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Fusion State"
            value={fusedReading?.label ?? "Idle"}
            detail={`${Math.round((fusedReading?.confidence ?? 0.72) * 100)}% multimodal confidence`}
            icon={BrainCircuit}
          />
          <MetricCard title="Privacy" value="Local" detail="Camera and mic inference stay in-browser" icon={ShieldCheck} />
          <MetricCard
            title="Mode"
            value={activeEmotion ? getEmotionMeta(activeEmotion).label : "Neutral"}
            detail="Themes and focus logic adapt live"
            icon={Zap}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <EmotionCamera
            videoRef={face.videoRef}
            canvasRef={face.canvasRef}
            modelsLoaded={face.modelsLoaded}
            running={face.running}
            error={face.error}
            fps={face.fps}
            readings={face.readings}
            activeEmotion={activeEmotion}
            onStart={face.startCamera}
            onStop={face.stopCamera}
          />
          <div className="space-y-5">
            <VoiceEmotionPanel
              running={voice.running}
              error={voice.error}
              waveform={voice.waveform}
              reading={voice.reading}
              transcript={voice.transcript}
              summary={voice.summary}
              speechSupported={voice.speechSupported}
              onStart={voice.start}
              onStop={voice.stop}
            />
            <ProductivityPanel activeEmotion={activeEmotion} samples={samples} />
          </div>
        </div>

        <div className="mt-7">
          <AnalyticsDashboard analytics={analytics} samples={samples} onExport={exportReport} onClear={clearHistory} />
        </div>
      </div>
    </main>
  );
};

export default Index;
