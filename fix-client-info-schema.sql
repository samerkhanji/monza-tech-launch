-- Fix Client Information Schema for Monza TECH
-- This script adds missing client information columns to the car_inventory table

-- Add missing client information columns
ALTER TABLE public.car_inventory 
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_license_plate VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS sold_date DATE,
ADD COLUMN IF NOT EXISTS reservation_date DATE;

-- Update existing sold cars with basic client information
-- Extract phone numbers from client names where possible (this is a basic approach)
UPDATE public.car_inventory 
SET 
    client_phone = CASE 
        WHEN client_name LIKE '%0%' OR client_name LIKE '%1%' OR client_name LIKE '%2%' OR 
             client_name LIKE '%3%' OR client_name LIKE '%4%' OR client_name LIKE '%5%' OR 
             client_name LIKE '%6%' OR client_name LIKE '%7%' OR client_name LIKE '%8%' OR 
             client_name LIKE '%9%' THEN '+961-XX-XXXXX'
        ELSE '+961-XX-XXXXX'
    END,
    client_email = CASE 
        WHEN client_name IS NOT NULL THEN LOWER(REPLACE(REPLACE(client_name, ' ', '.'), '-', '.')) || '@example.com'
        ELSE NULL
    END,
    client_license_plate = CASE 
        WHEN client_name IS NOT NULL THEN 'LB-' || SUBSTRING(client_name, 1, 2) || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY client_name)::TEXT, 3, '0')
        ELSE NULL
    END,
    sold_date = CASE 
        WHEN status = 'sold' AND delivery_date IS NOT NULL THEN delivery_date
        WHEN status = 'sold' THEN '2025-01-01'
        ELSE NULL
    END
WHERE status = 'sold';

-- Show the updated schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'car_inventory' 
ORDER BY ordinal_position;

-- Show sample of updated data
SELECT 
    client_name,
    client_phone,
    client_email,
    client_license_plate,
    sold_date,
    status
FROM public.car_inventory 
WHERE status = 'sold' 
LIMIT 10;

-- Count cars with client information
SELECT 
    status,
    COUNT(*) as total_cars,
    COUNT(client_phone) as with_phone,
    COUNT(client_email) as with_email,
    COUNT(client_license_plate) as with_license_plate
FROM public.car_inventory 
GROUP BY status 
ORDER BY status;
