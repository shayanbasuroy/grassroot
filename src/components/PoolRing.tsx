"use client";

import { motion } from "framer-motion";
import { PopNumber, SMOOTH_EASE } from "./MotionPrimitives";

export function PoolRing({
  joined,
  target,
  size = 76,
  strokeWidth = 7,
}: {
  joined: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, joined / Math.max(1, target)));
  const dashOffset = circumference * (1 - pct);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${joined} of ${target} boxes joined`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-hairline)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--status-pool)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.85, ease: SMOOTH_EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <PopNumber
          value={joined}
          className="text-sm font-bold text-[var(--ink-primary)]"
        />
        <span className="text-[10px] font-medium text-[var(--ink-secondary)] tabular-nums">
          / {target}
        </span>
      </div>
    </div>
  );
}
