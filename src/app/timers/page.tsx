"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer as TimerIcon,
} from "lucide-react";
import { formatCountdown, useApp } from "@/components/AppProvider";
import {
  APPLE_SPRING,
  FadeIn,
  SMOOTH_EASE,
  SNAPPY_SPRING,
} from "@/components/MotionPrimitives";

const PRESET_TIMERS = [
  {
    title: "Rice Cooker Cycle",
    slug: "teriyaki-01",
    seconds: 1080,
    subtitle: "Jasmine rice + teriyaki chicken",
  },
  {
    title: "Air Fryer Crisp",
    slug: "airfryer-lemon-herb-chicken",
    seconds: 480,
    subtitle: "190°C golden thigh & potatoes",
  },
  {
    title: "Creamy Sambal Simmer",
    slug: "creamy-butter-sambal-chicken",
    seconds: 240,
    subtitle: "Thick glossy butter glaze",
  },
  {
    title: "Onsen Soft Egg",
    slug: "halal-beef-gyudon-15min",
    seconds: 360,
    subtitle: "Jammy golden yolk",
  },
];

export default function TimersAndSavedPage() {
  const {
    state,
    activeTimer,
    startCookTimer,
    toggleCookTimer,
    adjustCookTimer,
    clearCookTimer,
    savedRecipeIds,
    toggleSaveRecipe,
    votedRecipeIds,
  } = useApp();

  const savedRecipes = (state?.recipes || []).filter((r) =>
    savedRecipeIds.includes(r.id)
  );
  const votedRecipes = (state?.recipes || []).filter((r) =>
    votedRecipeIds.includes(r.id)
  );

  return (
    <main className="mx-auto w-full max-w-4xl overflow-x-clip px-4 pt-3 sm:px-6 md:pt-8">
      <FadeIn>
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-orange)]">
          Kitchen Companion
        </p>
        <h1 className="font-display mt-0.5 text-[28px] font-bold leading-[1.15] text-[var(--ink-primary)] sm:text-[34px]">
          Timers &amp; Saved
        </h1>
      </FadeIn>

      {/* Active Cook-Along / Live Activity Card */}
      <FadeIn delay={0.05}>
        <section className="glass-panel mt-6 rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-orange)]">
                Active Kitchen Timer
              </p>
              <h2 className="font-display mt-0.5 text-lg font-bold text-[var(--ink-primary)]">
                {activeTimer ? activeTimer.recipeTitle : "No active cook timer"}
              </h2>
            </div>
            {activeTimer && (
              <Link
                href={`/cook/${activeTimer.slug}`}
                className="glass-btn-emerald rounded-full px-3.5 py-1.5 text-xs font-semibold text-white"
              >
                Resume Cook Along
              </Link>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTimer ? (
              <motion.div
                key="active-timer-card"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={APPLE_SPRING}
                className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--glass-subtle-bg)] p-4"
              >
                <div>
                  <div className="text-xs text-[var(--ink-secondary)]">
                    Step {activeTimer.stepNumber}: {activeTimer.stepTitle}
                  </div>
                  <div className="font-display mt-1 text-[44px] font-bold leading-none text-[var(--ink-primary)] tabular-nums">
                    {activeTimer.finished
                      ? "00:00"
                      : formatCountdown(activeTimer.remainingSeconds)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCookTimer}
                    className="glass-btn-orange inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-white"
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
                    className="glass-tile inline-flex items-center gap-1 rounded-full px-3.5 py-2.5 text-xs font-semibold text-[var(--ink-primary)] tabular-nums"
                  >
                    <Plus className="h-3.5 w-3.5" /> 1m
                  </button>
                  <button
                    type="button"
                    onClick={clearCookTimer}
                    aria-label="Clear timer"
                    className="glass-tile flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-secondary)]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="empty-timer-copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 text-xs text-[var(--ink-secondary)]"
              >
                Start a preset timer below or tap any highlighted duration inside
                Cook Along Mode to pin it to your floating Live Activity pill.
              </motion.p>
            )}
          </AnimatePresence>

          {/* 1-Tap Quick-Start Presets */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PRESET_TIMERS.map((p, idx) => (
              <motion.button
                key={p.title}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.26,
                  delay: idx * 0.04,
                  ease: SMOOTH_EASE,
                }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  startCookTimer({
                    slug: p.slug,
                    recipeTitle: p.title,
                    stepNumber: 1,
                    stepTitle: p.subtitle,
                    seconds: p.seconds,
                  })
                }
                className="glass-tile flex min-w-0 flex-col justify-between rounded-2xl p-3 text-left transition hover:brightness-110"
              >
                <div className="flex items-center justify-between text-[var(--brand-orange)]">
                  <TimerIcon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="text-xs font-bold tabular-nums">
                    {formatCountdown(p.seconds)}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-semibold text-[var(--ink-primary)]">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-[var(--ink-secondary)]">
                    {p.subtitle}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Saved Recipes Shelf */}
      <FadeIn delay={0.1}>
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              Saved Recipes ({savedRecipes.length})
            </h2>
            <Link
              href="/"
              className="text-xs font-semibold text-[var(--brand-forest)] hover:underline"
            >
              Browse all
            </Link>
          </div>

          {savedRecipes.length === 0 ? (
            <div className="glass-panel rounded-[24px] p-8 text-center text-xs text-[var(--ink-secondary)]">
              Tap the heart icon on any recipe to save it here for quick weeknight
              cooking.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {savedRecipes.map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: idx * 0.04,
                    ease: SMOOTH_EASE,
                  }}
                  className="glass-panel flex min-w-0 items-center justify-between gap-3 rounded-[22px] p-3"
                >
                  <Link
                    href={`/recipe/${rec.slug}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rec.hero_image_url}
                      alt={rec.title}
                      className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/20"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-[var(--ink-secondary)]">
                        {rec.appliance_tag} · {rec.prep_mins + rec.cook_mins} min
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/cook/${rec.slug}`}
                      className="glass-btn-orange rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Cook
                    </Link>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.88 }}
                      transition={SNAPPY_SPRING}
                      onClick={() => toggleSaveRecipe(rec.id)}
                      aria-label={`Unsave ${rec.title}`}
                      className="glass-tile flex h-8 w-8 items-center justify-center rounded-full text-rose-400"
                    >
                      <Heart className="h-4 w-4 fill-current" strokeWidth={1.75} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </FadeIn>

      {/* Voted For Next Week's Pool */}
      {votedRecipes.length > 0 && (
        <FadeIn delay={0.14}>
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              Your Votes for Next Week&apos;s Pool ({votedRecipes.length})
            </h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {votedRecipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/recipe/${r.slug}`}
                  className="glass-tile flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition hover:brightness-110"
                >
                  <span className="font-semibold text-[var(--ink-primary)]">
                    {r.title}
                  </span>
                  <span className="font-semibold text-[var(--brand-orange)] tabular-nums">
                    {r.votes_count} votes
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}
    </main>
  );
}
