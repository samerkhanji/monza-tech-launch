-- Parts Tracking System Migration
-- This migration creates comprehensive parts tracking tables and relationships

-- Create garage_assignments table for tracking repair assignments
CREATE TABLE IF NOT EXISTS public.garage_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.car_inventory(id) ON DELETE CASCADE,
  car_vin TEXT NOT NULL,
  car_model TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_license_plate TEXT,
  assigned_technician TEXT NOT NULL,
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'waiting_parts', 'completed', 'on_hold')),
  work_description TEXT,
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  labor_hours DECIMAL(5,2),
  total_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignment_parts table for tracking parts used in each assignment
CREATE TABLE IF NOT EXISTS public.assignment_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.garage_assignments(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  used_by TEXT NOT NULL, -- technician name
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parts_reorder_alerts table for automated stock management
CREATE TABLE IF NOT EXISTS public.parts_reorder_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  minimum_threshold INTEGER NOT NULL DEFAULT 5,
  reorder_quantity INTEGER NOT NULL DEFAULT 10,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('low', 'critical', 'out_of_stock')),
  alert_created TIMESTAMP WITH TIME ZONE DEFAULT now(),
  alert_resolved TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  supplier_info JSONB,
  estimated_cost DECIMAL(10,2),
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parts_usage_analytics table for usage pattern analysis
CREATE TABLE IF NOT EXISTS public.parts_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  analysis_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_usage INTEGER NOT NULL DEFAULT 0,
  total_assignments INTEGER NOT NULL DEFAULT 0,
  average_usage_per_assignment DECIMAL(5,2),
  peak_usage_day TEXT,
  most_common_car_model TEXT,
  most_frequent_technician TEXT,
  total_cost DECIMAL(10,2),
  usage_trend TEXT, -- 'increasing', 'decreasing', 'stable'
  forecast_next_period INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(part_id, analysis_period, period_start)
);

-- Create parts_barcode_mappings table for barcode scanner support
CREATE TABLE IF NOT EXISTS public.parts_barcode_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  barcode_value TEXT NOT NULL UNIQUE,
  barcode_type TEXT NOT NULL DEFAULT 'CODE128', -- CODE128, QR, UPC, etc.
  is_primary BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.garage_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_reorder_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_barcode_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for garage_assignments
CREATE POLICY "Users can view garage assignments" 
  ON public.garage_assignments 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage garage assignments" 
  ON public.garage_assignments 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for assignment_parts
CREATE POLICY "Users can view assignment parts" 
  ON public.assignment_parts 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage assignment parts" 
  ON public.assignment_parts 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for parts_reorder_alerts
CREATE POLICY "Users can view reorder alerts" 
  ON public.parts_reorder_alerts 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage reorder alerts" 
  ON public.parts_reorder_alerts 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for parts_usage_analytics
CREATE POLICY "Users can view usage analytics" 
  ON public.parts_usage_analytics 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage usage analytics" 
  ON public.parts_usage_analytics 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for parts_barcode_mappings
CREATE POLICY "Users can view barcode mappings" 
  ON public.parts_barcode_mappings 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage barcode mappings" 
  ON public.parts_barcode_mappings 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_garage_assignments_status ON public.garage_assignments(status);
CREATE INDEX IF NOT EXISTS idx_garage_assignments_technician ON public.garage_assignments(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_garage_assignments_date ON public.garage_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_garage_assignments_car_vin ON public.garage_assignments(car_vin);

CREATE INDEX IF NOT EXISTS idx_assignment_parts_assignment_id ON public.assignment_parts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_part_id ON public.assignment_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_used_at ON public.assignment_parts(used_at);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_technician ON public.assignment_parts(used_by);

CREATE INDEX IF NOT EXISTS idx_reorder_alerts_active ON public.parts_reorder_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_reorder_alerts_level ON public.parts_reorder_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_reorder_alerts_priority ON public.parts_reorder_alerts(priority);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_period ON public.parts_usage_analytics(analysis_period, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_part ON public.parts_usage_analytics(part_id);

CREATE INDEX IF NOT EXISTS idx_barcode_mappings_barcode ON public.parts_barcode_mappings(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcode_mappings_part ON public.parts_barcode_mappings(part_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_garage_assignments_updated_at 
  BEFORE UPDATE ON public.garage_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_reorder_alerts_updated_at 
  BEFORE UPDATE ON public.parts_reorder_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_usage_analytics_updated_at 
  BEFORE UPDATE ON public.parts_usage_analytics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_barcode_mappings_updated_at 
  BEFORE UPDATE ON public.parts_barcode_mappings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update inventory when parts are used
CREATE OR REPLACE FUNCTION update_inventory_on_parts_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease inventory quantity when parts are used
  UPDATE public.inventory_items 
  SET 
    quantity = quantity - NEW.quantity_used,
    last_updated = now()
  WHERE id = NEW.part_id;
  
  -- Check if stock is low and create alert if needed
  INSERT INTO public.parts_reorder_alerts (
    part_id, 
    part_number, 
    part_name, 
    current_stock, 
    alert_level,
    priority
  )
  SELECT 
    i.id,
    i.part_number,
    i.part_name,
    i.quantity,
    CASE 
      WHEN i.quantity = 0 THEN 'out_of_stock'
      WHEN i.quantity <= 3 THEN 'critical'
      WHEN i.quantity <= 5 THEN 'low'
    END,
    CASE 
      WHEN i.quantity = 0 THEN 4
      WHEN i.quantity <= 3 THEN 3
      WHEN i.quantity <= 5 THEN 2
      ELSE 1
    END
  FROM public.inventory_items i
  WHERE i.id = NEW.part_id 
    AND i.quantity <= 5
    AND NOT EXISTS (
      SELECT 1 FROM public.parts_reorder_alerts 
      WHERE part_id = NEW.part_id AND is_active = true
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic inventory updates
CREATE TRIGGER trigger_update_inventory_on_parts_usage
  AFTER INSERT ON public.assignment_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_parts_usage();

-- Create function to restore inventory when parts usage is deleted
CREATE OR REPLACE FUNCTION restore_inventory_on_parts_removal()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase inventory quantity when parts usage is removed
  UPDATE public.inventory_items 
  SET 
    quantity = quantity + OLD.quantity_used,
    last_updated = now()
  WHERE id = OLD.part_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory restoration
CREATE TRIGGER trigger_restore_inventory_on_parts_removal
  AFTER DELETE ON public.assignment_parts
  FOR EACH ROW
  EXECUTE FUNCTION restore_inventory_on_parts_removal();

-- Insert sample data for testing
INSERT INTO public.garage_assignments (
  car_vin, car_model, client_name, client_phone, assigned_technician, 
  work_description, status, priority_level, labor_hours
) VALUES 
('VF2024-001', 'Voyah Free 2024', 'John Smith', '+971-50-123-4567', 'Ahmed Al-Zaabi', 
 'Brake system maintenance and inspection', 'in_progress', 'normal', 2.5),
('VM2024-002', 'MHero 917 2024', 'Sarah Johnson', '+971-55-987-6543', 'Omar Hassan', 
 'Engine diagnostic and repair', 'assigned', 'high', 4.0),
('VD2025-003', 'Voyah Dream 2025', 'Mike Brown', '+971-52-456-7890', 'Khalid Ahmed', 
 'Electrical system troubleshooting', 'waiting_parts', 'urgent', 3.0);

-- Insert sample barcode mappings
INSERT INTO public.parts_barcode_mappings (part_number, barcode_value, barcode_type, is_primary) VALUES
('BP-TM3-001', '1234567890123', 'CODE128', true),
('AF-BMW-iX3-002', '2345678901234', 'CODE128', true),
('HL-VW-ID4-003', '3456789012345', 'CODE128', true);

-- Create view for parts usage summary
CREATE OR REPLACE VIEW parts_usage_summary AS
SELECT 
  p.part_number,
  p.part_name,
  p.car_model,
  p.supplier,
  i.quantity as current_stock,
  COALESCE(usage.total_used, 0) as total_used_last_30_days,
  COALESCE(usage.usage_count, 0) as usage_count_last_30_days,
  COALESCE(usage.total_cost, 0) as total_cost_last_30_days,
  CASE 
    WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
    WHEN i.quantity <= 3 THEN 'CRITICAL'
    WHEN i.quantity <= 5 THEN 'LOW'
    WHEN i.quantity <= 10 THEN 'MEDIUM'
    ELSE 'GOOD'
  END as stock_status,
  i.last_updated
FROM public.inventory_items i
LEFT JOIN (
  SELECT 
    ap.part_id,
    SUM(ap.quantity_used) as total_used,
    COUNT(*) as usage_count,
    SUM(ap.total_cost) as total_cost
  FROM public.assignment_parts ap
  WHERE ap.used_at >= (now() - interval '30 days')
  GROUP BY ap.part_id
) usage ON i.id = usage.part_id
LEFT JOIN public.inventory_items p ON i.id = p.id
ORDER BY 
  CASE 
    WHEN i.quantity = 0 THEN 1
    WHEN i.quantity <= 3 THEN 2
    WHEN i.quantity <= 5 THEN 3
    ELSE 4
  END,
  usage.total_used DESC NULLS LAST; 