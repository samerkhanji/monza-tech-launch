/**
 * test-connection.js  
 * Quick test to check if we can connect to Supabase and if tables exist
 * Run: node test-connection.js
 */
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 TESTING SUPABASE CONNECTION...');
  console.log('');
  
  // Check environment variables
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📊 Environment Check:');
  console.log('   VITE_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
  console.log('   VITE_SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing');
  console.log('   VITE_SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅ Set' : '❌ Missing');
  console.log('');
  
  if (!url || !anonKey || !serviceKey) {
    console.log('❌ Environment not configured. Run: node setup-env.js');
    return;
  }
  
  try {
    // Import Supabase (install if needed)
    let createClient;
    try {
      createClient = require('@supabase/supabase-js').createClient;
    } catch (e) {
      console.log('❌ @supabase/supabase-js not installed. Run: npm install @supabase/supabase-js');
      return;
    }
    
    const supabase = createClient(url, serviceKey);
    
    console.log('🔗 Testing connection...');
    
    // Test 1: Check if car_inventory table exists
    const { data: tables, error: tablesError } = await supabase
      .from('car_inventory')
      .select('*')
      .limit(1);
      
    if (tablesError && tablesError.message.includes('relation "car_inventory" does not exist')) {
      console.log('📋 car_inventory table: ❌ Does not exist');
      console.log('   👉 Need to run database schema first');
      console.log('   👉 Copy supabase/migrations/car_inventory_table.sql to Supabase SQL Editor');
    } else if (tablesError) {
      console.log('📋 car_inventory table: ⚠️  Error:', tablesError.message);
    } else {
      const count = tables?.length || 0;
      console.log(`📋 car_inventory table: ✅ Exists (${count} records)`);
    }
    
    // Test 2: Check other tables
    const tablesToCheck = ['cars', 'users', 'audit_log'];
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error && error.message.includes('does not exist')) {
          console.log(`📋 ${table} table: ❌ Does not exist`);
        } else if (error) {
          console.log(`📋 ${table} table: ⚠️  Error: ${error.message}`);
        } else {
          console.log(`📋 ${table} table: ✅ Exists (${data?.length || 0} records)`);
        }
      } catch (e) {
        console.log(`📋 ${table} table: ❌ ${e.message}`);
      }
    }
    
    console.log('');
    console.log('🎯 READY TO UPLOAD?');
    
    if (tablesError && tablesError.message.includes('relation "car_inventory" does not exist')) {
      console.log('❌ Database not ready. Follow these steps:');
      console.log('');
      console.log('1️⃣ Create database table:');
      console.log('   • Go to Supabase Dashboard > SQL Editor');
      console.log('   • Copy/paste: supabase/migrations/car_inventory_table.sql');
      console.log('   • Run the query');
      console.log('');
      console.log('2️⃣ Upload inventory:');
      console.log('   • npm run upload:monza-inventory');
    } else {
      console.log('✅ Ready to upload! Run: npm run upload:monza-inventory');
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check your Supabase project is running');
    console.log('2. Verify your API keys are correct');
    console.log('3. Make sure you have internet connection');
  }
}

testConnection().catch(console.error);
