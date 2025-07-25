-- Migration: Enhance car_inventory for PDI and Test Drive functionality
-- Date: 2025-01-19

-- Add missing columns to car_inventory table
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
  electrical_integrity JSONB DEFAULT '{}',
  information_tools JSONB DEFAULT '{}',
  engine_compartment JSONB DEFAULT '{}',
  external_inspection JSONB DEFAULT '{}',
  internal_inspection JSONB DEFAULT '{}',
  lifting_inspection JSONB DEFAULT '{}',
  road_test JSONB DEFAULT '{}',
  final_inspection JSONB DEFAULT '{}',
  
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
  planned_duration INTEGER,
  actual_duration INTEGER,
  
  -- Driver Information
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_license TEXT NOT NULL,
  
  -- Test Drive Type and Notes
  is_client_test_drive BOOLEAN DEFAULT false,
  employee_name TEXT,
  notes TEXT,
  route_taken TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  
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
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  damage_type TEXT,
  
  -- Assessment Info
  assessed_by TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  repair_required BOOLEAN DEFAULT true,
  repair_priority TEXT,
  
  -- Repair Status
  repair_status TEXT DEFAULT 'pending',
  repair_date TIMESTAMP WITH TIME ZONE,
  repair_technician TEXT,
  repair_cost NUMERIC,
  repair_notes TEXT,
  
  -- Photos and Documentation
  photos TEXT[],
  repair_photos TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  FOREIGN KEY (car_id) REFERENCES public.car_inventory(id) ON DELETE CASCADE
);

-- Enable RLS for all new tables
ALTER TABLE public.pdi_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_damage_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage PDI checklists" 
  ON public.pdi_checklists 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage test drive history" 
  ON public.test_drive_history 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage car damage assessments" 
  ON public.car_damage_assessments 
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

-- Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdi_checklists_car_id ON public.pdi_checklists(car_id);
CREATE INDEX IF NOT EXISTS idx_pdi_checklists_completed ON public.pdi_checklists(is_completed);
CREATE INDEX IF NOT EXISTS idx_test_drive_history_car_id ON public.test_drive_history(car_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_history_status ON public.test_drive_history(status);
CREATE INDEX IF NOT EXISTS idx_car_damage_assessments_car_id ON public.car_damage_assessments(car_id);

-- Add comments
COMMENT ON TABLE public.pdi_checklists IS 'Comprehensive PDI (Pre-Delivery Inspection) checklists with 8 main inspection sections';
COMMENT ON TABLE public.test_drive_history IS 'Complete test drive history for both client and employee test drives';
COMMENT ON TABLE public.car_damage_assessments IS 'Damage assessment and tracking for vehicles';
