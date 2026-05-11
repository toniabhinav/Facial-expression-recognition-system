import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  className?: string;
};

export const MetricCard = ({ title, value, detail, icon: Icon, className }: MetricCardProps) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 260, damping: 24 }}
    className={cn(
      "glass-panel rounded-lg p-4 shadow-card",
      "border border-white/10 bg-card/58 backdrop-blur-xl",
      className
    )}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-primary">
        <Icon className="h-4 w-4" />
      </span>
    </div>
    <div className="text-2xl font-semibold tracking-tight">{value}</div>
    <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
  </motion.div>
);
