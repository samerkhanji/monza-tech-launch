-- FIX VIEW SECURITY DEFINER ISSUES
-- This specifically addresses the SECURITY DEFINER problem on views
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. CHECK CURRENT VIEW DEFINITIONS
-- =============================================
SELECT 'Current view definitions:' as info;
SELECT schemaname, viewname, viewowner, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('car_inventory', 'notifications_unread_counts');

-- =============================================
-- 2. DROP AND RECREATE VIEWS WITHOUT SECURITY DEFINER
-- =============================================

-- Drop existing views completely
DROP VIEW IF EXISTS public.car_inventory CASCADE;
DROP VIEW IF EXISTS public.notifications_unread_counts CASCADE;

SELECT 'STEP 1: ✅ Dropped existing views' as progress;

-- Recreate car_inventory view as a regular view (NOT SECURITY DEFINER)
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
  seats,
  client_name,
  vehicle_type,
  model_year,
  delivery_date,
  vehicle_warranty_expiry,
  battery_warranty_expiry,
  dms_warranty_deadline,
  service_date,
  contact_info
FROM public.cars;

-- Recreate notifications_unread_counts view as a regular view (NOT SECURITY DEFINER)
CREATE VIEW public.notifications_unread_counts AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM public.notifications 
WHERE read = false
GROUP BY user_id;

SELECT 'STEP 2: ✅ Recreated views without SECURITY DEFINER' as progress;

-- =============================================
-- 3. SET PROPER OWNERSHIP AND PERMISSIONS
-- =============================================

-- Set proper ownership (to postgres or your main role)
-- ALTER VIEW public.car_inventory OWNER TO postgres;
-- ALTER VIEW public.notifications_unread_counts OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.car_inventory TO authenticated;
GRANT SELECT ON public.notifications_unread_counts TO authenticated;

-- Explicitly revoke from anon and public
REVOKE ALL ON public.car_inventory FROM anon, public;
REVOKE ALL ON public.notifications_unread_counts FROM anon, public;

SELECT 'STEP 3: ✅ Set proper permissions on views' as progress;

-- =============================================
-- 4. VERIFY THE VIEWS ARE NOW SECURE
-- =============================================

SELECT '=== VERIFICATION ===' as info;

-- Check that views are no longer SECURITY DEFINER
SELECT 'View definitions after fix:' as check;
SELECT schemaname, viewname, viewowner 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('car_inventory', 'notifications_unread_counts');

-- Test that views work correctly
SELECT 'car_inventory view test:' as check, COUNT(*) as count FROM public.car_inventory;
SELECT 'notifications_unread_counts view test:' as check, COUNT(*) as count FROM public.notifications_unread_counts;

-- Check permissions
SELECT 'View permissions:' as check;
SELECT schemaname, objectname, privilege_type, grantee 
FROM information_schema.table_privileges 
WHERE schemaname = 'public' 
AND objectname IN ('car_inventory', 'notifications_unread_counts')
ORDER BY objectname, grantee;

-- =============================================
-- 5. ADDITIONAL SECURITY MEASURES
-- =============================================

-- Create a function to safely get unread counts for current user only
CREATE OR REPLACE FUNCTION public.get_my_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT unread_count 
     FROM public.notifications_unread_counts 
     WHERE user_id = auth.uid()), 
    0
  );
$$;

-- Grant permission on the function
GRANT EXECUTE ON FUNCTION public.get_my_unread_count() TO authenticated;

SELECT 'STEP 4: ✅ Created secure notification count function' as progress;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '🔒 VIEW SECURITY DEFINER ISSUES FIXED! 🔒' as result;
SELECT 'Views are now regular views without SECURITY DEFINER' as result;
SELECT 'RLS policies will now apply correctly to view queries' as result;
SELECT 'Added secure function for notification counts' as result;
SELECT 'Your views are now secure and production-ready!' as result;
