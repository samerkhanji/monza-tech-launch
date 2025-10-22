-- QUICK DIAGNOSTIC - Run this first to see what exists
-- This will show us exactly what columns are in your cars table

-- Check if cars table exists and what columns it has
SELECT 'Cars table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cars'
ORDER BY ordinal_position;

-- Check all tables in public schema
SELECT 'All public tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
