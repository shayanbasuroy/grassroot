"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Clock, Flame } from "lucide-react";
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
      className="fixed inset-0 z-[100] min-h-[100dvh] w-full overflow-hidden bg-[#080D0F] text-white select-none"
    >
      {/* Full-Bleed Blurred Dish Backdrop (Identical to Recipe Card View) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#080D0F]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/recipes/hainanese-rice-cooker.jpg"
          alt=""
          className="h-full w-full scale-115 object-cover blur-[44px] brightness-[0.44] saturate-[1.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/55" />
      </div>

      {/* Centered Recipe Card Layout */}
      <div className="relative z-10 mx-auto w-full max-w-2xl overflow-x-clip pb-28 md:pt-5">
        {/* Seamless Full-Bleed Top Hero Photo */}
        <div className="relative">
          <div className="relative h-[320px] w-full overflow-hidden sm:h-[390px] md:rounded-t-[32px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/recipes/hainanese-rice-cooker.jpg"
              alt="One Pot Hainanese Chicken Rice"
              className="hero-photo-fade h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

            {/* Floating Circular Frosted Controls (Top Left Brand Mark + Top Right Pill) */}
            <div
              className="absolute inset-x-4 top-4 z-20 flex items-center justify-between"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              <div className="glass-photo-circle flex h-11 w-11 items-center justify-center rounded-full p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/brand/logo-mark.png"
                  alt="GrassRoot"
                  className="h-full w-full rounded-full bg-white object-contain p-0.5"
                />
              </div>

              <span className="glass-photo-pill rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/95">
                {mode === "splash" ? "GrassRoot Kitchen" : "Loading recipe…"}
              </span>
            </div>
          </div>

          {/* Hero Badges & Dish Title Dissolving Above Stat Tiles */}
          <div className="relative z-10 -mt-28 px-4 pb-2 text-white sm:-mt-32 sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="glass-photo-pill rounded-full px-3 py-1">
                RM 10.50–13 / Meal
              </span>
              <span className="glass-btn-emerald rounded-full px-3 py-1 text-white">
                100% Halal
              </span>
            </div>
            <h1 className="font-display mt-2.5 text-[26px] font-bold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-[31px]">
              One Pot Hainanese Chicken Rice
            </h1>
            <p className="mt-1 text-[13px] leading-snug text-white/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] sm:text-sm">
              Fragrant pandan ginger rice and silky poached chicken made completely in your rice cooker.
            </p>
          </div>
        </div>

        {/* Frosted Liquid Glass Body Stack (Matching the Recipe Card Screenshot) */}
        <div className="space-y-3.5 px-4 pt-3 sm:px-5 sm:pt-4">
          {/* 3 Frosted Glass Stat Tiles (Prep, Cook, Tool) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="glass-photo-tile min-w-0 rounded-[20px] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                <Clock className="h-3.5 w-3.5 shrink-0 text-white/85" strokeWidth={1.75} />
                Prep
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-white tabular-nums sm:text-base">
                5 min
              </div>
            </div>

            <div className="glass-photo-tile min-w-0 rounded-[20px] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                <Flame className="h-3.5 w-3.5 shrink-0 text-[#E49469]" strokeWidth={1.75} />
                Cook
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-white tabular-nums sm:text-base">
                22 min
              </div>
            </div>

            <div className="glass-photo-tile min-w-0 rounded-[20px] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                <ChefHat className="h-3.5 w-3.5 shrink-0 text-[#82C9AF]" strokeWidth={1.75} />
                Tool
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-white sm:text-base">
                Rice Cooker
              </div>
            </div>
          </div>

          {/* Frosted Glass Ingredients Slab with Soft Shimmer */}
          <div className="glass-photo-panel rounded-[28px] p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Ingredients
                </h2>
                <p className="text-xs text-white/75">
                  560 kcal · 35g protein · Save 35m &amp; RM 10 vs GrabFood
                </p>
              </div>
              <div className="glass-photo-track inline-flex items-center rounded-full p-1 text-xs font-semibold">
                <span className="glass-capsule-active rounded-full px-3 py-1 text-[#0F172A]">
                  1 pax
                </span>
                <span className="px-2.5 py-1 text-white/75">2 pax</span>
                <span className="px-2.5 py-1 text-white/75">4 pax</span>
              </div>
            </div>

            <div className="mt-3.5 divide-y divide-white/12 text-sm">
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full border-[1.5px] border-white/65 bg-white/5" />
                  <span className="font-medium text-white/95">
                    Halal Boneless Chicken Thigh
                  </span>
                </div>
                <span className="font-semibold text-white tabular-nums">180 g</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full border-[1.5px] border-white/65 bg-white/5" />
                  <span className="font-medium text-white/95">
                    Jasmine Fragrant Rice
                  </span>
                </div>
                <span className="font-semibold text-white tabular-nums">140 g</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full border-[1.5px] border-white/65 bg-white/5" />
                  <span className="font-medium text-white/95">
                    Crushed Ginger, Garlic &amp; Pandan Leaf
                  </span>
                </div>
                <span className="font-semibold text-white tabular-nums">20 g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Floating Liquid Glass Bottom Dock */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={APPLE_SPRING}
          className="fixed inset-x-4 z-30 md:bottom-5"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="glass-photo-dock mx-auto flex max-w-2xl items-center gap-2.5 rounded-[28px] p-2">
            <div className="glass-btn-secondary flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold sm:text-sm">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
              <span>Opening Kitchen…</span>
            </div>
            <div className="glass-btn-emerald flex min-w-0 flex-[1.2] items-center justify-center rounded-full px-4 py-3 text-xs font-bold text-white sm:text-sm">
              Sunday Condo Pool · RM 0
            </div>
          </div>
        </motion.div>
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
