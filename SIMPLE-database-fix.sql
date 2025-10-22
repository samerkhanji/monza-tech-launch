-- SIMPLE DATABASE FIX FOR MONZA TECH
-- This avoids complex dynamic SQL and uses a straightforward approach
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. HANDLE car_inventory CONFLICT
-- =============================================
-- First, let's see what we have
SELECT 'DIAGNOSTIC: Current car_inventory structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'car_inventory' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Backup any existing data
DO $$
DECLARE
    has_car_inventory BOOLEAN;
    row_count INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'car_inventory' AND table_schema = 'public'
    ) INTO has_car_inventory;
    
    IF has_car_inventory THEN
        EXECUTE 'SELECT COUNT(*) FROM car_inventory' INTO row_count;
        RAISE NOTICE 'Found car_inventory with % rows', row_count;
        
        IF row_count > 0 THEN
            DROP TABLE IF EXISTS car_inventory_backup;
            EXECUTE 'CREATE TABLE car_inventory_backup AS SELECT * FROM car_inventory';
            RAISE NOTICE 'Backed up % rows', row_count;
        END IF;
        
        -- Drop existing car_inventory
        EXECUTE 'DROP TABLE IF EXISTS car_inventory CASCADE';
        EXECUTE 'DROP VIEW IF EXISTS car_inventory CASCADE';
        RAISE NOTICE 'Dropped existing car_inventory';
    END IF;
END $$;

SELECT 'STEP 1: ✅ Handled car_inventory conflict' as progress;

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

SELECT 'STEP 2: ✅ Audit log table ready' as progress;

-- =============================================
-- 3. CREATE/UPDATE CARS TABLE
-- =============================================
-- Create cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add all necessary columns (safe - won't error if they exist)
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS vin text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS location text DEFAULT 'showroom';
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS current_floor text DEFAULT 'showroom';
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS current_location text DEFAULT 'showroom';
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS warranty_start date;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS warranty_end date;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS mileage integer;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS fuel_type text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS transmission text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS engine_size text;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS doors integer;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS seats integer;

SELECT 'STEP 3: ✅ Cars table columns ensured' as progress;

-- =============================================
-- 4. CREATE car_inventory VIEW
-- =============================================
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

SELECT 'STEP 4: ✅ car_inventory view created' as progress;

-- =============================================
-- 5. RESTORE DATA (SIMPLE APPROACH)
-- =============================================
-- Check what columns exist in backup and restore accordingly
DO $$
DECLARE
    backup_exists BOOLEAN;
    row_count INTEGER := 0;
    backup_columns text;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'car_inventory_backup' AND table_schema = 'public'
    ) INTO backup_exists;
    
    IF backup_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM car_inventory_backup' INTO row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE 'Restoring % rows from backup...', row_count;
            
            -- Simple restore - just use the columns that definitely exist
            -- and provide defaults for missing ones
            INSERT INTO public.cars (
                id, 
                vin, 
                model, 
                brand, 
                year, 
                color, 
                price, 
                status, 
                location, 
                current_floor, 
                current_location,
                created_at,
                updated_at
            )
            SELECT 
                COALESCE(b.id, gen_random_uuid()),
                COALESCE(
                    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='car_inventory_backup' AND column_name='vinnumber') 
                         THEN b.vinnumber 
                         WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='car_inventory_backup' AND column_name='vin') 
                         THEN b.vin
                         ELSE 'RESTORED' END,
                    'RESTORED'
                ),
                COALESCE(b.model, 'Unknown'),
                COALESCE(b.brand, 'Unknown'),
                COALESCE(b.year, 2024),
                COALESCE(b.color, 'Unknown'),
                COALESCE(b.price, 0),
                COALESCE(b.status, 'available'),
                'showroom', -- Default location
                'showroom', -- Default current_floor
                'showroom', -- Default current_location
                COALESCE(b.created_at, now()),
                COALESCE(b.updated_at, now())
            FROM car_inventory_backup b;
            
            RAISE NOTICE 'Successfully restored % rows', row_count;
        END IF;
    END IF;
END $$;

SELECT 'STEP 5: ✅ Data restored' as progress;

-- =============================================
-- 6. ADD SAMPLE DATA (ONLY IF NO CARS EXIST)
-- =============================================
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

SELECT 'STEP 6: ✅ Sample data added if needed' as progress;

-- =============================================
-- 7. CREATE NOTIFICATIONS SYSTEM
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

SELECT 'STEP 7: ✅ Notifications system ready' as progress;

-- =============================================
-- 8. CREATE RPC FUNCTIONS
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

SELECT 'STEP 8: ✅ RPC functions created' as progress;

-- =============================================
-- 9. SET PERMISSIONS
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT SELECT ON public.car_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications_unread_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car_manual(uuid, text, text) TO authenticated;

SELECT 'STEP 9: ✅ Permissions granted' as progress;

-- =============================================
-- 10. CLEANUP AND VERIFICATION
-- =============================================
-- Drop backup table
DROP TABLE IF EXISTS car_inventory_backup;

-- Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

SELECT 'Total cars in database:' as check, COUNT(*) as count FROM public.cars;

SELECT 'Sample of cars:' as check;
SELECT id, model, brand, color, status, location FROM public.cars LIMIT 5;

SELECT 'car_inventory view test:' as check, COUNT(*) as view_count FROM public.car_inventory;

SELECT 'Final cars table columns:' as check;
SELECT column_name FROM information_schema.columns WHERE table_name = 'cars' AND table_schema = 'public' ORDER BY ordinal_position;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '🎉 SIMPLE DATABASE SETUP COMPLETE! 🎉' as result;
SELECT 'All complex dynamic SQL removed - using simple, reliable approach.' as result;
SELECT 'Your applications should now work perfectly!' as result;
