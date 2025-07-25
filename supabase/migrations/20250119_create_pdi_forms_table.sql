-- Migration: Create pdi_forms table and pdis storage bucket
-- Date: 2025-01-19
-- Description: Add pdi_forms table for standalone PDI form submissions and create pdis storage bucket

-- Create pdi_forms table for standalone PDI forms
CREATE TABLE IF NOT EXISTS public.pdi_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  outlet_name TEXT,
  outlet_number TEXT,
  model TEXT,
  vin TEXT,
  estimated_delivery_date TEXT,
  manufacturing_date TEXT,
  range_extender_number TEXT,
  hv_battery_number TEXT,
  front_motor_number TEXT,
  rear_motor_number TEXT,
  quality_activities TEXT,
  activity_number TEXT,
  customer_requirements TEXT,
  
  -- Inspection sections (JSON objects with boolean values)
  lifting_inspection JSONB DEFAULT '{}',
  road_test_inspection JSONB DEFAULT '{}',
  engine_inspection JSONB DEFAULT '{}',
  external_inspection JSONB DEFAULT '{}',
  internal_inspection JSONB DEFAULT '{}',
  final_inspection JSONB DEFAULT '{}',
  
  -- Overhaul text notes
  lifting_overhaul TEXT,
  road_test_overhaul TEXT,
  engine_overhaul TEXT,
  external_overhaul TEXT,
  internal_overhaul TEXT,
  final_overhaul TEXT,
  
  -- Final status
  final_status TEXT,
  
  -- Signatures (JSON object with signature data URLs)
  signatures JSONB DEFAULT '{}',
  
  -- PDF storage
  pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pdis storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdis',
  'pdis',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for pdi_forms table
ALTER TABLE public.pdi_forms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pdi_forms
CREATE POLICY "Users can view pdi forms" 
  ON public.pdi_forms 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage pdi forms" 
  ON public.pdi_forms 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage policies for pdis bucket
CREATE POLICY "Authenticated users can upload pdis" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'pdis');

CREATE POLICY "Anyone can view pdis" 
  ON storage.objects 
  FOR SELECT 
  TO public
  USING (bucket_id = 'pdis');

CREATE POLICY "Authenticated users can update pdis" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'pdis');

CREATE POLICY "Authenticated users can delete pdis" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'pdis');

-- Create trigger for updated_at
CREATE TRIGGER update_pdi_forms_updated_at
  BEFORE UPDATE ON public.pdi_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_pdi_forms_vin ON public.pdi_forms(vin);
CREATE INDEX IF NOT EXISTS idx_pdi_forms_created_at ON public.pdi_forms(created_at);

-- Add comment
COMMENT ON TABLE public.pdi_forms IS 'Standalone PDI form submissions with signature capture and PDF export'; 