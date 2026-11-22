import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { computeMealKitAnalytics } from "./calculations";
import { createSeedData, type LocalMealKitDb } from "./seed-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase";
import type {
  AppStatePayload,
  BoxOrder,
  CookFeedback,
  PaymentMethod,
  PlanTier,
} from "./types";

const PRIMARY_DB_PATH = path.join(process.cwd(), ".grassroot-mealkit-db.json");
const TMP_DB_PATH = path.join(os.tmpdir(), ".grassroot-mealkit-db.json");

declare global {
  var __grassrootEmitter: EventEmitter | undefined;
  var __grassrootMemoryDb: LocalMealKitDb | undefined;
}

export function getRealtimeEmitter(): EventEmitter {
  if (!globalThis.__grassrootEmitter) {
    globalThis.__grassrootEmitter = new EventEmitter();
    globalThis.__grassrootEmitter.setMaxListeners(100);
  }
  return globalThis.__grassrootEmitter;
}

function broadcastChange(reason: string) {
  getRealtimeEmitter().emit("state_changed", {
    reason,
    timestamp: Date.now(),
  });
}

function readLocalDb(): LocalMealKitDb {
  for (const candidatePath of [PRIMARY_DB_PATH, TMP_DB_PATH]) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ candidatePath)) {
        const raw = fs.readFileSync(
          /*turbopackIgnore: true*/ candidatePath,
          "utf-8"
        );
        const parsed = JSON.parse(raw) as LocalMealKitDb;
        if (
          parsed &&
          Array.isArray(parsed.recipes) &&
          Array.isArray(parsed.condos)
        ) {
          const seedMap = new Map(
            createSeedData().recipes.map((r) => [r.id, r])
          );
          parsed.recipes = parsed.recipes.map((r) => {
            const seedRec = seedMap.get(r.id);
            return {
              ...r,
              grabfood_price_rm:
                r.grabfood_price_rm ?? seedRec?.grabfood_price_rm ?? 22.0,
              money_saved_rm:
                r.money_saved_rm ?? seedRec?.money_saved_rm ?? 10.0,
              time_saved_mins:
                r.time_saved_mins ?? seedRec?.time_saved_mins ?? 32,
              health_benefit:
                r.health_benefit ??
                seedRec?.health_benefit ??
                `${r.protein_g}g protein · Less oil`,
            };
          });
          globalThis.__grassrootMemoryDb = parsed;
          return parsed;
        }
      }
    } catch {
      // Fall through to next candidate or memory fallback
    }
  }

  if (globalThis.__grassrootMemoryDb) {
    return globalThis.__grassrootMemoryDb;
  }

  const seeded = createSeedData();
  writeLocalDb(seeded);
  return seeded;
}

function writeLocalDb(data: LocalMealKitDb): void {
  globalThis.__grassrootMemoryDb = data;
  const serialized = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(
      /*turbopackIgnore: true*/ PRIMARY_DB_PATH,
      serialized,
      "utf-8"
    );
    return;
  } catch {
    // On Vercel (/var/task), process.cwd() is read-only (EROFS); fall back to os.tmpdir() (/tmp)
  }
  try {
    fs.writeFileSync(
      /*turbopackIgnore: true*/ TMP_DB_PATH,
      serialized,
      "utf-8"
    );
  } catch {
    // Ignore if tmpdir is also unavailable; globalThis.__grassrootMemoryDb holds state in memory
  }
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getAppState(): Promise<AppStatePayload> {
  const supabase = getSupabaseServerClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const [condosRes, dropsRes, recipesRes, addonsRes, ordersRes, itemsRes, feedbackRes] =
        await Promise.all([
          supabase.from("condos").select("*").eq("active", true),
          supabase.from("weekly_drops").select("*"),
          supabase.from("recipes").select("*, recipe_steps(*), recipe_ingredients(*)"),
          supabase.from("addons").select("*"),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("order_items").select("*"),
          supabase.from("cook_feedback").select("*"),
        ]);

      if (
        !condosRes.error &&
        !dropsRes.error &&
        !recipesRes.error &&
        condosRes.data &&
        condosRes.data.length > 0 &&
        recipesRes.data &&
        recipesRes.data.length > 0
      ) {
        const seed = createSeedData();
        const itemsByOrder = new Map<string, { recipe_id: string; portions: number }[]>();
        for (const it of (itemsRes.data || []) as {
          order_id: string;
          recipe_id: string;
          portions: number;
        }[]) {
          const list = itemsByOrder.get(it.order_id) || [];
          list.push({ recipe_id: it.recipe_id, portions: it.portions });
          itemsByOrder.set(it.order_id, list);
        }

        const seedById = new Map(seed.recipes.map((sr) => [sr.id, sr]));
        const recipes = recipesRes.data.map((r) => {
          const seedRec = seedById.get(r.id);
          return {
            ...r,
            cogs_per_meal_rm: Number(r.cogs_per_meal_rm),
            price_per_meal_rm: Number(r.price_per_meal_rm),
            grabfood_price_rm:
              Number(r.grabfood_price_rm) ||
              seedRec?.grabfood_price_rm ||
              22.0,
            money_saved_rm:
              Number(r.money_saved_rm) || seedRec?.money_saved_rm || 10.0,
            time_saved_mins:
              Number(r.time_saved_mins) || seedRec?.time_saved_mins || 32,
            health_benefit:
              r.health_benefit ||
              seedRec?.health_benefit ||
              `${r.protein_g}g protein · Less oil`,
            ingredients: r.recipe_ingredients || [],
            steps: (r.recipe_steps || []).sort(
              (a: { step_number: number }, b: { step_number: number }) =>
                a.step_number - b.step_number
            ),
          };
        });

        const orders: BoxOrder[] = (ordersRes.data || []).map((o) => ({
          ...o,
          subtotal_rm: Number(o.subtotal_rm),
          addons_rm: Number(o.addons_rm),
          fpx_fee_rm: Number(o.fpx_fee_rm),
          total_rm: Number(o.total_rm),
          items: itemsByOrder.get(o.id) || [],
          addons: o.addons_json || [],
        }));

        const addons = (addonsRes.data && addonsRes.data.length > 0
          ? addonsRes.data
          : seed.addons
        ).map((a) => ({
          ...a,
          price_rm: Number(a.price_rm),
          retail_rm: Number(a.retail_rm),
          po_qty_per_unit: Number(a.po_qty_per_unit),
        }));

        const analytics = computeMealKitAnalytics({
          condos: condosRes.data,
          drops: dropsRes.data || [],
          recipes,
          plans: seed.plans,
          addons,
          orders,
        });

        return {
          backend_mode: "supabase",
          condos: condosRes.data,
          drops: dropsRes.data || [],
          recipes,
          plans: seed.plans,
          addons,
          orders,
          feedback: feedbackRes.data || [],
          ...analytics,
        };
      }
    } catch (err) {
      console.error("Supabase read failed, falling back to local JSON store:", err);
    }
  }

  const db = readLocalDb();
  const sortedOrders = [...db.orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const analytics = computeMealKitAnalytics({
    condos: db.condos,
    drops: db.drops,
    recipes: db.recipes,
    plans: db.plans,
    addons: db.addons,
    orders: sortedOrders,
  });

  return {
    backend_mode: "local",
    condos: db.condos,
    drops: db.drops,
    recipes: db.recipes,
    plans: db.plans,
    addons: db.addons,
    orders: sortedOrders,
    feedback: db.feedback,
    ...analytics,
  };
}

export async function voteRecipe(recipeId: string): Promise<{ votes_count: number }> {
  const state = await getAppState();
  const target = state.recipes.find((r) => r.id === recipeId);
  if (!target) throw new Error("Recipe not found");

  const nextVotes = target.votes_count + 1;
  const supabase = getSupabaseServerClient();

  if (supabase && state.backend_mode === "supabase") {
    const { error } = await supabase
      .from("recipes")
      .update({ votes_count: nextVotes })
      .eq("id", recipeId);
    if (error) throw new Error(error.message);
  } else {
    const db = readLocalDb();
    const rec = db.recipes.find((r) => r.id === recipeId);
    if (rec) rec.votes_count = nextVotes;
    writeLocalDb(db);
  }

  broadcastChange("recipe_voted");
  return { votes_count: nextVotes };
}

export async function createBoxOrder(input: {
  condo_id: string;
  customer_name: string;
  customer_phone: string;
  unit_no: string;
  plan_tier: PlanTier;
  items: { recipe_id: string; portions: number }[];
  addons: { addon_id: string; qty: number }[];
  payment_method: PaymentMethod;
  auto_renew: boolean;
}): Promise<BoxOrder> {
  const state = await getAppState();
  const drop = state.drops.find((d) => d.condo_id === input.condo_id);
  const plan = state.plans.find((p) => p.tier === input.plan_tier);
  if (!drop || !plan) throw new Error("Invalid condo drop or plan selected");

  const addonMap = new Map(state.addons.map((a) => [a.id, a]));
  const cleanAddons = (input.addons || []).filter(
    (a) => a.qty > 0 && addonMap.has(a.addon_id)
  );
  const addonsRm =
    Math.round(
      cleanAddons.reduce(
        (s, a) => s + (addonMap.get(a.addon_id)?.price_rm || 0) * a.qty,
        0
      ) * 100
    ) / 100;

  const fpxFeeRm = input.payment_method === "billplz_fpx" ? 1.25 : 0;
  const totalRm = Math.round((plan.price_rm + addonsRm + fpxFeeRm) * 100) / 100;

  const condoOrdersCount = state.orders.filter(
    (o) => o.condo_id === input.condo_id
  ).length;
  const boxNum = drop.base_joined_boxes + condoOrdersCount + 1;
  const shortPrefix = input.condo_id.replace("condo-", "").slice(0, 3).toUpperCase();
  const suffix = Math.floor(100 + Math.random() * 900);

  const cleanItems = (input.items || []).filter((i) => i.portions > 0);
  if (cleanItems.length === 0) {
    throw new Error("Please select at least 1 dish for your weekly box");
  }

  const newOrder: BoxOrder = {
    id: randomId("ord"),
    box_code: `BOX #${boxNum}`,
    condo_id: input.condo_id,
    weekly_drop_id: drop.id,
    customer_name: input.customer_name.trim(),
    customer_phone: input.customer_phone.trim(),
    unit_no: input.unit_no.trim().toUpperCase(),
    plan_tier: plan.tier,
    meal_count: plan.meals,
    items: cleanItems,
    addons: cleanAddons,
    subtotal_rm: plan.price_rm,
    addons_rm: addonsRm,
    fpx_fee_rm: fpxFeeRm,
    total_rm: totalRm,
    payment_method: input.payment_method,
    payment_status: "paid",
    auto_renew: Boolean(input.auto_renew),
    paused: false,
    pickup_qr_token: `GR-${shortPrefix}-${suffix}`,
    handed_over_at: null,
    late_pickup: false,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase && state.backend_mode === "supabase") {
    const { items, addons, ...row } = newOrder;
    const { error: oErr } = await supabase
      .from("orders")
      .insert({ ...row, addons_json: addons });
    if (oErr) throw new Error(oErr.message);

    const itemRows = items.map((it) => ({
      id: randomId("oi"),
      order_id: newOrder.id,
      recipe_id: it.recipe_id,
      portions: it.portions,
    }));
    const { error: iErr } = await supabase.from("order_items").insert(itemRows);
    if (iErr) throw new Error(iErr.message);
  } else {
    const db = readLocalDb();
    db.orders.unshift(newOrder);
    writeLocalDb(db);
  }

  broadcastChange("box_order_created");
  return newOrder;
}

export async function manageBoxOrder(input: {
  order_id: string;
  auto_renew?: boolean;
  paused?: boolean;
}): Promise<BoxOrder> {
  const state = await getAppState();
  const order = state.orders.find((o) => o.id === input.order_id);
  if (!order) throw new Error("Order not found");

  const updated: BoxOrder = {
    ...order,
    auto_renew:
      typeof input.auto_renew === "boolean" ? input.auto_renew : order.auto_renew,
    paused: typeof input.paused === "boolean" ? input.paused : order.paused,
  };

  const supabase = getSupabaseServerClient();
  if (supabase && state.backend_mode === "supabase") {
    const { error } = await supabase
      .from("orders")
      .update({ auto_renew: updated.auto_renew, paused: updated.paused })
      .eq("id", order.id);
    if (error) throw new Error(error.message);
  } else {
    const db = readLocalDb();
    const target = db.orders.find((o) => o.id === order.id);
    if (target) {
      target.auto_renew = updated.auto_renew;
      target.paused = updated.paused;
    }
    writeLocalDb(db);
  }

  broadcastChange("box_order_updated");
  return updated;
}

export async function submitCookFeedback(input: {
  recipe_id: string;
  rating: "too_easy" | "just_right" | "tricky";
  keep_next_week: boolean;
}): Promise<CookFeedback> {
  const state = await getAppState();
  const entry: CookFeedback = {
    id: randomId("fb"),
    recipe_id: input.recipe_id,
    rating: input.rating,
    keep_next_week: Boolean(input.keep_next_week),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase && state.backend_mode === "supabase") {
    const { error } = await supabase.from("cook_feedback").insert(entry);
    if (error) throw new Error(error.message);
  } else {
    const db = readLocalDb();
    db.feedback.unshift(entry);
    writeLocalDb(db);
  }

  broadcastChange("cook_feedback_submitted");
  return entry;
}

export async function verifyCaptainHandover(input: {
  token_or_order_id: string;
  mark_late?: boolean;
}): Promise<BoxOrder> {
  const state = await getAppState();
  const query = input.token_or_order_id.trim().toUpperCase();
  const order = state.orders.find(
    (o) =>
      o.id.toUpperCase() === query ||
      o.pickup_qr_token.toUpperCase() === query ||
      o.box_code.toUpperCase() === query
  );
  if (!order) {
    throw new Error("Pickup QR token not found in this week's manifest.");
  }

  const nowIso = new Date().toISOString();
  const patch = input.mark_late
    ? { late_pickup: true }
    : { handed_over_at: nowIso, late_pickup: false };

  const supabase = getSupabaseServerClient();
  if (supabase && state.backend_mode === "supabase") {
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    if (error) throw new Error(error.message);
  } else {
    const db = readLocalDb();
    const target = db.orders.find((o) => o.id === order.id);
    if (target) {
      if (input.mark_late) {
        target.late_pickup = true;
      } else {
        target.handed_over_at = nowIso;
        target.late_pickup = false;
      }
    }
    writeLocalDb(db);
  }

  broadcastChange("captain_handover_updated");
  return { ...order, ...patch };
}

export async function resetDemoState(): Promise<void> {
  const seeded = createSeedData();
  writeLocalDb(seeded);
  broadcastChange("demo_reset");
}
