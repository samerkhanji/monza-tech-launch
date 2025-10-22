-- UPLOAD REAL MONZA DATA
-- This uploads your existing car inventory to the cars table
-- Run this in Supabase SQL Editor

-- First, clear sample data (optional - remove this section if you want to keep sample data)
DELETE FROM public.cars WHERE vin IN ('SAMPLE001', 'SAMPLE002', 'SAMPLE003');

-- Add missing warranty columns to cars table if they don't exist
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

-- Insert your real car inventory data
INSERT INTO public.cars (
    client_name, vin, vehicle_type, color, model, year, 
    delivery_date, vehicle_warranty_expiry, battery_warranty_expiry, 
    dms_warranty_deadline, status, notes, brand, price, location, current_floor, current_location,
    created_at, updated_at
) VALUES 
-- Sample of your real data (add more as needed)
('Yoland Salem', 'LDP95H961SE900274', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-17', '2030-05-17', '2033-05-17', '2030-08-20', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('H.E. Saqr Ghabbash Said Ghabbash', 'LDP95H963RE104961', 'REEV', 'BLACK', 'Dream', 2024, 
 '2025-06-03', '2030-06-03', '2033-06-03', '2029-10-15', 'sold', 'Sold', 'Voyah', 55000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

('Assaad Obeid', 'LDP95H960SE900265', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-17', '2030-05-17', '2033-05-17', '2030-08-20', 'sold', 'Sold', 'Voyah', 45000, 'delivered', 'delivered', 'delivered', NOW(), NOW()),

-- Add more vehicles here following the same pattern
-- You can copy from your complete-117-vehicles-upload.sql and modify the table name

-- Available vehicles in showroom
('Available Stock', 'STOCK001', 'REEV', 'WHITE', 'Free', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'available', 'Available for sale', 'Voyah', 45000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

('Available Stock', 'STOCK002', 'REEV', 'BLACK', 'Dream', 2024, 
 NULL, '2029-12-31', '2032-12-31', '2029-12-31', 'available', 'Available for sale', 'Voyah', 55000, 'showroom', 'showroom', 'showroom', NOW(), NOW()),

('Available Stock', 'STOCK003', 'REEV', 'BLUE', 'Courage', 2025, 
 NULL, '2030-12-31', '2033-12-31', '2030-12-31', 'available', 'Available for sale', 'Voyah', 65000, 'showroom', 'showroom', 'showroom', NOW(), NOW());

-- Verification
SELECT 'Upload complete!' as result;
SELECT 'Total cars in database:' as check, COUNT(*) as count FROM public.cars;
SELECT 'Cars by status:' as check;
SELECT status, COUNT(*) as count FROM public.cars GROUP BY status ORDER BY status;
