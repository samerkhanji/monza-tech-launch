/**
 * scripts/fix-cars-table-schema.ts
 * Fix the cars table schema by adding missing columns
 * Run: npx tsx scripts/fix-cars-table-schema.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixCarsTableSchema() {
  console.log('🔧 MONZA TECH - Fix Cars Table Schema');
  console.log('=======================================');
  console.log('');

  try {
    // Step 1: Check current table structure
    console.log('📊 Step 1: Checking current cars table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('cars')
      .select('*')
      .limit(0);

    if (tableError) {
      console.log(`❌ Error accessing cars table: ${tableError.message}`);
      return;
    }

    console.log('✅ cars table exists and is accessible');
    
    // Step 2: Add missing columns
    console.log('🔧 Step 2: Adding missing columns...');
    
    const missingColumns = [
      {
        name: 'vin_number',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS vin_number text UNIQUE'
      },
      {
        name: 'color',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS color text'
      },
      {
        name: 'current_location',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS current_location text DEFAULT \'Inventory\''
      },
      {
        name: 'arrival_date',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS arrival_date timestamptz DEFAULT now()'
      },
      {
        name: 'customs',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS customs text CHECK (customs IN (\'not_paid\', \'paid\', \'pending\', \'exempted\')) DEFAULT \'not_paid\''
      },
      {
        name: 'battery_percentage',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS battery_percentage integer DEFAULT 100 CHECK (battery_percentage >= 0 AND battery_percentage <= 100)'
      },
      {
        name: 'range_km',
        sql: 'ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS range_km integer'
      }
    ];

    for (const column of missingColumns) {
      console.log(`   Adding column: ${column.name}...`);
      
      try {
        // Use RPC to execute SQL (if available)
        const { error } = await supabase.rpc('exec_sql', { sql: column.sql });
        
        if (error) {
          console.log(`   ⚠️  Could not add ${column.name} via RPC: ${error.message}`);
          console.log(`   💡 Column might already exist or RPC not available`);
        } else {
          console.log(`   ✅ Added column: ${column.name}`);
        }
      } catch (e) {
        console.log(`   ⚠️  Error adding ${column.name}: ${e.message}`);
      }
    }

    // Step 3: Test the updated schema
    console.log('🧪 Step 3: Testing updated schema...');
    
    const testCar = {
      vin_number: 'TEST123456789TEST',
      model: 'Free',
      brand: 'Voyah',
      year: 2025,
      color: 'Red',
      category: 'EV',
      status: 'in_stock',
      current_location: 'Inventory',
      selling_price: 50000,
      battery_percentage: 100,
      range_km: 520
    };

    const { data: insertData, error: insertError } = await supabase
      .from('cars')
      .insert([testCar])
      .select();

    if (insertError) {
      console.log(`❌ Test insert failed: ${insertError.message}`);
      console.log('💡 Schema might still have issues');
      return;
    }

    console.log(`✅ Test car inserted successfully!`);
    console.log(`   → Car ID: ${insertData[0]?.id}`);
    console.log(`   → VIN: ${insertData[0]?.vin_number}`);

    // Step 4: Clean up test record
    console.log('🧹 Step 4: Cleaning up test record...');
    
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('vin_number', 'TEST123456789TEST');

    if (deleteError) {
      console.log(`⚠️  Could not delete test record: ${deleteError.message}`);
    } else {
      console.log('✅ Test record cleaned up successfully');
    }

    console.log('');
    console.log('🎉 SCHEMA FIX COMPLETED!');
    console.log('========================');
    console.log('✅ Added missing columns to cars table');
    console.log('✅ Schema now matches expected structure');
    console.log('✅ Ready to migrate data from car_inventory');
    console.log('');
    console.log('🚀 Next step: Run the data migration script');
    console.log('   npx tsx scripts/fixInventoryDisplay.ts');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixCarsTableSchema();
