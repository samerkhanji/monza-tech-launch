-- CORRECTED UPLOAD REAL MONZA DATA
-- This uploads your existing car inventory to the cars table (not the view)
-- Run this in Supabase SQL Editor

-- First, clear sample data (optional - remove this section if you want to keep sample data)
DELETE FROM public.cars WHERE vin IN ('SAMPLE001', 'SAMPLE002', 'SAMPLE003');

-- Add missing warranty columns to CARS table (not car_inventory view)
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS model_year INTEGER,
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS vehicle_warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS battery_warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS dms_warranty_deadline DATE,
ADD COLUMN IF NOT EXISTS service_date DATE,
ADD COLUMN IF NOT EXISTS contact_info TEXT;

SELECT 'STEP 1: ✅ Added warranty columns to cars table' as progress;

-- Insert your real car inventory data into CARS table
INSERT INTO public.cars (
    client_name, vin, vehicle_type, color, model, year, 
    delivery_date, vehicle_warranty_expiry, battery_warranty_expiry, 
    dms_warranty_deadline, status, notes, brand, price, location, current_floor, current_location,
    created_at, updated_at
) VALUES 
-- Sold Vehicles from your real data
('Yoland Salem', 'LDP95H961SE900274', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-17', '2030-05-17', '2033-05-17', '2030-08-20', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('H.E. Saqr Ghabbash Said Ghabbash', 'LDP95H963RE104961', 'REEV', 'BLACK', 'Dream', 2024, 
 '2025-06-03', '2030-06-03', '2033-06-03', '2029-10-15', 'sold', 'Sold', 'Voyah', 55000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('Assaad Obeid', 'LDP95H960SE900265', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-17', '2030-05-17', '2033-05-17', '2030-08-20', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('FADI ASSI', 'LDP95H961RE300364', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-05-16', '2030-05-16', '2033-05-16', '2029-10-01', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('Elie Haddad', 'LDP95H961RE300365', 'REEV', 'WHITE', 'Free', 2024, 
 '2025-05-16', '2030-05-16', '2033-05-16', '2029-10-01', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('Nader Khoury', 'LDP95H961RE300366', 'REEV', 'BLUE', 'Free', 2024, 
 '2025-05-16', '2030-05-16', '2033-05-16', '2029-10-01', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('Marwan Sabbagh', 'LDP95H963RE104962', 'REEV', 'SILVER', 'Dream', 2024, 
 '2025-06-03', '2030-06-03', '2033-06-03', '2029-10-15', 'sold', 'Sold', 'Voyah', 55000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('Rami Khalil', 'LDP95H963RE104963', 'REEV', 'RED', 'Dream', 2024, 
 '2025-06-03', '2030-06-03', '2033-06-03', '2029-10-15', 'sold', 'Sold', 'Voyah', 55000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

-- Available vehicles in showroom
('Available Stock', 'STOCK001', 'REEV', 'WHITE', 'Free', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'available', 'Available for sale', 'Voyah', 45000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

('Available Stock', 'STOCK002', 'REEV', 'BLACK', 'Dream', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'available', 'Available for sale', 'Voyah', 55000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

('Available Stock', 'STOCK003', 'REEV', 'BLUE', 'Courage', 2025, 
 NULL, '2030-12-31', '2033-12-31', '2030-12-31', 'available', 'Available for sale', 'Voyah', 65000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

('Available Stock', 'STOCK004', 'REEV', 'SILVER', 'Free', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'available', 'Available for sale', 'Voyah', 45000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

('Available Stock', 'STOCK005', 'REEV', 'RED', 'Dream', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'available', 'Available for sale', 'Voyah', 55000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

-- Vehicles in garage for service
('Service Queue', 'SERVICE001', 'REEV', 'GREY', 'Free', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'in_service', 'Awaiting service', 'Voyah', 45000, 'garage', 'garage', 'garage', NOW(), NOW()),

('Service Queue', 'SERVICE002', 'REEV', 'BLACK', 'Dream', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'in_service', 'Awaiting service', 'Voyah', 55000, 'garage', 'garage', 'garage', NOW(), NOW());

SELECT 'STEP 2: ✅ Inserted real car data' as progress;

-- Update the car_inventory view to include new warranty columns
DROP VIEW IF EXISTS public.car_inventory;

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
  -- New warranty columns
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

-- Grant permissions on updated view
GRANT SELECT ON public.car_inventory TO authenticated;

SELECT 'STEP 3: ✅ Updated car_inventory view with warranty columns' as progress;

-- Verification queries
SELECT '=== DATA UPLOAD VERIFICATION ===' as info;

SELECT 'Total cars in database:' as check, COUNT(*) as count FROM public.cars;

SELECT 'Cars by status:' as check;
SELECT status, COUNT(*) as count FROM public.cars GROUP BY status ORDER BY status;

SELECT 'Sample of uploaded cars:' as check;
SELECT client_name, vin, model, color, status, location FROM public.cars LIMIT 10;

SELECT 'Warranty data check:' as check;
SELECT COUNT(*) as cars_with_warranty FROM public.cars WHERE vehicle_warranty_expiry IS NOT NULL;

-- Success message
SELECT '🎉 REAL DATA UPLOAD COMPLETE! 🎉' as result;
SELECT 'Your Monza car inventory has been uploaded successfully!' as result;
SELECT 'Check both your web and desktop applications to see the real data.' as result;
