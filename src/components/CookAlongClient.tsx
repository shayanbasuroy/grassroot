"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sun,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import { formatCountdown, useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { APPLE_SPRING, SMOOTH_EASE } from "@/components/MotionPrimitives";
import type { Recipe } from "@/lib/types";

const STEP_VARIANTS = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 24,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -24,
  }),
};

export function CookAlongClient({
  slug,
  initialRecipe,
}: {
  slug: string;
  initialRecipe: Recipe;
}) {
  const {
    state,
    activeTimer,
    startCookTimer,
    toggleCookTimer,
    adjustCookTimer,
    clearCookTimer,
    showToast,
  } = useApp();

  const recipe = state?.recipes.find((r) => r.slug === slug) || initialRecipe;
  const steps = recipe.steps;

  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [completed, setCompleted] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [rating, setRating] = useState<"too_easy" | "just_right" | "tricky">(
    "just_right"
  );
  const [keepNextWeek, setKeepNextWeek] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const stepIdxRef = useRef(stepIdx);
  useEffect(() => {
    stepIdxRef.current = stepIdx;
  }, [stepIdx]);

  const currentStep = steps[stepIdx] || steps[0];
  const isTimerForThisStep =
    activeTimer &&
    activeTimer.slug === recipe.slug &&
    activeTimer.stepNumber === currentStep.step_number;

  function goToStep(targetIdx: number) {
    setDirection(targetIdx >= stepIdxRef.current ? 1 : -1);
    setStepIdx(Math.max(0, Math.min(steps.length - 1, targetIdx)));
  }

  // Screen Wake Lock API so phone screen never dims mid-cook
  useEffect(() => {
    let sentinel: { release: () => Promise<void> } | null = null;
    let mounted = true;

    async function acquireWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          sentinel = await navigator.wakeLock.request("screen");
          if (mounted) setWakeLockActive(true);
        }
      } catch {
        if (mounted) setWakeLockActive(false);
      }
    }

    acquireWakeLock();
    const onVis = () => {
      if (document.visibilityState === "visible") acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVis);
      sentinel?.release().catch(() => {});
    };
  }, []);

  // Optional Hands-Free Voice Control ("Next", "Back", "Start timer")
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleVoiceControl() {
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }

    type SpeechRecCtor = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (event: {
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecCtor;
      webkitSpeechRecognition?: SpeechRecCtor;
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      showToast("Voice commands use Web Speech API (Chrome/Safari)");
      return;
    }

    const rec = new Rec();
    rec.lang = "en-MY";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = (last?.[0]?.transcript || "").toLowerCase();
      if (text.includes("next") || text.includes("continue")) {
        if (stepIdxRef.current < steps.length - 1) {
          setDirection(1);
          setStepIdx((i) => Math.min(steps.length - 1, i + 1));
        } else {
          setCompleted(true);
        }
      } else if (text.includes("back") || text.includes("previous")) {
        setDirection(-1);
        setStepIdx((i) => Math.max(0, i - 1));
      } else if (text.includes("timer") || text.includes("start")) {
        const st = steps[stepIdxRef.current];
        if (st?.timer_seconds) {
          startCookTimer({
            slug: recipe.slug,
            recipeTitle: recipe.title,
            stepNumber: st.step_number,
            stepTitle: st.title,
            seconds: st.timer_seconds,
          });
        }
      }
    };
    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);
    rec.start();
    recognitionRef.current = rec;
    setVoiceActive(true);
    showToast('Listening for "Next Step", "Back", or "Start Timer"');
  }

  function handleLaunchStepTimer() {
    if (!currentStep.timer_seconds) return;
    startCookTimer({
      slug: recipe.slug,
      recipeTitle: recipe.title,
      stepNumber: currentStep.step_number,
      stepTitle: currentStep.title,
      seconds: currentStep.timer_seconds,
    });
  }

  async function handleFinishFeedback() {
    setSubmitting(true);
    try {
      await fetch("/api/cook/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipe.id,
          rating,
          keep_next_week: keepNextWeek,
        }),
      });
      setFeedbackSent(true);
      showToast("Saved! Thanks for cooking with GrassRoot");
    } finally {
      setSubmitting(false);
    }
  }

  const backdropNode = (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#080D0F]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={recipe.hero_image_url}
        alt=""
        className="h-full w-full scale-115 object-cover blur-[48px] brightness-[0.38] saturate-[1.3]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/60" />
    </div>
  );

  if (completed) {
    return (
      <>
        {backdropNode}
        <main className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={APPLE_SPRING}
            className="glass-photo-panel rounded-[28px] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={APPLE_SPRING}
                className="glass-btn-emerald flex h-14 w-14 items-center justify-center rounded-full text-white"
              >
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </motion.div>

              <BrandLogo variant="mark" size="md" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#82C9AF]">
              First-Cook Complete
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
              Dinner is served!
            </h1>
            <p className="mt-1.5 text-sm text-white/80">
              You just cooked <strong className="text-white">{recipe.title}</strong> (
              {recipe.protein_g}g protein · ~RM{" "}
              {recipe.price_per_meal_rm.toFixed(2)}).
            </p>

            {/* 1-Tap Difficulty Rating */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                How did that feel?
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {[
                  { id: "too_easy" as const, label: "Too Easy" },
                  { id: "just_right" as const, label: "Just Right" },
                  { id: "tricky" as const, label: "Tricky" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRating(opt.id)}
                    className={`rounded-2xl py-3 text-xs font-semibold transition ${
                      rating === opt.id
                        ? "glass-btn-emerald text-white"
                        : "glass-photo-tile text-white/80 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Tap Keep on Next Week's Box Toggle */}
            <button
              type="button"
              onClick={() => setKeepNextWeek((v) => !v)}
              className="glass-photo-tile mt-4 flex w-full items-center justify-between rounded-2xl p-4 text-left"
            >
              <div>
                <div className="text-sm font-semibold text-white">
                  Keep on Next Week&apos;s Box
                </div>
                <div className="text-xs text-white/75">
                  Auto-include if pooled again next Sunday
                </div>
              </div>
              <span
                className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                  keepNextWeek
                    ? "justify-end bg-[#64B8AE]"
                    : "justify-start bg-white/25"
                }`}
              >
                <motion.span
                  layout
                  transition={APPLE_SPRING}
                  className="h-5 w-5 rounded-full bg-white shadow-xs"
                />
              </span>
            </button>

            <div className="mt-6 flex flex-col gap-2.5">
              {!feedbackSent ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinishFeedback}
                  className="glass-btn-orange w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save & Return to Library"}
                </button>
              ) : (
                <Link
                  href="/"
                  className="glass-btn-emerald flex w-full items-center justify-center rounded-full py-3.5 text-sm font-bold text-white"
                >
                  Done · Back to Cook
                </Link>
              )}
              <Link
                href="/box"
                className="glass-photo-pill flex w-full items-center justify-center rounded-full py-3 text-xs font-semibold text-white/90"
              >
                View Next Sunday&apos;s Box
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  const timerPct =
    isTimerForThisStep && activeTimer.totalSeconds > 0
      ? activeTimer.remainingSeconds / activeTimer.totalSeconds
      : 1;
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <>
      {backdropNode}

      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-between px-4 pt-4 pb-32 text-white">
        {/* Top Progress Bar + Controls */}
        <div>
          {/* Segmented Hairline Bars */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
            aria-label={`Step ${stepIdx + 1} of ${steps.length}`}
          >
            {steps.map((s, idx) => (
              <button
                key={s.step_number}
                type="button"
                onClick={() => goToStep(idx)}
                aria-label={`Jump to step ${idx + 1}: ${s.title}`}
                className="py-1"
              >
                <span
                  className={`block h-1.5 w-full rounded-full transition-colors ${
                    idx <= stepIdx ? "bg-[#E49469]" : "bg-white/25"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Top Chrome Row */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <Link
              href={`/recipe/${recipe.slug}`}
              className="glass-photo-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Exit
            </Link>

            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium ${
                  wakeLockActive
                    ? "glass-btn-emerald text-white"
                    : "glass-photo-pill text-white/80"
                }`}
                title="Screen Wake Lock keeps display awake while cooking"
              >
                <Sun className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                <span>{wakeLockActive ? "Awake" : "Keep Awake"}</span>
              </span>

              <button
                type="button"
                onClick={toggleVoiceControl}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  voiceActive
                    ? "glass-btn-orange text-white"
                    : "glass-photo-pill text-white"
                }`}
              >
                {voiceActive ? (
                  <Mic className="h-3.5 w-3.5 animate-pulse" strokeWidth={2} />
                ) : (
                  <MicOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                )}
                <span>{voiceActive ? "Listening" : "Voice"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Stage: Glass Card with Oversized Instruction & Timer */}
        <div className="my-auto overflow-hidden py-5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep.step_number}
              custom={direction}
              variants={STEP_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: SMOOTH_EASE }}
              className="glass-photo-panel space-y-5 rounded-[28px] p-5 sm:p-7"
            >
              {/* Dish Visual Header */}
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.hero_image_url}
                  alt={recipe.title}
                  className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/30"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#E49469] tabular-nums">
                    Step {stepIdx + 1} of {steps.length} · {currentStep.title}
                  </p>
                  <p className="text-xs text-white/75">{recipe.title}</p>
                </div>
              </div>

              {/* 26pt+ Bold Instruction Legible from 1 Meter Away */}
              <h1 className="font-display text-[25px] font-semibold leading-[1.3] text-white sm:text-[31px]">
                {currentStep.instruction}
              </h1>

              {currentStep.tip && (
                <p className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white/85">
                  <strong className="text-white">Kitchen Tip:</strong>{" "}
                  {currentStep.tip}
                </p>
              )}

              {currentStep.sponsor_callout && (
                <div className="glass-photo-tile rounded-2xl px-4 py-3 text-xs font-medium text-white">
                  <span className="font-semibold text-[#82C9AF]">
                    Included in pouch:{" "}
                  </span>
                  <span>{currentStep.sponsor_callout}</span>
                </div>
              )}

              {/* Inline Smart Timer Pill / Expanded Radial Countdown Ring */}
              {currentStep.timer_seconds && (
                <div className="pt-1">
                  <AnimatePresence mode="wait">
                    {!isTimerForThisStep ? (
                      <motion.div
                        key="timer-cta"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={APPLE_SPRING}
                      >
                        <button
                          type="button"
                          onClick={handleLaunchStepTimer}
                          className="glass-btn-orange inline-flex items-center gap-3 rounded-full px-6 py-4 text-base font-bold text-white transition hover:brightness-110"
                        >
                          <TimerIcon className="h-5 w-5" strokeWidth={2} />
                          <span className="tabular-nums">
                            Start {formatCountdown(currentStep.timer_seconds)} Timer
                          </span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="timer-card"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={APPLE_SPRING}
                        className="glass-photo-panel flex flex-col items-center gap-5 rounded-[24px] p-5 text-center sm:flex-row sm:text-left"
                      >
                        <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center">
                          <svg width={120} height={120} className="-rotate-90">
                            <circle
                              cx={60}
                              cy={60}
                              r={ringRadius}
                              fill="none"
                              stroke="rgba(255,255,255,0.18)"
                              strokeWidth={8}
                            />
                            <circle
                              cx={60}
                              cy={60}
                              r={ringRadius}
                              fill="none"
                              stroke={
                                activeTimer.finished ? "#82C9AF" : "#E49469"
                              }
                              strokeWidth={8}
                              strokeLinecap="round"
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={
                                ringCircumference * (1 - timerPct)
                              }
                              style={{
                                transition: "stroke-dashoffset 0.9s linear",
                              }}
                            />
                          </svg>
                          <span className="absolute text-2xl font-bold text-white tabular-nums">
                            {formatCountdown(activeTimer.remainingSeconds)}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-white/75">
                            {activeTimer.finished
                              ? "Timer Complete!"
                              : "Live Activity Active"}
                          </div>
                          <div className="font-display text-[36px] font-bold leading-none text-white tabular-nums">
                            {formatCountdown(activeTimer.remainingSeconds)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={toggleCookTimer}
                              className="glass-photo-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
                            >
                              {activeTimer.running ? (
                                <>
                                  <Pause className="h-3.5 w-3.5" /> Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5" /> Resume
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustCookTimer(60)}
                              className="glass-photo-pill inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold text-white tabular-nums"
                            >
                              <Plus className="h-3.5 w-3.5" /> 1m
                            </button>
                            <button
                              type="button"
                              onClick={clearCookTimer}
                              aria-label="Reset timer"
                              className="glass-photo-pill inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-white/80"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Extra-Large Wet-Hand Bottom Liquid Glass Control Dock */}
        <div
          className="fixed inset-x-4 z-40"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="glass-photo-dock mx-auto flex max-w-2xl items-center gap-2.5 rounded-[32px] p-2">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => goToStep(stepIdx - 1)}
              className="glass-btn-secondary flex h-[56px] w-[32%] items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition disabled:opacity-35"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                if (stepIdx < steps.length - 1) {
                  goToStep(stepIdx + 1);
                } else {
                  setCompleted(true);
                }
              }}
              className="glass-btn-orange flex h-[56px] w-[68%] items-center justify-center gap-2 rounded-full text-base font-bold text-white transition hover:brightness-110"
            >
              {stepIdx < steps.length - 1 ? (
                <>
                  Next Step
                  <ArrowRight className="h-5 w-5" strokeWidth={2} />
                </>
              ) : (
                <>
                  Finish Cooking
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
