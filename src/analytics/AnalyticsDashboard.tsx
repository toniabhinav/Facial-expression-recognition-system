import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, History, Percent, PieChart, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import {
  TRACKED_EMOTIONS,
  formatDuration,
  getEmotionMeta,
  type AnalyticsSnapshot,
  type EmotionSample,
} from "@/utils/emotion";

type AnalyticsDashboardProps = {
  analytics: AnalyticsSnapshot;
  samples: EmotionSample[];
  onExport: () => void;
  onClear: () => void;
};

const chartTheme = {
  grid: "hsl(var(--border) / 0.55)",
  text: "hsl(var(--muted-foreground))",
};

export const AnalyticsDashboard = ({
  analytics,
  samples,
  onExport,
  onClear,
}: AnalyticsDashboardProps) => {
  const frequencyData = TRACKED_EMOTIONS.map((emotion) => ({
    emotion,
    label: getEmotionMeta(emotion).label,
    count: analytics.frequency[emotion],
    percent: analytics.percentages[emotion],
    color: getEmotionMeta(emotion).color,
  })).filter((item) => item.count > 0 || ["happy", "neutral", "stressed", "excited"].includes(item.emotion));

  const confidenceTimeline = analytics.timeline.map((item, index) => ({
    index: index + 1,
    time: item.time,
    confidence: item.confidence,
    emotion: getEmotionMeta(item.emotion).label,
  }));

  const most = analytics.mostDetectedEmotion ? getEmotionMeta(analytics.mostDetectedEmotion).label : "None yet";
  const averageConfidence =
    samples.length > 0
      ? Math.round((samples.reduce((total, sample) => total + sample.confidence, 0) / samples.length) * 100)
      : 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Emotion Analytics</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Daily mood intelligence</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport} variant="secondary" className="rounded-md">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={onClear} variant="outline" className="rounded-md border-white/10 bg-white/[0.03]">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Session"
          value={formatDuration(analytics.sessionDurationSeconds)}
          detail="Deep work telemetry"
          icon={Timer}
        />
        <MetricCard title="Samples" value={`${analytics.totalSamples}`} detail="Face, voice, and fused readings" icon={History} />
        <MetricCard title="Dominant Mood" value={most} detail="Most detected signal today" icon={PieChart} />
        <MetricCard title="Avg Confidence" value={`${averageConfidence}%`} detail="Rolling model certainty" icon={Percent} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Emotion Frequency</h3>
              <p className="text-sm text-muted-foreground">Percent distribution across this session.</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" stroke={chartTheme.text} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={chartTheme.text} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.25)" }}
                  contentStyle={{
                    background: "hsl(var(--card) / 0.92)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                  {frequencyData.map((entry) => (
                    <Cell key={entry.emotion} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl">
          <h3 className="font-semibold">Weekly Emotional Trend</h3>
          <p className="text-sm text-muted-foreground">Positive, neutral, and strained signals by day.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trend.length > 0 ? analytics.trend : [{ label: "Now", positive: 0, neutral: 0, strained: 0 }]}>
                <defs>
                  <linearGradient id="positive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="strained" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" stroke={chartTheme.text} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={chartTheme.text} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card) / 0.92)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area type="monotone" dataKey="positive" stackId="1" stroke="hsl(var(--accent))" fill="url(#positive)" />
                <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.16)" />
                <Area type="monotone" dataKey="strained" stackId="1" stroke="hsl(var(--destructive))" fill="url(#strained)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl">
          <h3 className="font-semibold">Confidence Timeline</h3>
          <p className="text-sm text-muted-foreground">Last 30 readings from all active sensors.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confidenceTimeline}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="index" stroke={chartTheme.text} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} stroke={chartTheme.text} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card) / 0.92)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="confidence" stroke="hsl(var(--theme-a))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-lg border border-white/10 bg-card/55 p-4 shadow-card backdrop-blur-xl">
          <h3 className="font-semibold">Timeline</h3>
          <p className="text-sm text-muted-foreground">Chronological emotional state visualization.</p>
          <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
            {analytics.timeline.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                Start camera or voice analysis to populate the timeline.
              </div>
            ) : (
              analytics.timeline
                .slice()
                .reverse()
                .map((item, index) => {
                  const meta = getEmotionMeta(item.emotion);
                  return (
                    <div key={`${item.time}-${index}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 14px ${meta.color}` }} />
                      <div>
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{item.time} - {item.source}</p>
                      </div>
                      <span className="text-sm font-semibold">{item.confidence}%</span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
