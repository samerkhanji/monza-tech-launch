-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('car-photos', 'car-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('pdi-photos', 'pdi-photos', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('test-drive-photos', 'test-drive-photos', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('documents', 'documents', false, 104857600, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('receipts', 'receipts', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Storage policies for car-photos bucket (public)
CREATE POLICY "Car photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-photos');

CREATE POLICY "Authenticated users can upload car photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'car-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can update car photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'car-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can delete car photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'car-photos' AND 
    auth.role() = 'authenticated'
  );

-- Storage policies for pdi-photos bucket (private)
CREATE POLICY "PDI photos are viewable by authenticated users"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdi-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Technicians can upload PDI photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdi-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Technicians can update PDI photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pdi-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can delete PDI photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdi-photos' AND 
    auth.role() = 'authenticated'
  );

-- Storage policies for test-drive-photos bucket (private)
CREATE POLICY "Test drive photos are viewable by authenticated users"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'test-drive-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload test drive photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'test-drive-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update test drive photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'test-drive-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can delete test drive photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'test-drive-photos' AND 
    auth.role() = 'authenticated'
  );

-- Storage policies for documents bucket (private)
CREATE POLICY "Documents are viewable by authenticated users"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated'
  );

-- Storage policies for receipts bucket (private)
CREATE POLICY "Receipts are viewable by authorized users"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can update receipts"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authorized users can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND 
    auth.role() = 'authenticated'
  ); 