-- Migration: Enhance car_inventory for PDI and Test Drive functionality
-- Date: 2025-01-19
-- Description: Add comprehensive PDI checklist fields, test drive support, and enhanced car management features

-- First, let's add the missing columns to car_inventory
ALTER TABLE public.car_inventory 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS custom_model_name TEXT,
ADD COLUMN IF NOT EXISTS customs TEXT DEFAULT 'not paid' CHECK (customs IN ('paid', 'not paid')),
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS reserved_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
-- PDI Software and System checks
ADD COLUMN IF NOT EXISTS pdi_software_issues TEXT[],
-- Test Drive Support
ADD COLUMN IF NOT EXISTS test_drive_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS test_drive_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_drive_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_drive_duration INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS test_driver_name TEXT,
ADD COLUMN IF NOT EXISTS test_driver_phone TEXT,
ADD COLUMN IF NOT EXISTS test_driver_license TEXT,
ADD COLUMN IF NOT EXISTS test_drive_notes TEXT,
ADD COLUMN IF NOT EXISTS test_drive_is_client BOOLEAN DEFAULT false;

-- Create PDI Checklist table for detailed PDI data
CREATE TABLE IF NOT EXISTS public.pdi_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  
  -- Header Information
  outlet_details JSONB DEFAULT '{}',
  delivery_date_planned DATE,
  delivery_date_actual DATE,
  vehicle_details JSONB DEFAULT '{}',
  motor_numbers JSONB DEFAULT '{}',
  
  -- Checklist Sections (8 main sections)
  electrical_integrity JSONB DEFAULT '{}', -- 5 items
  information_tools JSONB DEFAULT '{}',    -- 3 items  
  engine_compartment JSONB DEFAULT '{}',   -- 4 items
  external_inspection JSONB DEFAULT '{}',  -- 6 items
  internal_inspection JSONB DEFAULT '{}',  -- 19 items
  lifting_inspection JSONB DEFAULT '{}',   -- 9 items
  road_test JSONB DEFAULT '{}',            -- 13 items
  final_inspection JSONB DEFAULT '{}',     -- 7 items
  
  -- Overhaul Flags
  electrical_overhaul_needed BOOLEAN DEFAULT false,
  information_overhaul_needed BOOLEAN DEFAULT false,
  engine_overhaul_needed BOOLEAN DEFAULT false,
  external_overhaul_needed BOOLEAN DEFAULT false,
  internal_overhaul_needed BOOLEAN DEFAULT false,
  lifting_overhaul_needed BOOLEAN DEFAULT false,
  road_test_overhaul_needed BOOLEAN DEFAULT false,
  final_overhaul_needed BOOLEAN DEFAULT false,
  
  -- Signatures and Completion
  maintenance_technician_signature TEXT,
  maintenance_technician_date DATE,
  technical_director_signature TEXT,
  technical_director_date DATE,
  delivery_manager_signature TEXT,
  delivery_manager_date DATE,
  
  -- Quality Activities
  quality_activities JSONB DEFAULT '{}',
  customer_requirements TEXT,
  
  -- PDI Completion Status
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Create Test Drive History table
CREATE TABLE IF NOT EXISTS public.test_drive_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  
  -- Test Drive Details
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  planned_duration INTEGER, -- in minutes
  actual_duration INTEGER, -- in minutes
  
  -- Driver Information
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_license TEXT NOT NULL,
  
  -- Test Drive Type and Notes
  is_client_test_drive BOOLEAN DEFAULT false,
  employee_name TEXT, -- if employee test drive
  notes TEXT,
  route_taken TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Performance Data
  start_battery_percentage INTEGER,
  end_battery_percentage INTEGER,
  distance_covered DECIMAL,
  
  -- Feedback
  driver_feedback TEXT,
  technical_notes TEXT,
  issues_noted TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Create Car Damage Assessment table
CREATE TABLE IF NOT EXISTS public.car_damage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  
  -- Damage Details
  location TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  description TEXT NOT NULL,
  damage_type TEXT, -- e.g., 'scratch', 'dent', 'paint_chip', etc.
  
  -- Assessment Info
  assessed_by TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  repair_required BOOLEAN DEFAULT true,
  repair_priority TEXT CHECK (repair_priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Repair Status
  repair_status TEXT DEFAULT 'pending' CHECK (repair_status IN ('pending', 'in_progress', 'completed', 'deferred')),
  repair_date TIMESTAMP WITH TIME ZONE,
  repair_technician TEXT,
  repair_cost NUMERIC,
  repair_notes TEXT,
  
  -- Photos and Documentation
  photos TEXT[], -- Array of photo URLs
  repair_photos TEXT[], -- Before/after repair photos
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Create Car System Checks table for PDI
CREATE TABLE IF NOT EXISTS public.car_system_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  pdi_checklist_id UUID,
  
  -- System Information
  system_name TEXT NOT NULL,
  check_category TEXT NOT NULL, -- electrical, mechanical, software, etc.
  
  -- Check Results
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'needs_attention', 'not_tested')),
  test_value TEXT, -- actual measured/observed value
  expected_value TEXT, -- what was expected
  
  -- Details
  notes TEXT,
  technician_name TEXT,
  check_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Remedial Action
  action_required TEXT,
  action_taken TEXT,
  action_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE,
  FOREIGN KEY (pdi_checklist_id) REFERENCES public.pdi_checklists(id) ON DELETE CASCADE
);

-- Enable RLS for all new tables
ALTER TABLE public.pdi_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_damage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_system_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for PDI Checklists
CREATE POLICY "Users can view PDI checklists" 
  ON public.pdi_checklists 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage PDI checklists" 
  ON public.pdi_checklists 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for Test Drive History
CREATE POLICY "Users can view test drive history" 
  ON public.test_drive_history 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage test drive history" 
  ON public.test_drive_history 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for Car Damage Assessments
CREATE POLICY "Users can view car damage assessments" 
  ON public.car_damage_assessments 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage car damage assessments" 
  ON public.car_damage_assessments 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for Car System Checks
CREATE POLICY "Users can view car system checks" 
  ON public.car_system_checks 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage car system checks" 
  ON public.car_system_checks 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_car_inventory_updated_at
  BEFORE UPDATE ON public.car_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdi_checklists_updated_at
  BEFORE UPDATE ON public.pdi_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_drive_history_updated_at
  BEFORE UPDATE ON public.test_drive_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_damage_assessments_updated_at
  BEFORE UPDATE ON public.car_damage_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_system_checks_updated_at
  BEFORE UPDATE ON public.car_system_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdi_checklists_car_id ON public.pdi_checklists(car_id);
CREATE INDEX IF NOT EXISTS idx_pdi_checklists_completed ON public.pdi_checklists(is_completed);
CREATE INDEX IF NOT EXISTS idx_test_drive_history_car_id ON public.test_drive_history(car_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_history_status ON public.test_drive_history(status);
CREATE INDEX IF NOT EXISTS idx_test_drive_history_active ON public.test_drive_history(car_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_car_damage_assessments_car_id ON public.car_damage_assessments(car_id);
CREATE INDEX IF NOT EXISTS idx_car_damage_assessments_severity ON public.car_damage_assessments(severity);
CREATE INDEX IF NOT EXISTS idx_car_system_checks_car_id ON public.car_system_checks(car_id);
CREATE INDEX IF NOT EXISTS idx_car_system_checks_pdi_id ON public.car_system_checks(pdi_checklist_id);

-- Update car_inventory to have proper defaults and constraints
ALTER TABLE public.car_inventory 
ALTER COLUMN category SET DEFAULT 'Other',
ADD CONSTRAINT chk_car_inventory_category CHECK (category IN ('EV', 'REV', 'ICEV', 'Other')),
ADD CONSTRAINT chk_car_inventory_status CHECK (status IN ('in_stock', 'sold', 'reserved')),
ADD CONSTRAINT chk_battery_percentage CHECK (battery_percentage >= 0 AND battery_percentage <= 100);

-- Add comment explaining the migration
COMMENT ON TABLE public.pdi_checklists IS 'Comprehensive PDI (Pre-Delivery Inspection) checklists with 8 main inspection sections';
COMMENT ON TABLE public.test_drive_history IS 'Complete test drive history for both client and employee test drives';
COMMENT ON TABLE public.car_damage_assessments IS 'Damage assessment and tracking for vehicles';
COMMENT ON TABLE public.car_system_checks IS 'Individual system checks performed during PDI'; 