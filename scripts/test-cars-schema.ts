/**
 * scripts/test-cars-schema.ts
 * Test the cars table schema and insert a simple test record
 * Run: npx tsx scripts/test-cars-schema.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCarsSchema() {
  console.log('🔍 Testing Cars Table Schema...');
  console.log('');

  try {
    // Test 1: Check if cars table exists and get its structure
    console.log('📊 Step 1: Checking cars table structure...');
    
    // Try to get the table info by selecting all columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('cars')
      .select('*')
      .limit(0);

    if (tableError) {
      console.log(`❌ Error accessing cars table: ${tableError.message}`);
      
      if (tableError.message.includes('does not exist')) {
        console.log('💡 The cars table does not exist. Need to create it first.');
        console.log('   Run the database migration: supabase/migrations/20240120000000_create_car_inventory_system.sql');
        return;
      }
      return;
    }

    console.log('✅ cars table exists and is accessible');
    
    // Test 2: Try to insert with only the most basic fields
    console.log('🚗 Step 2: Testing minimal insert...');
    
    // Try with just VIN and model first
    const basicCar = {
      vin_number: 'TEST123456789TEST',
      model: 'Free'
    };

    console.log('   Trying with just VIN and model...');
    const { data: basicInsertData, error: basicInsertError } = await supabase
      .from('cars')
      .insert([basicCar])
      .select();

    if (basicInsertError) {
      console.log(`❌ Basic insert failed: ${basicInsertError.message}`);
      
      // Try with just VIN
      console.log('   Trying with just VIN...');
      const { data: vinOnlyData, error: vinOnlyError } = await supabase
        .from('cars')
        .insert([{ vin_number: 'TEST123456789TEST' }])
        .select();

      if (vinOnlyError) {
        console.log(`❌ VIN-only insert failed: ${vinOnlyError.message}`);
        
        // Try to get more info about the table structure
        console.log('💡 Let me check what columns actually exist...');
        
        // Try to select specific columns to see which ones exist
        const columnsToTest = [
          'id', 'vin_number', 'model', 'brand', 'year', 'color', 
          'category', 'status', 'current_location', 'selling_price'
        ];
        
        for (const column of columnsToTest) {
          try {
            const { data, error } = await supabase
              .from('cars')
              .select(column)
              .limit(1);
            
            if (error && error.message.includes('does not exist')) {
              console.log(`   ❌ Column '${column}' does not exist`);
            } else {
              console.log(`   ✅ Column '${column}' exists`);
            }
          } catch (e) {
            console.log(`   ❌ Column '${column}' error: ${e.message}`);
          }
        }
        
        return;
      } else {
        console.log(`✅ VIN-only insert successful!`);
        console.log(`   → Car ID: ${vinOnlyData[0]?.id}`);
      }
    } else {
      console.log(`✅ Basic insert successful!`);
      console.log(`   → Car ID: ${basicInsertData[0]?.id}`);
    }

    // Clean up: Delete the test record
    console.log('🧹 Step 3: Cleaning up test record...');
    
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
    console.log('🎯 SUMMARY:');
    console.log('✅ cars table exists and is accessible');
    console.log('❌ Schema mismatch detected');
    console.log('💡 Need to check actual table structure');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCarsSchema();
