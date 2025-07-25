
-- Create workflow_tracking table for tracking various workflow events
CREATE TABLE IF NOT EXISTS public.workflow_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  user_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for workflow_tracking
ALTER TABLE public.workflow_tracking ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for workflow_tracking
CREATE POLICY "Users can view workflow tracking" 
  ON public.workflow_tracking 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert workflow tracking" 
  ON public.workflow_tracking 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create showroom_inventory table for showroom accessories
CREATE TABLE IF NOT EXISTS public.showroom_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC,
  description TEXT,
  supplier TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for showroom_inventory
ALTER TABLE public.showroom_inventory ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for showroom_inventory
CREATE POLICY "Users can view showroom inventory" 
  ON public.showroom_inventory 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage showroom inventory" 
  ON public.showroom_inventory 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create business_calendar table for business events
CREATE TABLE IF NOT EXISTS public.business_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT NOT NULL DEFAULT 'meeting',
  attendees TEXT[],
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for business_calendar
ALTER TABLE public.business_calendar ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for business_calendar
CREATE POLICY "Users can view business calendar" 
  ON public.business_calendar 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage business calendar" 
  ON public.business_calendar 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_showroom_inventory_updated_at
  BEFORE UPDATE ON public.showroom_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_calendar_updated_at
  BEFORE UPDATE ON public.business_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for showroom_inventory
INSERT INTO public.showroom_inventory (name, category, quantity, price, description, supplier, location) VALUES
('Car Cover Premium', 'Accessories', 10, 299.99, 'Premium waterproof car cover', 'Voyah Supplies', 'Showroom Storage'),
('Floor Mats Set', 'Interior', 25, 89.99, 'Custom fit floor mats', 'Voyah Supplies', 'Showroom Storage'),
('Charging Cable Type 2', 'Charging', 15, 149.99, 'Type 2 charging cable for EV', 'EV Accessories Ltd', 'Showroom Storage'),
('Roof Box', 'Exterior', 5, 599.99, 'Aerodynamic roof storage box', 'Car Accessories Pro', 'Showroom Storage'),
('Phone Holder', 'Interior', 30, 24.99, 'Magnetic phone holder for dashboard', 'Tech Auto', 'Showroom Storage');
