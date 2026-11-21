"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const APPLE_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export const SNAPPY_SPRING = {
  type: "spring" as const,
  stiffness: 460,
  damping: 26,
};

export const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: SMOOTH_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.045,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: SMOOTH_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PopNumber({
  value,
  className = "",
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <motion.span
      key={String(value)}
      initial={{ scale: 0.82, opacity: 0.65 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={SNAPPY_SPRING}
      className={`inline-block tabular-nums ${className}`}
    >
      {value}
    </motion.span>
  );
}
