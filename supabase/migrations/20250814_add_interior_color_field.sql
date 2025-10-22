-- Add interior_color to car-related tables (exclude schedule tables)

-- Primary cars table
ALTER TABLE IF EXISTS public.cars
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

-- Optional tables used in some environments/code paths (no-op if absent)
ALTER TABLE IF EXISTS public.garage_cars
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.car_inventory
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.inventory_cars
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.new_car_arrivals
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.showroom_cars
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.floor1_cars
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.floor2_cars
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);

ALTER TABLE IF EXISTS public.inventory_garage
  ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);


