-- Add the two new locations to the floor_loc enum
ALTER TYPE floor_loc ADD VALUE IF NOT EXISTS 'GARAGE_INVENTORY';
ALTER TYPE floor_loc ADD VALUE IF NOT EXISTS 'SCHEDULE';

-- Create views for the new locations
CREATE OR REPLACE VIEW public.view_garage_inventory AS
  SELECT * FROM public.car_inventory WHERE current_floor='GARAGE_INVENTORY';

CREATE OR REPLACE VIEW public.view_schedule AS
  SELECT * FROM public.car_inventory WHERE current_floor='SCHEDULE';

-- Create index for better performance on floor filtering
CREATE INDEX IF NOT EXISTS car_inventory_current_floor_idx ON public.car_inventory(current_floor);

-- Update RLS policies to allow the new floor values
-- (This assumes you already have policies for car_inventory updates)
