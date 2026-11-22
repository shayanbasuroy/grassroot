"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { APPLE_SPRING, SMOOTH_EASE } from "./MotionPrimitives";

export function MobileLoadingScreen({
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
      className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#0A0F0E] px-6 select-none"
    >
      {/* Warm Optical Blurred Photo Backdrop (Recipe Screen Aesthetic) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0A0F0E]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/recipes/hainanese-rice-cooker.jpg"
          alt=""
          className="h-full w-full scale-125 object-cover blur-[56px] brightness-[0.48] saturate-[1.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/60" />
      </div>

      {/* Just the Logo inside a Frosted Liquid Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={APPLE_SPRING}
        className="glass-photo-panel relative z-10 flex items-center justify-center rounded-[32px] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-center rounded-[22px] bg-white px-6 py-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/logo-full.png"
            alt="GrassRoot"
            className="h-20 w-auto object-contain sm:h-24"
          />
        </div>
      </motion.div>
    </div>
  );
}

export function InitialMobileSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 800);
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
