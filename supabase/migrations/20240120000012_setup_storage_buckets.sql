-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('car-photos', 'car-photos', true),
  ('documents', 'documents', true),
  ('pdi-files', 'pdi-files', true),
  ('repair-photos', 'repair-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage buckets
DO $$
BEGIN
    -- Car photos policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload car photos') THEN
        CREATE POLICY "Authenticated users can upload car photos" 
          ON storage.objects 
          FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = 'car-photos');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view car photos') THEN
        CREATE POLICY "Authenticated users can view car photos" 
          ON storage.objects 
          FOR SELECT 
          TO authenticated
          USING (bucket_id = 'car-photos');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete car photos') THEN
        CREATE POLICY "Authenticated users can delete car photos" 
          ON storage.objects 
          FOR DELETE 
          TO authenticated
          USING (bucket_id = 'car-photos');
    END IF;

    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload documents') THEN
        CREATE POLICY "Authenticated users can upload documents" 
          ON storage.objects 
          FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = 'documents');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view documents') THEN
        CREATE POLICY "Authenticated users can view documents" 
          ON storage.objects 
          FOR SELECT 
          TO authenticated
          USING (bucket_id = 'documents');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete documents') THEN
        CREATE POLICY "Authenticated users can delete documents" 
          ON storage.objects 
          FOR DELETE 
          TO authenticated
          USING (bucket_id = 'documents');
    END IF;

    -- PDI files policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload PDI files') THEN
        CREATE POLICY "Authenticated users can upload PDI files" 
          ON storage.objects 
          FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = 'pdi-files');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view PDI files') THEN
        CREATE POLICY "Authenticated users can view PDI files" 
          ON storage.objects 
          FOR SELECT 
          TO authenticated
          USING (bucket_id = 'pdi-files');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete PDI files') THEN
        CREATE POLICY "Authenticated users can delete PDI files" 
          ON storage.objects 
          FOR DELETE 
          TO authenticated
          USING (bucket_id = 'pdi-files');
    END IF;

    -- Repair photos policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload repair photos') THEN
        CREATE POLICY "Authenticated users can upload repair photos" 
          ON storage.objects 
          FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = 'repair-photos');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view repair photos') THEN
        CREATE POLICY "Authenticated users can view repair photos" 
          ON storage.objects 
          FOR SELECT 
          TO authenticated
          USING (bucket_id = 'repair-photos');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete repair photos') THEN
        CREATE POLICY "Authenticated users can delete repair photos" 
          ON storage.objects 
          FOR DELETE 
          TO authenticated
          USING (bucket_id = 'repair-photos');
    END IF;
END $$; 