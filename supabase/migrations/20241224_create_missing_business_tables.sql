-- Missing Business Tables for Dashboard Views
-- Created: 2024-12-24
-- This migration creates all the missing tables that the dashboard views reference

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Car Inventory table (if not exists, based on dashboard view requirements)
CREATE TABLE IF NOT EXISTS public.car_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  trim text,
  brand text DEFAULT 'Voyah',
  vin text UNIQUE,
  status text CHECK (status IN ('in_stock', 'reserved', 'sold', 'maintenance')) DEFAULT 'in_stock',
  current_floor text DEFAULT 'Inventory',
  color text,
  year integer,
  purchase_price decimal(10,2),
  selling_price decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Garage Cars table for service tracking
CREATE TABLE IF NOT EXISTS public.garage_cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin text NOT NULL,
  model text NOT NULL,
  status text CHECK (status IN ('queued', 'in_service', 'awaiting_parts', 'completed', 'ready_for_pickup')) DEFAULT 'queued',
  assigned_to text,
  customer_name text,
  phone text,
  started_at timestamptz,
  eta_finish timestamptz,
  completed_at timestamptz,
  service_type text,
  work_description text,
  parts_needed text[],
  labor_hours decimal(4,2),
  parts_cost decimal(10,2),
  labor_cost decimal(10,2),
  total_cost decimal(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Repair History table
CREATE TABLE IF NOT EXISTS public.repair_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_car_id uuid REFERENCES public.garage_cars(id),
  vin text NOT NULL,
  model text,
  technician text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  service_type text NOT NULL,
  work_performed text,
  parts_used text[],
  labor_hours decimal(4,2),
  customer_satisfaction integer CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  created_at timestamptz DEFAULT now()
);

-- 4. Test Drives table
CREATE TABLE IF NOT EXISTS public.test_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text,
  email text,
  model text NOT NULL,
  vin text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  sales_person text,
  test_drive_type text CHECK (test_drive_type IN ('client', 'employee')) DEFAULT 'client',
  route text,
  feedback text,
  result text CHECK (result IN ('interested', 'not_interested', 'needs_followup', 'booked_again')),
  followup_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Client Requests table (alternative name for requests)
CREATE TABLE IF NOT EXISTS public.client_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  priority text CHECK (priority IN ('urgent', 'medium', 'low')) DEFAULT 'medium',
  status text CHECK (status IN ('open', 'in_progress', 'blocked', 'done', 'cancelled')) DEFAULT 'open',
  customer_name text,
  phone text,
  email text,
  related_vin text,
  assigned_to text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Sales table for tracking sales pipeline
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text,
  email text,
  model text,
  vin text,
  status text CHECK (status IN ('lead', 'contacted', 'demo_scheduled', 'demo_completed', 'negotiating', 'contract_sent', 'won', 'lost')) DEFAULT 'lead',
  sales_person text,
  lead_source text,
  budget_range text,
  financing_type text,
  trade_in_vehicle text,
  estimated_value decimal(10,2),
  final_price decimal(10,2),
  down_payment decimal(10,2),
  financing_amount decimal(10,2),
  monthly_payment decimal(10,2),
  closed_at timestamptz,
  lost_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Repair Schedule table for pickup/delivery tracking
CREATE TABLE IF NOT EXISTS public.repair_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_car_id uuid REFERENCES public.garage_cars(id),
  customer_name text NOT NULL,
  phone text,
  model text,
  vin text,
  service_type text,
  at_time timestamptz NOT NULL,
  schedule_type text CHECK (schedule_type IN ('pickup', 'delivery', 'appointment')) DEFAULT 'appointment',
  address text,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 8. Sales Orders table for delivery tracking
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id uuid REFERENCES public.sales(id),
  customer_name text NOT NULL,
  phone text,
  email text,
  model text,
  vin text,
  order_date timestamptz DEFAULT now(),
  delivery_at timestamptz,
  delivery_address text,
  final_price decimal(10,2),
  deposit_paid decimal(10,2),
  balance_due decimal(10,2),
  payment_status text CHECK (payment_status IN ('pending', 'partial', 'paid')) DEFAULT 'pending',
  delivery_status text CHECK (delivery_status IN ('pending', 'scheduled', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
  accessories text[],
  warranty_package text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Inventory Items table for parts tracking
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  supplier text,
  cost_price decimal(10,2),
  selling_price decimal(10,2),
  in_stock integer DEFAULT 0,
  min_level integer DEFAULT 5,
  max_level integer DEFAULT 100,
  location text,
  last_restocked timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (basic - authenticated users can read/write)
-- Car Inventory
CREATE POLICY "Users can view car inventory" ON public.car_inventory
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage car inventory" ON public.car_inventory
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Garage Cars
CREATE POLICY "Users can view garage cars" ON public.garage_cars
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage garage cars" ON public.garage_cars
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Repair History
CREATE POLICY "Users can view repair history" ON public.repair_history
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage repair history" ON public.repair_history
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Test Drives
CREATE POLICY "Users can view test drives" ON public.test_drives
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage test drives" ON public.test_drives
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Client Requests  
CREATE POLICY "Users can view client requests" ON public.client_requests
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage client requests" ON public.client_requests
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Sales
CREATE POLICY "Users can view sales" ON public.sales
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage sales" ON public.sales
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Repair Schedule
CREATE POLICY "Users can view repair schedule" ON public.repair_schedule
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage repair schedule" ON public.repair_schedule
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Sales Orders
CREATE POLICY "Users can view sales orders" ON public.sales_orders
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage sales orders" ON public.sales_orders
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Inventory Items
CREATE POLICY "Users can view inventory items" ON public.inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage inventory items" ON public.inventory_items
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON public.car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON public.car_inventory(model);
CREATE INDEX IF NOT EXISTS idx_garage_cars_status ON public.garage_cars(status);
CREATE INDEX IF NOT EXISTS idx_garage_cars_assigned ON public.garage_cars(assigned_to);
CREATE INDEX IF NOT EXISTS idx_repair_history_dates ON public.repair_history(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_test_drives_scheduled ON public.test_drives(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON public.client_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_closed ON public.sales(closed_at);
CREATE INDEX IF NOT EXISTS idx_repair_schedule_time ON public.repair_schedule(at_time);
CREATE INDEX IF NOT EXISTS idx_sales_orders_delivery ON public.sales_orders(delivery_at);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON public.inventory_items(in_stock, min_level);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garage_cars TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_drives TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_schedule TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_car_inventory_updated_at
  BEFORE UPDATE ON public.car_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garage_cars_updated_at
  BEFORE UPDATE ON public.garage_cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_drives_updated_at
  BEFORE UPDATE ON public.test_drives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_requests_updated_at
  BEFORE UPDATE ON public.client_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.car_inventory (model, trim, status, current_floor, color, year, selling_price) VALUES
  ('Free', 'Standard', 'in_stock', 'Showroom 1', 'White', 2024, 45000),
  ('Free', 'Premium', 'in_stock', 'Showroom 2', 'Black', 2024, 52000),
  ('Passion', 'Standard', 'in_stock', 'Inventory', 'Blue', 2024, 65000),
  ('Passion', 'Premium', 'reserved', 'Showroom 1', 'Red', 2024, 72000)
ON CONFLICT DO NOTHING;

INSERT INTO public.garage_cars (vin, model, status, assigned_to, customer_name) VALUES
  ('VIN123456789', 'Free', 'in_service', 'John Mechanic', 'Ahmed Ali'),
  ('VIN987654321', 'Passion', 'awaiting_parts', 'Mike Tech', 'Sarah Smith')
ON CONFLICT DO NOTHING;

INSERT INTO public.sales (customer_name, model, status, sales_person) VALUES
  ('John Doe', 'Free', 'lead', 'Sales Rep 1'),
  ('Jane Smith', 'Passion', 'negotiating', 'Sales Rep 2'),
  ('Ali Hassan', 'Free', 'won', 'Sales Rep 1')
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory_items (part_number, name, category, in_stock, min_level) VALUES
  ('BRAKE001', 'Brake Pads', 'Brakes', 3, 5),
  ('FILT001', 'Air Filter', 'Filters', 12, 10),
  ('OIL001', 'Engine Oil', 'Fluids', 2, 8)
ON CONFLICT DO NOTHING;
