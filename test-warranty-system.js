// Test Warranty System
// Run this in your Supabase SQL editor to test the warranty system

-- 1. First, let's check if the warranty fields exist in car_inventory
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'car_inventory' 
AND column_name LIKE 'warranty%'
ORDER BY column_name;

-- 2. Check if the warranty view exists
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'car_inventory_warranty'
) as warranty_view_exists;

-- 3. Check if the warranty constraint exists
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'warranty_dates_order_chk';

-- 4. Check if the warranty index exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'car_inventory' 
AND indexname = 'idx_car_inventory_warranty_end_date';

-- 5. Test inserting warranty data (replace with actual VIN)
-- UPDATE public.car_inventory 
-- SET 
--   warranty_start_date = '2024-01-01',
--   warranty_end_date = '2027-01-01',
--   warranty_notes = 'Standard 3-year warranty'
-- WHERE vin = 'YOUR_TEST_VIN';

-- 6. Test the warranty view
-- SELECT 
--   vin,
--   warranty_start_date,
--   warranty_end_date,
--   warranty_notes,
--   warranty_days_left
-- FROM public.car_inventory_warranty 
-- WHERE warranty_end_date IS NOT NULL
-- ORDER BY warranty_days_left ASC;

-- 7. Test the constraint (this should fail)
-- UPDATE public.car_inventory 
-- SET 
--   warranty_start_date = '2027-01-01',
--   warranty_end_date = '2024-01-01'
-- WHERE vin = 'YOUR_TEST_VIN';

-- 8. Test valid warranty dates (this should work)
-- UPDATE public.car_inventory 
-- SET 
--   warranty_start_date = '2024-01-01',
--   warranty_end_date = '2027-01-01'
-- WHERE vin = 'YOUR_TEST_VIN';

-- 9. Check warranty system status
SELECT 
  'Warranty Fields' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'car_inventory' AND column_name = 'warranty_start_date')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Warranty View' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'car_inventory_warranty')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Warranty Constraint' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'warranty_dates_order_chk')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Warranty Index' as component,
  CASE 
    WHEN EXISTS (SELECT FROM pg_indexes WHERE tablename = 'car_inventory' AND indexname = 'idx_car_inventory_warranty_end_date')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 10. Sample warranty data for testing (uncomment to use)
-- INSERT INTO public.car_inventory (
--   vin, 
--   model, 
--   year, 
--   color, 
--   status,
--   warranty_start_date,
--   warranty_end_date,
--   warranty_notes
-- ) VALUES (
--   'TEST_WARRANTY_001',
--   'Test Model',
--   2024,
--   'Test Color',
--   'in_stock',
--   '2024-01-01',
--   '2027-01-01',
--   'Test warranty for demonstration'
-- );

-- 11. Check warranty days calculation
-- SELECT 
--   vin,
--   warranty_start_date,
--   warranty_end_date,
--   CURRENT_DATE as today,
--   warranty_end_date::date - CURRENT_DATE as days_until_expiry,
--   GREATEST(0, (warranty_end_date::date - CURRENT_DATE))::int as warranty_days_left
-- FROM public.car_inventory 
-- WHERE warranty_end_date IS NOT NULL
-- ORDER BY warranty_days_left ASC;

-- 12. Clean up test data (uncomment when ready)
-- DELETE FROM public.car_inventory WHERE vin = 'TEST_WARRANTY_001';
