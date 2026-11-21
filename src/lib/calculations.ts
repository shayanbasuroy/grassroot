import type {
  Addon,
  BoxOrder,
  Condo,
  CondoPoolSummary,
  KitchenLabel,
  PlanSpec,
  ProcurementLine,
  Recipe,
  UnitEconomicsSummary,
  VanManifestRow,
  WeeklyDrop,
} from "./types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const INGREDIENT_UNIT_COST_RM: Record<string, number> = {
  "sku-chicken-breast": 16.5, // per kg
  "sku-chicken-thigh": 15.8, // per kg
  "sku-jasmine-rice": 4.2, // per kg
  "sku-teriyaki-pouch": 14.0, // per L
  "sku-bok-choy": 6.5, // per kg
  "sku-sesame-sachet": 0.0, // sponsored FMCG sachet
  "sku-sambal-paste": 18.0, // per kg
  "sku-evap-milk": 7.2, // per L
  "sku-curry-leaf": 0.45, // per pack
  "sku-broccoli": 9.8, // per kg
  "sku-black-pepper-sauce": 15.0, // per L
  "sku-baby-potato": 5.4, // per kg
  "sku-lemon-herb-marinade": 16.5, // per L
  "sku-egg": 12.2, // per tray
};

export function computeMealKitAnalytics(params: {
  condos: Condo[];
  drops: WeeklyDrop[];
  recipes: Recipe[];
  plans: PlanSpec[];
  addons: Addon[];
  orders: BoxOrder[];
}): {
  pool_summaries: CondoPoolSummary[];
  procurement_lines: ProcurementLine[];
  kitchen_labels: KitchenLabel[];
  van_manifest: VanManifestRow[];
  unit_economics: UnitEconomicsSummary;
} {
  const { condos, drops, recipes, plans, addons, orders } = params;

  const condoMap = new Map(condos.map((c) => [c.id, c]));
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const planMap = new Map(plans.map((p) => [p.tier, p]));
  const addonMap = new Map(addons.map((a) => [a.id, a]));
  const pooledRecipes = recipes.filter((r) => r.is_pooled_this_week);

  const activeOrders = orders.filter((o) => !o.paused);

  // 1. Condo Pool Summaries
  const poolSummaries: CondoPoolSummary[] = drops.map((drop) => {
    const condo = condoMap.get(drop.condo_id)!;
    const condoOrders = activeOrders.filter((o) => o.condo_id === drop.condo_id);
    const joinedBoxes = drop.base_joined_boxes + condoOrders.length;
    const progressPct = Math.min(
      100,
      Math.round((joinedBoxes / drop.target_boxes) * 100)
    );
    const realOrdersGmv = condoOrders.reduce(
      (s, o) => s + o.subtotal_rm + o.addons_rm,
      0
    );
    // Baseline cohort averages RM 88.67 / box (aligned with 30 boxes = RM 2,660 GMV)
    const baselineGmv = drop.base_joined_boxes * 88.67;
    const handedOverCount = condoOrders.filter((o) => Boolean(o.handed_over_at)).length;

    return {
      condo,
      drop,
      orders_count: condoOrders.length,
      joined_boxes: joinedBoxes,
      progress_pct: progressPct,
      van_breakeven_unlocked: joinedBoxes >= 5,
      target_unlocked: joinedBoxes >= drop.target_boxes,
      boxes_remaining_to_target: Math.max(0, drop.target_boxes - joinedBoxes),
      batch_gmv_rm: round2(baselineGmv + realOrdersGmv),
      handed_over_count: handedOverCount,
    };
  });

  // 2. Raw-Weight Supplier Procurement Rollup
  const poMap = new Map<string, ProcurementLine>();

  const addPoQty = (args: {
    sku_id: string;
    ingredient_name: string;
    supplier_name: string;
    raw_qty: number;
    raw_unit: "kg" | "L" | "packs" | "trays";
    portions: number;
  }) => {
    const existing = poMap.get(args.sku_id);
    const unitCost = INGREDIENT_UNIT_COST_RM[args.sku_id] ?? 10;
    if (existing) {
      existing.raw_qty = round2(existing.raw_qty + args.raw_qty);
      existing.total_portions += args.portions;
      existing.estimated_cost_rm = round2(existing.raw_qty * unitCost);
    } else {
      poMap.set(args.sku_id, {
        sku_id: args.sku_id,
        ingredient_name: args.ingredient_name,
        supplier_name: args.supplier_name,
        raw_qty: round2(args.raw_qty),
        raw_unit: args.raw_unit,
        total_portions: args.portions,
        estimated_cost_rm: round2(args.raw_qty * unitCost),
      });
    }
  };

  // Roll up baseline cohort portions across the 4 pooled dishes (~2 portions per dish per baseline box)
  const totalBaselineBoxes = drops.reduce((s, d) => s + d.base_joined_boxes, 0);
  if (pooledRecipes.length > 0 && totalBaselineBoxes > 0) {
    const baselinePortionsPerDish = Math.round(totalBaselineBoxes * 2.08);
    for (const rec of pooledRecipes) {
      for (const ing of rec.ingredients) {
        addPoQty({
          sku_id: ing.sku_id,
          ingredient_name: ing.name,
          supplier_name: ing.supplier_name,
          raw_qty: ing.qty_per_serving * baselinePortionsPerDish * ing.po_conversion_factor,
          raw_unit: ing.raw_unit_for_po,
          portions: baselinePortionsPerDish,
        });
      }
    }
  }

  // Roll up exact live orders + add-ons
  for (const order of activeOrders) {
    for (const item of order.items) {
      const rec = recipeMap.get(item.recipe_id);
      if (!rec) continue;
      for (const ing of rec.ingredients) {
        addPoQty({
          sku_id: ing.sku_id,
          ingredient_name: ing.name,
          supplier_name: ing.supplier_name,
          raw_qty: ing.qty_per_serving * item.portions * ing.po_conversion_factor,
          raw_unit: ing.raw_unit_for_po,
          portions: item.portions,
        });
      }
    }
    for (const addonOrder of order.addons) {
      const addon = addonMap.get(addonOrder.addon_id);
      if (!addon) continue;
      addPoQty({
        sku_id: addon.sku_id,
        ingredient_name: `${addon.name} (Extra)`,
        supplier_name: addon.supplier_name,
        raw_qty: addon.po_qty_per_unit * addonOrder.qty,
        raw_unit: addon.raw_unit_for_po,
        portions: addonOrder.qty,
      });
    }
  }

  const procurementLines = Array.from(poMap.values()).sort(
    (a, b) => b.raw_qty - a.raw_qty
  );

  // 3. Halal Central Kitchen Packing Labels
  const kitchenLabels: KitchenLabel[] = activeOrders.map((order) => {
    const condo = condoMap.get(order.condo_id);
    const plan = planMap.get(order.plan_tier);
    return {
      order_id: order.id,
      box_code: order.box_code,
      condo_name: condo?.name || order.condo_id,
      unit_no: order.unit_no,
      customer_name: order.customer_name,
      plan_label: plan?.name || order.plan_tier,
      meal_count: order.meal_count,
      pouches: order.items.map((it) => {
        const rec = recipeMap.get(it.recipe_id);
        return {
          recipe_title: rec?.title || it.recipe_id,
          portions: it.portions,
          cook_qr_url: `grassroot.my/cook/${rec?.slug || it.recipe_id}`,
          fmcg_sachet: rec?.fmcg_sponsor_note || null,
        };
      }),
      addons: order.addons.map((a) => ({
        name: addonMap.get(a.addon_id)?.name || a.addon_id,
        qty: a.qty,
      })),
    };
  });

  // 4. Lalamove 9-ft Chilled Van Manifest
  const vanManifest: VanManifestRow[] = poolSummaries.map((ps) => {
    const condoOrders = activeOrders.filter((o) => o.condo_id === ps.condo.id);
    const realMeals = condoOrders.reduce((s, o) => s + o.meal_count, 0);
    const baselineMeals = Math.round(ps.drop.base_joined_boxes * 8.33);
    const totalMeals = baselineMeals + realMeals;
    return {
      condo_id: ps.condo.id,
      condo_name: ps.condo.name,
      pickup_lobby: ps.condo.pickup_lobby,
      pickup_window: ps.drop.pickup_window,
      captain_name: ps.condo.captain_name,
      captain_phone: ps.condo.captain_phone,
      total_boxes: ps.joined_boxes,
      total_meals: totalMeals,
      van_cost_rm: ps.drop.van_cost_rm,
      captain_fee_rm: ps.drop.captain_fee_rm,
      chilled_crates: Math.ceil(ps.joined_boxes / 6),
    };
  });

  // 5. Unit Economics Summary
  const totalActiveBoxes = poolSummaries.reduce((s, p) => s + p.joined_boxes, 0);
  const totalMeals = vanManifest.reduce((s, v) => s + v.total_meals, 0);
  const batchGmvRm = round2(
    poolSummaries.reduce((s, p) => s + p.batch_gmv_rm, 0)
  );
  // RM 7.00 all-in COGS/meal + ~55% COGS on add-ons
  const realAddonsCost = round2(
    activeOrders.reduce((s, o) => s + o.addons_rm * 0.65, 0)
  );
  const rawCogsRm = round2(totalMeals * 7.0 + realAddonsCost);
  const vanLogisticsRm = vanManifest.reduce((s, v) => s + v.van_cost_rm, 0);
  const captainPayoutsRm = vanManifest.reduce((s, v) => s + v.captain_fee_rm, 0);
  const fpxFeesRm = round2(totalActiveBoxes * 1.25);

  const netContributionRm = round2(
    batchGmvRm - rawCogsRm - vanLogisticsRm - captainPayoutsRm - fpxFeesRm
  );
  const contributionMarginPct =
    batchGmvRm > 0 ? round2((netContributionRm / batchGmvRm) * 100) : 0;

  const fixedOverheadBreakdown = [
    { label: "Vercel Pro (PWA + Edge CDN)", cost_rm: 82 },
    { label: "Supabase Pro (DB, Auth, Storage)", cost_rm: 103 },
    { label: "WhatsApp Cloud API & Resend", cost_rm: 45 },
    { label: "Apple / Google Dev (Amortized)", cost_rm: 41 },
    { label: "Ops Tooling & Buffer", cost_rm: 350 },
  ];

  return {
    pool_summaries: poolSummaries,
    procurement_lines: procurementLines,
    kitchen_labels: kitchenLabels,
    van_manifest: vanManifest,
    unit_economics: {
      total_active_boxes: totalActiveBoxes,
      total_meals: totalMeals,
      batch_gmv_rm: batchGmvRm,
      raw_cogs_rm: rawCogsRm,
      van_logistics_rm: vanLogisticsRm,
      captain_payouts_rm: captainPayoutsRm,
      fpx_fees_rm: fpxFeesRm,
      net_contribution_rm: netContributionRm,
      contribution_margin_pct: contributionMarginPct,
      fixed_monthly_overhead_rm: 621,
      fixed_monthly_cap_rm: 621,
      fixed_overhead_breakdown: fixedOverheadBreakdown,
    },
  };
}
