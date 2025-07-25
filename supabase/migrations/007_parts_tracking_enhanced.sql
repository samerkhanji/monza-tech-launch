-- Enhanced Parts Tracking System Migration

-- Create garage_assignments table for tracking repair assignments
CREATE TABLE IF NOT EXISTS public.garage_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_vin TEXT NOT NULL,
  car_model TEXT NOT NULL,
  client_name TEXT NOT NULL,
  assigned_technician TEXT NOT NULL,
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'assigned',
  work_description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignment_parts table for tracking parts used in each assignment
CREATE TABLE IF NOT EXISTS public.assignment_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.garage_assignments(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity_used INTEGER NOT NULL,
  cost_per_unit DECIMAL(10,2),
  used_by TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to update inventory when parts are used
CREATE OR REPLACE FUNCTION update_inventory_on_parts_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.inventory_items 
  SET quantity = quantity - NEW.quantity_used
  WHERE part_number = NEW.part_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic inventory updates
CREATE TRIGGER trigger_update_inventory_on_parts_usage
  AFTER INSERT ON public.assignment_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_parts_usage();

-- Enable RLS
ALTER TABLE public.garage_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage assignments" ON public.garage_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage assignment parts" ON public.assignment_parts FOR ALL TO authenticated USING (true); 