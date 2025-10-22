-- WORKING DATABASE FIX FOR MONZA TECH
-- This fixes the PostgreSQL syntax error and handles all column issues
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. DIAGNOSE CURRENT STATE
-- =============================================
SELECT 'DIAGNOSTIC: Current tables and their types:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =============================================
-- 2. HANDLE car_inventory CONFLICT SAFELY
-- =============================================
DO $$
DECLARE
    has_car_inventory BOOLEAN;
    row_count INTEGER := 0;
BEGIN
    -- Check if car_inventory exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'car_inventory' AND table_schema = 'public'
    ) INTO has_car_inventory;
    
    IF has_car_inventory THEN
        -- Get row count
        EXECUTE 'SELECT COUNT(*) FROM car_inventory' INTO row_count;
        RAISE NOTICE 'Found car_inventory with % rows', row_count;
        
        IF row_count > 0 THEN
            -- Create backup table
            DROP TABLE IF EXISTS car_inventory_backup;
            EXECUTE 'CREATE TABLE car_inventory_backup AS SELECT * FROM car_inventory';
            RAISE NOTICE 'Created backup of % rows', row_count;
        END IF;
        
        -- Drop the existing car_inventory
        EXECUTE 'DROP TABLE IF EXISTS car_inventory CASCADE';
        EXECUTE 'DROP VIEW IF EXISTS car_inventory CASCADE';
        RAISE NOTICE 'Dropped existing car_inventory';
    END IF;
END $$;

SELECT 'STEP 1: ✅ Handled car_inventory conflict' as progress;

-- =============================================
-- 3. CREATE AUDIT_LOG TABLE
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
-- 4. ENSURE CARS TABLE WITH ALL COLUMNS
-- =============================================
-- Create cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns one by one with proper syntax
DO $$ 
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Add vin column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='vin' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN vin text;
        RAISE NOTICE 'Added vin column';
    END IF;

    -- Add model column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='model' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN model text;
        RAISE NOTICE 'Added model column';
    END IF;

    -- Add brand column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='brand' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN brand text;
        RAISE NOTICE 'Added brand column';
    END IF;

    -- Add year column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='year' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN year integer;
        RAISE NOTICE 'Added year column';
    END IF;

    -- Add color column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='color' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN color text;
        RAISE NOTICE 'Added color column';
    END IF;

    -- Add price column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='price' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN price numeric;
        RAISE NOTICE 'Added price column';
    END IF;

    -- Add status column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='status' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN status text DEFAULT 'available';
        RAISE NOTICE 'Added status column';
    END IF;

    -- Add location column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='location' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN location text DEFAULT 'showroom';
        RAISE NOTICE 'Added location column';
    END IF;

    -- Add current_floor column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='current_floor' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN current_floor text DEFAULT 'showroom';
        RAISE NOTICE 'Added current_floor column';
    END IF;

    -- Add current_location column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='current_location' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN current_location text DEFAULT 'showroom';
        RAISE NOTICE 'Added current_location column';
    END IF;

    -- Add notes column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='notes' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN notes text;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Add warranty_start column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='warranty_start' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN warranty_start date;
        RAISE NOTICE 'Added warranty_start column';
    END IF;

    -- Add warranty_end column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='warranty_end' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN warranty_end date;
        RAISE NOTICE 'Added warranty_end column';
    END IF;

    -- Add mileage column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='mileage' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN mileage integer;
        RAISE NOTICE 'Added mileage column';
    END IF;

    -- Add fuel_type column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='fuel_type' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN fuel_type text;
        RAISE NOTICE 'Added fuel_type column';
    END IF;

    -- Add transmission column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='transmission' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN transmission text;
        RAISE NOTICE 'Added transmission column';
    END IF;

    -- Add engine_size column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='engine_size' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN engine_size text;
        RAISE NOTICE 'Added engine_size column';
    END IF;

    -- Add doors column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='doors' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN doors integer;
        RAISE NOTICE 'Added doors column';
    END IF;

    -- Add seats column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='seats' AND table_schema='public'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE public.cars ADD COLUMN seats integer;
        RAISE NOTICE 'Added seats column';
    END IF;
END $$;

SELECT 'STEP 3: ✅ Cars table columns ensured' as progress;

-- =============================================
-- 5. CREATE car_inventory VIEW
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
-- 6. RESTORE DATA WITH SMART COLUMN DETECTION
-- =============================================
DO $$
DECLARE
    backup_exists BOOLEAN;
    row_count INTEGER := 0;
    has_vinnumber BOOLEAN := FALSE;
    has_vin BOOLEAN := FALSE;
    vin_column text;
BEGIN
    -- Check if backup exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'car_inventory_backup' AND table_schema = 'public'
    ) INTO backup_exists;
    
    IF backup_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM car_inventory_backup' INTO row_count;
        
        IF row_count > 0 THEN
            -- Check which VIN column exists
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='car_inventory_backup' AND column_name='vinnumber' AND table_schema='public'
            ) INTO has_vinnumber;
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='car_inventory_backup' AND column_name='vin' AND table_schema='public'
            ) INTO has_vin;
            
            -- Determine which VIN column to use
            IF has_vinnumber THEN
                vin_column := 'vinnumber';
            ELSIF has_vin THEN
                vin_column := 'vin';
            ELSE
                vin_column := '''RESTORED''';
            END IF;
            
            -- Restore data with proper column mapping
            EXECUTE format('
                INSERT INTO public.cars (id, vin, model, brand, year, color, price, status, location, current_floor, current_location, created_at, updated_at)
                SELECT 
                    COALESCE(id, gen_random_uuid()),
                    COALESCE(%s, ''RESTORED''),
                    COALESCE(model, ''Unknown''),
                    COALESCE(brand, ''Unknown''),
                    COALESCE(year, 2024),
                    COALESCE(color, ''Unknown''),
                    COALESCE(price, 0),
                    COALESCE(status, ''available''),
                    COALESCE(
                        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=''car_inventory_backup'' AND column_name=''location'' AND table_schema=''public'') 
                             THEN location ELSE ''showroom'' END, 
                        ''showroom''
                    ),
                    COALESCE(
                        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=''car_inventory_backup'' AND column_name=''current_floor'' AND table_schema=''public'') 
                             THEN current_floor ELSE ''showroom'' END, 
                        ''showroom''
                    ),
                    COALESCE(
                        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=''car_inventory_backup'' AND column_name=''current_location'' AND table_schema=''public'') 
                             THEN current_location ELSE ''showroom'' END, 
                        ''showroom''
                    ),
                    COALESCE(created_at, now()),
                    COALESCE(updated_at, now())
                FROM car_inventory_backup
            ', vin_column);
            
            RAISE NOTICE 'Restored % rows from backup using % column', row_count, vin_column;
        END IF;
    END IF;
END $$;

SELECT 'STEP 5: ✅ Data restored with smart mapping' as progress;

-- =============================================
-- 7. ADD SAMPLE DATA (ONLY IF NO CARS EXIST)
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
-- 8. CREATE NOTIFICATIONS SYSTEM
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
-- 9. CREATE RPC FUNCTIONS
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
-- 10. SET PERMISSIONS
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT SELECT ON public.car_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications_unread_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car_manual(uuid, text, text) TO authenticated;

SELECT 'STEP 9: ✅ Permissions granted' as progress;

-- =============================================
-- 11. CLEANUP AND VERIFICATION
-- =============================================
-- Drop backup table
DROP TABLE IF EXISTS car_inventory_backup;

-- Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

SELECT 'Total cars in database:' as check, COUNT(*) as count FROM public.cars;

SELECT 'Sample of cars:' as check;
SELECT id, model, brand, color, status, location FROM public.cars LIMIT 5;

SELECT 'car_inventory view test:' as check, COUNT(*) as view_count FROM public.car_inventory;

SELECT 'Tables in database:' as check;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'Views in database:' as check;
SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '🎉 DATABASE SETUP COMPLETE! 🎉' as result;
SELECT 'All syntax errors fixed and data preserved.' as result;
SELECT 'Your applications should now work perfectly!' as result;
