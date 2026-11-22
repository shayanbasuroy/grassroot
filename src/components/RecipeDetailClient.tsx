"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChefHat,
  Clock,
  Flame,
  Heart,
  HeartPulse,
  QrCode,
  Wallet,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import {
  APPLE_SPRING,
  FadeIn,
  PopNumber,
  SNAPPY_SPRING,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import type { Recipe } from "@/lib/types";

const SERVINGS = [1, 2, 4] as const;

export function RecipeDetailClient({
  slug,
  initialRecipe,
}: {
  slug: string;
  initialRecipe: Recipe;
}) {
  const router = useRouter();
  const {
    state,
    savedRecipeIds,
    toggleSaveRecipe,
    votedRecipeIds,
    voteForRecipe,
    addRecipeToBox,
  } = useApp();

  const recipe =
    state?.recipes.find((r) => r.slug === slug) || initialRecipe;

  const [servings, setServings] = useState<1 | 2 | 4>(1);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const isSaved = savedRecipeIds.includes(recipe.id);
  const hasVoted = votedRecipeIds.includes(recipe.id);

  function toggleIngredient(id: string) {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleGetKit() {
    addRecipeToBox(recipe.id);
    router.push("/box");
  }

  return (
    <>
      {/* Full-Bleed Blurred Dish Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#080D0F]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.hero_image_url}
          alt=""
          className="h-full w-full scale-115 object-cover blur-[44px] brightness-[0.44] saturate-[1.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/55" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-2xl overflow-x-clip pb-32 md:pt-5">
        {/* Seamless Full-Bleed Top Hero Photo */}
        <FadeIn className="relative">
          <div className="relative h-[340px] w-full overflow-hidden sm:h-[410px] md:rounded-t-[32px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.hero_image_url}
              alt={recipe.title}
              className="hero-photo-fade h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

            {/* Floating Circular Frosted Controls */}
            <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between">
              <Link
                href="/"
                aria-label="Back to recipes"
                className="glass-photo-circle flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
              </Link>

              <button
                type="button"
                onClick={() => toggleSaveRecipe(recipe.id)}
                aria-label={isSaved ? "Remove from favorites" : "Save recipe"}
                className="glass-photo-circle flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105"
              >
                <motion.span
                  animate={isSaved ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                  transition={SNAPPY_SPRING}
                  className="inline-flex"
                >
                  <Heart
                    className={`h-5 w-5 ${isSaved ? "fill-rose-400 text-rose-400" : "text-white"}`}
                    strokeWidth={1.75}
                  />
                </motion.span>
              </button>
            </div>
          </div>

          {/* Hero Badges & Typography Dissolving Cleanly Above Stat Tiles */}
          <div className="relative z-10 -mt-28 px-4 pb-2 text-white sm:-mt-32 sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {recipe.is_pooled_this_week ? (
                <span className="glass-btn-orange rounded-full px-3 py-1 text-white">
                  Meal Kit · RM {recipe.price_per_meal_rm.toFixed(2)}/meal
                </span>
              ) : (
                <span className="glass-photo-pill rounded-full px-3 py-1">
                  Free Recipe
                </span>
              )}
              <span className="glass-btn-emerald rounded-full px-3 py-1 text-white">
                100% Halal
              </span>
            </div>
            <h1 className="font-display mt-2.5 text-[27px] font-bold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-[32px]">
              {recipe.title}
            </h1>
            <p className="mt-1 text-[13px] leading-snug text-white/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] sm:text-sm">
              {recipe.subtitle}
            </p>
          </div>
        </FadeIn>

        {/* Glass Body Stack */}
        <div className="space-y-4 px-4 pt-3 sm:px-5 sm:pt-4">
          {/* Quick Metadata Strip (3 Frosted Glass Tiles) */}
          <StaggerGroup className="grid grid-cols-3 gap-2.5">
            <StaggerItem className="glass-photo-tile min-w-0 rounded-[20px] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                <Clock className="h-3.5 w-3.5 shrink-0 text-white/85" strokeWidth={1.75} />
                Prep
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-white tabular-nums sm:text-base">
                {recipe.prep_mins} min
              </div>
            </StaggerItem>
            <StaggerItem className="glass-photo-tile min-w-0 rounded-[20px] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                <Flame className="h-3.5 w-3.5 shrink-0 text-[#E49469]" strokeWidth={1.75} />
                Cook
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-white tabular-nums sm:text-base">
                {recipe.cook_mins} min
              </div>
            </StaggerItem>
            <StaggerItem className="glass-photo-tile min-w-0 rounded-[20px] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                <ChefHat className="h-3.5 w-3.5 shrink-0 text-[#82C9AF]" strokeWidth={1.75} />
                Tool
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-white sm:text-base">
                {recipe.appliance_tag}
              </div>
            </StaggerItem>
          </StaggerGroup>

          {/* vs. Eating Out / GrabFood Comparison Panel (Time Saved, Money Saved, Health Benefit) */}
          <FadeIn delay={0.03}>
            <section className="glass-photo-panel rounded-[26px] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#82C9AF]">
                  vs. Eating Out &amp; GrabFood Delivery
                </div>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/85 tabular-nums">
                  Outside avg: RM {(recipe.grabfood_price_rm * servings).toFixed(2)} (incl. RM 5–9 fee)
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                    <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    Time Saved
                  </div>
                  <div className="mt-1 text-base font-bold text-white tabular-nums sm:text-lg">
                    {recipe.time_saved_mins} mins
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-white/70">
                    {recipe.prep_mins + recipe.cook_mins}m cook vs 45m+ wait or traffic
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#82C9AF]">
                    <Wallet className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    Money Saved
                  </div>
                  <div className="mt-1 text-base font-bold text-[#82C9AF] tabular-nums sm:text-lg">
                    RM {(recipe.money_saved_rm * servings).toFixed(2)}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-white/70">
                    ~45% cheaper · RM 0 batched lobby drop
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-300">
                    <HeartPulse className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    Health Benefit
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">
                    {recipe.health_benefit}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-white/70">
                    Cooked fresh ({recipe.calories} kcal) · zero soggy transit
                  </p>
                </div>
              </div>
            </section>
          </FadeIn>

          {/* Included Kit Sample */}
          {recipe.fmcg_sponsor_note && (
            <FadeIn delay={0.05}>
              <div className="glass-photo-tile rounded-[22px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#82C9AF]">
                  Included in your kit
                </p>
                <p className="mt-0.5 text-xs font-medium text-white/90">
                  {recipe.fmcg_sponsor_note}
                </p>
              </div>
            </FadeIn>
          )}

          {/* Ingredients Glass Slab + Interactive Serving Stepper (1x, 2x, 4x) */}
          <FadeIn delay={0.08}>
            <section className="glass-photo-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Ingredients
                  </h2>
                  <p className="text-xs text-white/75 tabular-nums">
                    {recipe.calories} kcal · {recipe.protein_g}g protein per serving
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Serving size"
                  className="glass-photo-track inline-flex items-center rounded-full p-1"
                >
                  {SERVINGS.map((s) => {
                    const active = servings === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setServings(s)}
                        className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition tabular-nums ${
                          active
                            ? "text-[#0F172A]"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="serving-pill"
                            transition={APPLE_SPRING}
                            className="glass-capsule-active absolute inset-0 rounded-full"
                          />
                        )}
                        <span className="relative z-10">{s} pax</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ul className="mt-4 divide-y divide-white/12">
                {recipe.ingredients.map((ing) => {
                  const checked = Boolean(checkedIds[ing.id]);
                  const scaledQty =
                    Math.round(ing.qty_per_serving * servings * 10) / 10;
                  return (
                    <li key={ing.id}>
                      <button
                        type="button"
                        onClick={() => toggleIngredient(ing.id)}
                        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <motion.span
                            animate={
                              checked ? { scale: [0.8, 1.15, 1] } : { scale: 1 }
                            }
                            transition={SNAPPY_SPRING}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition ${
                              checked
                                ? "glass-btn-emerald border-emerald-300 text-white"
                                : "border-white/65 bg-white/5"
                            }`}
                          >
                            {checked && (
                              <Check className="h-3 w-3" strokeWidth={2.5} />
                            )}
                          </motion.span>
                          <span
                            className={`text-sm transition-colors ${
                              checked
                                ? "text-white/50 line-through"
                                : "font-medium text-white/95"
                            }`}
                          >
                            {ing.name}
                          </span>
                        </div>
                        <PopNumber
                          value={`${scaledQty} ${ing.unit}`}
                          className="shrink-0 text-sm font-semibold text-white"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </FadeIn>

          {/* Steps Glass Slab + Hands-free Mode */}
          <FadeIn delay={0.12}>
            <section className="glass-photo-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-white">
                  Steps ({recipe.steps.length})
                </h2>
                <Link
                  href={`/cook/${recipe.slug}`}
                  className="glass-photo-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  <QrCode className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Hands free mode
                </Link>
              </div>

              <ol className="mt-4 space-y-3">
                {recipe.steps.map((st) => (
                  <li
                    key={st.step_number}
                    className="flex gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-3.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-xs font-bold text-white tabular-nums">
                      {st.step_number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          {st.title}
                        </span>
                        {st.timer_seconds && (
                          <span className="text-[11px] font-semibold text-[#E49469] tabular-nums">
                            {Math.round(st.timer_seconds / 60)}m timer
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-white/75">
                        {st.instruction}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </FadeIn>
        </div>

        {/* Sticky Floating Liquid Glass CTA Dock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={APPLE_SPRING}
          className="fixed inset-x-4 z-30 md:bottom-5"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="glass-photo-dock mx-auto flex max-w-2xl items-center gap-2.5 rounded-[28px] p-2">
            <Link
              href={`/cook/${recipe.slug}`}
              className="glass-btn-secondary flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-xs font-bold transition hover:brightness-105 sm:text-sm"
            >
              Cook Free
            </Link>

            {recipe.is_pooled_this_week ? (
              <button
                type="button"
                onClick={handleGetKit}
                className="glass-btn-orange flex min-w-0 flex-[1.4] items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-xs font-bold text-white transition hover:brightness-110 sm:text-sm tabular-nums"
              >
                Add Kit · RM {(recipe.price_per_meal_rm * servings).toFixed(2)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => voteForRecipe(recipe.id)}
                className="glass-btn-emerald flex min-w-0 flex-[1.4] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-3 text-xs font-bold text-white transition hover:brightness-110 sm:text-sm tabular-nums"
              >
                <motion.span
                  animate={hasVoted ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                  transition={SNAPPY_SPRING}
                  className="inline-flex shrink-0"
                >
                  <Heart
                    className={`h-4 w-4 shrink-0 ${hasVoted ? "fill-white" : ""}`}
                    strokeWidth={2}
                  />
                </motion.span>
                {hasVoted
                  ? `Requested (${recipe.votes_count})`
                  : `Request Next Week (${recipe.votes_count})`}
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </>
  );
}
