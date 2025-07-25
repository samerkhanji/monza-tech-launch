-- Migration: Enhance car_inventory for PDI and Test Drive functionality

-- Add missing columns to car_inventory
ALTER TABLE public.car_inventory 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS custom_model_name TEXT,
ADD COLUMN IF NOT EXISTS customs TEXT DEFAULT 'not paid',
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS reserved_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS pdi_software_issues TEXT[],
ADD COLUMN IF NOT EXISTS test_drive_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS test_drive_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_drive_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_drive_duration INTEGER,
ADD COLUMN IF NOT EXISTS test_driver_name TEXT,
ADD COLUMN IF NOT EXISTS test_driver_phone TEXT,
ADD COLUMN IF NOT EXISTS test_driver_license TEXT,
ADD COLUMN IF NOT EXISTS test_drive_notes TEXT,
ADD COLUMN IF NOT EXISTS test_drive_is_client BOOLEAN DEFAULT false;

-- Create PDI Checklist table
CREATE TABLE IF NOT EXISTS public.pdi_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  outlet_details JSONB DEFAULT '{}',
  delivery_date_planned DATE,
  delivery_date_actual DATE,
  vehicle_details JSONB DEFAULT '{}',
  motor_numbers JSONB DEFAULT '{}',
  electrical_integrity JSONB DEFAULT '{}',
  information_tools JSONB DEFAULT '{}',
  engine_compartment JSONB DEFAULT '{}',
  external_inspection JSONB DEFAULT '{}',
  internal_inspection JSONB DEFAULT '{}',
  lifting_inspection JSONB DEFAULT '{}',
  road_test JSONB DEFAULT '{}',
  final_inspection JSONB DEFAULT '{}',
  electrical_overhaul_needed BOOLEAN DEFAULT false,
  information_overhaul_needed BOOLEAN DEFAULT false,
  engine_overhaul_needed BOOLEAN DEFAULT false,
  external_overhaul_needed BOOLEAN DEFAULT false,
  internal_overhaul_needed BOOLEAN DEFAULT false,
  lifting_overhaul_needed BOOLEAN DEFAULT false,
  road_test_overhaul_needed BOOLEAN DEFAULT false,
  final_overhaul_needed BOOLEAN DEFAULT false,
  maintenance_technician_signature TEXT,
  maintenance_technician_date DATE,
  technical_director_signature TEXT,
  technical_director_date DATE,
  delivery_manager_signature TEXT,
  delivery_manager_date DATE,
  quality_activities JSONB DEFAULT '{}',
  customer_requirements TEXT,
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Create Test Drive History table
CREATE TABLE IF NOT EXISTS public.test_drive_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  planned_duration INTEGER,
  actual_duration INTEGER,
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_license TEXT NOT NULL,
  is_client_test_drive BOOLEAN DEFAULT false,
  employee_name TEXT,
  notes TEXT,
  route_taken TEXT,
  status TEXT DEFAULT 'active',
  start_battery_percentage INTEGER,
  end_battery_percentage INTEGER,
  distance_covered DECIMAL,
  driver_feedback TEXT,
  technical_notes TEXT,
  issues_noted TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Create Car Damage Assessment table
CREATE TABLE IF NOT EXISTS public.car_damage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  location TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  damage_type TEXT,
  assessed_by TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  repair_required BOOLEAN DEFAULT true,
  repair_priority TEXT,
  repair_status TEXT DEFAULT 'pending',
  repair_date TIMESTAMP WITH TIME ZONE,
  repair_technician TEXT,
  repair_cost NUMERIC,
  repair_notes TEXT,
  photos TEXT[],
  repair_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.pdi_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_damage_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage PDI checklists" ON public.pdi_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage test drive history" ON public.test_drive_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage car damage assessments" ON public.car_damage_assessments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_pdi_checklists_car_id ON public.pdi_checklists(car_id);
CREATE INDEX idx_test_drive_history_car_id ON public.test_drive_history(car_id);
CREATE INDEX idx_car_damage_assessments_car_id ON public.car_damage_assessments(car_id); 