-- Add Warranty Fields to Car Inventory
-- Created: 2025-01-23
-- This migration adds warranty tracking fields to the car_inventory table

-- Add warranty fields to car_inventory table
ALTER TABLE public.car_inventory
  ADD COLUMN IF NOT EXISTS warranty_start_date date,
  ADD COLUMN IF NOT EXISTS warranty_end_date   date,
  ADD COLUMN IF NOT EXISTS warranty_notes      text;

-- Create warranty helper view
CREATE OR REPLACE VIEW public.car_inventory_warranty AS
SELECT
  c.*,
  GREATEST(0, (c.warranty_end_date::date - CURRENT_DATE))::int AS warranty_days_left
FROM public.car_inventory c;

-- Add constraint to ensure warranty dates are logical
ALTER TABLE public.car_inventory
  ADD CONSTRAINT IF NOT EXISTS warranty_dates_order_chk
  CHECK (
    warranty_start_date IS NULL OR warranty_end_date IS NULL
    OR warranty_end_date >= warranty_start_date
  );

-- Create index for warranty date sorting
CREATE INDEX IF NOT EXISTS idx_car_inventory_warranty_end_date 
ON public.car_inventory (warranty_end_date) 
WHERE warranty_end_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.car_inventory.warranty_start_date IS 'Start date of vehicle warranty coverage';
COMMENT ON COLUMN public.car_inventory.warranty_end_date IS 'End date of vehicle warranty coverage (expiry date)';
COMMENT ON COLUMN public.car_inventory.warranty_notes IS 'Additional notes about warranty coverage';
COMMENT ON VIEW public.car_inventory_warranty IS 'Car inventory with calculated warranty days remaining';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Warranty fields migration completed successfully!';
  RAISE NOTICE 'Added: warranty_start_date, warranty_end_date, warranty_notes columns';
  RAISE NOTICE 'Created: car_inventory_warranty view with warranty_days_left calculation';
  RAISE NOTICE 'Added: warranty dates order constraint and index';
END $$;
