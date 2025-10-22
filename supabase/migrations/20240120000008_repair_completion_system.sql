-- Repair completion system tables
-- This migration adds tables for tracking part usage and generating receipts

-- Table for tracking parts used in repairs
CREATE TABLE IF NOT EXISTS repair_parts_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts_inventory(id) ON DELETE CASCADE,
  quantity_used INTEGER DEFAULT 1,
  used_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Table for storing repair receipts
CREATE TABLE IF NOT EXISTS repair_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id TEXT UNIQUE NOT NULL,
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  car_vin TEXT NOT NULL,
  car_model TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  completed_date TIMESTAMP NOT NULL,
  parts_list JSONB NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  mechanics TEXT[] NOT NULL,
  generated_at TIMESTAMP DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_parts_used_repair_id ON repair_parts_used(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_used_part_id ON repair_parts_used(part_id);
CREATE INDEX IF NOT EXISTS idx_repair_receipts_car_vin ON repair_receipts(car_vin);
CREATE INDEX IF NOT EXISTS idx_repair_receipts_repair_id ON repair_receipts(repair_id);

-- Add RLS policies
ALTER TABLE repair_parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for repair_parts_used
CREATE POLICY "Users can view repair parts used" ON repair_parts_used
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert repair parts used" ON repair_parts_used
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update repair parts used" ON repair_parts_used
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS policies for repair_receipts
CREATE POLICY "Users can view repair receipts" ON repair_receipts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert repair receipts" ON repair_receipts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update repair receipts" ON repair_receipts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add columns to existing repairs table if they don't exist
DO $$ 
BEGIN
  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repairs' AND column_name = 'completed_at') THEN
    ALTER TABLE repairs ADD COLUMN completed_at TIMESTAMP;
  END IF;

  -- Add completed_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repairs' AND column_name = 'completed_by') THEN
    ALTER TABLE repairs ADD COLUMN completed_by UUID REFERENCES users(id);
  END IF;

  -- Add total_cost column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repairs' AND column_name = 'total_cost') THEN
    ALTER TABLE repairs ADD COLUMN total_cost DECIMAL(10,2);
  END IF;
END $$;

-- Create function to automatically update part inventory when parts are used
CREATE OR REPLACE FUNCTION update_part_inventory_on_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock quantity
  UPDATE parts_inventory 
  SET stock_quantity = stock_quantity - NEW.quantity_used
  WHERE id = NEW.part_id;
  
  -- Check if stock is low and log alert
  IF EXISTS (
    SELECT 1 FROM parts_inventory 
    WHERE id = NEW.part_id 
    AND stock_quantity <= low_stock_threshold
  ) THEN
    -- Log low stock alert (could be extended to send notifications)
    INSERT INTO system_alerts (alert_type, message, severity, created_at)
    VALUES (
      'low_stock',
      'Part ' || (SELECT part_number FROM parts_inventory WHERE id = NEW.part_id) || ' is running low on stock',
      'warning',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic inventory updates
DROP TRIGGER IF EXISTS trigger_update_part_inventory ON repair_parts_used;
CREATE TRIGGER trigger_update_part_inventory
  AFTER INSERT ON repair_parts_used
  FOR EACH ROW
  EXECUTE FUNCTION update_part_inventory_on_usage();

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RCP-' || to_char(now(), 'YYYYMMDD') || '-' || 
         lpad(floor(random() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql; 