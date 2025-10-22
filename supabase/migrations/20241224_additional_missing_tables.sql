-- Additional Missing Tables for Complete Application Support
-- Created: 2024-12-24
-- This migration creates additional tables referenced in the application code

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Audit Logs table for system auditing
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  timestamp timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  session_id text,
  changes_summary text,
  entity_id text,
  entity_type text
);

-- 2. Request Notifications table for messaging system
CREATE TABLE IF NOT EXISTS public.request_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'request_update',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3. Financial Analytics tables
CREATE TABLE IF NOT EXISTS public.repair_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_car_id uuid REFERENCES public.garage_cars(id),
  repair_date timestamptz NOT NULL,
  labor_cost decimal(10,2) DEFAULT 0,
  parts_cost decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2) DEFAULT 0,
  profit_margin decimal(5,2) DEFAULT 0,
  technician text,
  work_category text,
  customer_paid boolean DEFAULT false,
  payment_method text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicle_sales_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id),
  vehicle_cost decimal(10,2) NOT NULL,
  sale_price decimal(10,2) NOT NULL,
  profit decimal(10,2) GENERATED ALWAYS AS (sale_price - vehicle_cost) STORED,
  commission_rate decimal(5,2) DEFAULT 5.0,
  commission_amount decimal(10,2) GENERATED ALWAYS AS (sale_price * commission_rate / 100) STORED,
  accessories_cost decimal(10,2) DEFAULT 0,
  financing_fee decimal(10,2) DEFAULT 0,
  insurance_fee decimal(10,2) DEFAULT 0,
  registration_fee decimal(10,2) DEFAULT 0,
  total_fees decimal(10,2) GENERATED ALWAYS AS (accessories_cost + financing_fee + insurance_fee + registration_fee) STORED,
  net_profit decimal(10,2) GENERATED ALWAYS AS (profit - commission_amount - total_fees) STORED,
  sale_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.operational_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'rent', 'utilities', 'salaries', 'marketing', 'equipment', etc.
  subcategory text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  description text,
  vendor text,
  invoice_number text,
  cost_date timestamptz NOT NULL,
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  payment_date timestamptz,
  payment_method text,
  department text,
  approved_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. User Agreements table for terms and conditions tracking
CREATE TABLE IF NOT EXISTS public.user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  agreement_type text NOT NULL, -- 'terms_and_conditions', 'privacy_policy', etc.
  version text NOT NULL,
  agreed_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  content_hash text,
  is_active boolean DEFAULT true
);

-- 5. Cars table (main vehicle inventory, if not exists)
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin_number text UNIQUE NOT NULL,
  brand text DEFAULT 'Voyah',
  model text NOT NULL,
  year integer NOT NULL,
  color text,
  category text CHECK (category IN ('EV', 'REV', 'ICEV')) DEFAULT 'EV',
  status text CHECK (status IN ('in_stock', 'reserved', 'sold', 'maintenance')) DEFAULT 'in_stock',
  current_location text DEFAULT 'Inventory',
  selling_price decimal(10,2),
  battery_percentage integer DEFAULT 100 CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
  range_km integer,
  arrival_date timestamptz DEFAULT now(),
  customs text CHECK (customs IN ('not_paid', 'paid', 'pending', 'exempted')) DEFAULT 'not_paid',
  notes text,
  manufacturing_date date,
  range_extender_number text,
  high_voltage_battery_number text,
  front_motor_number text,
  rear_motor_number text,
  kilometers_driven integer DEFAULT 0,
  interior_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. PDI Inspections table
CREATE TABLE IF NOT EXISTS public.pdi_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  vin_number text NOT NULL,
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  technician_name text,
  start_date timestamptz,
  completion_date timestamptz,
  inspection_items jsonb DEFAULT '{}',
  issues_found text[],
  corrective_actions text[],
  photos text[],
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Test Drives detailed table (extending the basic one)
CREATE TABLE IF NOT EXISTS public.test_drive_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_drive_id uuid REFERENCES public.test_drives(id),
  car_id uuid REFERENCES public.cars(id),
  vin_number text,
  driver_name text NOT NULL,
  driver_license text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  route_taken text,
  distance_km decimal(5,2),
  fuel_consumption decimal(5,2),
  performance_rating integer CHECK (performance_rating >= 1 AND performance_rating <= 5),
  comfort_rating integer CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  features_rating integer CHECK (features_rating >= 1 AND features_rating <= 5),
  overall_satisfaction integer CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  feedback text,
  issues_noted text[],
  purchase_intent text CHECK (purchase_intent IN ('high', 'medium', 'low', 'none')),
  follow_up_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_sales_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
-- Audit Logs - admin only
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
  );

-- Request Notifications - users see their own
CREATE POLICY "Users can view their notifications" ON public.request_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.request_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Financial tables - admin/owner access
CREATE POLICY "Admins can view repair financials" ON public.repair_financials
  FOR SELECT USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
  );

CREATE POLICY "Admins can view vehicle sales financials" ON public.vehicle_sales_financials
  FOR SELECT USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
  );

CREATE POLICY "Admins can view operational costs" ON public.operational_costs
  FOR SELECT USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
  );

-- User agreements - users see their own
CREATE POLICY "Users can view their agreements" ON public.user_agreements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create agreements" ON public.user_agreements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cars - general access for authenticated users
CREATE POLICY "Users can view cars" ON public.cars
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage cars" ON public.cars
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- PDI Inspections - authenticated users
CREATE POLICY "Users can view pdi inspections" ON public.pdi_inspections
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage pdi inspections" ON public.pdi_inspections
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Test drive logs - authenticated users
CREATE POLICY "Users can view test drive logs" ON public.test_drive_logs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage test drive logs" ON public.test_drive_logs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_request_notifications_user ON public.request_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_request_notifications_unread ON public.request_notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_repair_financials_date ON public.repair_financials(repair_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_sales_financials_date ON public.vehicle_sales_financials(sale_date);
CREATE INDEX IF NOT EXISTS idx_operational_costs_date ON public.operational_costs(cost_date);

CREATE INDEX IF NOT EXISTS idx_user_agreements_user ON public.user_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_type ON public.user_agreements(agreement_type, version);

CREATE INDEX IF NOT EXISTS idx_cars_vin ON public.cars(vin_number);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_model ON public.cars(model);

CREATE INDEX IF NOT EXISTS idx_pdi_inspections_car ON public.pdi_inspections(car_id);
CREATE INDEX IF NOT EXISTS idx_pdi_inspections_status ON public.pdi_inspections(status);

CREATE INDEX IF NOT EXISTS idx_test_drive_logs_test_drive ON public.test_drive_logs(test_drive_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_logs_car ON public.test_drive_logs(car_id);

-- Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_financials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_sales_financials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_costs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_agreements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdi_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_drive_logs TO authenticated;

-- Add updated_at triggers
CREATE TRIGGER update_operational_costs_updated_at
  BEFORE UPDATE ON public.operational_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdi_inspections_updated_at
  BEFORE UPDATE ON public.pdi_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.cars (vin_number, model, year, color, selling_price) VALUES
  ('TEST123456789', 'Free', 2024, 'White', 45000),
  ('TEST987654321', 'Passion', 2024, 'Black', 65000)
ON CONFLICT (vin_number) DO NOTHING;

INSERT INTO public.operational_costs (category, amount, description, cost_date) VALUES
  ('utilities', 2500.00, 'Monthly electricity bill', CURRENT_DATE),
  ('rent', 8000.00, 'Showroom rent', CURRENT_DATE),
  ('salaries', 25000.00, 'Staff salaries', CURRENT_DATE)
ON CONFLICT DO NOTHING;
