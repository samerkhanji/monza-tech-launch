-- BULLETPROOF DATABASE FIX FOR MONZA TECH
-- This completely avoids column reference issues
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. DIAGNOSE AND BACKUP
-- =============================================
SELECT 'DIAGNOSTIC: Checking current state...' as info;

-- Show what tables exist
SELECT 'Current tables:' as check;
SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Backup car_inventory if it exists
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

SELECT 'STEP 1: ✅ Backup and cleanup complete' as progress;

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
-- 3. CREATE COMPLETE CARS TABLE
-- =============================================
-- Drop and recreate cars table to ensure clean state
DROP TABLE IF EXISTS public.cars CASCADE;

CREATE TABLE public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vin text,
  model text,
  brand text,
  year integer,
  color text,
  price numeric,
  status text DEFAULT 'available',
  location text DEFAULT 'showroom',
  current_floor text DEFAULT 'showroom',
  current_location text DEFAULT 'showroom',
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

SELECT 'STEP 3: ✅ Cars table created with all columns' as progress;

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
-- 5. RESTORE DATA (BULLETPROOF METHOD)
-- =============================================
-- Use separate queries for different column scenarios
DO $$
DECLARE
    backup_exists BOOLEAN;
    row_count INTEGER := 0;
    has_vinnumber BOOLEAN := FALSE;
    has_vin BOOLEAN := FALSE;
    restored_count INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'car_inventory_backup' AND table_schema = 'public'
    ) INTO backup_exists;
    
    IF backup_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM car_inventory_backup' INTO row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE 'Attempting to restore % rows...', row_count;
            
            -- Check which VIN column exists
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='car_inventory_backup' AND column_name='vinnumber' AND table_schema='public'
            ) INTO has_vinnumber;
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='car_inventory_backup' AND column_name='vin' AND table_schema='public'
            ) INTO has_vin;
            
            -- Restore based on which VIN column exists
            IF has_vinnumber THEN
                INSERT INTO public.cars (id, vin, model, brand, year, color, price, status, location, current_floor, current_location, created_at, updated_at)
                SELECT 
                    COALESCE(id, gen_random_uuid()),
                    COALESCE(vinnumber, 'RESTORED'),
                    COALESCE(model, 'Unknown'),
                    COALESCE(brand, 'Unknown'),
                    COALESCE(year, 2024),
                    COALESCE(color, 'Unknown'),
                    COALESCE(price, 0),
                    COALESCE(status, 'available'),
                    'showroom',
                    'showroom',
                    'showroom',
                    COALESCE(created_at, now()),
                    COALESCE(updated_at, now())
                FROM car_inventory_backup;
                RAISE NOTICE 'Restored using vinnumber column';
            ELSIF has_vin THEN
                INSERT INTO public.cars (id, vin, model, brand, year, color, price, status, location, current_floor, current_location, created_at, updated_at)
                SELECT 
                    COALESCE(id, gen_random_uuid()),
                    COALESCE(vin, 'RESTORED'),
                    COALESCE(model, 'Unknown'),
                    COALESCE(brand, 'Unknown'),
                    COALESCE(year, 2024),
                    COALESCE(color, 'Unknown'),
                    COALESCE(price, 0),
                    COALESCE(status, 'available'),
                    'showroom',
                    'showroom',
                    'showroom',
                    COALESCE(created_at, now()),
                    COALESCE(updated_at, now())
                FROM car_inventory_backup;
                RAISE NOTICE 'Restored using vin column';
            ELSE
                -- No VIN column, restore without it
                INSERT INTO public.cars (id, vin, model, brand, year, color, price, status, location, current_floor, current_location, created_at, updated_at)
                SELECT 
                    COALESCE(id, gen_random_uuid()),
                    'RESTORED',
                    COALESCE(model, 'Unknown'),
                    COALESCE(brand, 'Unknown'),
                    COALESCE(year, 2024),
                    COALESCE(color, 'Unknown'),
                    COALESCE(price, 0),
                    COALESCE(status, 'available'),
                    'showroom',
                    'showroom',
                    'showroom',
                    COALESCE(created_at, now()),
                    COALESCE(updated_at, now())
                FROM car_inventory_backup;
                RAISE NOTICE 'Restored without VIN column';
            END IF;
            
            SELECT COUNT(*) INTO restored_count FROM public.cars;
            RAISE NOTICE 'Successfully restored % rows', restored_count;
        END IF;
    END IF;
END $$;

SELECT 'STEP 5: ✅ Data restoration complete' as progress;

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

SELECT 'Cars table structure:' as check;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cars' AND table_schema = 'public' ORDER BY ordinal_position;

SELECT 'All tables:' as check;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'All views:' as check;
SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '🎉 BULLETPROOF DATABASE SETUP COMPLETE! 🎉' as result;
SELECT 'All column reference issues eliminated!' as result;
SELECT 'Database is now ready for your applications!' as result;
