-- ULTRA-SAFE DATABASE FIX FOR MONZA TECH
-- This script will work regardless of current schema state
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. FIRST, LET'S SEE WHAT WE'RE WORKING WITH
-- =============================================
SELECT 'DIAGNOSTIC: Current tables in database:' as step;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- =============================================
-- 2. CREATE AUDIT_LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          bigserial PRIMARY KEY,
  table_name  text        NOT NULL,
  action      text        NOT NULL,
  row_id      uuid,
  old_data    jsonb,
  new_data    jsonb,
  actor       uuid        DEFAULT auth.uid(),
  created_at  timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE ON SEQUENCE public.audit_log_id_seq TO authenticated;

SELECT 'STEP 1: ✅ Audit log table created' as progress;

-- =============================================
-- 3. CREATE CARS TABLE WITH MINIMAL COLUMNS FIRST
-- =============================================
-- Create basic cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

SELECT 'STEP 2: ✅ Basic cars table ensured' as progress;

-- =============================================
-- 4. ADD COLUMNS ONE BY ONE (SAFE METHOD)
-- =============================================
-- This approach adds columns only if they don't exist

-- Basic car information
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='vin' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN vin text;
    RAISE NOTICE 'Added vin column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='model' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN model text;
    RAISE NOTICE 'Added model column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='brand' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN brand text;
    RAISE NOTICE 'Added brand column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='year' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN year integer;
    RAISE NOTICE 'Added year column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='color' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN color text;
    RAISE NOTICE 'Added color column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='price' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN price numeric;
    RAISE NOTICE 'Added price column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='status' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN status text DEFAULT 'available';
    RAISE NOTICE 'Added status column';
  END IF;
END $$;

-- Location columns (the problematic ones)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='location' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN location text DEFAULT 'showroom';
    RAISE NOTICE 'Added location column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='current_floor' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN current_floor text DEFAULT 'showroom';
    RAISE NOTICE 'Added current_floor column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='current_location' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN current_location text DEFAULT 'showroom';
    RAISE NOTICE 'Added current_location column';
  END IF;
END $$;

-- Additional columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='notes' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN notes text;
    RAISE NOTICE 'Added notes column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='warranty_start' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN warranty_start date;
    RAISE NOTICE 'Added warranty_start column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='warranty_end' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN warranty_end date;
    RAISE NOTICE 'Added warranty_end column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='mileage' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN mileage integer;
    RAISE NOTICE 'Added mileage column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='fuel_type' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN fuel_type text;
    RAISE NOTICE 'Added fuel_type column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='transmission' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN transmission text;
    RAISE NOTICE 'Added transmission column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='engine_size' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN engine_size text;
    RAISE NOTICE 'Added engine_size column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='doors' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN doors integer;
    RAISE NOTICE 'Added doors column';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='seats' AND table_schema='public') THEN
    ALTER TABLE public.cars ADD COLUMN seats integer;
    RAISE NOTICE 'Added seats column';
  END IF;
END $$;

SELECT 'STEP 3: ✅ All car columns added safely' as progress;

-- =============================================
-- 5. NOW CREATE THE VIEW (AFTER COLUMNS EXIST)
-- =============================================
-- Drop any existing problematic view
DROP VIEW IF EXISTS public.car_inventory;

-- Create the view now that we know all columns exist
CREATE VIEW public.car_inventory AS
SELECT 
  id,
  vin as vinNumber,
  model,
  brand,
  year,
  color,
  price,
  status,
  current_floor,
  current_location,
  location,
  created_at,
  updated_at,
  notes,
  warranty_start,
  warranty_end,
  mileage,
  fuel_type,
  transmission,
  engine_size,
  doors,
  seats
FROM public.cars;

SELECT 'STEP 4: ✅ Car inventory view created' as progress;

-- =============================================
-- 6. CREATE NOTIFICATIONS SYSTEM
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE VIEW public.notifications_unread_counts AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM public.notifications 
WHERE read = false
GROUP BY user_id;

SELECT 'STEP 5: ✅ Notifications system created' as progress;

-- =============================================
-- 7. CREATE RPC FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.move_car(
  car_id uuid,
  new_location text,
  new_floor text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  UPDATE public.cars 
  SET 
    location = new_location,
    current_location = new_location,
    current_floor = COALESCE(new_floor, new_location),
    updated_at = now()
  WHERE id = car_id;
  
  SELECT json_build_object(
    'success', true,
    'car_id', car_id,
    'new_location', new_location,
    'updated_at', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_car_manual(
  car_id uuid,
  new_status text,
  new_location text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  UPDATE public.cars 
  SET 
    status = new_status,
    location = new_location,
    current_location = new_location,
    current_floor = new_location,
    updated_at = now()
  WHERE id = car_id;
  
  SELECT json_build_object(
    'success', true,
    'car_id', car_id,
    'new_status', new_status,
    'new_location', new_location,
    'updated_at', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

SELECT 'STEP 6: ✅ RPC functions created' as progress;

-- =============================================
-- 8. SET PERMISSIONS
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT SELECT ON public.car_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications_unread_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car_manual(uuid, text, text) TO authenticated;

SELECT 'STEP 7: ✅ Permissions granted' as progress;

-- =============================================
-- 9. ADD SAMPLE DATA
-- =============================================
-- Only add sample data if table is empty
INSERT INTO public.cars (vin, model, brand, year, color, price, status, location, current_floor, current_location)
SELECT 
  'SAMPLE001', 'Voyah Free', 'Voyah', 2024, 'White', 45000, 'available', 'showroom', 'showroom', 'showroom'
WHERE NOT EXISTS (SELECT 1 FROM public.cars LIMIT 1);

INSERT INTO public.cars (vin, model, brand, year, color, price, status, location, current_floor, current_location)
SELECT 
  'SAMPLE002', 'Voyah Dream', 'Voyah', 2024, 'Black', 55000, 'available', 'showroom', 'showroom', 'showroom'
WHERE (SELECT COUNT(*) FROM public.cars) <= 1;

INSERT INTO public.cars (vin, model, brand, year, color, price, status, location, current_floor, current_location)
SELECT 
  'SAMPLE003', 'MHero 917', 'MHero', 2024, 'Blue', 65000, 'available', 'garage', 'garage', 'garage'
WHERE (SELECT COUNT(*) FROM public.cars) <= 2;

SELECT 'STEP 8: ✅ Sample data added' as progress;

-- =============================================
-- 10. FINAL VERIFICATION
-- =============================================
SELECT '=== FINAL VERIFICATION ===' as info;

SELECT 'Cars table final columns:' as check;
SELECT column_name FROM information_schema.columns WHERE table_name = 'cars' AND table_schema = 'public' ORDER BY ordinal_position;

SELECT 'Sample cars created:' as check;
SELECT id, model, brand, color, status, location FROM public.cars;

SELECT 'Views created:' as check;
SELECT table_name FROM information_schema.views WHERE table_schema = 'public';

SELECT 'Functions created:' as check;
SELECT proname FROM pg_proc WHERE proname IN ('move_car', 'move_car_manual');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '🎉 DATABASE SETUP COMPLETE! 🎉' as result;
SELECT 'All tables, columns, views, functions, and sample data created successfully.' as result;
SELECT 'You can now test both your web and desktop applications.' as result;
