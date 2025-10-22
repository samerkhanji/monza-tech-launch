// =============================================
// QUICK SUPABASE SETUP SCRIPT
// =============================================
// Run this to check what's missing and get setup instructions

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 MONZA TECH - SUPABASE SETUP CHECKER');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

console.log('📋 Environment Check:');
console.log('   .env.local file:', envExists ? '✅ Found' : '❌ Missing');

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasAnonKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');
  const hasServiceKey = envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY=');
  
  console.log('   VITE_SUPABASE_URL:', hasUrl ? '✅ Set' : '❌ Missing');
  console.log('   VITE_SUPABASE_ANON_KEY:', hasAnonKey ? '✅ Set' : '❌ Missing');
  console.log('   VITE_SUPABASE_SERVICE_ROLE_KEY:', hasServiceKey ? '✅ Set' : '❌ Missing');
} else {
  console.log('\n📝 To create .env.local:');
  console.log('   1. Copy env-template.txt to .env.local');
  console.log('   2. Replace placeholder values with your Supabase credentials');
  console.log('   3. Get credentials from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
}

// Check if schema file exists
const schemaPath = path.join(__dirname, 'monza-complete-schema.sql');
const schemaExists = fs.existsSync(schemaPath);

console.log('\n📋 Database Schema Check:');
console.log('   monza-complete-schema.sql:', schemaExists ? '✅ Found' : '❌ Missing');

if (schemaExists) {
  console.log('\n📝 To apply the schema:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy the contents of monza-complete-schema.sql');
  console.log('   4. Paste and run the entire script');
  console.log('   5. Verify tables are created');
}

// Check if types file exists and has content
const typesPath = path.join(__dirname, 'src/integrations/supabase/types.ts');
const typesExists = fs.existsSync(typesPath);

if (typesExists) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  const hasContent = typesContent.trim().length > 0;
  console.log('\n📋 TypeScript Types Check:');
  console.log('   types.ts file:', hasContent ? '✅ Has content' : '❌ Empty (schema not applied)');
  
  if (!hasContent) {
    console.log('\n⚠️  The types.ts file is empty, which means:');
    console.log('   - Database schema has not been applied to Supabase');
    console.log('   - You need to run the monza-complete-schema.sql in Supabase');
    console.log('   - After applying schema, restart your dev server to regenerate types');
  }
} else {
  console.log('\n📋 TypeScript Types Check:');
  console.log('   types.ts file: ❌ Missing');
  console.log('   This will be auto-generated after schema is applied');
}

console.log('\n🚀 NEXT STEPS:');
console.log('==============');

if (!envExists) {
  console.log('1. Create .env.local with your Supabase credentials');
}

if (schemaExists) {
  console.log('2. Apply the database schema in Supabase SQL Editor');
} else {
  console.log('2. The schema file is missing - check if monza-complete-schema.sql exists');
}

console.log('3. Restart your development server');
console.log('4. Test the application');

console.log('\n📞 If you need help:');
console.log('   - Check setup-supabase-complete.md for detailed instructions');
console.log('   - Verify your Supabase project is active and accessible');
console.log('   - Make sure you have the correct API keys');

console.log('\n✨ Once everything is set up, you\'ll have:');
console.log('   - Complete database schema with all tables');
console.log('   - Row Level Security policies');
console.log('   - Sample data for testing');
console.log('   - Full audit logging system');
console.log('   - Optimistic locking for data integrity');
