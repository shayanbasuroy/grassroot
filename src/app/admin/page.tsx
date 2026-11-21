"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardCopy,
  Download,
  Heart,
  Package,
  Printer,
  RotateCcw,
  Truck,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import {
  APPLE_SPRING,
  FadeIn,
  SMOOTH_EASE,
} from "@/components/MotionPrimitives";

type AdminTab = "po" | "labels" | "van" | "votes";

export default function AdminProcurementPage() {
  const { state, refresh, showToast } = useApp();
  const [tab, setTab] = useState<AdminTab>("po");
  const [resetting, setResetting] = useState(false);

  const econ = state?.unit_economics;
  const poLines = state?.procurement_lines || [];
  const labels = state?.kitchen_labels || [];
  const vanRows = state?.van_manifest || [];
  const rankedVotes = [...(state?.recipes || [])].sort(
    (a, b) => b.votes_count - a.votes_count
  );
  const maxVotes = Math.max(1, rankedVotes[0]?.votes_count || 1);

  async function handleReset() {
    setResetting(true);
    try {
      await fetch("/api/admin/reset", { method: "POST" });
      await refresh();
      showToast("Demo data reset to Sunday Finals baseline");
    } finally {
      setResetting(false);
    }
  }

  function handleDownloadCsv() {
    if (poLines.length === 0) return;
    const header = [
      "SKU ID",
      "Raw Ingredient",
      "Supplier",
      "Total Qty",
      "Unit",
      "Portions",
      "Est Cost (RM)",
    ];
    const rows = poLines.map((l) => [
      l.sku_id,
      `"${l.ingredient_name}"`,
      `"${l.supplier_name}"`,
      l.raw_qty.toFixed(2),
      l.raw_unit,
      String(l.total_portions),
      l.estimated_cost_rm.toFixed(2),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grassroot-supplier-po-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded raw-weight Supplier PO CSV");
  }

  function handleCopyPo() {
    const lines = [
      "GRASSROOT WEEKLY PO — FRIDAY 8:00 PM CUTOFF",
      `Active Boxes: ${econ?.total_active_boxes || 0} | Total Meals: ${
        econ?.total_meals || 0
      }`,
      "--------------------------------------------",
      ...poLines.map(
        (l) =>
          `• ${l.raw_qty.toFixed(1)} ${l.raw_unit} — ${l.ingredient_name} (${
            l.supplier_name
          })`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    showToast("Copied Supplier PO to clipboard");
  }

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-4 pt-3 sm:px-6 md:pt-8">
      {/* Header */}
      <FadeIn className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-forest)]">
            Friday 8:00 PM Cutoff Rollup
          </p>
          <h1 className="font-display mt-0.5 text-[28px] font-bold leading-[1.15] text-[var(--ink-primary)] sm:text-[32px]">
            Procurement &amp; Unit Economics
          </h1>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="glass-tile inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:brightness-110 disabled:opacity-50"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
          Reset Demo Data
        </button>
      </FadeIn>

      {/* Unit Economics 4-Column Ledger */}
      {econ && (
        <FadeIn delay={0.04}>
          <section className="glass-panel mt-5 overflow-hidden rounded-[24px]">
            <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border-hairline)] sm:grid-cols-4 sm:divide-y-0">
              <div className="min-w-0 p-3.5 sm:p-4">
                <div className="truncate text-[11px] text-[var(--ink-secondary)] sm:text-xs">
                  Pooled Batch GMV
                </div>
                <div className="font-display mt-1 truncate text-base font-bold text-[var(--ink-primary)] tabular-nums sm:text-2xl">
                  RM {econ.batch_gmv_rm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 truncate text-[11px] text-[var(--ink-secondary)] tabular-nums">
                  {econ.total_active_boxes} boxes · {econ.total_meals} meals
                </div>
              </div>

              <div className="min-w-0 p-3.5 sm:p-4">
                <div className="truncate text-[11px] text-[var(--ink-secondary)] sm:text-xs">
                  Raw COGS (RM 7/meal)
                </div>
                <div className="font-display mt-1 truncate text-base font-bold text-[var(--ink-primary)] tabular-nums sm:text-2xl">
                  RM {econ.raw_cogs_rm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 truncate text-[11px] text-[var(--ink-secondary)] tabular-nums">
                  Van RM {econ.van_logistics_rm} · Capt RM {econ.captain_payouts_rm}
                </div>
              </div>

              <div className="min-w-0 p-3.5 sm:p-4">
                <div className="truncate text-[11px] text-[var(--ink-secondary)] sm:text-xs">
                  Contribution Margin
                </div>
                <div className="font-display mt-1 truncate text-base font-bold text-[var(--brand-forest)] tabular-nums sm:text-2xl">
                  {econ.contribution_margin_pct}%
                </div>
                <div className="mt-1 truncate text-[11px] text-[var(--ink-secondary)] tabular-nums">
                  RM {econ.net_contribution_rm.toLocaleString("en-MY", { minimumFractionDigits: 2 })} net
                </div>
              </div>

              <div className="min-w-0 p-3.5 sm:p-4">
                <div className="truncate text-[11px] text-[var(--ink-secondary)] sm:text-xs">
                  Fixed Tech/Ops
                </div>
                <div className="font-display mt-1 truncate text-base font-bold text-[var(--ink-primary)] tabular-nums sm:text-2xl">
                  RM {econ.fixed_monthly_overhead_rm}/mo
                </div>
                <div className="mt-1 truncate text-[11px] text-[var(--brand-forest)]">
                  Within ≤ RM {econ.fixed_monthly_cap_rm}/mo
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-hairline)] bg-[var(--glass-subtle-bg)] px-4 py-2 text-[11px] text-[var(--ink-secondary)]">
              {econ.fixed_overhead_breakdown.map((item) => (
                <span key={item.label} className="tabular-nums">
                  {item.label}: <strong>RM {item.cost_rm}</strong>
                </span>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Focused Workspace Tabs */}
      <div
        role="tablist"
        aria-label="Admin procurement tabs"
        className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1 print:hidden"
      >
        {[
          { id: "po" as const, label: `Raw-Weight Supplier PO (${poLines.length})` },
          { id: "labels" as const, label: `Halal Kitchen Labels (${labels.length})` },
          { id: "van" as const, label: `Lalamove Van Manifest (${vanRows.length})` },
          { id: "votes" as const, label: "Next-Week Pool Votes" },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                active
                  ? "text-[#0F172A]"
                  : "glass-tile text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-tab-pill"
                  transition={APPLE_SPRING}
                  className="glass-capsule-active absolute inset-0 rounded-full"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: Raw-Weight Supplier PO */}
        {tab === "po" && (
          <motion.section
            key="admin-tab-po"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: SMOOTH_EASE }}
            className="glass-panel mt-4 rounded-[24px] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
              <div>
                <h2
                  id="po-table-heading"
                  className="font-display text-base font-bold text-[var(--ink-primary)]"
                >
                  Consolidated Klang Valley Supplier Purchase Order
                </h2>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Automatically converts all weekly boxes &amp; add-ons into raw
                  weights (kg / L / packs).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleCopyPo}
                  className="glass-tile inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copy PO
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="glass-tile inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="glass-btn-orange inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-labelledby="po-table-heading"
              className="gr-table-wrapper mt-4"
            >
              <table className="gr-table text-left text-xs">
                <thead className="border-b border-[var(--border-hairline)] text-[11px] uppercase tracking-wider text-[var(--ink-secondary)]">
                  <tr>
                    <th className="py-2.5 pr-4">Raw Ingredient</th>
                    <th className="px-3 py-2.5">Supplier</th>
                    <th className="px-3 py-2.5 text-right">Portions</th>
                    <th className="px-3 py-2.5 text-right">Raw Order Qty</th>
                    <th className="py-2.5 pl-3 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {poLines.map((line) => (
                    <tr key={line.sku_id}>
                      <th
                        scope="row"
                        className="py-3 pr-4 font-semibold text-[var(--ink-primary)]"
                      >
                        {line.ingredient_name}
                      </th>
                      <td
                        data-label="Supplier"
                        className="px-3 py-3 text-[var(--ink-secondary)]"
                      >
                        {line.supplier_name}
                      </td>
                      <td
                        data-label="Portions"
                        className="px-3 py-3 text-right text-[var(--ink-secondary)] tabular-nums"
                      >
                        {line.total_portions}
                      </td>
                      <td
                        data-label="Raw Order Qty"
                        className="px-3 py-3 text-right font-bold text-[var(--brand-forest)] tabular-nums"
                      >
                        {line.raw_qty.toFixed(1)} {line.raw_unit}
                      </td>
                      <td
                        data-label="Est. Cost"
                        className="py-3 pl-3 text-right font-medium text-[var(--ink-primary)] tabular-nums"
                      >
                        RM {line.estimated_cost_rm.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* Tab 2: Halal Central Kitchen Packing Labels */}
        {tab === "labels" && (
          <motion.section
            key="admin-tab-labels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: SMOOTH_EASE }}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {labels.map((lbl, idx) => (
              <motion.div
                key={lbl.order_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: idx * 0.035,
                  ease: SMOOTH_EASE,
                }}
                className="glass-panel min-w-0 rounded-[22px] p-4"
              >
                <div className="flex items-start justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                  <div className="min-w-0 flex-1">
                    <span className="glass-tile rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--ink-primary)]">
                      {lbl.box_code}
                    </span>
                    <h3 className="mt-1.5 text-sm font-bold text-[var(--ink-primary)]">
                      {lbl.condo_name} · Unit {lbl.unit_no}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)]">
                      {lbl.customer_name} · {lbl.plan_label} ({lbl.meal_count} meals)
                    </p>
                  </div>
                  <Package className="h-5 w-5 text-[var(--ink-secondary)]" />
                </div>

                <ul className="mt-3 space-y-2 text-xs">
                  {lbl.pouches.map((p) => (
                    <li
                      key={p.recipe_title}
                      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-subtle-bg)] p-2.5"
                    >
                      <div className="flex justify-between font-semibold text-[var(--ink-primary)]">
                        <span>
                          {p.portions}× {p.recipe_title}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-[var(--ink-secondary)]">
                        Pouch QR: {p.cook_qr_url}
                      </div>
                      {p.fmcg_sachet && (
                        <div className="mt-0.5 text-[10px] font-medium text-[var(--brand-forest)]">
                          + {p.fmcg_sachet}
                        </div>
                      )}
                    </li>
                  ))}
                  {lbl.addons.map((a) => (
                    <li
                      key={a.name}
                      className="flex justify-between px-1 font-medium text-[var(--brand-orange)]"
                    >
                      <span>
                        + Add-On: {a.qty}× {a.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.section>
        )}

        {/* Tab 3: Lalamove 9-ft Chilled Van Manifest */}
        {tab === "van" && (
          <motion.section
            key="admin-tab-van"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: SMOOTH_EASE }}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {vanRows.map((row, idx) => (
              <motion.div
                key={row.condo_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: idx * 0.04,
                  ease: SMOOTH_EASE,
                }}
                className="glass-panel min-w-0 rounded-[22px] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--status-pool)]">
                      <Truck className="h-3.5 w-3.5" />
                      Chilled Van Drop
                    </span>
                    <h3 className="font-display mt-1 text-base font-bold text-[var(--ink-primary)]">
                      {row.condo_name}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)]">
                      {row.pickup_lobby} · {row.pickup_window}
                    </p>
                  </div>
                  <span className="glass-tile rounded-full px-3 py-1 text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                    {row.total_boxes} boxes
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border-hairline)] pt-3 text-xs tabular-nums">
                  <div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">Crates</div>
                    <div className="font-bold">{row.chilled_crates} chilled</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">Van Cost</div>
                    <div className="font-bold">RM {row.van_cost_rm}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">Captain</div>
                    <div className="truncate font-bold">{row.captain_name}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.section>
        )}

        {/* Tab 4: Next-Week Pool Demand Telemetry */}
        {tab === "votes" && (
          <motion.section
            key="admin-tab-votes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: SMOOTH_EASE }}
            className="glass-panel mt-4 rounded-[24px] p-5"
          >
            <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
              Community Demand Telemetry (Next Week&apos;s Pool)
            </h2>
            <p className="text-xs text-[var(--ink-secondary)]">
              Top voted dishes across the free library become next week&apos;s 4
              &ldquo;Pooled This Week&rdquo; boxes.
            </p>

            <div className="mt-4 divide-y divide-[var(--border-hairline)]">
              {rankedVotes.map((r, idx) => {
                const ratio = Math.max(0.06, r.votes_count / maxVotes);
                return (
                  <div key={r.id} className="flex flex-col gap-2 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="w-5 shrink-0 text-xs font-bold text-[var(--ink-secondary)] tabular-nums">
                          #{idx + 1}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.hero_image_url}
                          alt={r.title}
                          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/20"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                            {r.title}
                          </div>
                          <div className="text-[11px] text-[var(--ink-secondary)]">
                            {r.appliance_tag} · {r.cuisine_tag}{" "}
                            {r.is_pooled_this_week
                              ? "· Currently Pooled"
                              : "· Free Library"}
                          </div>
                        </div>
                      </div>

                      <span className="glass-tile inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[var(--brand-orange)] tabular-nums">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                        {r.votes_count}
                      </span>
                    </div>

                    <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-[var(--glass-subtle-bg)]">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: ratio }}
                        transition={{
                          duration: 0.55,
                          delay: idx * 0.04,
                          ease: SMOOTH_EASE,
                        }}
                        style={{ transformOrigin: "left" }}
                        className="h-full w-full rounded-full bg-[var(--brand-orange)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
