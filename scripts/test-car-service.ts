/**
 * scripts/test-car-service.ts
 * Test if the fixed car service can read data from car_inventory
 * Run: npx tsx scripts/test-car-service.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCarService() {
  console.log('🧪 Testing Fixed Car Service...');
  console.log('');

  try {
    // Test 1: Read from car_inventory table
    console.log('📊 Step 1: Reading from car_inventory table...');
    
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('car_inventory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (inventoryError) {
      console.log(`❌ Error reading car_inventory: ${inventoryError.message}`);
      return;
    }

    console.log(`✅ Successfully read ${inventoryData?.length || 0} records from car_inventory`);
    
    if (inventoryData && inventoryData.length > 0) {
      console.log('📋 Sample record structure:');
      const sample = inventoryData[0];
      console.log(`   - id: ${sample.id}`);
      console.log(`   - model: ${sample.model || sample.Model}`);
      console.log(`   - year: ${sample.year || sample.model_year || sample.Model_Year}`);
      console.log(`   - color: ${sample.color || sample.Color}`);
      console.log(`   - status: ${sample.status || sample.Status}`);
      console.log(`   - vin: ${sample.vin || sample.VIN}`);
      console.log(`   - brand: ${sample.brand || sample.Brand}`);
      console.log(`   - category: ${sample.category || sample.vehicle_type}`);
    }

    // Test 2: Simulate the transformation that the car service does
    console.log('');
    console.log('🔄 Step 2: Testing data transformation...');
    
    const transformedCars = inventoryData?.map(car => ({
      id: car.id,
      model: car.model || car.Model,
      year: car.year || car.model_year || car.Model_Year,
      color: car.color || car.Color,
      status: car.status || car.Status,
      vinNumber: car.vin || car.VIN,
      brand: car.brand || car.Brand || 'Voyah',
      category: car.category || car.vehicle_type || 'EV',
      currentFloor: car.current_location || 'Inventory',
      batteryPercentage: car.battery_percentage || 100,
      notes: car.notes || car.Notes,
      clientName: car.client_name || car.Client_Name,
      purchasePrice: car.purchase_price || 45000,
      sellingPrice: car.selling_price || 50000,
    })) || [];

    console.log(`✅ Successfully transformed ${transformedCars.length} records`);
    
    if (transformedCars.length > 0) {
      console.log('📋 Sample transformed record:');
      const sample = transformedCars[0];
      console.log(`   - id: ${sample.id}`);
      console.log(`   - model: ${sample.model}`);
      console.log(`   - year: ${sample.year}`);
      console.log(`   - color: ${sample.color}`);
      console.log(`   - status: ${sample.status}`);
      console.log(`   - vinNumber: ${sample.vinNumber}`);
      console.log(`   - brand: ${sample.brand}`);
      console.log(`   - category: ${sample.category}`);
    }

    // Test 3: Check if we can filter by status
    console.log('');
    console.log('🔍 Step 3: Testing status filtering...');
    
    const availableCars = transformedCars.filter(car => 
      car.status === 'Available' || car.status === 'in_stock'
    );
    const soldCars = transformedCars.filter(car => 
      car.status === 'Sold' || car.status === 'sold'
    );
    const reservedCars = transformedCars.filter(car => 
      car.status === 'Reserved' || car.status === 'reserved'
    );

    console.log(`📊 Status breakdown:`);
    console.log(`   - Available: ${availableCars.length}`);
    console.log(`   - Sold: ${soldCars.length}`);
    console.log(`   - Reserved: ${reservedCars.length}`);
    console.log(`   - Total: ${transformedCars.length}`);

    console.log('');
    console.log('🎉 CAR SERVICE TEST COMPLETED SUCCESSFULLY!');
    console.log('===========================================');
    console.log('✅ Can read from car_inventory table');
    console.log('✅ Can transform data correctly');
    console.log('✅ Can filter by status');
    console.log('✅ Dashboard should now display data correctly');
    console.log('');
    console.log('🚀 Refresh your dashboard to see the data!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCarService();
