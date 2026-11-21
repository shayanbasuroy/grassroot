"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  CreditCard,
  MapPin,
  Minus,
  PauseCircle,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import {
  APPLE_SPRING,
  FadeIn,
  PopNumber,
  SMOOTH_EASE,
} from "@/components/MotionPrimitives";
import { PoolRing } from "@/components/PoolRing";
import { closeTopLayer } from "@/lib/top-layer";
import type { BoxOrder, PaymentMethod } from "@/lib/types";

function useCutoffCountdown(cutoffIso?: string) {
  const [label, setLabel] = useState("...");
  useEffect(() => {
    if (!cutoffIso) return;
    const update = () => {
      const diff = new Date(cutoffIso).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Cutoff closed");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(
        d > 0
          ? `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`
          : `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [cutoffIso]);
  return label;
}

function DeterministicPassQr({ token }: { token: string }) {
  const cells = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < token.length; i++) {
      seed = (seed * 31 + token.charCodeAt(i)) >>> 0;
    }
    const grid: boolean[] = [];
    for (let i = 0; i < 49; i++) {
      const r = Math.floor(i / 7);
      const c = i % 7;
      const inCorner =
        (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
      if (inCorner) {
        grid.push(true);
      } else {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        grid.push((seed & 1) === 1);
      }
    }
    return grid;
  }, [token]);

  return (
    <div
      className="grid h-20 w-20 shrink-0 grid-cols-7 gap-0.5 rounded-xl bg-white p-1.5 shadow-xs ring-1 ring-black/10 sm:h-24 sm:w-24 sm:p-2"
      aria-label={`QR Code ${token}`}
    >
      {cells.map((on, i) => (
        <span
          key={i}
          className={`rounded-[1px] ${on ? "bg-[#0F172A]" : "bg-transparent"}`}
        />
      ))}
    </div>
  );
}

export default function MyBoxPage() {
  const {
    state,
    refresh,
    selectedCondoId,
    setCondoPickerOpen,
    draftBox,
    setPlanTier,
    setDishPortion,
    autoFillBox,
    setAddonQty,
    lastOrderIds,
    registerNewOrderId,
    showToast,
  } = useApp();

  const [boxTab, setBoxTab] = useState<"build" | "pass">("build");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("billplz_fpx");
  const [autoRenew, setAutoRenew] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [managingOrderId, setManagingOrderId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const payDialogRef = useRef<HTMLDialogElement | null>(null);
  const payTitleId = useId();

  const selectedPool =
    state?.pool_summaries.find((p) => p.condo.id === selectedCondoId) ||
    state?.pool_summaries[0];

  const cutoffCountdown = useCutoffCountdown(selectedPool?.drop.cutoff_at);

  const pooledRecipes = useMemo(
    () => (state?.recipes || []).filter((r) => r.is_pooled_this_week),
    [state]
  );

  const selectedPlan =
    state?.plans.find((p) => p.tier === draftBox.planTier) || state?.plans[1];

  const totalChosenMeals = Object.values(draftBox.portionsByRecipe).reduce(
    (s, n) => s + n,
    0
  );

  const addonsSubtotal = useMemo(() => {
    return (state?.addons || []).reduce(
      (sum, a) => sum + (draftBox.addons[a.id] || 0) * a.price_rm,
      0
    );
  }, [state, draftBox.addons]);

  const fpxFee = paymentMethod === "billplz_fpx" ? 1.25 : 0;
  const checkoutTotal = (selectedPlan?.price_rm || 0) + addonsSubtotal + fpxFee;

  const pickupPassOrder: BoxOrder | undefined = useMemo(() => {
    const orders = state?.orders || [];
    for (const id of lastOrderIds) {
      const hit = orders.find((o) => o.id === id);
      if (hit) return hit;
    }
    return orders.find((o) => o.condo_id === selectedCondoId) || orders[0];
  }, [state, lastOrderIds, selectedCondoId]);

  const recipeMap = useMemo(
    () => new Map((state?.recipes || []).map((r) => [r.id, r])),
    [state]
  );

  useEffect(() => {
    const dialog = payDialogRef.current;
    if (!dialog) return;

    const onCancel = (e: Event) => {
      e.preventDefault();
      void closeTopLayer(dialog);
    };
    dialog.addEventListener("cancel", onCancel);

    if ("closedBy" in HTMLDialogElement.prototype) {
      return () => dialog.removeEventListener("cancel", onCancel);
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
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  function handleOpenPayModal(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (totalChosenMeals <= 0) {
      setErrorMsg("Select at least 1 dish for your weekly box.");
      return;
    }
    if (!formRef.current?.reportValidity()) return;
    payDialogRef.current?.showModal();
  }

  async function handleConfirmBoxOrder() {
    if (!selectedPlan || !selectedPool || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const items = Object.entries(draftBox.portionsByRecipe)
        .filter(([, portions]) => portions > 0)
        .map(([recipe_id, portions]) => ({ recipe_id, portions }));

      const addons = Object.entries(draftBox.addons)
        .filter(([, qty]) => qty > 0)
        .map(([addon_id, qty]) => ({ addon_id, qty }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condo_id: selectedPool.condo.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          unit_no: unitNo,
          plan_tier: selectedPlan.tier,
          items,
          addons,
          payment_method: paymentMethod,
          auto_renew: autoRenew,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      registerNewOrderId(data.order.id);
      await closeTopLayer(payDialogRef.current);
      await refresh();
      setBoxTab("pass");
      showToast(`Confirmed ${data.order.box_code} · Pickup QR ready`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to place order");
      await closeTopLayer(payDialogRef.current);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManageOrder(
    order: BoxOrder,
    patch: { auto_renew?: boolean; paused?: boolean }
  ) {
    setManagingOrderId(order.id);
    try {
      const res = await fetch("/api/orders/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, ...patch }),
      });
      if (res.ok) {
        await refresh();
        showToast(
          patch.paused !== undefined
            ? patch.paused
              ? "Box paused for this week"
              : "Box resumed for Sunday drop"
            : "Auto renewal preference updated"
        );
      }
    } finally {
      setManagingOrderId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-4 pt-3 sm:px-6 md:pt-8">
      <FadeIn className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-forest)]">
            Sunday Lobby Box · RM 0 Delivery
          </p>
          <h1 className="font-display mt-0.5 text-[28px] font-bold leading-[1.15] text-[var(--ink-primary)] sm:text-[34px]">
            My Sunday Box
          </h1>
        </div>

        {/* 2-Mode Specular Track Control: Build Box vs My Pickup Pass */}
        <div
          role="tablist"
          aria-label="Box mode"
          className="glass-track flex w-full items-center rounded-full p-1 sm:w-auto"
        >
          {(
            [
              { id: "build", label: "Build Sunday Box" },
              { id: "pass", label: "My Pickup Pass" },
            ] as const
          ).map((t) => {
            const active = boxTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setBoxTab(t.id)}
                className={`relative flex-1 rounded-full px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                  active
                    ? "text-[#0F172A]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="box-mode-pill"
                    transition={APPLE_SPRING}
                    className="glass-capsule-active absolute inset-0 rounded-full"
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      <AnimatePresence mode="wait">
        {/* Mode 1: My Pickup Pass */}
        {boxTab === "pass" && (
          <motion.div
            key="box-tab-pass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: SMOOTH_EASE }}
            className="mt-6 max-w-xl"
          >
            {pickupPassOrder ? (
              <section className="pass-sheen rounded-[28px] border border-white/22 bg-[linear-gradient(155deg,rgba(14,62,48,0.78),rgba(9,34,28,0.94))] p-5 text-white shadow-[0_22px_50px_-14px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.3)] backdrop-blur-2xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                      <BrandLogo variant="mark" size="sm" />
                      <span>GrassRoot · Sunday Pickup Pass</span>
                      {pickupPassOrder.handed_over_at && (
                        <span className="rounded-full border border-emerald-300/40 bg-emerald-400/20 px-2 py-0.5 text-emerald-100">
                          Collected
                        </span>
                      )}
                      {pickupPassOrder.paused && (
                        <span className="rounded-full border border-amber-300/40 bg-amber-400/20 px-2 py-0.5 text-amber-100">
                          Paused This Week
                        </span>
                      )}
                    </div>
                    <h2 className="font-display mt-2.5 text-2xl font-bold tabular-nums">
                      {pickupPassOrder.box_code} · {pickupPassOrder.meal_count} meals
                    </h2>
                    <p className="mt-1 text-xs text-emerald-100/90">
                      {pickupPassOrder.customer_name} · Unit{" "}
                      {pickupPassOrder.unit_no}
                    </p>
                    <p className="mt-1 font-mono text-xs text-emerald-200">
                      Token: {pickupPassOrder.pickup_qr_token}
                    </p>
                  </div>

                  <DeterministicPassQr token={pickupPassOrder.pickup_qr_token} />
                </div>

                <p className="mt-4 rounded-2xl border border-white/20 bg-black/25 px-3.5 py-2.5 text-xs text-emerald-100 backdrop-blur-xs">
                  Show this QR to{" "}
                  <strong>{selectedPool?.condo.captain_name}</strong> at{" "}
                  <strong>{selectedPool?.condo.pickup_lobby}</strong> (
                  {selectedPool?.drop.pickup_window}).
                </p>

                {/* Start Cooking Buttons for Dishes Inside Box */}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/85">
                    Dishes in your box
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pickupPassOrder.items.map((it) => {
                      const rec = recipeMap.get(it.recipe_id);
                      if (!rec) return null;
                      return (
                        <Link
                          key={it.recipe_id}
                          href={`/cook/${rec.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/25"
                        >
                          <Play className="h-3 w-3" />
                          Cook {rec.cuisine_tag} ({it.portions}×)
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-4 text-xs">
                  <button
                    type="button"
                    disabled={managingOrderId === pickupPassOrder.id}
                    onClick={() =>
                      handleManageOrder(pickupPassOrder, {
                        auto_renew: !pickupPassOrder.auto_renew,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 font-semibold transition hover:bg-white/25"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {pickupPassOrder.auto_renew
                      ? "Weekly Auto Renew On"
                      : "One Time Box"}
                  </button>
                  <button
                    type="button"
                    disabled={managingOrderId === pickupPassOrder.id}
                    onClick={() =>
                      handleManageOrder(pickupPassOrder, {
                        paused: !pickupPassOrder.paused,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 font-semibold transition hover:bg-white/25"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    {pickupPassOrder.paused ? "Resume Box" : "Skip This Week"}
                  </button>
                </div>
              </section>
            ) : (
              <div className="glass-panel rounded-[24px] p-8 text-center">
                <p className="text-sm font-semibold text-[var(--ink-primary)]">
                  No Sunday box ordered yet
                </p>
                <button
                  type="button"
                  onClick={() => setBoxTab("build")}
                  className="glass-btn-orange mt-3 rounded-full px-5 py-2 text-xs font-bold text-white"
                >
                  Build Your Box
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Mode 2: Build Sunday Box */}
        {boxTab === "build" && (
          <motion.div
            key="box-tab-build"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: SMOOTH_EASE }}
          >
            {/* Compact Condo Delivery Status Strip */}
            {selectedPool && (
              <section className="glass-panel mt-5 flex items-center justify-between gap-4 rounded-[24px] p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-primary)]">
                      <MapPin
                        className="h-3.5 w-3.5 text-[var(--status-pool)]"
                        strokeWidth={1.75}
                      />
                      {selectedPool.condo.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCondoPickerOpen(true)}
                      className="text-xs font-semibold text-[var(--brand-forest)] underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                    <strong className="text-[var(--ink-primary)] tabular-nums">
                      {selectedPool.joined_boxes} of{" "}
                      {selectedPool.drop.target_boxes}
                    </strong>{" "}
                    neighbours joined · Sunday delivery confirmed (RM 0 fee)
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--brand-orange)] tabular-nums">
                    <Clock className="h-3 w-3" strokeWidth={1.75} />
                    Order closes in {cutoffCountdown} (Fri 8 PM)
                  </p>
                </div>

                <PoolRing
                  joined={selectedPool.joined_boxes}
                  target={selectedPool.drop.target_boxes}
                  size={62}
                  strokeWidth={6}
                />
              </section>
            )}

            {/* Main Builder + Checkout Split */}
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left 7 Cols: Box Size + Dishes + Optional Extras */}
              <div className="min-w-0 space-y-6 lg:col-span-7">
                {/* 1. Choose Box Size */}
                <section>
                  <h2 className="font-display text-base font-bold text-[var(--ink-primary)] sm:text-lg">
                    1. Choose Box Size
                  </h2>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(state?.plans || []).map((plan, idx) => {
                      const active = plan.tier === draftBox.planTier;
                      return (
                        <motion.button
                          key={plan.tier}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: idx * 0.04,
                            ease: SMOOTH_EASE,
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPlanTier(plan.tier)}
                          className={`glass-tile flex flex-col justify-between rounded-[20px] p-3.5 text-left transition ${
                            active
                              ? "border-[#EA580C] bg-orange-500/12 ring-1 ring-[#FB923C]"
                              : "hover:brightness-105"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-[var(--ink-primary)]">
                              {plan.meals} Meals
                            </div>
                            <p className="mt-0.5 text-[11px] text-[var(--ink-secondary)]">
                              {plan.name}
                            </p>
                          </div>
                          <div className="mt-2.5 tabular-nums">
                            <div className="text-base font-bold text-[var(--ink-primary)]">
                              RM {plan.price_rm}
                            </div>
                            <div className="text-[11px] font-medium text-[var(--brand-forest)]">
                              RM {plan.per_meal_rm.toFixed(2)}/meal
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Pick Your Dishes */}
                <section className="glass-panel rounded-[24px] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold text-[var(--ink-primary)] sm:text-lg">
                        2. Pick Your Dishes
                      </h2>
                      <p className="text-xs text-[var(--ink-secondary)] tabular-nums">
                        <PopNumber value={totalChosenMeals} /> of{" "}
                        {selectedPlan?.meals || 5} meals chosen
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={autoFillBox}
                      className="glass-tile rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:brightness-110"
                    >
                      Auto Fill
                    </button>
                  </div>

                  <div className="mt-3 divide-y divide-[var(--border-hairline)]">
                    {pooledRecipes.map((rec) => {
                      const count = draftBox.portionsByRecipe[rec.id] || 0;
                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rec.hero_image_url}
                              alt={rec.title}
                              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/20 sm:h-14 sm:w-14 sm:rounded-2xl"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/recipe/${rec.slug}`}
                                className="block truncate text-xs font-semibold text-[var(--ink-primary)] hover:underline sm:text-sm"
                              >
                                {rec.title}
                              </Link>
                              <p className="text-[11px] text-[var(--ink-secondary)]">
                                {rec.appliance_tag} · {rec.prep_mins + rec.cook_mins}m
                              </p>
                              {rec.fmcg_sponsor_note && count > 0 && (
                                <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--brand-forest)]">
                                  Included: {rec.fmcg_sponsor_note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={count <= 0}
                              onClick={() => setDishPortion(rec.id, -1)}
                              aria-label={`Remove portion of ${rec.title}`}
                              className="glass-tile flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-primary)] disabled:opacity-30"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <PopNumber
                              value={count}
                              className="w-5 text-center text-sm font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => setDishPortion(rec.id, 1)}
                              aria-label={`Add portion of ${rec.title}`}
                              className="glass-tile flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-primary)] transition hover:brightness-115"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 3. Add Extras (Optional) */}
                <section>
                  <div className="mb-2.5">
                    <h2 className="font-display text-base font-bold text-[var(--ink-primary)] sm:text-lg">
                      3. Add Extras (Optional)
                    </h2>
                    <p className="text-xs text-[var(--ink-secondary)]">
                      Delivered in the same Sunday box with RM 0 extra shipping.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {(state?.addons || []).map((addon) => {
                      const qty = draftBox.addons[addon.id] || 0;
                      return (
                        <div
                          key={addon.id}
                          className="glass-tile flex min-w-0 items-center justify-between gap-2.5 rounded-[20px] p-3.5"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-[var(--ink-primary)]">
                              {addon.name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--ink-secondary)]">
                              {addon.weight_label}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums">
                              <span className="font-bold text-[var(--brand-orange)]">
                                +RM {addon.price_rm.toFixed(2)}
                              </span>
                              <span className="text-[var(--ink-secondary)] line-through">
                                RM {addon.retail_rm.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={qty <= 0}
                              onClick={() => setAddonQty(addon.id, -1)}
                              aria-label={`Remove ${addon.name}`}
                              className="glass-tile flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <PopNumber
                              value={qty}
                              className="w-4 text-center text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => setAddonQty(addon.id, 1)}
                              aria-label={`Add ${addon.name}`}
                              className="glass-tile flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-primary)] transition hover:brightness-115"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right 5 Cols: Details & Payment */}
              <aside className="min-w-0 lg:sticky lg:top-24 lg:col-span-5">
                <form
                  ref={formRef}
                  onSubmit={handleOpenPayModal}
                  className="glass-panel rounded-[24px] p-5"
                >
                  <h2 className="font-display text-base font-bold text-[var(--ink-primary)] sm:text-lg">
                    4. Your Details &amp; Payment
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                    {selectedPool?.condo.name} · {selectedPool?.drop.pickup_window}
                  </p>

                  {errorMsg && (
                    <div className="mt-3 rounded-2xl border border-red-400/50 bg-red-500/15 px-3.5 py-2.5 text-xs font-medium text-red-200">
                      {errorMsg}
                    </div>
                  )}

                  <div className="mt-4 space-y-3.5">
                    <div className="gr-field min-w-0">
                      <label
                        htmlFor="box-name"
                        className="block text-xs font-semibold text-[var(--ink-primary)]"
                      >
                        Full Name
                      </label>
                      <span
                        id="box-name-hint"
                        className="block text-[11px] text-[var(--ink-secondary)]"
                      >
                        Printed on your chilled box label
                      </span>
                      <input
                        id="box-name"
                        type="text"
                        required
                        minLength={2}
                        autoComplete="name"
                        aria-describedby="box-name-hint"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Daniel Lim"
                        className="glass-input mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm focus:border-[var(--brand-forest)] focus:outline-none"
                      />
                      <div className="gr-error-msg">
                        Please enter your name (at least 2 characters).
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="gr-field min-w-0">
                        <label
                          htmlFor="box-phone"
                          className="block text-xs font-semibold text-[var(--ink-primary)]"
                        >
                          WhatsApp Number
                        </label>
                        <span
                          id="box-phone-hint"
                          className="block text-[11px] text-[var(--ink-secondary)]"
                        >
                          Format: 01X-XXXXXXX
                        </span>
                        <input
                          id="box-phone"
                          type="tel"
                          required
                          pattern="(\+?6?01[0-9][- ]?[0-9]{7,8})"
                          autoComplete="tel"
                          aria-describedby="box-phone-hint"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="012-3456789"
                          className="glass-input mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm focus:border-[var(--brand-forest)] focus:outline-none"
                        />
                        <div className="gr-error-msg">
                          Enter a valid Malaysian mobile number.
                        </div>
                      </div>

                      <div className="gr-field min-w-0">
                        <label
                          htmlFor="box-unit"
                          className="block text-xs font-semibold text-[var(--ink-primary)]"
                        >
                          Condo Unit No.
                        </label>
                        <span
                          id="box-unit-hint"
                          className="block text-[11px] text-[var(--ink-secondary)]"
                        >
                          e.g. A-14-05
                        </span>
                        <input
                          id="box-unit"
                          type="text"
                          required
                          minLength={2}
                          aria-describedby="box-unit-hint"
                          value={unitNo}
                          onChange={(e) => setUnitNo(e.target.value)}
                          placeholder="A-14-05"
                          className="glass-input mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm focus:border-[var(--brand-forest)] focus:outline-none"
                        />
                        <div className="gr-error-msg">
                          Enter your unit number.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Toggle */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-[var(--ink-primary)]">
                      Malaysian Payment Method
                    </p>
                    <div className="glass-track mt-2 grid grid-cols-2 gap-1 rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("billplz_fpx")}
                        className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                          paymentMethod === "billplz_fpx"
                            ? "text-[#0F172A]"
                            : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        {paymentMethod === "billplz_fpx" && (
                          <motion.span
                            layoutId="box-payment-pill"
                            transition={APPLE_SPRING}
                            className="glass-capsule-active absolute inset-0 rounded-xl"
                          />
                        )}
                        <CreditCard className="relative z-10 h-3.5 w-3.5 shrink-0" />
                        <span className="relative z-10">FPX Banking</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("duitnow_qr")}
                        className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                          paymentMethod === "duitnow_qr"
                            ? "text-[#0F172A]"
                            : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        {paymentMethod === "duitnow_qr" && (
                          <motion.span
                            layoutId="box-payment-pill"
                            transition={APPLE_SPRING}
                            className="glass-capsule-active absolute inset-0 rounded-xl"
                          />
                        )}
                        <QrCode className="relative z-10 h-3.5 w-3.5 shrink-0" />
                        <span className="relative z-10">DuitNow QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Weekly Auto Renew */}
                  <button
                    type="button"
                    onClick={() => setAutoRenew((v) => !v)}
                    className="glass-tile mt-4 flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--ink-primary)]">
                        Weekly Auto Renew
                      </div>
                      <div className="text-[11px] text-[var(--ink-secondary)]">
                        Pause or skip anytime up to 48h before cutoff
                      </div>
                    </div>
                    <span
                      className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
                        autoRenew
                          ? "justify-end bg-[var(--status-pool)]"
                          : "justify-start bg-slate-400/60"
                      }`}
                    >
                      <motion.span
                        layout
                        transition={APPLE_SPRING}
                        className="h-5 w-5 rounded-full bg-white shadow-xs"
                      />
                    </span>
                  </button>

                  {/* Summary Breakdown */}
                  <div className="mt-4 space-y-1.5 border-t border-[var(--border-hairline)] pt-4 text-xs">
                    <div className="flex justify-between text-[var(--ink-secondary)]">
                      <span>
                        {selectedPlan?.name} ({selectedPlan?.meals} meals)
                      </span>
                      <span className="font-medium text-[var(--ink-primary)] tabular-nums">
                        RM {(selectedPlan?.price_rm || 0).toFixed(2)}
                      </span>
                    </div>
                    {addonsSubtotal > 0 && (
                      <div className="flex justify-between text-[var(--ink-secondary)]">
                        <span>Free Delivery Extras</span>
                        <span className="font-medium text-[var(--ink-primary)] tabular-nums">
                          RM {addonsSubtotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[var(--ink-secondary)]">
                      <span>Chilled Van Lobby Delivery</span>
                      <span className="font-semibold text-[var(--brand-forest)]">
                        RM 0.00
                      </span>
                    </div>
                    {fpxFee > 0 && (
                      <div className="flex justify-between text-[var(--ink-secondary)]">
                        <span>Billplz FPX Gateway Fee</span>
                        <span className="tabular-nums">RM {fpxFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between pt-2 text-base font-bold text-[var(--ink-primary)]">
                      <span>Total</span>
                      <PopNumber
                        value={`RM ${checkoutTotal.toFixed(2)}`}
                        className="text-xl"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    className="glass-btn-orange mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                  >
                    Pay &amp; Confirm Box · RM {checkoutTotal.toFixed(2)}
                  </motion.button>
                </form>
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Native <dialog> Billplz FPX / DuitNow QR Checkout Modal */}
      <dialog
        ref={payDialogRef}
        aria-labelledby={payTitleId}
        {...({ closedby: "any" } as Record<string, string>)}
        className="glass-panel m-auto w-[min(92vw,390px)] overflow-hidden rounded-[28px] p-0 text-[var(--ink-primary)]"
      >
        <div className="max-h-[85dvh] overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="mark" size="sm" />
              <h2
                id={payTitleId}
                className="font-display text-lg font-bold text-[var(--ink-primary)]"
              >
                {paymentMethod === "billplz_fpx"
                  ? "Billplz FPX Verification"
                  : "DuitNow QR Payment"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void closeTopLayer(payDialogRef.current)}
              aria-label="Close payment modal"
              className="glass-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink-secondary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            {selectedPool?.condo.name} · Unit {unitNo || "N/A"}
          </p>

          <div className="glass-tile mt-4 flex flex-col items-center rounded-2xl p-5">
            {paymentMethod === "duitnow_qr" ? (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-[#ed2c66] bg-white p-3">
                <QrCode className="h-28 w-28 text-[#0F172A]" />
              </div>
            ) : (
              <div className="flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-[var(--border-hairline)] bg-[var(--glass-subtle-bg)] px-4 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-forest)]">
                  Billplz Malaysia FPX
                </span>
                <span className="mt-1 text-xs text-[var(--ink-secondary)]">
                  Maybank2u · CIMB Clicks · Public Bank · RHB
                </span>
              </div>
            )}
            <div className="mt-3 text-xl font-bold text-[var(--ink-primary)] tabular-nums">
              RM {checkoutTotal.toFixed(2)}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              autoFocus
              disabled={submitting}
              onClick={handleConfirmBoxOrder}
              className="glass-btn-emerald inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting
                ? "Confirming Order..."
                : "Simulate Payment Success & Get Pickup QR"}
            </button>
            <button
              type="button"
              onClick={() => void closeTopLayer(payDialogRef.current)}
              className="w-full rounded-full py-2 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
