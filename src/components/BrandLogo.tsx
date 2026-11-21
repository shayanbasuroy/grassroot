"use client";

import { motion } from "framer-motion";
import { SNAPPY_SPRING } from "./MotionPrimitives";

export interface BrandLogoProps {
  variant?: "lockup" | "mark" | "full";
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
  className?: string;
}

const MARK_SIZE_CLASSES: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-8 w-8 rounded-[10px] p-0.5",
  md: "h-9 w-9 rounded-[12px] p-1",
  lg: "h-12 w-12 rounded-[15px] p-1",
};

const WORDMARK_SIZE_CLASSES: Record<NonNullable<BrandLogoProps["size"]>, string> =
  {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

const FULL_HEIGHT_CLASSES: Record<NonNullable<BrandLogoProps["size"]>, string> =
  {
    sm: "h-10",
    md: "h-14",
    lg: "h-20",
  };

export function BrandLogo({
  variant = "lockup",
  size = "sm",
  inverted = false,
  className = "",
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={SNAPPY_SPRING}
        className={`inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 shadow-2xs ring-1 ring-black/6 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/brand/logo-full.png"
          alt="GrassRoot"
          className={`w-auto object-contain ${FULL_HEIGHT_CLASSES[size]}`}
        />
      </motion.div>
    );
  }

  const markNode = (
    <motion.span
      whileHover={{ scale: 1.05, rotate: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={SNAPPY_SPRING}
      className={`inline-flex shrink-0 items-center justify-center bg-white shadow-2xs ring-1 ring-black/8 ${MARK_SIZE_CLASSES[size]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/logo-mark.png"
        alt={variant === "mark" ? "GrassRoot" : ""}
        aria-hidden={variant === "mark" ? undefined : true}
        className="h-full w-full object-contain"
      />
    </motion.span>
  );

  if (variant === "mark") {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        {markNode}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 select-none ${className}`}
    >
      {markNode}
      <span
        className={`font-display font-bold tracking-tight ${WORDMARK_SIZE_CLASSES[size]} ${
          inverted ? "text-white" : "text-[var(--ink-primary)]"
        }`}
      >
        GrassRoot
      </span>
    </span>
  );
}
