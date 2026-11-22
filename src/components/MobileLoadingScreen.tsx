"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, HeartPulse, ShieldCheck, Wallet } from "lucide-react";
import { APPLE_SPRING, SMOOTH_EASE } from "./MotionPrimitives";

export function MobileLoadingScreen({
  mode = "route",
  onDismiss,
}: {
  mode?: "splash" | "route";
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading GrassRoot Kitchen"
      className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#080F0D] px-5 text-white select-none"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Ambient Emerald & Warm Terracotta Bokeh Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#0D6E52]/35 blur-[85px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-[#EA580C]/25 blur-[95px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[#10B981]/20 blur-[85px]"
      />

      {/* Top Row: Halal & Condo Pool Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/8 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-xl">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
          <span>100% Halal · Pooled Condo Kits</span>
        </div>
        <span className="rounded-full border border-white/15 bg-white/6 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white/75 uppercase backdrop-blur-md">
          Bandar Sunway
        </span>
      </div>

      {/* Center Hero: Animated Glass Brand Emblem + Value Prop Pills */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center">
        {/* Pulsing Specular Rings around Logo */}
        <div className="relative flex items-center justify-center">
          <motion.span
            aria-hidden="true"
            animate={{
              scale: [1, 1.24, 1],
              opacity: [0.35, 0.08, 0.35],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              pointer-events-none absolute h-28 w-28 rounded-[34px]
              border border-emerald-400/35 bg-emerald-500/10
            "
          />
          <motion.span
            aria-hidden="true"
            animate={{
              scale: [1, 1.42, 1],
              opacity: [0.2, 0.02, 0.2],
            }}
            transition={{
              duration: 2.2,
              delay: 0.25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              pointer-events-none absolute h-32 w-32 rounded-[40px]
              border border-orange-400/25
            "
          />

          <motion.div
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={APPLE_SPRING}
            className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/40 bg-white p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.9)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/logo-mark.png"
              alt="GrassRoot"
              className="h-full w-full object-contain"
            />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: SMOOTH_EASE }}
          className="font-display mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          GrassRoot
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: SMOOTH_EASE }}
          className="mt-1 max-w-[270px] text-xs leading-relaxed text-white/75 sm:max-w-xs sm:text-sm"
        >
          Cook fresh in 15 mins · Pooled Sunday condo boxes from RM 10.50/meal
        </motion.p>

        {/* Animated Liquid Glass Shimmer Progress Bar */}
        <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full border border-white/15 bg-white/10 p-0.5 backdrop-blur-md">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 via-[#FB923C] to-emerald-400"
          />
        </div>

        {/* 3 Pitch-Deck Value Pills (Time Saved, Money Saved, Health Benefit) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.14, ease: SMOOTH_EASE }}
          className="mt-6 grid w-full max-w-sm grid-cols-3 gap-2"
        >
          <div className="rounded-2xl border border-white/16 bg-white/[0.07] p-2.5 text-center backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Time</span>
            </div>
            <div className="mt-1 text-xs font-bold text-white tabular-nums">
              Save 35m
            </div>
            <div className="mt-0.5 text-[10px] text-white/60">15m fresh cook</div>
          </div>

          <div className="rounded-2xl border border-white/16 bg-white/[0.07] p-2.5 text-center backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              <Wallet className="h-3 w-3 shrink-0" />
              <span>Money</span>
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-300 tabular-nums">
              Save 45%
            </div>
            <div className="mt-0.5 text-[10px] text-white/60">vs GrabFood</div>
          </div>

          <div className="rounded-2xl border border-white/16 bg-white/[0.07] p-2.5 text-center backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
              <HeartPulse className="h-3 w-3 shrink-0" />
              <span>Health</span>
            </div>
            <div className="mt-1 text-xs font-bold text-white tabular-nums">
              35–42g
            </div>
            <div className="mt-0.5 text-[10px] text-white/60">Lean protein</div>
          </div>
        </motion.div>

        {/* Preview Skeleton Strip (Mobile Card Shimmer) */}
        {mode === "route" && (
          <div
            aria-hidden="true"
            className="mt-5 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.05] p-3 backdrop-blur-lg"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-white/15" />
            <div className="min-w-0 flex-1 space-y-2 text-left">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/20" />
              <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-white/12" />
            </div>
            <div className="h-7 w-14 shrink-0 animate-pulse rounded-full bg-emerald-400/25" />
          </div>
        )}
      </div>

      {/* Bottom Status Footer */}
      <div className="relative z-10 flex flex-col items-center gap-1 text-center">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="mb-1 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md transition active:scale-95"
          >
            Enter Kitchen →
          </button>
        )}
        <p className="text-[11px] font-medium text-white/55">
          Syncing live condo pool &amp; Sunday menu…
        </p>
      </div>
    </div>
  );
}

export function InitialMobileSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 950);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="grassroot-mobile-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.28, ease: SMOOTH_EASE }}
          className="fixed inset-0 z-[100]"
        >
          <MobileLoadingScreen
            mode="splash"
            onDismiss={() => setVisible(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
