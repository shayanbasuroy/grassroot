-- GrassRoot Pooled Meal-Kit & Guided Cooking Schema (PRD Section 6)
create extension if not exists "pgcrypto";

-- 1. Residential Complexes & Weekly Pooled Drops
create table if not exists public.condos (
  id text primary key,
  name text not null,
  address text not null,
  captain_name text not null,
  captain_phone text not null,
  pickup_lobby text not null,
  unit_count integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_drops (
  id text primary key,
  condo_id text not null references public.condos(id) on delete cascade,
  drop_date date not null,
  cutoff_at timestamptz not null,
  pickup_window text not null,
  target_boxes integer not null default 30,
  base_joined_boxes integer not null default 0,
  van_cost_rm numeric(10, 2) not null default 90.00,
  captain_fee_rm numeric(10, 2) not null default 35.00,
  status text not null default 'open' check (status in ('open', 'cutoff_locked', 'dispatched', 'completed'))
);

-- 2. Recipes, Appliance Filters & Featured Pool Rotation
create table if not exists public.recipes (
  id text primary key,
  slug text not null unique,
  title text not null,
  subtitle text not null,
  appliance_tag text not null,
  goal_tags text[] not null default '{}',
  cuisine_tag text not null,
  dietary_tags text[] not null default '{}',
  difficulty text not null check (difficulty in ('Zero Skill', 'Beginner')),
  prep_mins integer not null,
  cook_mins integer not null,
  calories integer not null,
  protein_g integer not null,
  is_pooled_this_week boolean not null default false,
  cogs_per_meal_rm numeric(10, 2) not null default 7.00,
  price_per_meal_rm numeric(10, 2) not null default 11.80,
  hero_image_url text not null,
  fmcg_sponsor_note text,
  votes_count integer not null default 0
);

create table if not exists public.recipe_steps (
  id text primary key default ('step-' || substr(gen_random_uuid()::text, 1, 8)),
  recipe_id text not null references public.recipes(id) on delete cascade,
  step_number integer not null,
  title text not null,
  instruction text not null,
  timer_seconds integer,
  tip text,
  sponsor_callout text
);

create table if not exists public.recipe_ingredients (
  id text primary key,
  recipe_id text not null references public.recipes(id) on delete cascade,
  sku_id text not null,
  name text not null,
  qty_per_serving numeric(10, 2) not null,
  unit text not null,
  raw_unit_for_po text not null check (raw_unit_for_po in ('kg', 'L', 'packs', 'trays')),
  po_conversion_factor numeric(10, 5) not null,
  supplier_name text not null
);

-- 3. Add-Ons, Orders & Cook Feedback
create table if not exists public.addons (
  id text primary key,
  sku_id text not null,
  name text not null,
  subtitle text not null,
  price_rm numeric(10, 2) not null,
  retail_rm numeric(10, 2) not null,
  weight_label text not null,
  supplier_name text not null,
  raw_unit_for_po text not null,
  po_qty_per_unit numeric(10, 2) not null
);

create table if not exists public.orders (
  id text primary key,
  box_code text not null,
  condo_id text not null references public.condos(id),
  weekly_drop_id text not null references public.weekly_drops(id),
  customer_name text not null,
  customer_phone text not null,
  unit_no text not null,
  plan_tier text not null check (plan_tier in ('student', 'pro', 'couple', 'family')),
  meal_count integer not null,
  addons_json jsonb not null default '[]'::jsonb,
  subtotal_rm numeric(10, 2) not null,
  addons_rm numeric(10, 2) not null default 0,
  fpx_fee_rm numeric(10, 2) not null default 1.25,
  total_rm numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('billplz_fpx', 'duitnow_qr')),
  payment_status text not null default 'paid',
  auto_renew boolean not null default true,
  paused boolean not null default false,
  pickup_qr_token text not null unique,
  handed_over_at timestamptz,
  late_pickup boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  recipe_id text not null references public.recipes(id),
  portions integer not null check (portions > 0)
);

create table if not exists public.cook_feedback (
  id text primary key,
  recipe_id text not null references public.recipes(id) on delete cascade,
  rating text not null check (rating in ('too_easy', 'just_right', 'tricky')),
  keep_next_week boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.condos enable row level security;
alter table public.weekly_drops enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.addons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cook_feedback enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['condos','weekly_drops','recipes','recipe_steps','recipe_ingredients','addons','orders','order_items','cook_feedback']
  loop
    execute format('drop policy if exists "demo_all_%I" on public.%I', t, t);
    execute format('create policy "demo_all_%I" on public.%I for all using (true) with check (true)', t, t);
  end loop;
end $$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
    alter publication supabase_realtime add table public.recipes;
    alter publication supabase_realtime add table public.weekly_drops;
  end if;
exception when duplicate_object then
  null;
end $$;
