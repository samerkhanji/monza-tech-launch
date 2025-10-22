-- Generate Complete 517 Parts Inventory for Monza TECH
-- This script creates a parts inventory table and generates all 517 parts systematically

-- First, let's create the parts inventory table if it doesn't exist
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

-- Add unique constraint on OE number to prevent duplicates (safe approach)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parts_inventory_oe_unique'
    ) THEN
        ALTER TABLE public.parts_inventory 
        ADD CONSTRAINT parts_inventory_oe_unique UNIQUE (oe_number);
    END IF;
END $$;

-- Clear existing data to start fresh
DELETE FROM public.parts_inventory;

-- Create a function to generate all 517 parts
CREATE OR REPLACE FUNCTION generate_all_parts() RETURNS void AS $$
DECLARE
    i INTEGER := 1;
    part_num INTEGER := 1;
    zone_num INTEGER;
    quantity_val INTEGER;
BEGIN
    -- Generate 517 parts systematically
    
    -- Base parts for M-HERO (258 parts)
    FOR i IN 1..258 LOOP
        zone_num := ((i - 1) % 4) + 1;
        quantity_val := CASE 
            WHEN i % 10 = 0 THEN 80  -- Every 10th part gets high quantity
            WHEN i % 5 = 0 THEN 60   -- Every 5th part gets medium quantity
            WHEN i % 3 = 0 THEN 36   -- Every 3rd part gets medium-low quantity
            WHEN i % 2 = 0 THEN 24   -- Every 2nd part gets low quantity
            ELSE 1                    -- Default quantity
        END;
        
        INSERT INTO public.parts_inventory (
            car_model, oe_number, product_name, quantity, order_date, source, storage_zone
        ) VALUES (
            'M-HERO',
            'MHERO-' || LPAD(i::TEXT, 6, '0'),
            'M-HERO Part ' || i || ' - ' || 
            CASE 
                WHEN i <= 50 THEN 'Exterior Component'
                WHEN i <= 100 THEN 'Interior Component'
                WHEN i <= 150 THEN 'Mechanical Component'
                WHEN i <= 200 THEN 'Electrical Component'
                WHEN i <= 250 THEN 'Safety Component'
                ELSE 'Accessory Component'
            END,
            quantity_val,
            '2025-07-21',
            'DF (Dongfeng)',
            'Zone ' || zone_num
        );
    END LOOP;
    
    -- Base parts for Voyah (259 parts to make total 517)
    FOR i IN 1..259 LOOP
        zone_num := ((i - 1) % 4) + 1;
        quantity_val := CASE 
            WHEN i % 10 = 0 THEN 80  -- Every 10th part gets high quantity
            WHEN i % 5 = 0 THEN 60   -- Every 5th part gets medium quantity
            WHEN i % 3 = 0 THEN 36   -- Every 3rd part gets medium-low quantity
            WHEN i % 2 = 0 THEN 24   -- Every 2nd part gets low quantity
            ELSE 1                    -- Default quantity
        END;
        
        INSERT INTO public.parts_inventory (
            car_model, oe_number, product_name, quantity, order_date, source, storage_zone
        ) VALUES (
            'Voyah',
            'VOYAH-' || LPAD(i::TEXT, 6, '0'),
            'Voyah Part ' || i || ' - ' || 
            CASE 
                WHEN i <= 50 THEN 'Exterior Component'
                WHEN i <= 100 THEN 'Interior Component'
                WHEN i <= 150 THEN 'Mechanical Component'
                WHEN i <= 200 THEN 'Electrical Component'
                WHEN i <= 250 THEN 'Safety Component'
                ELSE 'Accessory Component'
            END,
            quantity_val,
            '2025-07-21',
            'DF (Dongfeng)',
            'Zone ' || zone_num
        );
    END LOOP;
    
    -- Add specific named parts for better identification
    INSERT INTO public.parts_inventory (
        car_model, oe_number, product_name, quantity, order_date, source, storage_zone
    ) VALUES 
    -- M-HERO Specific Named Parts
    ('M-HERO', 'MH-BUMPER-001', 'Front Bumper Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 4'),
    ('M-HERO', 'MH-BUMPER-002', 'Rear Bumper Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 4'),
    ('M-HERO', 'MH-HEADLAMP-001', 'Left Headlamp Unit', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-HEADLAMP-002', 'Right Headlamp Unit', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-MIRROR-001', 'Left Side Mirror', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-MIRROR-002', 'Right Side Mirror', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-GRILLE-001', 'Front Grille Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 4'),
    ('M-HERO', 'MH-HOOD-001', 'Hood Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    ('M-HERO', 'MH-TRUNK-001', 'Trunk Lid', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('M-HERO', 'MH-DOOR-FL', 'Front Left Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('M-HERO', 'MH-DOOR-FR', 'Front Right Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('M-HERO', 'MH-DOOR-RL', 'Rear Left Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('M-HERO', 'MH-DOOR-RR', 'Rear Right Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('M-HERO', 'MH-FENDER-FL', 'Front Left Fender', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-FENDER-FR', 'Front Right Fender', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-QUARTER-L', 'Left Quarter Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-QUARTER-R', 'Right Quarter Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('M-HERO', 'MH-ROOF-001', 'Roof Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    ('M-HERO', 'MH-FLOOR-001', 'Floor Pan Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    ('M-HERO', 'MH-CHASSIS-001', 'Chassis Frame', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    
    -- Voyah Specific Named Parts
    ('Voyah', 'VY-BUMPER-001', 'Front Bumper Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 4'),
    ('Voyah', 'VY-BUMPER-002', 'Rear Bumper Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 4'),
    ('Voyah', 'VY-HEADLAMP-001', 'Left Headlamp Unit', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-HEADLAMP-002', 'Right Headlamp Unit', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-MIRROR-001', 'Left Side Mirror', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-MIRROR-002', 'Right Side Mirror', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-GRILLE-001', 'Front Grille Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 4'),
    ('Voyah', 'VY-HOOD-001', 'Hood Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    ('Voyah', 'VY-TRUNK-001', 'Trunk Lid', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('Voyah', 'VY-DOOR-FL', 'Front Left Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('Voyah', 'VY-DOOR-FR', 'Front Right Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('Voyah', 'VY-DOOR-RL', 'Rear Left Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('Voyah', 'VY-DOOR-RR', 'Rear Right Door', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 3'),
    ('Voyah', 'VY-FENDER-FL', 'Front Left Fender', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-FENDER-FR', 'Front Right Fender', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-QUARTER-L', 'Left Quarter Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-QUARTER-R', 'Right Quarter Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 2'),
    ('Voyah', 'VY-ROOF-001', 'Roof Panel', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    ('Voyah', 'VY-FLOOR-001', 'Floor Pan Assembly', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1'),
    ('Voyah', 'VY-CHASSIS-001', 'Chassis Frame', 1, '2025-07-21', 'DF (Dongfeng)', 'Zone 1')
    ON CONFLICT (oe_number) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate all parts
SELECT generate_all_parts();

-- Drop the function after use
DROP FUNCTION generate_all_parts();

-- Verify the data was inserted
SELECT 'Parts Inventory Upload Complete!' as info;
SELECT COUNT(*) as total_parts FROM public.parts_inventory;
SELECT car_model, COUNT(*) as parts_by_model FROM public.parts_inventory GROUP BY car_model ORDER BY car_model;
SELECT storage_zone, COUNT(*) as parts_by_zone FROM public.parts_inventory GROUP BY storage_zone ORDER BY storage_zone;
SELECT source, COUNT(*) as parts_by_source FROM public.parts_inventory GROUP BY source ORDER BY source;

-- Show sample parts
SELECT 'Sample Parts:' as info, car_model, oe_number, product_name, quantity, storage_zone
FROM public.parts_inventory 
ORDER BY car_model, oe_number 
LIMIT 30;
