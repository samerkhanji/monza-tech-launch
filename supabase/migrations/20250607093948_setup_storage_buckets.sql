-- ===============================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ===============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('car-photos', 'car-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain']::text[]),
  ('pdi-files', 'pdi-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('repair-photos', 'repair-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('signatures', 'signatures', true, 10485760, ARRAY['image/png', 'image/svg+xml']::text[])
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- RLS POLICIES FOR STORAGE BUCKETS
-- ===============================================

-- Car Photos Policies
CREATE POLICY "Authenticated users can upload car photos" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'car-photos');

CREATE POLICY "Anyone can view car photos" 
  ON storage.objects 
  FOR SELECT 
  TO public
  USING (bucket_id = 'car-photos');

CREATE POLICY "Authenticated users can update car photos" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'car-photos');

CREATE POLICY "Authenticated users can delete car photos" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'car-photos');

-- Documents Policies
CREATE POLICY "Authenticated users can upload documents" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents" 
  ON storage.objects 
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'documents');

-- PDI Files Policies
CREATE POLICY "Authenticated users can upload pdi files" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'pdi-files');

CREATE POLICY "Authenticated users can view pdi files" 
  ON storage.objects 
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'pdi-files');

CREATE POLICY "Authenticated users can update pdi files" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'pdi-files');

CREATE POLICY "Authenticated users can delete pdi files" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'pdi-files');

-- Repair Photos Policies
CREATE POLICY "Authenticated users can upload repair photos" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'repair-photos');

CREATE POLICY "Anyone can view repair photos" 
  ON storage.objects 
  FOR SELECT 
  TO public
  USING (bucket_id = 'repair-photos');

CREATE POLICY "Authenticated users can update repair photos" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'repair-photos');

CREATE POLICY "Authenticated users can delete repair photos" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'repair-photos');

-- Signatures Policies
CREATE POLICY "Authenticated users can upload signatures" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can view signatures" 
  ON storage.objects 
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can update signatures" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can delete signatures" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'signatures');
