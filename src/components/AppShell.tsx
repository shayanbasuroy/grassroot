"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChefHat,
  MapPin,
  Package,
  Timer,
  User,
  X,
} from "lucide-react";
import { formatCountdown, useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { InitialMobileSplash } from "./MobileLoadingScreen";
import { APPLE_SPRING, PopNumber, SMOOTH_EASE } from "./MotionPrimitives";
import { PoolRing } from "./PoolRing";
import { closeTopLayer } from "@/lib/top-layer";

const TABS = [
  { href: "/", label: "Cook", icon: ChefHat },
  { href: "/box", label: "Box", icon: Package },
  { href: "/timers", label: "Timers", icon: Timer },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCookAlong = pathname.startsWith("/cook/");
  const isRecipeDetail = pathname.startsWith("/recipe/");
  const hideMobileNav = isCookAlong || isRecipeDetail;
  const isPortal = pathname.startsWith("/admin") || pathname.startsWith("/captain");

  const {
    state,
    selectedCondoId,
    setSelectedCondoId,
    condoPickerOpen,
    setCondoPickerOpen,
    draftBox,
    activeTimer,
    toastMessage,
  } = useApp();

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const dialogTitleId = useId();

  const selectedPool =
    state?.pool_summaries.find((p) => p.condo.id === selectedCondoId) ||
    state?.pool_summaries[0];

  const totalDraftMeals = Object.values(draftBox.portionsByRecipe).reduce(
    (s, n) => s + n,
    0
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (condoPickerOpen && !dialog.open) {
      dialog.showModal();
    } else if (!condoPickerOpen && dialog.open) {
      void closeTopLayer(dialog);
    }
  }, [condoPickerOpen]);

  // Animated top-layer close on cancel (Esc / closedby) and light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onClose = () => setCondoPickerOpen(false);
    const onCancel = (e: Event) => {
      e.preventDefault();
      void closeTopLayer(dialog);
    };
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("cancel", onCancel);

    if ("closedBy" in HTMLDialogElement.prototype) {
      return () => {
        dialog.removeEventListener("close", onClose);
        dialog.removeEventListener("cancel", onCancel);
      };
    }

    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    let pressedOutside = false;
    const onDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) void closeTopLayer(dialog);
    };
    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, [setCondoPickerOpen]);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip text-[var(--ink-primary)]">
      {/* Phone-Optimised Liquid Glass Launch Loading Screen */}
      <InitialMobileSplash />

      {/* Ambient Atmospheric Bokeh Backdrop (skipped on full-bleed dish photo routes) */}
      {!isRecipeDetail && !isCookAlong && (
        <div aria-hidden="true" className="gr-ambient-bg print:hidden" />
      )}

      <div className="relative z-10">
        {/* Desktop Floating Liquid Glass Top Nav */}
        {!isCookAlong && (
          <header className="sticky top-0 z-40 hidden pt-3 md:block print:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
              <div className="liquid-glass flex w-full items-center justify-between rounded-full px-3 py-1.5">
                {/* Official Brand Lockup */}
                <Link href="/" className="pl-1.5">
                  <BrandLogo variant="lockup" size="sm" />
                </Link>

                {/* 4 Floating Tabs */}
                <nav
                  aria-label="Primary navigation"
                  className="flex items-center gap-1"
                >
                  {TABS.map(({ href, label, icon: Icon }) => {
                    const active =
                      href === "/"
                        ? pathname === "/" || pathname.startsWith("/recipe/")
                        : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                          active
                            ? "font-semibold text-[#0F172A]"
                            : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="desktop-nav-pill"
                            transition={APPLE_SPRING}
                            className="glass-capsule-active absolute inset-0 rounded-full"
                          />
                        )}
                        <Icon
                          className="relative z-10 h-4 w-4"
                          strokeWidth={1.75}
                          style={active ? { color: "#064E3B" } : undefined}
                        />
                        <span className="relative z-10">{label}</span>
                        {href === "/box" && totalDraftMeals > 0 && (
                          <span className="glass-btn-orange relative z-10 rounded-full px-1.5 py-0.2 text-[10px] font-bold text-white">
                            <PopNumber value={totalDraftMeals} />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Condo Pool Quick Pill */}
                <div className="flex items-center gap-2 pr-1">
                  {isPortal && (
                    <Link
                      href={pathname.startsWith("/admin") ? "/captain" : "/admin"}
                      className="glass-tile rounded-full px-3 py-1 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    >
                      {pathname.startsWith("/admin") ? "Captain View" : "Admin PO"}
                    </Link>
                  )}
                  {selectedPool && (
                    <button
                      type="button"
                      onClick={() => setCondoPickerOpen(true)}
                      className="glass-tile flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--ink-primary)] transition hover:brightness-110"
                    >
                      <span
                        className="pool-dot-pulse h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--status-pool)" }}
                      />
                      <span className="max-w-[130px] truncate">
                        {selectedPool.condo.name}
                      </span>
                      <span className="text-[var(--ink-secondary)] tabular-nums">
                        {selectedPool.joined_boxes}/{selectedPool.drop.target_boxes}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Mobile Compact Brand Bar */}
        {!hideMobileNav && (
          <header
            className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 pt-3.5 pb-0.5 md:hidden print:hidden ${
              activeTimer ? "mt-11" : ""
            }`}
          >
            <Link href="/" className="shrink-0">
              <BrandLogo variant="lockup" size="sm" />
            </Link>

            {selectedPool && (
              <button
                type="button"
                onClick={() => setCondoPickerOpen(true)}
                className="glass-tile flex min-w-0 max-w-[54vw] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[var(--ink-primary)]"
              >
                <span
                  className="pool-dot-pulse h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--status-pool)" }}
                />
                <span className="truncate">{selectedPool.condo.name}</span>
                <span className="shrink-0 text-[var(--ink-secondary)] tabular-nums">
                  {selectedPool.joined_boxes}/{selectedPool.drop.target_boxes}
                </span>
              </button>
            )}
          </header>
        )}

        {/* Dynamic Island Live Activity Pill */}
        <div className="pointer-events-none fixed top-3 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 md:top-[68px] print:hidden">
          <AnimatePresence>
            {activeTimer && !isCookAlong && (
              <motion.div
                key="dynamic-island-timer"
                initial={{ opacity: 0, y: -16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.92 }}
                transition={APPLE_SPRING}
                className="pointer-events-auto"
              >
                <Link
                  href={`/cook/${activeTimer.slug}`}
                  className="flex items-center gap-2.5 rounded-full border border-white/25 bg-[#0B1215]/85 px-3.5 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl transition hover:scale-[1.02]"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeTimer.finished
                        ? "bg-emerald-400"
                        : activeTimer.running
                          ? "animate-pulse bg-[#FB923C]"
                          : "bg-slate-400"
                    }`}
                  />
                  <span className="max-w-[140px] truncate">
                    {activeTimer.recipeTitle}
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[#FB923C] tabular-nums">
                    {activeTimer.finished
                      ? "Done!"
                      : formatCountdown(activeTimer.remainingSeconds)}
                  </span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Toast Feedback */}
        <div
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 md:bottom-6 print:hidden"
          role="status"
          aria-live="polite"
        >
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                key={toastMessage}
                initial={{ opacity: 0, y: 14, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={APPLE_SPRING}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/25 bg-[#0B1215]/85 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2} />
                <span className="truncate">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page Body */}
        <div
          className={`${isCookAlong ? "" : hideMobileNav ? "pb-6 md:pb-12" : "pb-32 md:pb-12"} ${
            activeTimer && !isCookAlong && hideMobileNav ? "pt-12 md:pt-0" : ""
          }`}
        >
          {isCookAlong ? (
            children
          ) : (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: SMOOTH_EASE }}
            >
              {children}
            </motion.div>
          )}
        </div>

        {/* Mobile Floating Liquid Glass Bottom Tab Bar */}
        {!hideMobileNav && (
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-4 z-40 md:hidden print:hidden"
            style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="liquid-glass mx-auto grid max-w-md grid-cols-4 rounded-full p-1">
              {TABS.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/"
                    ? pathname === "/" || pathname.startsWith("/recipe/")
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex flex-col items-center justify-center gap-0.5 rounded-full py-2 text-[11px] font-medium transition-colors ${
                      active
                        ? "font-semibold text-[#0F172A]"
                        : "text-[var(--ink-secondary)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="mobile-nav-pill"
                        transition={APPLE_SPRING}
                        className="glass-capsule-active absolute inset-0 rounded-full"
                      />
                    )}
                    <div className="relative z-10">
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={1.75}
                        style={active ? { color: "#064E3B" } : undefined}
                      />
                      {href === "/box" && totalDraftMeals > 0 && (
                        <span className="glass-btn-orange absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white">
                          <PopNumber value={totalDraftMeals} />
                        </span>
                      )}
                      {href === "/timers" && activeTimer && (
                        <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-[#EA580C]" />
                      )}
                    </div>
                    <span className="relative z-10">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Native <dialog> Condo Pool Matcher Modal */}
        <dialog
          ref={dialogRef}
          aria-labelledby={dialogTitleId}
          {...({ closedby: "any" } as Record<string, string>)}
          className="glass-panel m-auto w-[min(92vw,460px)] overflow-hidden rounded-[28px] p-0 text-[var(--ink-primary)]"
        >
          <div className="max-h-[85dvh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandLogo variant="mark" size="sm" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-forest)]">
                    Sunday Lobby Delivery
                  </p>
                  <h2
                    id={dialogTitleId}
                    className="font-display mt-0.5 text-xl font-bold text-[var(--ink-primary)]"
                  >
                    Choose Your Condo
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void closeTopLayer(dialogRef.current)}
                aria-label="Close condo selector"
                className="glass-tile flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <p className="mt-2 text-xs text-[var(--ink-secondary)]">
              All neighbours in your condo share one Sunday van, so delivery is RM 0.
            </p>

            <div className="mt-4 space-y-2.5">
              {(state?.pool_summaries || []).map((ps) => {
                const isSelected = ps.condo.id === selectedCondoId;
                return (
                  <button
                    key={ps.condo.id}
                    type="button"
                    onClick={() => {
                      setSelectedCondoId(ps.condo.id);
                      void closeTopLayer(dialogRef.current);
                    }}
                    className={`glass-tile flex w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left transition ${
                      isSelected
                        ? "border-[var(--status-pool)] ring-1 ring-[var(--status-pool)]"
                        : "hover:brightness-105"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-[var(--brand-forest)]"
                          strokeWidth={1.75}
                        />
                        <span className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                          {ps.condo.name}
                        </span>
                        <span className="glass-btn-emerald rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
                          Confirmed
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--ink-secondary)]">
                        {ps.joined_boxes} of {ps.drop.target_boxes} neighbours joined ·{" "}
                        {ps.drop.pickup_window}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--ink-secondary)]">
                        {ps.condo.pickup_lobby} · {ps.condo.captain_name}
                      </p>
                    </div>

                    <PoolRing
                      joined={ps.joined_boxes}
                      target={ps.drop.target_boxes}
                      size={58}
                      strokeWidth={5}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </dialog>
      </div>
    </div>
  );
}
