-- DIAGNOSE SUPABASE SCHEMA
-- Run this first to see what tables and columns exist

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check columns in cars table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cars'
ORDER BY ordinal_position;

-- Check if any car-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%car%'
ORDER BY table_name;

-- Check all columns in all tables (to see what we're working with)
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
