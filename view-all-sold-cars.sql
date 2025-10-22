-- View All Sold Cars - Monza TECH
-- This script shows all sold vehicles with complete client and warranty information

-- First, let's see the current status of all cars
SELECT 
    'Current Status Summary' as info,
    status,
    COUNT(*) as count
FROM public.car_inventory 
GROUP BY status 
ORDER BY status;

-- Show all sold cars with complete information
SELECT 
    'ALL SOLD CARS - COMPLETE INFORMATION' as section,
    client_name,
    vin,
    vehicle_type,
    color,
    model,
    year as model_year,
    delivery_date,
    vehicle_warranty_expiry,
    battery_warranty_expiry,
    dms_warranty_deadline,
    service_date,
    contact_info,
    selling_price,
    status,
    notes,
    -- Client information (if available)
    client_phone,
    client_email,
    client_license_plate,
    client_address,
    sold_date,
    -- Timestamps
    created_at,
    updated_at
FROM public.car_inventory 
WHERE status = 'sold' OR status = 'Sold'
ORDER BY client_name, delivery_date;

-- Show sold cars by car model
SELECT 
    'SOLD CARS BY MODEL' as section,
    model,
    COUNT(*) as total_sold,
    COUNT(client_phone) as with_phone,
    COUNT(client_email) as with_email,
    COUNT(client_license_plate) as with_license_plate
FROM public.car_inventory 
WHERE status = 'sold' OR status = 'Sold'
GROUP BY model 
ORDER BY total_sold DESC;

-- Show sold cars by delivery date (recent first)
SELECT 
    'SOLD CARS BY DELIVERY DATE' as section,
    delivery_date,
    COUNT(*) as cars_delivered,
    STRING_AGG(client_name, ', ') as clients
FROM public.car_inventory 
WHERE (status = 'sold' OR status = 'Sold') AND delivery_date IS NOT NULL
GROUP BY delivery_date 
ORDER BY delivery_date DESC;

-- Show warranty expiry summary for sold cars
SELECT 
    'WARRANTY EXPIRY SUMMARY FOR SOLD CARS' as section,
    CASE 
        WHEN vehicle_warranty_expiry < CURRENT_DATE THEN 'EXPIRED'
        WHEN vehicle_warranty_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING SOON (30 days)'
        WHEN vehicle_warranty_expiry < CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRING SOON (90 days)'
        ELSE 'ACTIVE'
    END as warranty_status,
    COUNT(*) as cars_count,
    MIN(vehicle_warranty_expiry) as earliest_expiry,
    MAX(vehicle_warranty_expiry) as latest_expiry
FROM public.car_inventory 
WHERE (status = 'sold' OR status = 'Sold') AND vehicle_warranty_expiry IS NOT NULL
GROUP BY 
    CASE 
        WHEN vehicle_warranty_expiry < CURRENT_DATE THEN 'EXPIRED'
        WHEN vehicle_warranty_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING SOON (30 days)'
        WHEN vehicle_warranty_expiry < CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRING SOON (90 days)'
        ELSE 'ACTIVE'
    END
ORDER BY 
    CASE warranty_status
        WHEN 'EXPIRED' THEN 1
        WHEN 'EXPIRING SOON (30 days)' THEN 2
        WHEN 'EXPIRING SOON (90 days)' THEN 3
        ELSE 4
    END;

-- Show cars that need client information updates
SELECT 
    'CARS NEEDING CLIENT INFO UPDATES' as section,
    client_name,
    vin,
    model,
    delivery_date,
    CASE 
        WHEN client_phone IS NULL THEN '❌ Missing Phone'
        ELSE '✅ Has Phone'
    END as phone_status,
    CASE 
        WHEN client_email IS NULL THEN '❌ Missing Email'
        ELSE '✅ Has Email'
    END as email_status,
    CASE 
        WHEN client_license_plate IS NULL THEN '❌ Missing License Plate'
        ELSE '✅ Has License Plate'
    END as license_status
FROM public.car_inventory 
WHERE (status = 'sold' OR status = 'Sold')
    AND (client_phone IS NULL OR client_email IS NULL OR client_license_plate IS NULL)
ORDER BY client_name;

-- Count total sold cars
SELECT 
    'TOTAL SOLD CARS COUNT' as info,
    COUNT(*) as total_sold_cars,
    COUNT(CASE WHEN client_phone IS NOT NULL THEN 1 END) as with_phone,
    COUNT(CASE WHEN client_email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN client_license_plate IS NOT NULL THEN 1 END) as with_license_plate,
    COUNT(CASE WHEN vehicle_warranty_expiry IS NOT NULL THEN 1 END) as with_warranty_info
FROM public.car_inventory 
WHERE status = 'sold' OR status = 'Sold';
