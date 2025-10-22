/**
 * scripts/testInventoryConnection.ts
 * Test if we can add a simple car to the inventory and see it show up
 * Run: npx tsx scripts/testInventoryConnection.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔍 Testing Car Inventory Connection...');
  console.log('');

  try {
    // Test 1: Check if we can read from cars table
    console.log('📊 Step 1: Checking cars table...');
    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .limit(5);

    if (carsError) {
      console.log(`❌ Cannot read cars table: ${carsError.message}`);
    } else {
      console.log(`✅ Cars table accessible: ${carsData?.length || 0} records found`);
    }

    // Test 2: Check if we can read from car_inventory table
    console.log('📦 Step 2: Checking car_inventory table...');
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('car_inventory')
      .select('*')
      .limit(5);

    if (inventoryError) {
      console.log(`❌ Cannot read car_inventory table: ${inventoryError.message}`);
    } else {
      console.log(`✅ Car_inventory table accessible: ${inventoryData?.length || 0} records found`);
    }

    // Test 3: Try to add a test car to the cars table
    console.log('🚗 Step 3: Adding test car to cars table...');
    const testCar = {
      vin_number: 'TEST123456789TEST',
      brand: 'Voyah',
      model: 'TEST-FREE',
      year: 2025,
      color: 'RED',
      category: 'REV',
      status: 'in_stock',
      current_location: 'Inventory',
      selling_price: 50000,
      battery_percentage: 100,
      range_km: 520,
      notes: 'TEST CAR - DELETE THIS'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('cars')
      .insert([testCar])
      .select();

    if (insertError) {
      console.log(`❌ Cannot insert test car: ${insertError.message}`);
      
      // If insert fails, it might be an RLS issue
      console.log('');
      console.log('🔍 Possible Issues:');
      console.log('1. Row Level Security (RLS) is blocking inserts');
      console.log('2. Missing required fields');
      console.log('3. Insufficient permissions');
      console.log('');
      console.log('💡 Trying alternative approach...');
      
      // Try with minimal data
      const minimalCar = {
        vin_number: 'MINIMAL123TEST',
        model: 'TEST',
        year: 2025,
        color: 'BLUE',
        selling_price: 1
      };

      const { data: minData, error: minError } = await supabase
        .from('cars')
        .insert([minimalCar])
        .select();

      if (minError) {
        console.log(`❌ Minimal insert also failed: ${minError.message}`);
      } else {
        console.log(`✅ Minimal car inserted successfully!`);
        console.log('   → This means the table structure works');
      }
    } else {
      console.log(`✅ Test car inserted successfully!`);
      console.log(`   → Car ID: ${insertData[0]?.id}`);
    }

    // Test 4: Check total count after insert
    console.log('📊 Step 4: Checking total count...');
    const { data: finalCount, error: countError } = await supabase
      .from('cars')
      .select('*', { count: 'exact' });

    if (countError) {
      console.log(`❌ Cannot count cars: ${countError.message}`);
    } else {
      console.log(`✅ Total cars in table: ${finalCount?.length || 0}`);
    }

    // Test 5: If we have data in car_inventory, show a sample
    if (inventoryData && inventoryData.length > 0) {
      console.log('');
      console.log('📦 Sample from car_inventory table:');
      console.log('VIN:', inventoryData[0]?.vin);
      console.log('Model:', inventoryData[0]?.model);
      console.log('Status:', inventoryData[0]?.status);
      console.log('Year:', inventoryData[0]?.model_year);
      
      console.log('');
      console.log('💡 SOLUTION: Your data is in car_inventory but app reads from cars');
      console.log('   Need to copy/transform data from car_inventory → cars');
    }

    console.log('');
    console.log('🎯 SUMMARY:');
    console.log(`   Cars table: ${carsData?.length || 0} records`);
    console.log(`   Car_inventory table: ${inventoryData?.length || 0} records`);
    
    if ((inventoryData?.length || 0) > 0 && (carsData?.length || 0) === 0) {
      console.log('');
      console.log('🚀 RECOMMENDED ACTION:');
      console.log('   Run data migration script to copy data from car_inventory to cars table');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testConnection();
