-- Add warranty columns to car_inventory table
ALTER TABLE car_inventory 
ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
ADD COLUMN IF NOT EXISTS warranty_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN car_inventory.warranty_start_date IS 'Start date of the warranty period';
COMMENT ON COLUMN car_inventory.warranty_end_date IS 'End date of the warranty period';
COMMENT ON COLUMN car_inventory.warranty_notes IS 'Additional notes about the warranty';

-- Create an index on warranty_end_date for efficient queries
CREATE INDEX IF NOT EXISTS idx_car_inventory_warranty_end_date 
ON car_inventory(warranty_end_date);

-- Test the columns by updating a sample car
UPDATE car_inventory 
SET 
  warranty_start_date = '2024-01-01',
  warranty_end_date = '2027-01-01',
  warranty_notes = 'Standard 3-year warranty'
WHERE vin = (SELECT vin FROM car_inventory LIMIT 1);
