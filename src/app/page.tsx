"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Heart, Plus } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import {
  APPLE_SPRING,
  FadeIn,
  PopNumber,
  SMOOTH_EASE,
  SNAPPY_SPRING,
} from "@/components/MotionPrimitives";
import type { Recipe } from "@/lib/types";

const FILTER_PILLS = [
  "All",
  "Rice Cooker",
  "15 Min",
  "Healthy",
  "Malay",
  "Japanese",
  "Chinese Halal",
  "Western",
] as const;

type FilterOption = (typeof FILTER_PILLS)[number];

export default function CookHomePage() {
  const {
    state,
    appliances,
    dietary,
    draftBox,
    votedRecipeIds,
    voteForRecipe,
    addRecipeToBox,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [activeSlide, setActiveSlide] = useState(0);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matchesFilter = (r: Recipe, filter: FilterOption): boolean => {
    if (filter === "All") return true;
    return (
      r.appliance_tag === filter ||
      r.goal_tags.includes(filter as never) ||
      r.cuisine_tag === filter
    );
  };

  // Section 1: Strictly this week's 4 meal-kit dishes
  const weeklyKitRecipes = useMemo(() => {
    const kits = (state?.recipes || []).filter((r) => r.is_pooled_this_week);
    if (activeFilter === "All") return kits;
    return kits.filter((r) => matchesFilter(r, activeFilter));
  }, [state, activeFilter]);

  // Section 2: Strictly the non-kit free recipes (zero duplicate cards!)
  const freeLibraryRecipes = useMemo(() => {
    const freeOnly = (state?.recipes || []).filter((r) => !r.is_pooled_this_week);
    const filtered = freeOnly.filter((r) => matchesFilter(r, activeFilter));

    return [...filtered].sort((a, b) => {
      const aMatch =
        (appliances.includes(a.appliance_tag) ? 2 : 0) +
        (dietary.every((d) => a.dietary_tags.includes(d)) ? 1 : 0);
      const bMatch =
        (appliances.includes(b.appliance_tag) ? 2 : 0) +
        (dietary.every((d) => b.dietary_tags.includes(d)) ? 1 : 0);
      if (bMatch !== aMatch) return bMatch - aMatch;
      return b.votes_count - a.votes_count;
    });
  }, [state, activeFilter, appliances, dietary]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleSettle = () => {
      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) return;
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let nearestIdx = 0;
      let minDist = Infinity;
      children.forEach((child, idx) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(childCenter - trackCenter);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = idx;
        }
      });
      setActiveSlide((prev) => {
        if (prev !== nearestIdx) {
          setStatusAnnouncement(
            `Slide ${nearestIdx + 1} of ${children.length}: ${
              weeklyKitRecipes[nearestIdx]?.title || ""
            }`
          );
        }
        return nearestIdx;
      });
    };

    const hasScrollEnd = "onscrollend" in window;
    const onScroll = () => {
      if (hasScrollEnd) return;
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(handleSettle, 120);
    };

    if (hasScrollEnd) {
      track.addEventListener("scrollend", handleSettle);
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (hasScrollEnd) {
        track.removeEventListener("scrollend", handleSettle);
      }
      track.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [weeklyKitRecipes]);

  function scrollToSlide(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) return;
    const targetIdx = (idx + children.length) % children.length;
    const child = children[targetIdx];
    track.scrollTo({
      left: Math.max(0, child.offsetLeft - track.offsetLeft),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    setActiveSlide(targetIdx);
  }

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-4 pt-3 sm:px-6 md:pt-8">
      {/* Header */}
      <FadeIn>
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-forest)]">
          GrassRoot Kitchen · 100% Halal
        </p>
        <h1 className="font-display mt-0.5 text-[28px] font-bold leading-[1.15] text-[var(--ink-primary)] sm:text-[34px]">
          What&apos;s for dinner?
        </h1>

        {/* Ultra-Compact 1-Row Explainer Strip */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-secondary)]">
          <span>
            <strong className="font-semibold text-[var(--ink-primary)]">1.</strong>{" "}
            Cook any recipe free
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="font-semibold text-[var(--ink-primary)]">2.</strong>{" "}
            Order freshly cut kits for Sunday (RM 0 delivery)
          </span>
        </div>
      </FadeIn>

      {/* Horizontal Filter Rail */}
      <FadeIn delay={0.04}>
        <div
          role="tablist"
          aria-label="Filter recipes by appliance, time, or cuisine"
          className="no-scrollbar mt-4 flex w-full items-center gap-2 overflow-x-auto py-1"
        >
          {FILTER_PILLS.map((pill) => {
            const active = activeFilter === pill;
            return (
              <button
                key={pill}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveFilter(pill)}
                className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "text-[#0F172A]"
                    : "glass-tile text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="cook-filter-pill"
                    transition={APPLE_SPRING}
                    className="glass-capsule-active absolute inset-0 rounded-full"
                  />
                )}
                <span className="relative z-10">{pill}</span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      {/* Section 1: This Week's Meal Kits (4 Dishes) */}
      <section
        aria-roledescription="carousel"
        aria-label="This Week's Meal Kits"
        className="mt-6"
      >
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)] sm:text-xl">
              This Week&apos;s Meal Kits
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
              Freshly cut halal ingredients delivered to your condo Sunday 6 PM · RM
              10.50 to 13/meal
            </p>
          </div>

          {weeklyKitRecipes.length > 1 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => scrollToSlide(activeSlide - 1)}
                aria-label="Previous meal kit"
                className="glass-tile flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-primary)] transition hover:brightness-110"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => scrollToSlide(activeSlide + 1)}
                aria-label="Next meal kit"
                className="glass-tile flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-primary)] transition hover:brightness-110"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>

        {weeklyKitRecipes.length === 0 ? (
          <div className="glass-panel flex items-center justify-between rounded-2xl p-4 text-xs text-[var(--ink-secondary)]">
            <span>No meal kits match &ldquo;{activeFilter}&rdquo; this week.</span>
            <button
              type="button"
              onClick={() => setActiveFilter("All")}
              className="font-semibold text-[var(--brand-forest)] underline"
            >
              Show all
            </button>
          </div>
        ) : (
          <>
            <div
              ref={trackRef}
              tabIndex={0}
              role="group"
              aria-label="Weekly meal kits"
              className="carousel-track w-full pt-1 pb-2"
            >
              {weeklyKitRecipes.map((recipe, idx) => {
                const inBoxQty = draftBox.portionsByRecipe[recipe.id] || 0;
                return (
                  <motion.div
                    key={recipe.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} of ${weeklyKitRecipes.length}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3 }}
                    transition={{
                      duration: 0.3,
                      delay: idx * 0.055,
                      ease: SMOOTH_EASE,
                    }}
                    className="carousel-slide group relative w-[76vw] max-w-[290px] shrink-0 overflow-hidden rounded-[26px] border border-white/25 bg-stone-900 shadow-xl sm:w-[272px]"
                  >
                    <Link
                      href={`/recipe/${recipe.slug}`}
                      className="block aspect-[4/5] w-full overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.hero_image_url}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />
                    </Link>

                    {/* Top Row: Price Glass Pill + Add Glass Pill */}
                    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                      <span className="glass-photo-pill rounded-full px-2.5 py-1 text-[11px] font-semibold text-white tabular-nums">
                        This Week · RM {recipe.price_per_meal_rm.toFixed(2)}
                      </span>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        transition={SNAPPY_SPRING}
                        onClick={() => addRecipeToBox(recipe.id)}
                        aria-label={`Add ${recipe.title} to Sunday box`}
                        className={`pointer-events-auto inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold text-white transition ${
                          inBoxQty > 0
                            ? "glass-btn-emerald"
                            : "glass-photo-pill hover:brightness-110"
                        }`}
                      >
                        {inBoxQty > 0 ? (
                          <motion.span
                            key={`inbox-${inBoxQty}`}
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            transition={SNAPPY_SPRING}
                            className="inline-flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            In Box ({inBoxQty})
                          </motion.span>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Add
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Bottom Info */}
                    <Link
                      href={`/recipe/${recipe.slug}`}
                      className="absolute inset-x-0 bottom-0 block p-4 text-white"
                    >
                      <div className="text-[11px] font-medium text-white/85">
                        {recipe.appliance_tag} · {recipe.prep_mins + recipe.cook_mins} min ·{" "}
                        {recipe.protein_g}g protein
                      </div>
                      <h3 className="font-display mt-1.5 text-base font-bold leading-snug text-white sm:text-lg">
                        {recipe.title}
                      </h3>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <p className="visually-hidden" role="status" aria-live="polite">
              {statusAnnouncement}
            </p>
            <nav
              aria-label="Choose a meal kit slide"
              className="mt-2.5 flex items-center justify-center gap-2 sm:hidden"
            >
              {weeklyKitRecipes.map((r, idx) => {
                const current = idx === activeSlide;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-label={`Go to ${r.title}`}
                    aria-current={current ? "true" : undefined}
                    onClick={() => scrollToSlide(idx)}
                    className="flex h-6 items-center justify-center px-1"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all ${
                        current
                          ? "w-6 bg-[var(--brand-orange)]"
                          : "w-1.5 bg-[var(--border-hairline)]"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </section>

      {/* Section 2: Free Recipes to Cook Tonight (Non-Kit Recipes Only) */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)] sm:text-xl">
              Free Recipes to Cook Tonight
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
              Cook free with your own groceries. Tap ♥ to request a dish for next
              Sunday&apos;s box.
            </p>
          </div>
        </div>

        {freeLibraryRecipes.length === 0 ? (
          <div className="glass-panel flex items-center justify-between rounded-2xl p-4 text-xs text-[var(--ink-secondary)]">
            <span>No free recipes match &ldquo;{activeFilter}&rdquo;.</span>
            <button
              type="button"
              onClick={() => setActiveFilter("All")}
              className="font-semibold text-[var(--brand-forest)] underline"
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {freeLibraryRecipes.map((recipe, idx) => {
              const hasVoted = votedRecipeIds.includes(recipe.id);
              return (
                <motion.article
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{
                    duration: 0.28,
                    delay: idx * 0.045,
                    ease: SMOOTH_EASE,
                  }}
                  className="glass-panel group flex min-w-0 flex-col justify-between overflow-hidden rounded-[22px] p-2.5 transition hover:brightness-[1.03]"
                >
                  <div>
                    <Link
                      href={`/recipe/${recipe.slug}`}
                      className="block aspect-[4/3] overflow-hidden rounded-[14px] bg-black/20 ring-1 ring-white/15"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.hero_image_url}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </Link>

                    <div className="mt-2.5 px-0.5">
                      <p className="truncate text-[11px] font-medium text-[var(--ink-secondary)] tabular-nums">
                        {recipe.prep_mins + recipe.cook_mins} min ·{" "}
                        {recipe.appliance_tag}
                      </p>
                      <Link href={`/recipe/${recipe.slug}`}>
                        <h3 className="font-display mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--ink-primary)] group-hover:underline sm:text-sm">
                          {recipe.title}
                        </h3>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 pt-1">
                    <button
                      type="button"
                      onClick={() => voteForRecipe(recipe.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[11px] font-semibold transition sm:text-xs ${
                        hasVoted
                          ? "border border-[#E49469]/40 bg-[#B5471A]/20 text-[var(--brand-orange)]"
                          : "border border-[var(--border-hairline)] bg-[var(--glass-subtle-bg)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 truncate">
                        <motion.span
                          animate={hasVoted ? { scale: [1, 1.38, 1] } : { scale: 1 }}
                          transition={SNAPPY_SPRING}
                          className="inline-flex shrink-0"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 shrink-0 ${
                              hasVoted ? "fill-current" : ""
                            }`}
                            strokeWidth={1.75}
                          />
                        </motion.span>
                        <span className="truncate">
                          {hasVoted ? "Requested" : "Request kit"}
                        </span>
                      </span>
                      <PopNumber
                        value={recipe.votes_count}
                        className="ml-1 shrink-0"
                      />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
