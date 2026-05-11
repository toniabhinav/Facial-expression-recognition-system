import EmotionDetector from "@/components/EmotionDetector";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <main className="min-h-screen w-full px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Real-time AI · Runs in your browser
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            <span className="text-gradient">Emotion</span> Detection
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-sm text-muted-foreground md:text-base">
            Live face detection and emotion classification powered by TensorFlow.js.
            No data leaves your device.
          </p>
        </header>

        <EmotionDetector />

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Models: TinyFaceDetector + FaceExpressionNet · Inference runs locally via WebGL.
        </footer>
      </div>
    </main>
  );
};

export default Index;
