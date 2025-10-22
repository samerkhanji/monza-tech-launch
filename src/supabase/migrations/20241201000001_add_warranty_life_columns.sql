-- Add warranty_life column to inventory tables
-- This column will store warranty information as TEXT (can be changed to DATE or INTEGER later)

-- Add to floor_1 table
ALTER TABLE IF EXISTS floor_1 ADD COLUMN IF NOT EXISTS warranty_life TEXT;

-- Add to floor_2 table  
ALTER TABLE IF EXISTS floor_2 ADD COLUMN IF NOT EXISTS warranty_life TEXT;

-- Add to car_inventory table
ALTER TABLE IF EXISTS car_inventory ADD COLUMN IF NOT EXISTS warranty_life TEXT;

-- Add to garage_inventory table
ALTER TABLE IF EXISTS garage_inventory ADD COLUMN IF NOT EXISTS warranty_life TEXT;

-- Add comments for documentation
COMMENT ON COLUMN floor_1.warranty_life IS 'Warranty life information for vehicles on floor 1';
COMMENT ON COLUMN floor_2.warranty_life IS 'Warranty life information for vehicles on floor 2';
COMMENT ON COLUMN car_inventory.warranty_life IS 'Warranty life information for vehicles in car inventory';
COMMENT ON COLUMN garage_inventory.warranty_life IS 'Warranty life information for vehicles in garage inventory';

-- Grant permissions (if needed)
GRANT UPDATE ON floor_1 TO authenticated;
GRANT UPDATE ON floor_2 TO authenticated;
GRANT UPDATE ON car_inventory TO authenticated;
GRANT UPDATE ON garage_inventory TO authenticated;
