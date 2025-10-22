-- CORRECTED COMPLETE DATABASE FIX FOR MONZA TECH
-- This script fixes the column mismatch errors and creates missing tables
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
-- 2. CREATE OR UPDATE CARS TABLE WITH ALL NEEDED COLUMNS
-- =============================================
-- First, create the cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vin text,
  model text,
  brand text,
  year integer,
  color text,
  price numeric,
  status text DEFAULT 'available',
  location text DEFAULT 'showroom',
  current_floor text,
  current_location text,
  notes text,
  warranty_start date,
  warranty_end date,
  mileage integer,
  fuel_type text,
  transmission text,
  engine_size text,
  doors integer,
  seats integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist (safe to run multiple times)
DO $$ 
BEGIN
  -- Add color column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='color') THEN
    ALTER TABLE public.cars ADD COLUMN color text;
  END IF;
  
  -- Add price column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='price') THEN
    ALTER TABLE public.cars ADD COLUMN price numeric;
  END IF;
  
  -- Add current_floor column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='current_floor') THEN
    ALTER TABLE public.cars ADD COLUMN current_floor text;
  END IF;
  
  -- Add current_location column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='current_location') THEN
    ALTER TABLE public.cars ADD COLUMN current_location text;
  END IF;
  
  -- Add notes column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='notes') THEN
    ALTER TABLE public.cars ADD COLUMN notes text;
  END IF;
  
  -- Add warranty columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='warranty_start') THEN
    ALTER TABLE public.cars ADD COLUMN warranty_start date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='warranty_end') THEN
    ALTER TABLE public.cars ADD COLUMN warranty_end date;
  END IF;
  
  -- Add vehicle details columns if missing
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
-- 3. CREATE CAR_INVENTORY VIEW (SAFE VERSION)
-- =============================================
-- This creates a view that only uses columns that exist
CREATE OR REPLACE VIEW public.car_inventory AS
SELECT 
  id,
  vin as vinNumber,
  model,
  brand,
  year,
  COALESCE(color, 'Unknown') as color,
  COALESCE(price, 0) as price,
  COALESCE(status, 'available') as status,
  COALESCE(location, current_floor, 'showroom') as current_floor,
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

-- Grant permissions for car_inventory view
GRANT SELECT ON public.car_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;

-- =============================================
-- 4. CREATE NOTIFICATIONS_UNREAD_COUNTS VIEW
-- =============================================
-- Create notifications table if it doesn't exist
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications_unread_counts TO authenticated;

-- =============================================
-- 5. CREATE MOVE_CAR RPC FUNCTIONS
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
    current_floor = COALESCE(new_floor, current_floor),
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.move_car(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car_manual(uuid, text, text) TO authenticated;

-- =============================================
-- 6. CREATE SAMPLE DATA (OPTIONAL)
-- =============================================
-- Insert a few sample cars if the table is empty
INSERT INTO public.cars (vin, model, brand, year, color, price, status, location)
SELECT 
  'SAMPLE001', 'Voyah Free', 'Voyah', 2024, 'White', 45000, 'available', 'showroom'
WHERE NOT EXISTS (SELECT 1 FROM public.cars LIMIT 1);

INSERT INTO public.cars (vin, model, brand, year, color, price, status, location)
SELECT 
  'SAMPLE002', 'Voyah Dream', 'Voyah', 2024, 'Black', 55000, 'available', 'showroom'
WHERE (SELECT COUNT(*) FROM public.cars) = 1;

-- =============================================
-- 7. VERIFICATION QUERIES
-- =============================================
-- These will show you what was created
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'Car inventory view columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'car_inventory' ORDER BY ordinal_position;

SELECT 'Sample cars:' as info;
SELECT id, model, brand, color, status, location FROM public.cars LIMIT 5;

-- Success message
SELECT '✅ Database setup complete! All tables, views, and functions created successfully.' as result;
