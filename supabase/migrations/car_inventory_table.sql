-- ===============================================
-- MONZA TECH CAR INVENTORY TABLE
-- ===============================================
-- Complete car inventory system with warranty tracking,
-- client information, and DMS integration

-- Create car inventory table
CREATE TABLE IF NOT EXISTS public.car_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehicle status and ownership
  status TEXT NOT NULL CHECK (status IN ('Available', 'Sold', 'Reserved', 'In Service')) DEFAULT 'Available',
  client_name TEXT,
  
  -- Vehicle identification
  vin TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL, -- REEV, EV
  color TEXT NOT NULL,
  model TEXT NOT NULL, -- Free, Dream, Passion, Courage, Mhero
  model_year INTEGER NOT NULL,
  
  -- Important dates
  delivery_date DATE,
  vehicle_warranty_expiry DATE,
  battery_warranty_expiry DATE,
  dms_warranty_deadline DATE,
  service_date DATE,
  
  -- Additional information
  notes TEXT,
  contact_info TEXT,
  
  -- Pricing and financial (optional for future use)
  purchase_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  
  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Add comments for documentation
COMMENT ON TABLE public.car_inventory IS 'Complete Monza vehicle inventory with warranty and client tracking';
COMMENT ON COLUMN public.car_inventory.vin IS 'Vehicle Identification Number - unique identifier';
COMMENT ON COLUMN public.car_inventory.vehicle_type IS 'REEV (Range Extended Electric Vehicle) or EV (Electric Vehicle)';
COMMENT ON COLUMN public.car_inventory.dms_warranty_deadline IS 'Warranty deadline according to Dealer Management System';
COMMENT ON COLUMN public.car_inventory.status IS 'Current status: Available, Sold, Reserved, or In Service';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON public.car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_vin ON public.car_inventory(vin);
CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON public.car_inventory(model, model_year);
CREATE INDEX IF NOT EXISTS idx_car_inventory_client ON public.car_inventory(client_name) WHERE client_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_car_inventory_delivery_date ON public.car_inventory(delivery_date) WHERE delivery_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_car_inventory_warranty ON public.car_inventory(vehicle_warranty_expiry) WHERE vehicle_warranty_expiry IS NOT NULL;

-- Enable RLS
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can read inventory (for sales team, customers, etc.)
CREATE POLICY IF NOT EXISTS "inventory_read_all" ON public.car_inventory
  FOR SELECT TO authenticated 
  USING (true);

-- OWNERS can do everything
CREATE POLICY IF NOT EXISTS "inventory_owners_full_access" ON public.car_inventory
  FOR ALL TO authenticated 
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- GARAGE_MANAGER and SALES_MANAGER can insert/update
CREATE POLICY IF NOT EXISTS "inventory_managers_write" ON public.car_inventory
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GARAGE_MANAGER', 'SALES_MANAGER')
    )
  );

CREATE POLICY IF NOT EXISTS "inventory_managers_update" ON public.car_inventory
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GARAGE_MANAGER', 'SALES_MANAGER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GARAGE_MANAGER', 'SALES_MANAGER')
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_car_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_car_inventory_updated_at ON public.car_inventory;
CREATE TRIGGER tr_car_inventory_updated_at
  BEFORE UPDATE ON public.car_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_car_inventory_timestamp();

-- Set created_by on insert
CREATE OR REPLACE FUNCTION public.set_car_inventory_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_car_inventory_created_by ON public.car_inventory;
CREATE TRIGGER tr_car_inventory_created_by
  BEFORE INSERT ON public.car_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_car_inventory_created_by();

-- ===============================================
-- USEFUL VIEWS FOR REPORTING
-- ===============================================

-- Available vehicles view
CREATE OR REPLACE VIEW public.available_vehicles AS
SELECT 
  id,
  vin,
  vehicle_type,
  color,
  model,
  model_year,
  notes,
  created_at
FROM public.car_inventory
WHERE status = 'Available'
ORDER BY model, color, model_year DESC;

-- Sold vehicles with client info
CREATE OR REPLACE VIEW public.sold_vehicles AS
SELECT 
  id,
  client_name,
  vin,
  vehicle_type,
  color,
  model,
  model_year,
  delivery_date,
  vehicle_warranty_expiry,
  battery_warranty_expiry,
  contact_info,
  notes
FROM public.car_inventory
WHERE status = 'Sold'
ORDER BY delivery_date DESC NULLS LAST;

-- Warranty expiration tracking
CREATE OR REPLACE VIEW public.warranty_tracking AS
SELECT 
  id,
  vin,
  client_name,
  model,
  model_year,
  delivery_date,
  vehicle_warranty_expiry,
  battery_warranty_expiry,
  dms_warranty_deadline,
  CASE 
    WHEN vehicle_warranty_expiry < CURRENT_DATE THEN 'Expired'
    WHEN vehicle_warranty_expiry < CURRENT_DATE + INTERVAL '90 days' THEN 'Expiring Soon'
    ELSE 'Active'
  END as warranty_status,
  status
FROM public.car_inventory
WHERE status = 'Sold' AND vehicle_warranty_expiry IS NOT NULL
ORDER BY vehicle_warranty_expiry ASC;

-- Inventory summary by model
CREATE OR REPLACE VIEW public.inventory_summary AS
SELECT 
  model,
  model_year,
  vehicle_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'Available') as available_count,
  COUNT(*) FILTER (WHERE status = 'Sold') as sold_count,
  COUNT(*) FILTER (WHERE status = 'Reserved') as reserved_count,
  COUNT(*) FILTER (WHERE status = 'In Service') as in_service_count
FROM public.car_inventory
GROUP BY model, model_year, vehicle_type
ORDER BY model, model_year DESC;

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚗 ===== CAR INVENTORY SYSTEM CREATED! =====';
  RAISE NOTICE '';
  RAISE NOTICE '✅ FEATURES INSTALLED:';
  RAISE NOTICE '   🏗️ Complete car_inventory table with all fields';
  RAISE NOTICE '   🔒 Row Level Security with role-based access';
  RAISE NOTICE '   📊 Performance indexes on key fields';
  RAISE NOTICE '   ⏰ Automatic timestamp and user tracking';
  RAISE NOTICE '   📋 Useful views for reporting and analytics';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 TABLE STRUCTURE:';
  RAISE NOTICE '   🆔 VIN-based unique identification';
  RAISE NOTICE '   👥 Client and contact information';
  RAISE NOTICE '   📅 Delivery and warranty date tracking';
  RAISE NOTICE '   🔧 DMS integration fields';
  RAISE NOTICE '   📝 Notes and service information';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ VIEWS CREATED:';
  RAISE NOTICE '   📦 available_vehicles - Current stock';
  RAISE NOTICE '   💰 sold_vehicles - Sales history';
  RAISE NOTICE '   ⚠️ warranty_tracking - Warranty status';
  RAISE NOTICE '   📊 inventory_summary - Stock overview';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 ACCESS CONTROL:';
  RAISE NOTICE '   👑 OWNERS: Full access to everything';
  RAISE NOTICE '   👨‍💼 MANAGERS: Can add/edit inventory';
  RAISE NOTICE '   👥 ALL USERS: Can view inventory';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY FOR: npm run upload:monza-inventory';
  RAISE NOTICE '';
END$$;
