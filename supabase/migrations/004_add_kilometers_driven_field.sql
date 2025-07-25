-- Migration to add kilometers_driven field for depreciation tracking
-- This field will track the actual kilometers the car has been driven

-- Add kilometers_driven column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS kilometers_driven INTEGER DEFAULT 0 CHECK (kilometers_driven >= 0);

-- Add kilometers_driven column to car_inventory table (if it exists separately)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_inventory') THEN
        ALTER TABLE car_inventory 
        ADD COLUMN IF NOT EXISTS kilometers_driven INTEGER DEFAULT 0 CHECK (kilometers_driven >= 0);
    END IF;
END $$;

-- Add comment to explain the field
COMMENT ON COLUMN cars.kilometers_driven IS 'Actual kilometers driven by the vehicle, used for depreciation calculations';

-- Create index for better performance on depreciation queries
CREATE INDEX IF NOT EXISTS idx_cars_kilometers_driven ON cars(kilometers_driven);

-- Update existing records to have 0 kilometers driven if NULL
UPDATE cars SET kilometers_driven = 0 WHERE kilometers_driven IS NULL;

-- Add RLS policy for kilometers_driven field
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Create policy for updating kilometers_driven
CREATE POLICY "Users can update kilometers_driven" 
  ON cars 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true); 