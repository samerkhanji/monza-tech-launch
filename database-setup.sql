-- COMPLETE MONZA CAR INVENTORY DATABASE SETUP
-- Copy this entire script to Supabase SQL Editor and run it
-- URL: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/sql

-- Create the car inventory table
CREATE TABLE IF NOT EXISTS public.car_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('Available', 'Sold', 'Reserved', 'In Service')) DEFAULT 'Available',
  client_name TEXT,
  vin TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  color TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INTEGER NOT NULL,
  delivery_date DATE,
  vehicle_warranty_expiry DATE,
  battery_warranty_expiry DATE,
  dms_warranty_deadline DATE,
  service_date DATE,
  notes TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON public.car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_vin ON public.car_inventory(vin);
CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON public.car_inventory(model);
CREATE INDEX IF NOT EXISTS idx_car_inventory_client ON public.car_inventory(client_name);

-- Enable RLS
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for reading (everyone can read)
CREATE POLICY IF NOT EXISTS "inventory_read_all" ON public.car_inventory
  FOR SELECT TO authenticated USING (true);

-- Create policy for owners (full access)
CREATE POLICY IF NOT EXISTS "inventory_owners_full" ON public.car_inventory
  FOR ALL TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'OWNER')
  );

-- Success message
SELECT 'SUCCESS: Car inventory table created with indexes and policies!' as result;