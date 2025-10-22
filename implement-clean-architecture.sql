-- ========================================
-- CLEAN ARCHITECTURE: Single Source of Truth
-- ========================================

-- 1) Create the floor location enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'floor_loc') THEN
    CREATE TYPE floor_loc AS ENUM ('INVENTORY','SHOWROOM_1','SHOWROOM_2','GARAGE');
  END IF;
END $$;

-- 2) Ensure cars table has the correct structure
-- First, let's check what columns exist and migrate if needed
DO $$
BEGIN
  -- Add current_floor column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='cars' AND column_name='current_floor'
  ) THEN
    ALTER TABLE public.cars ADD COLUMN current_floor floor_loc NOT NULL DEFAULT 'INVENTORY';
  END IF;
  
  -- Ensure the column is not null
  ALTER TABLE public.cars ALTER COLUMN current_floor SET NOT NULL;
  
  -- Add constraint to ensure it's never null
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cars_current_floor_not_null' 
    AND conrelid = 'public.cars'::regclass
  ) THEN
    ALTER TABLE public.cars 
    ADD CONSTRAINT cars_current_floor_not_null CHECK (current_floor IS NOT NULL);
  END IF;
END $$;

-- 3) Migrate existing car_inventory data to cars table
-- First, let's copy any missing cars from car_inventory to cars
INSERT INTO public.cars (id, vin, model, brand, year, color, vehicle_type, selling_price, status, current_floor, created_at, updated_at)
SELECT 
  ci.id, 
  ci.vin, 
  ci.model, 
  ci.brand, 
  ci.year, 
  ci.color, 
  ci.vehicle_type, 
  ci.selling_price, 
  ci.status, 
  'INVENTORY'::floor_loc as current_floor,
  ci.created_at,
  ci.updated_at
FROM public.car_inventory ci
LEFT JOIN public.cars c ON c.vin = ci.vin
WHERE c.vin IS NULL
ON CONFLICT (vin) DO NOTHING;

-- 4) Create views for each "file" (read-only filters)
CREATE OR REPLACE VIEW public.view_car_inventory AS
  SELECT * FROM public.cars WHERE current_floor = 'INVENTORY';

CREATE OR REPLACE VIEW public.view_showroom_floor1 AS
  SELECT * FROM public.cars WHERE current_floor = 'SHOWROOM_1';

CREATE OR REPLACE VIEW public.view_showroom_floor2 AS
  SELECT * FROM public.cars WHERE current_floor = 'SHOWROOM_2';

CREATE OR REPLACE VIEW public.view_garage AS
  SELECT * FROM public.cars WHERE current_floor = 'GARAGE';

-- 5) Create audit table for car moves
CREATE TABLE IF NOT EXISTS public.car_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  from_floor floor_loc NOT NULL,
  to_floor   floor_loc NOT NULL,
  moved_by uuid NOT NULL DEFAULT auth.uid(),
  moved_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Create the move_car function with audit logging
CREATE OR REPLACE FUNCTION public.move_car(p_car_id uuid, p_to floor_loc)
RETURNS public.cars
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old public.cars;
  v_new public.cars;
BEGIN
  -- Get the current car with lock
  SELECT * INTO v_old FROM public.cars WHERE id = p_car_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car % not found', p_car_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Update the car's floor
  UPDATE public.cars
  SET current_floor = p_to, updated_at = now()
  WHERE id = p_car_id
  RETURNING * INTO v_new;

  -- Log the move
  INSERT INTO public.car_moves (car_id, from_floor, to_floor, moved_by)
  VALUES (p_car_id, v_old.current_floor, p_to, auth.uid());

  RETURN v_new;
END $$;

-- 7) Grant permissions
REVOKE ALL ON FUNCTION public.move_car(uuid, floor_loc) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_car(uuid, floor_loc) TO authenticated;

-- 8) Enable RLS on cars table
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- 9) Create RLS policies
DO $$
BEGIN
  -- Read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cars' AND policyname='cars_read'
  ) THEN
    CREATE POLICY cars_read
      ON public.cars FOR SELECT TO authenticated
      USING (true);
  END IF;
  
  -- Update policy for moving cars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cars' AND policyname='cars_move'
  ) THEN
    CREATE POLICY cars_move
      ON public.cars FOR UPDATE TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10) Create indexes for performance
CREATE INDEX IF NOT EXISTS cars_current_floor_idx ON public.cars(current_floor);
CREATE INDEX IF NOT EXISTS cars_vin_idx ON public.cars(vin);
CREATE INDEX IF NOT EXISTS car_moves_car_id_idx ON public.car_moves(car_id);
CREATE INDEX IF NOT EXISTS car_moves_moved_at_idx ON public.car_moves(moved_at);

-- 11) Create materialized view for counts (optional but useful)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_car_floor_counts AS
SELECT current_floor, count(*)::int AS total
FROM public.cars
GROUP BY current_floor;

-- 12) Create function to refresh counts
CREATE OR REPLACE FUNCTION public.refresh_car_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_car_floor_counts;
END $$;

-- 13) Clean up old tables (commented out for safety - uncomment after verification)
-- DROP TABLE IF EXISTS public.car_inventory CASCADE;
-- DROP TABLE IF EXISTS public.showroom_floor1 CASCADE;
-- DROP TABLE IF EXISTS public.showroom_floor2 CASCADE;

-- 14) Verify the setup
SELECT 
  'Setup Complete' as status,
  (SELECT count(*) FROM public.cars) as total_cars,
  (SELECT count(*) FROM public.cars WHERE current_floor = 'INVENTORY') as inventory_cars,
  (SELECT count(*) FROM public.cars WHERE current_floor = 'SHOWROOM_1') as floor1_cars,
  (SELECT count(*) FROM public.cars WHERE current_floor = 'SHOWROOM_2') as floor2_cars,
  (SELECT count(*) FROM public.cars WHERE current_floor = 'GARAGE') as garage_cars;
