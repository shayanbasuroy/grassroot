"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Gift,
  MapPin,
  Monitor,
  Moon,
  QrCode,
  Sun,
} from "lucide-react";
import { type ColorSchemePreference, useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import {
  APPLE_SPRING,
  FadeIn,
  SNAPPY_SPRING,
} from "@/components/MotionPrimitives";
import { PoolRing } from "@/components/PoolRing";
import type { ApplianceTag, DietaryTag } from "@/lib/types";

const APPLIANCES: ApplianceTag[] = [
  "Rice-Cooker",
  "Air Fryer",
  "Single Pan",
  "Full Stove",
];

const DIETARY_PREFS: DietaryTag[] = [
  "100% Halal",
  "High-Protein",
  "No Seafood",
  "No Spicy",
];

export default function ProfilePage() {
  const {
    state,
    selectedCondoId,
    setCondoPickerOpen,
    appliances,
    toggleAppliance,
    dietary,
    toggleDietary,
    colorScheme,
    setColorScheme,
  } = useApp();

  const systemTheme = useSyncExternalStore<"light" | "dark">(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    () => "dark"
  );

  const selectedPool =
    state?.pool_summaries.find((p) => p.condo.id === selectedCondoId) ||
    state?.pool_summaries[0];

  const schemeOptions: {
    id: ColorSchemePreference;
    label: string;
    icon: typeof Sun;
  }[] = [
    { id: "system", label: "Auto", icon: Monitor },
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl overflow-x-clip px-4 pt-3 sm:px-6 md:pt-8">
      <FadeIn>
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-forest)]">
          Account &amp; Kitchen Setup
        </p>
        <h1 className="font-display mt-0.5 text-[28px] font-bold leading-[1.15] text-[var(--ink-primary)] sm:text-[34px]">
          Profile
        </h1>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Condo Complex & Pool Card */}
          {selectedPool && (
            <section className="glass-panel flex min-w-0 items-center justify-between gap-4 rounded-[24px] p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-forest)]">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                  My Condo Pool
                </div>
                <h2 className="font-display mt-1 text-lg font-bold text-[var(--ink-primary)]">
                  {selectedPool.condo.name}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                  {selectedPool.condo.pickup_lobby}
                </p>
                <button
                  type="button"
                  onClick={() => setCondoPickerOpen(true)}
                  className="glass-tile mt-3 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
                >
                  Change Residence
                </button>
              </div>
              <PoolRing
                joined={selectedPool.joined_boxes}
                target={selectedPool.drop.target_boxes}
                size={68}
                strokeWidth={6}
              />
            </section>
          )}

          {/* Referral Credits Card */}
          <section className="glass-panel flex min-w-0 flex-col justify-between rounded-[24px] p-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-orange)]">
                <Gift className="h-3.5 w-3.5" strokeWidth={1.75} />
                Neighbour Referral Credits
              </div>
              <div className="font-display mt-1 text-2xl font-bold text-[var(--ink-primary)] tabular-nums">
                RM 15.00 Available
              </div>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Give RM 15, get RM 15 when a neighbour in your condo joins Sunday&apos;s
                drop.
              </p>
            </div>
            <div className="glass-tile mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-semibold text-[var(--ink-primary)]">
              Code: SUNWAY-GEO-15
            </div>
          </section>
        </div>
      </FadeIn>

      {/* Your Kitchen & Diet */}
      <FadeIn delay={0.08}>
        <section className="glass-panel mt-5 rounded-[24px] p-5">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-[var(--brand-forest)]" strokeWidth={1.75} />
            <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
              Your Kitchen &amp; Diet
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
            Tap the appliances you own—your Home feed automatically ranks
            compatible recipes first.
          </p>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Appliances Owned
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {APPLIANCES.map((app) => {
                const on = appliances.includes(app);
                return (
                  <motion.button
                    key={app}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={SNAPPY_SPRING}
                    onClick={() => toggleAppliance(app)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      on
                        ? "glass-capsule-active text-[#0F172A]"
                        : "glass-tile text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {app}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Dietary Preferences
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIETARY_PREFS.map((pref) => {
                const on = dietary.includes(pref);
                return (
                  <motion.button
                    key={pref}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={SNAPPY_SPRING}
                    onClick={() => toggleDietary(pref)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      on
                        ? "glass-capsule-active text-[#0F172A]"
                        : "glass-tile text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {pref}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Appearance: 3-State Dark Mode Control (Auto / Light / Dark) */}
      <FadeIn delay={0.11}>
        <section className="glass-panel mt-5 rounded-[24px] p-5">
          <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
            Appearance
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
            Active theme:{" "}
            {colorScheme === "dark"
              ? "Atmospheric Dark Glass"
              : colorScheme === "light"
                ? "Light Frosted Glass"
                : `Auto (${systemTheme === "dark" ? "Dark" : "Light"})`}
            .
          </p>

          <div
            role="radiogroup"
            aria-label="Color scheme preference"
            className="glass-track mt-3 grid grid-cols-3 gap-2 rounded-2xl p-1"
          >
            {schemeOptions.map(({ id, label, icon: Icon }) => {
              const active = colorScheme === id;
              return (
                <button
                  key={id}
                  role="radio"
                  type="button"
                  aria-checked={active}
                  onClick={() => setColorScheme(id)}
                  className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                    active
                      ? "text-[#0F172A]"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="appearance-pill"
                      transition={APPLE_SPRING}
                      className="glass-capsule-active absolute inset-0 rounded-xl"
                    />
                  )}
                  <Icon className="relative z-10 h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </FadeIn>

      {/* Team Portals */}
      <FadeIn delay={0.14}>
        <section className="mt-5">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
            Team Portals
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/captain"
              className="glass-panel group flex min-w-0 items-center justify-between gap-3 rounded-[22px] p-4 transition hover:brightness-105"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="glass-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--ink-primary)]">
                  <QrCode className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[var(--ink-primary)]">
                    Building Captain Scanner
                  </div>
                  <div className="truncate text-xs text-[var(--ink-secondary)]">
                    Lobby QR handover · RM 35/drop payout
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-secondary)] transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/admin"
              className="glass-panel group flex min-w-0 items-center justify-between gap-3 rounded-[22px] p-4 transition hover:brightness-105"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="glass-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--ink-primary)]">
                  <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[var(--ink-primary)]">
                    Admin Procurement Exporter
                  </div>
                  <div className="truncate text-xs text-[var(--ink-secondary)]">
                    Raw-weight CSV PO · Packing Labels · Unit Economics
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-secondary)] transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </FadeIn>

      {/* GrassRoot Official Brand Card */}
      <FadeIn delay={0.17}>
        <section className="glass-panel mt-6 flex flex-col items-center justify-between gap-4 rounded-[24px] p-5 text-center sm:flex-row sm:text-left">
          <BrandLogo variant="full" size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--ink-primary)]">
              Bandar Sunway &amp; Subang Jaya Community Kitchen
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
              100% Halal weekly pooled meal boxes delivered straight to your condo
              lobby with RM 0 delivery fee.
            </p>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
