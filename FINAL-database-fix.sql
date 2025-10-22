-- FINAL DATABASE FIX FOR MONZA TECH
-- This script handles all column mismatches and creates a working schema
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. DIAGNOSE CURRENT SCHEMA FIRST
-- =============================================
-- Let's see what we're working with
SELECT 'Current tables:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- =============================================
-- 2. CREATE MISSING AUDIT_LOG TABLE
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
-- 3. CREATE/UPDATE CARS TABLE WITH ALL COLUMNS
-- =============================================
-- Create cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add all possible columns safely (won't error if they exist)
DO $$ 
BEGIN
  -- Basic car info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='vin') THEN
    ALTER TABLE public.cars ADD COLUMN vin text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='model') THEN
    ALTER TABLE public.cars ADD COLUMN model text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='brand') THEN
    ALTER TABLE public.cars ADD COLUMN brand text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='year') THEN
    ALTER TABLE public.cars ADD COLUMN year integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='color') THEN
    ALTER TABLE public.cars ADD COLUMN color text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='price') THEN
    ALTER TABLE public.cars ADD COLUMN price numeric;
  END IF;
  
  -- Status and location columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='status') THEN
    ALTER TABLE public.cars ADD COLUMN status text DEFAULT 'available';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='location') THEN
    ALTER TABLE public.cars ADD COLUMN location text DEFAULT 'showroom';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='current_floor') THEN
    ALTER TABLE public.cars ADD COLUMN current_floor text DEFAULT 'showroom';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='current_location') THEN
    ALTER TABLE public.cars ADD COLUMN current_location text DEFAULT 'showroom';
  END IF;
  
  -- Additional info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='notes') THEN
    ALTER TABLE public.cars ADD COLUMN notes text;
  END IF;
  
  -- Warranty columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='warranty_start') THEN
    ALTER TABLE public.cars ADD COLUMN warranty_start date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='warranty_end') THEN
    ALTER TABLE public.cars ADD COLUMN warranty_end date;
  END IF;
  
  -- Vehicle details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='mileage') THEN
    ALTER TABLE public.cars ADD COLUMN mileage integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='fuel_type') THEN
    ALTER TABLE public.cars ADD COLUMN fuel_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='transmission') THEN
    ALTER TABLE public.cars ADD COLUMN transmission text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='engine_size') THEN
    ALTER TABLE public.cars ADD COLUMN engine_size text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='doors') THEN
    ALTER TABLE public.cars ADD COLUMN doors integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='seats') THEN
    ALTER TABLE public.cars ADD COLUMN seats integer;
  END IF;
END $$;

-- =============================================
-- 4. CREATE SAFE CAR_INVENTORY VIEW
-- =============================================
-- Drop existing view if it exists
DROP VIEW IF EXISTS public.car_inventory;

-- Create view with only columns that exist
CREATE OR REPLACE VIEW public.car_inventory AS
SELECT 
  id,
  COALESCE(vin, '') as vinNumber,
  COALESCE(model, '') as model,
  COALESCE(brand, '') as brand,
  COALESCE(year, 2024) as year,
  COALESCE(color, 'Unknown') as color,
  COALESCE(price, 0) as price,
  COALESCE(status, 'available') as status,
  COALESCE(current_floor, location, 'showroom') as current_floor,
  COALESCE(current_location, location, 'showroom') as current_location,
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
-- 5. CREATE NOTIFICATIONS SYSTEM
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

-- Create the unread counts view
CREATE OR REPLACE VIEW public.notifications_unread_counts AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM public.notifications 
WHERE read = false
GROUP BY user_id;

-- =============================================
-- 6. CREATE RPC FUNCTIONS
-- =============================================
-- Function to move car between locations
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
  -- Update the car location
  UPDATE public.cars 
  SET 
    location = new_location,
    current_location = new_location,
    current_floor = COALESCE(new_floor, current_floor, new_location),
    updated_at = now()
  WHERE id = car_id;
  
  -- Return success result
  SELECT json_build_object(
    'success', true,
    'car_id', car_id,
    'new_location', new_location,
    'updated_at', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Manual move car function
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
  -- Update the car
  UPDATE public.cars 
  SET 
    status = new_status,
    location = new_location,
    current_location = new_location,
    current_floor = new_location,
    updated_at = now()
  WHERE id = car_id;
  
  -- Return success result
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

-- =============================================
-- 7. SET PERMISSIONS
-- =============================================
-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT SELECT ON public.car_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications_unread_counts TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.move_car(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car_manual(uuid, text, text) TO authenticated;

-- =============================================
-- 8. INSERT SAMPLE DATA
-- =============================================
-- Insert sample cars for testing (only if table is empty)
INSERT INTO public.cars (vin, model, brand, year, color, price, status, location, current_floor, current_location)
SELECT 
  'SAMPLE001', 'Voyah Free', 'Voyah', 2024, 'White', 45000, 'available', 'showroom', 'showroom', 'showroom'
WHERE NOT EXISTS (SELECT 1 FROM public.cars LIMIT 1);

INSERT INTO public.cars (vin, model, brand, year, color, price, status, location, current_floor, current_location)
SELECT 
  'SAMPLE002', 'Voyah Dream', 'Voyah', 2024, 'Black', 55000, 'available', 'showroom', 'showroom', 'showroom'
WHERE (SELECT COUNT(*) FROM public.cars) = 1;

INSERT INTO public.cars (vin, model, brand, year, color, price, status, location, current_floor, current_location)
SELECT 
  'SAMPLE003', 'MHero 917', 'MHero', 2024, 'Blue', 65000, 'available', 'garage', 'garage', 'garage'
WHERE (SELECT COUNT(*) FROM public.cars) = 2;

-- =============================================
-- 9. VERIFICATION
-- =============================================
SELECT '=== VERIFICATION RESULTS ===' as info;

SELECT 'Tables created:' as check;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'Cars table columns:' as check;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cars' ORDER BY ordinal_position;

SELECT 'Sample data:' as check;
SELECT id, model, brand, color, status, location FROM public.cars LIMIT 5;

SELECT 'Functions created:' as check;
SELECT proname FROM pg_proc WHERE proname IN ('move_car', 'move_car_manual');

-- Final success message
SELECT '✅ DATABASE SETUP COMPLETE! All tables, views, functions, and sample data created successfully.' as result;
