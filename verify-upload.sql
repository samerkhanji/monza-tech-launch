-- Verify Upload Success - Monza TECH Database
-- Run this after executing the main upload script

-- Check total count
SELECT 'Total Vehicles in Database:' as info, COUNT(*) as count FROM public.car_inventory;

-- Check breakdown by status
SELECT 'Vehicles by Status:' as info, status, COUNT(*) as count 
FROM public.car_inventory 
GROUP BY status 
ORDER BY count DESC;

-- Check breakdown by floor location
SELECT 'Vehicles by Floor Location:' as info, current_floor, COUNT(*) as count 
FROM public.car_inventory 
GROUP BY current_floor 
ORDER BY count DESC;

-- Check breakdown by model
SELECT 'Vehicles by Model:' as info, model, COUNT(*) as count 
FROM public.car_inventory 
GROUP BY model 
ORDER BY count DESC;

-- Check breakdown by year
SELECT 'Vehicles by Year:' as info, year, COUNT(*) as count 
FROM public.car_inventory 
GROUP BY year 
ORDER BY year DESC;

-- Check warranty information
SELECT 'Vehicles with Warranty Info:' as info, 
       COUNT(*) as total_vehicles,
       COUNT(vehicle_warranty_expiry) as with_vehicle_warranty,
       COUNT(battery_warranty_expiry) as with_battery_warranty,
       COUNT(dms_warranty_deadline) as with_dms_deadline
FROM public.car_inventory;

-- Sample of recent additions
SELECT 'Sample of Recent Vehicles:' as info, 
       client_name, model, year, color, status, current_floor
FROM public.car_inventory 
ORDER BY created_at DESC 
LIMIT 10;
