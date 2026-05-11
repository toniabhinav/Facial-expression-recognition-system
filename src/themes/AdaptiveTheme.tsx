import { useEffect } from "react";
import { motion } from "framer-motion";
import { getEmotionTheme } from "@/themes/emotionThemes";
import type { Emotion } from "@/utils/emotion";

type AdaptiveThemeProps = {
  emotion: Emotion | null;
};

export const AdaptiveTheme = ({ emotion }: AdaptiveThemeProps) => {
  const theme = getEmotionTheme(emotion);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, value]) => root.style.setProperty(key, value));
    root.style.setProperty("--gradient-primary", "linear-gradient(135deg, hsl(var(--theme-a)), hsl(var(--theme-b)))");
    root.style.setProperty(
      "--gradient-card",
      "linear-gradient(160deg, hsl(240 16% 11% / 0.78), hsl(240 18% 7% / 0.82))"
    );
    root.style.setProperty("--shadow-glow", "0 0 64px -14px hsl(var(--theme-a) / 0.62)");
    root.style.setProperty("--shadow-neon", "0 0 24px hsl(var(--theme-a) / 0.45)");
  }, [theme]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        key={theme.name}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{ backgroundImage: theme.aura }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "conic-gradient(from 120deg, hsl(var(--theme-a)), hsl(var(--theme-b)), hsl(var(--theme-c)), hsl(var(--theme-a)))" }}
      />
      <div className="particles-layer">
        {Array.from({ length: 22 }).map((_, index) => (
          <span
            key={index}
            className="particle"
            style={{
              left: `${(index * 37) % 100}%`,
              animationDelay: `${(index % 7) * 0.75}s`,
              animationDuration: `${8 + (index % 6)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
