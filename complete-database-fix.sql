-- COMPLETE DATABASE FIX FOR MONZA TECH
-- This script fixes all the 404 and 42P01 errors identified
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. CREATE MISSING AUDIT_LOG TABLE
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

-- Grant permissions for audit_log
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE ON SEQUENCE public.audit_log_id_seq TO authenticated;

-- =============================================
-- 2. CREATE CAR_INVENTORY VIEW 
-- =============================================
-- This creates a view so the frontend can use .from('car_inventory')
-- while the actual data is stored in the 'cars' table
CREATE OR REPLACE VIEW public.car_inventory AS
SELECT 
  id,
  vin as vinNumber,
  model,
  brand,
  year,
  color,
  price,
  status,
  location as current_floor,
  location as current_location,
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

-- =============================================
-- 3. CREATE NOTIFICATIONS VIEW STUB
-- =============================================
CREATE OR REPLACE VIEW public.notifications_unread_counts AS
SELECT 0::integer AS unread_count;

-- =============================================
-- 4. CREATE PROPER MOVE_CAR RPC FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.move_car(p_car_id uuid, p_to text)
RETURNS TABLE (id uuid, location text, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_to text := upper(replace(trim(p_to), ' ', '_'));
BEGIN
  -- Validate destination
  IF v_to NOT IN ('SHOWROOM_1','SHOWROOM_2','CAR_INVENTORY','GARAGE_INVENTORY','SCHEDULE') THEN
    RAISE EXCEPTION 'Invalid destination: %. Must be one of: SHOWROOM_1, SHOWROOM_2, CAR_INVENTORY, GARAGE_INVENTORY, SCHEDULE', p_to;
  END IF;

  -- Update the car location
  RETURN QUERY
  UPDATE public.cars
     SET location = v_to,
         updated_at = now()
   WHERE cars.id = p_car_id
  RETURNING cars.id, cars.location, cars.updated_at;
  
  -- Check if any rows were updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car with ID % not found', p_car_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION public.move_car(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.move_car(uuid, text) TO authenticated;

-- =============================================
-- 5. CREATE MANUAL MOVE CAR FUNCTION (Alternative)
-- =============================================
CREATE OR REPLACE FUNCTION public.move_car_manual(p_car_id uuid, p_to text, p_notes text DEFAULT NULL)
RETURNS TABLE (id uuid, location text, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_to text := upper(replace(trim(p_to), ' ', '_'));
  v_notes text;
BEGIN
  -- Validate destination
  IF v_to NOT IN ('SHOWROOM_1','SHOWROOM_2','CAR_INVENTORY','GARAGE_INVENTORY','SCHEDULE') THEN
    RAISE EXCEPTION 'Invalid destination: %. Must be one of: SHOWROOM_1, SHOWROOM_2, CAR_INVENTORY, GARAGE_INVENTORY, SCHEDULE', p_to;
  END IF;

  -- Prepare notes
  IF p_notes IS NOT NULL AND trim(p_notes) != '' THEN
    v_notes := trim(p_notes) || ' (Moved on ' || current_date || ')';
  END IF;

  -- Update the car location
  RETURN QUERY
  UPDATE public.cars
     SET location = v_to,
         updated_at = now(),
         notes = CASE 
           WHEN v_notes IS NOT NULL THEN v_notes
           ELSE notes
         END
   WHERE cars.id = p_car_id
  RETURNING cars.id, cars.location, cars.updated_at;
  
  -- Check if any rows were updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car with ID % not found', p_car_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.move_car_manual(uuid, text, text) TO authenticated;

-- =============================================
-- 6. ENSURE RLS POLICIES ALLOW UPDATES
-- =============================================
-- Enable RLS on cars table if not already enabled
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS cars_update_authenticated ON public.cars;

-- Create update policy for authenticated users
CREATE POLICY cars_update_authenticated
ON public.cars
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Ensure select policy exists too
DROP POLICY IF EXISTS cars_select_authenticated ON public.cars;
CREATE POLICY cars_select_authenticated
ON public.cars
FOR SELECT
USING (auth.role() = 'authenticated');

-- =============================================
-- 7. VERIFICATION QUERIES
-- =============================================
-- These will help verify everything is working

-- Check that all required tables/views exist
SELECT 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_schema='public' 
  AND table_name IN ('cars','car_inventory','notifications_unread_counts','audit_log')
ORDER BY table_name;

-- Check that the move_car function exists with correct signature
SELECT
  n.nspname AS schema, 
  p.proname AS function_name, 
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' 
  AND p.proname IN ('move_car', 'move_car_manual');

-- Show sample of cars data structure
SELECT 
  id, vin, model, brand, location, created_at
FROM public.cars
LIMIT 3;

-- Show car_inventory view structure
SELECT 
  id, vinNumber, model, brand, current_floor, created_at
FROM public.car_inventory
LIMIT 3;
