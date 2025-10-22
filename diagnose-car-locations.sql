-- Diagnose car locations in the database
-- This will help us understand what values are actually being used

-- Check total count of cars
SELECT 'Total Cars' as metric, COUNT(*) as count FROM public.car_inventory;

-- Check current_location values
SELECT 'Current Location Values' as metric, current_location, COUNT(*) as count 
FROM public.car_inventory 
GROUP BY current_location 
ORDER BY count DESC;

-- Check current_floor values (if column exists)
SELECT 'Current Floor Values' as metric, current_floor, COUNT(*) as count 
FROM public.car_inventory 
GROUP BY current_floor 
ORDER BY count DESC;

-- Check cars with NULL current_location (should be in inventory)
SELECT 'Cars with NULL current_location' as metric, COUNT(*) as count 
FROM public.car_inventory 
WHERE current_location IS NULL;

-- Check cars that should be in inventory based on our logic
SELECT 'Cars in Inventory (our logic)' as metric, COUNT(*) as count 
FROM public.car_inventory 
WHERE current_location = 'CAR_INVENTORY' 
   OR current_location IS NULL 
   OR current_location = 'Inventory'
   OR current_floor = 'INVENTORY'
   OR current_floor = 'Inventory';

-- Sample of cars to see their actual values
SELECT 'Sample Cars' as metric, vin, model, current_location, current_floor 
FROM public.car_inventory 
LIMIT 10;
