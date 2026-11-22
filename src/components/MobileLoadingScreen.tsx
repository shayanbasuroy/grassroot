"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
      aria-label="Loading GrassRoot"
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#0A0F0E] px-5 text-white select-none"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Warm Natural Food Photography Bokeh Backdrop (Exact Same Optical Refractive Aesthetic as the Recipe Card) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0A0F0E]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/recipes/hainanese-rice-cooker.jpg"
          alt=""
          className="h-full w-full scale-125 object-cover blur-[56px] brightness-[0.52] saturate-[1.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/65" />
      </div>

      {/* Top Bar: Minimal Frosted Glass Pills */}
      <div className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between">
        <span className="glass-photo-pill rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/95">
          GrassRoot
        </span>
        <span className="glass-btn-emerald rounded-full px-3.5 py-1.5 text-xs font-semibold text-white">
          100% Halal
        </span>
      </div>

      {/* Center Frosted Liquid Glass Loading Card */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={APPLE_SPRING}
          className="glass-photo-panel rounded-[32px] p-6 sm:p-7"
        >
          {/* Brand Emblem in Frosted Circle + Clean Editorial Heading */}
          <div className="flex items-center gap-4">
            <div className="glass-photo-circle flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/brand/logo-mark.png"
                alt="GrassRoot"
                className="h-full w-full rounded-xl bg-white object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Pooled Condo Meal Kits
              </p>
              <h1 className="font-display mt-0.5 text-2xl font-bold tracking-tight text-white">
                {mode === "splash" ? "Preparing Kitchen" : "Loading Menu"}
              </h1>
            </div>
          </div>

          {/* 3 Frosted Glass Tiles (Matching the exact Prep / Cook / Tool Glass Tile Aesthetic) */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <div className="glass-photo-tile rounded-[20px] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Cook Time
              </div>
              <div className="mt-1 text-sm font-bold text-white tabular-nums">
                15 min
              </div>
            </div>

            <div className="glass-photo-tile rounded-[20px] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Per Meal
              </div>
              <div className="mt-1 text-sm font-bold text-white tabular-nums">
                RM 10.50
              </div>
            </div>

            <div className="glass-photo-tile rounded-[20px] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Delivery
              </div>
              <div className="mt-1 text-sm font-bold text-white tabular-nums">
                RM 0
              </div>
            </div>
          </div>

          {/* Translucent Glass Track Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-medium text-white/80">
              <span>Syncing Sunday condo pool…</span>
              <span className="font-semibold text-white/95 tabular-nums">
                Bandar Sunway
              </span>
            </div>

            <div className="glass-photo-track mt-2.5 h-2.5 w-full overflow-hidden rounded-full p-0.5">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.25,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="glass-capsule-active h-full w-1/2 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Frosted Glass Pill Dock */}
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="glass-photo-dock flex items-center justify-between rounded-full px-4 py-2.5">
          <div className="flex items-center gap-2.5 text-xs font-medium text-white/85">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>Fresh pre-portioned Halal kits</span>
          </div>
          <span className="text-xs font-semibold text-white/90">
            Save 45% vs GrabFood
          </span>
        </div>
      </div>
    </div>
  );
}

export function InitialMobileSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="grassroot-mobile-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: SMOOTH_EASE }}
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
