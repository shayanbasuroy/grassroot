-- GrassRoot Pooled Meal-Kit Pilot Seed Data (Sunway / Subang Jaya)

insert into public.condos (id, name, address, captain_name, captain_phone, pickup_lobby, unit_count, active) values
  ('condo-geo', 'Geo Residences', 'Jalan Lagoon Selatan, Bandar Sunway', 'Aiman Hakim', '+6017-882 3410', 'Lobby A Chilled Drop Bay', 620, true),
  ('condo-dlatour', 'D''Latour', 'Jalan Taylor''s, Bandar Sunway', 'Mei Ling Tan', '+6016-991 2044', 'Tower B Mailroom Lounge', 580, true),
  ('condo-ridzuan', 'Sunway Ridzuan', 'Jalan PJS 10/11, Bandar Sunway', 'Farhan Razak', '+6012-440 9182', 'Main Guardhouse Drop Bay', 640, true),
  ('condo-amarine', 'A''Marine', 'Sunway South Quay, Bandar Sunway', 'Kavitha Nair', '+6019-442 8190', 'Lakeside Concierge Lobby', 420, true)
on conflict (id) do nothing;

insert into public.weekly_drops (id, condo_id, drop_date, cutoff_at, pickup_window, target_boxes, base_joined_boxes, van_cost_rm, captain_fee_rm, status) values
  ('drop-geo-sun', 'condo-geo', current_date + interval '2 days', now() + interval '1 day', 'Sun 6:00 PM – 6:45 PM', 30, 24, 90.00, 35.00, 'open'),
  ('drop-dlatour-sun', 'condo-dlatour', current_date + interval '2 days', now() + interval '1 day', 'Sun 6:30 PM – 7:15 PM', 30, 18, 90.00, 35.00, 'open'),
  ('drop-ridzuan-sun', 'condo-ridzuan', current_date + interval '2 days', now() + interval '1 day', 'Sun 7:00 PM – 7:45 PM', 30, 29, 90.00, 35.00, 'open'),
  ('drop-amarine-sun', 'condo-amarine', current_date + interval '2 days', now() + interval '1 day', 'Sun 6:00 PM – 6:45 PM', 30, 11, 90.00, 35.00, 'open')
on conflict (id) do nothing;

insert into public.addons (id, sku_id, name, subtitle, price_rm, retail_rm, weight_label, supplier_name, raw_unit_for_po, po_qty_per_unit) values
  ('addon-chicken-500g', 'sku-chicken-breast', 'Extra 500g Halal Diced Chicken Breast', 'Vacuum-chilled lean protein top-up', 12.00, 15.50, '500g pack', 'Klang Valley Halal Poultry Direct', 'kg', 0.50),
  ('addon-teriyaki-500ml', 'sku-teriyaki-pouch', 'Bulk Teriyaki Glaze Bottle (500ml)', 'Make 12+ extra bowls anytime', 9.00, 12.90, '500ml bottle', 'Sunway Halal Central Kitchen', 'L', 0.50),
  ('addon-eggs-30s', 'sku-egg', '30s Grade A Egg Tray', 'Farm-direct Sepang chilled van', 13.99, 16.50, '30 eggs', 'Ladang Telur Sepang Direct', 'trays', 1.00),
  ('addon-jasmine-2kg', 'sku-jasmine-rice', 'Jasmine Fragrant Rice (2kg)', 'Zero delivery markup', 8.50, 10.90, '2kg bag', 'Syarikat Borong Klang Sdn Bhd', 'kg', 2.00)
on conflict (id) do nothing;
