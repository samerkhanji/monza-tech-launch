-- Quick Parts Inventory Test for Monza TECH
-- This script creates a simple parts table with a few test parts

-- Create the parts inventory table
CREATE TABLE IF NOT EXISTS public.parts_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_model VARCHAR(100) NOT NULL,
    oe_number VARCHAR(100) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    order_date DATE NOT NULL,
    source VARCHAR(100) NOT NULL,
    storage_zone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear existing data
DELETE FROM public.parts_inventory;

-- Add a few test parts
INSERT INTO public.parts_inventory (
    car_model, oe_number, product_name, quantity, order_date, source, storage_zone
) VALUES 
('M-HERO', 'TEST-001', 'Test Bumper', 5, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
('M-HERO', 'TEST-002', 'Test Headlamp', 10, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
('Voyah', 'TEST-003', 'Test Mirror', 3, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
('Voyah', 'TEST-004', 'Test Grille', 7, '2025-07-21', 'DF (Dongfeng)', 'Zone 4');

-- Verify the data
SELECT 'Test Parts Added Successfully!' as info;
SELECT COUNT(*) as total_parts FROM public.parts_inventory;
SELECT * FROM public.parts_inventory ORDER BY car_model, oe_number;
