-- ===============================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- Run this in your Supabase Dashboard SQL Editor
-- ===============================================

-- Step 1: Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('car-photos', 'car-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain']::text[]),
  ('pdi-files', 'pdi-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('repair-photos', 'repair-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('signatures', 'signatures', true, 10485760, ARRAY['image/png', 'image/svg+xml']::text[])
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create RLS policies for storage buckets (simplified)

-- Car Photos Policies
CREATE POLICY "Car photos access policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'car-photos') WITH CHECK (bucket_id = 'car-photos');
CREATE POLICY "Car photos public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'car-photos');

-- Documents Policies  
CREATE POLICY "Documents access policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');

-- PDI Files Policies
CREATE POLICY "PDI files access policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'pdi-files') WITH CHECK (bucket_id = 'pdi-files');

-- Repair Photos Policies
CREATE POLICY "Repair photos access policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'repair-photos') WITH CHECK (bucket_id = 'repair-photos');
CREATE POLICY "Repair photos public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'repair-photos');

-- Signatures Policies
CREATE POLICY "Signatures access policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'signatures') WITH CHECK (bucket_id = 'signatures');

-- Step 3: Create performance optimization indexes

-- Car inventory performance
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_location ON car_inventory(location);
CREATE INDEX IF NOT EXISTS idx_car_inventory_pdi_completed ON car_inventory(pdi_completed);
CREATE INDEX IF NOT EXISTS idx_car_inventory_vin ON car_inventory(vin_number);
CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON car_inventory(model);
CREATE INDEX IF NOT EXISTS idx_car_inventory_year ON car_inventory(year);
CREATE INDEX IF NOT EXISTS idx_car_inventory_created_at ON car_inventory(created_at);

-- Repair history performance  
CREATE INDEX IF NOT EXISTS idx_repair_history_car_id ON repair_history(car_id);
CREATE INDEX IF NOT EXISTS idx_repair_history_status ON repair_history(status);
CREATE INDEX IF NOT EXISTS idx_repair_history_created_at ON repair_history(created_at);

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);

-- Step 4: Create system logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create utility functions

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name text,
    size_pretty text,
    size_bytes bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename AS table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Insert setup completion log
INSERT INTO system_logs (action, details, timestamp)
VALUES ('setup_complete', 'Monza Sal system setup completed successfully', NOW());

-- Step 7: Verification
SELECT '✅ Setup completed successfully!' as status; 