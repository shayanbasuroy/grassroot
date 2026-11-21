export type ApplianceTag = "Rice Cooker" | "Air Fryer" | "Single Pan" | "Full Stove";
export type GoalTag = "Rice Cooker" | "15 Min" | "Healthy";
export type CuisineTag = "Malay" | "Japanese" | "Chinese Halal" | "Western";
export type DietaryTag = "100% Halal" | "High Protein" | "No Seafood" | "No Spicy";
export type PlanTier = "student" | "pro" | "couple" | "family";
export type DropStatus = "open" | "cutoff_locked" | "dispatched" | "completed";
export type PaymentMethod = "billplz_fpx" | "duitnow_qr";

export interface Condo {
  id: string;
  name: string;
  address: string;
  captain_name: string;
  captain_phone: string;
  pickup_lobby: string;
  unit_count: number;
  active: boolean;
}

export interface WeeklyDrop {
  id: string;
  condo_id: string;
  drop_date: string;
  cutoff_at: string;
  pickup_window: string;
  target_boxes: number;
  base_joined_boxes: number;
  van_cost_rm: number;
  captain_fee_rm: number;
  status: DropStatus;
}

export interface RecipeIngredient {
  id: string;
  sku_id: string;
  name: string;
  qty_per_serving: number;
  unit: string;
  raw_unit_for_po: "kg" | "L" | "packs" | "trays";
  po_conversion_factor: number; // multiplies qty_per_serving to reach raw_unit_for_po (e.g. g -> kg = 0.001)
  supplier_name: string;
}

export interface RecipeStep {
  step_number: number;
  title: string;
  instruction: string;
  timer_seconds: number | null;
  tip?: string;
  sponsor_callout?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  appliance_tag: ApplianceTag;
  goal_tags: GoalTag[];
  cuisine_tag: CuisineTag;
  dietary_tags: DietaryTag[];
  difficulty: "Zero Skill" | "Beginner";
  prep_mins: number;
  cook_mins: number;
  calories: number;
  protein_g: number;
  is_pooled_this_week: boolean;
  cogs_per_meal_rm: number;
  price_per_meal_rm: number;
  hero_image_url: string;
  fmcg_sponsor_note: string | null;
  votes_count: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface PlanSpec {
  tier: PlanTier;
  name: string;
  persona_label: string;
  meals: number;
  breakdown_label: string;
  price_rm: number;
  per_meal_rm: number;
  badge?: string;
}

export interface Addon {
  id: string;
  name: string;
  subtitle: string;
  price_rm: number;
  retail_rm: number;
  weight_label: string;
  supplier_name: string;
  raw_unit_for_po: "kg" | "L" | "packs" | "trays";
  po_qty_per_unit: number;
  sku_id: string;
}

export interface BoxOrder {
  id: string;
  box_code: string;
  condo_id: string;
  weekly_drop_id: string;
  customer_name: string;
  customer_phone: string;
  unit_no: string;
  plan_tier: PlanTier;
  meal_count: number;
  items: { recipe_id: string; portions: number }[];
  addons: { addon_id: string; qty: number }[];
  subtotal_rm: number;
  addons_rm: number;
  fpx_fee_rm: number;
  total_rm: number;
  payment_method: PaymentMethod;
  payment_status: "paid";
  auto_renew: boolean;
  paused: boolean;
  pickup_qr_token: string;
  handed_over_at: string | null;
  late_pickup: boolean;
  created_at: string;
}

export interface CookFeedback {
  id: string;
  recipe_id: string;
  rating: "too_easy" | "just_right" | "tricky";
  keep_next_week: boolean;
  created_at: string;
}

export interface CondoPoolSummary {
  condo: Condo;
  drop: WeeklyDrop;
  orders_count: number;
  joined_boxes: number;
  progress_pct: number;
  van_breakeven_unlocked: boolean;
  target_unlocked: boolean;
  boxes_remaining_to_target: number;
  batch_gmv_rm: number;
  handed_over_count: number;
}

export interface ProcurementLine {
  sku_id: string;
  ingredient_name: string;
  supplier_name: string;
  raw_qty: number;
  raw_unit: "kg" | "L" | "packs" | "trays";
  total_portions: number;
  estimated_cost_rm: number;
}

export interface KitchenLabel {
  order_id: string;
  box_code: string;
  condo_name: string;
  unit_no: string;
  customer_name: string;
  plan_label: string;
  meal_count: number;
  pouches: {
    recipe_title: string;
    portions: number;
    cook_qr_url: string;
    fmcg_sachet: string | null;
  }[];
  addons: { name: string; qty: number }[];
}

export interface VanManifestRow {
  condo_id: string;
  condo_name: string;
  pickup_lobby: string;
  pickup_window: string;
  captain_name: string;
  captain_phone: string;
  total_boxes: number;
  total_meals: number;
  van_cost_rm: number;
  captain_fee_rm: number;
  chilled_crates: number;
}

export interface UnitEconomicsSummary {
  total_active_boxes: number;
  total_meals: number;
  batch_gmv_rm: number;
  raw_cogs_rm: number;
  van_logistics_rm: number;
  captain_payouts_rm: number;
  fpx_fees_rm: number;
  net_contribution_rm: number;
  contribution_margin_pct: number;
  fixed_monthly_overhead_rm: number;
  fixed_monthly_cap_rm: number;
  fixed_overhead_breakdown: { label: string; cost_rm: number }[];
}

export interface AppStatePayload {
  backend_mode: "supabase" | "local";
  condos: Condo[];
  drops: WeeklyDrop[];
  recipes: Recipe[];
  plans: PlanSpec[];
  addons: Addon[];
  orders: BoxOrder[];
  feedback: CookFeedback[];
  pool_summaries: CondoPoolSummary[];
  procurement_lines: ProcurementLine[];
  kitchen_labels: KitchenLabel[];
  van_manifest: VanManifestRow[];
  unit_economics: UnitEconomicsSummary;
}
