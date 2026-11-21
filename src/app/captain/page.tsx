"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  QrCode,
  ScanLine,
  Wallet,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import {
  APPLE_SPRING,
  FadeIn,
  SMOOTH_EASE,
} from "@/components/MotionPrimitives";

export default function BuildingCaptainPage() {
  const { state, refresh, selectedCondoId, setSelectedCondoId, showToast } =
    useApp();

  const [scanToken, setScanToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanMessage, setScanMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const selectedPool =
    state?.pool_summaries.find((p) => p.condo.id === selectedCondoId) ||
    state?.pool_summaries[0];

  const condoOrders = useMemo(
    () =>
      (state?.orders || []).filter((o) => o.condo_id === selectedPool?.condo.id),
    [state, selectedPool]
  );

  const recipeMap = useMemo(
    () => new Map((state?.recipes || []).map((r) => [r.id, r])),
    [state]
  );

  const handedOverCount = condoOrders.filter((o) =>
    Boolean(o.handed_over_at)
  ).length;

  async function handleHandover(tokenOrId: string, markLate = false) {
    if (!tokenOrId.trim() || submitting) return;
    setSubmitting(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/captain/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_or_order_id: tokenOrId.trim(),
          mark_late: markLate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid QR token");

      setScanToken("");
      setScanMessage({
        type: "ok",
        text: markLate
          ? `Flagged ${data.order.box_code} (${data.order.unit_no}) as late pickup`
          : `Handed over ${data.order.box_code} (${data.order.unit_no}) to ${data.order.customer_name}`,
      });
      await refresh();
      showToast(
        markLate ? "Marked late pickup" : `${data.order.box_code} handed over`
      );
    } catch (err) {
      setScanMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Scan failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl overflow-x-clip px-4 pt-3 sm:px-6 md:pt-8">
      {/* Header */}
      <FadeIn className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--status-pool)]">
            Building Captain Portal
          </p>
          <h1 className="font-display mt-0.5 text-[28px] font-bold leading-[1.15] text-[var(--ink-primary)] sm:text-[32px]">
            Lobby QR Scanner
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-secondary)]">
            Captain: <strong>{selectedPool?.condo.captain_name}</strong> ·{" "}
            {selectedPool?.condo.pickup_lobby} · {selectedPool?.drop.pickup_window}
          </p>
        </div>

        <div className="glass-tile flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[var(--brand-forest)]">
          <Wallet className="h-4 w-4" strokeWidth={1.75} />
          RM {selectedPool?.drop.captain_fee_rm || 35} Drop Payout
        </div>
      </FadeIn>

      {/* Condo Switcher */}
      <div className="no-scrollbar mt-5 flex w-full gap-2 overflow-x-auto pb-1">
        {(state?.pool_summaries || []).map((ps) => {
          const active = ps.condo.id === selectedPool?.condo.id;
          return (
            <button
              key={ps.condo.id}
              type="button"
              onClick={() => setSelectedCondoId(ps.condo.id)}
              className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "text-[#0F172A]"
                  : "glass-tile text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="captain-condo-pill"
                  transition={APPLE_SPRING}
                  className="glass-capsule-active absolute inset-0 rounded-full"
                />
              )}
              <span className="relative z-10">{ps.condo.name}</span>
            </button>
          );
        })}
      </div>

      {/* QR Pass Scanner Box */}
      <FadeIn delay={0.06}>
        <section className="glass-panel mt-5 rounded-[24px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-[var(--brand-orange)]" />
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                Scan Resident Pickup QR Token
              </h2>
            </div>
            <span className="text-xs font-medium text-[var(--ink-secondary)] tabular-nums">
              {handedOverCount} / {condoOrders.length} active passes verified
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleHandover(scanToken, false);
            }}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <QrCode className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-[var(--ink-secondary)]" />
              <input
                type="text"
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                placeholder="Enter QR token (e.g. GR-GEO-104) or BOX #14"
                aria-label="Pickup QR token"
                className="glass-input w-full rounded-full py-2.5 pr-4 pl-10 font-mono text-sm focus:border-[var(--brand-forest)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !scanToken.trim()}
              className="glass-btn-orange w-full rounded-full px-5 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40 sm:w-auto"
            >
              {submitting ? "Verifying..." : "Verify & Hand Over"}
            </button>
          </form>

          <AnimatePresence>
            {scanMessage && (
              <motion.div
                key={scanMessage.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={APPLE_SPRING}
                className={`mt-3 flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-medium ${
                  scanMessage.type === "ok"
                    ? "border-emerald-400/40 bg-emerald-500/15 text-[var(--brand-forest)]"
                    : "border-red-400/40 bg-red-500/15 text-red-400"
                }`}
              >
                {scanMessage.type === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{scanMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </FadeIn>

      {/* Resident Manifest */}
      <section className="mt-5 space-y-2.5">
        {condoOrders.length === 0 ? (
          <div className="glass-panel rounded-[24px] p-8 text-center text-xs text-[var(--ink-secondary)]">
            No checked-out boxes for {selectedPool?.condo.name} yet.
          </div>
        ) : (
          condoOrders.map((order, idx) => {
            const done = Boolean(order.handed_over_at);
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: idx * 0.04,
                  ease: SMOOTH_EASE,
                }}
                className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[22px] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="glass-tile rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--ink-primary)]">
                      {order.box_code}
                    </span>
                    <span className="glass-tile rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--ink-primary)]">
                      Unit {order.unit_no}
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink-primary)]">
                      {order.customer_name}
                    </span>
                  </div>

                  <p className="mt-1 font-mono text-[11px] text-[var(--ink-secondary)]">
                    QR: {order.pickup_qr_token} · {order.meal_count} meals ·{" "}
                    {order.customer_phone}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-[var(--ink-secondary)]">
                    {order.items.map((it) => (
                      <span
                        key={it.recipe_id}
                        className="rounded-full border border-[var(--border-hairline)] bg-[var(--glass-subtle-bg)] px-2 py-0.5"
                      >
                        {it.portions}×{" "}
                        {recipeMap.get(it.recipe_id)?.cuisine_tag || it.recipe_id}
                      </span>
                    ))}
                  </div>
                </div>

                {done ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-[var(--brand-forest)]">
                    <CheckCircle2 className="h-4 w-4" />
                    Handed Over
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleHandover(order.pickup_qr_token, true)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        order.late_pickup
                          ? "glass-btn-orange text-white"
                          : "glass-tile text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {order.late_pickup ? "Late Logged" : "Late"}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleHandover(order.pickup_qr_token, false)}
                      className="glass-btn-emerald rounded-full px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                    >
                      Scan / Mark Done
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </section>
    </main>
  );
}
