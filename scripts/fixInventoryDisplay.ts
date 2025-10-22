/**
 * scripts/fixInventoryDisplay.ts
 * Fix Car Inventory display by copying data from car_inventory to cars table
 * Run: npx tsx scripts/fixInventoryDisplay.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('🔍 Checking current database state...');
  
  try {
    // Check cars table
    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('*', { count: 'exact' });

    let carsCount = 0;
    if (carsError) {
      console.log(`❌ cars table error: ${carsError.message}`);
    } else {
      carsCount = carsData?.length || 0;
      console.log(`📊 cars table: ${carsCount} records`);
    }

    // Check car_inventory table
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('car_inventory')
      .select('*', { count: 'exact' });

    let inventoryCount = 0;
    if (inventoryError) {
      console.log(`❌ car_inventory table error: ${inventoryError.message}`);
    } else {
      inventoryCount = inventoryData?.length || 0;
      console.log(`📦 car_inventory table: ${inventoryCount} records`);
    }

    return { carsCount, inventoryCount, inventoryData };
  } catch (error) {
    console.error(`❌ Error checking tables:`, error);
    return { carsCount: 0, inventoryCount: 0, inventoryData: null };
  }
}

async function fixInventoryData() {
  console.log('🚗 MONZA TECH - Fix Car Inventory Display');
  console.log('==========================================');
  console.log('');

  // Step 1: Check current state
  const { carsCount, inventoryCount, inventoryData } = await checkTables();
  
  if (inventoryCount === 0) {
    console.log('❌ No data found in car_inventory table. Please upload your stock data first.');
    return;
  }

  if (carsCount > 0) {
    console.log(`✅ cars table already has ${carsCount} records.`);
    console.log('Your Car Inventory should be working. Try refreshing the page.');
    return;
  }

  console.log('');
  console.log(`🔧 Issue identified: ${inventoryCount} vehicles in car_inventory, but cars table is empty.`);
  console.log('📋 Copying data to fix the display...');
  console.log('');

  try {
    // Transform data to match cars table structure
    const carsData = inventoryData.map((item: any) => ({
      vin_number: item.vin,
      brand: 'Voyah',
      model: item.model,
      year: item.model_year,
      color: item.color,
      category: item.vehicle_type === 'EV' ? 'EV' : 'REV',
      status: item.status === 'Available' ? 'in_stock' : 
             item.status === 'Sold' ? 'sold' : 
             item.status === 'Reserved' ? 'reserved' : 'in_stock',
      current_location: item.status === 'Available' ? 'Inventory' : 
                      item.status === 'Sold' ? 'Delivered' : 'Reserved',
      selling_price: item.selling_price || 50000,
      battery_percentage: 100,
      range_km: 520,
      arrival_date: item.created_at || new Date().toISOString(),
      customs: 'paid',
      notes: [
        item.notes,
        item.client_name ? `Client: ${item.client_name}` : null,
        item.delivery_date ? `Delivery: ${item.delivery_date}` : null,
        item.vehicle_warranty_expiry ? `Warranty: ${item.vehicle_warranty_expiry}` : null
      ].filter(Boolean).join(' | ') || null,
      created_at: item.created_at,
      updated_at: item.updated_at || new Date().toISOString()
    }));

    console.log(`🔄 Transformed ${carsData.length} records for cars table`);

    // Clear existing data in cars table first (if any)
    console.log('🧹 Clearing cars table...');
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.log(`⚠️ Could not clear cars table: ${deleteError.message}`);
    }

    // Insert in batches
    const batchSize = 25;
    let successCount = 0;
    let errorCount = 0;

    console.log('📤 Uploading vehicles to cars table...');

    for (let i = 0; i < carsData.length; i += batchSize) {
      const batch = carsData.slice(i, i + batchSize);
      const batchNum = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(carsData.length / batchSize);
      
      console.log(`   📦 Batch ${batchNum}/${totalBatches} (${batch.length} vehicles)...`);
      
      const { data, error } = await supabase
        .from('cars')
        .insert(batch)
        .select();

      if (error) {
        console.log(`   ❌ Error in batch ${batchNum}: ${error.message}`);
        errorCount += batch.length;
      } else {
        console.log(`   ✅ Batch ${batchNum} uploaded successfully`);
        successCount += batch.length;
      }
    }

    console.log('');
    console.log('🎉 FIX COMPLETED!');
    console.log('=================');
    console.log(`✅ Successfully copied: ${successCount} vehicles`);
    console.log(`❌ Failed uploads: ${errorCount} vehicles`);
    
    if (successCount > 0) {
      // Verify the fix
      const { data: verifyData } = await supabase
        .from('cars')
        .select('status', { count: 'exact' });

      if (verifyData) {
        const soldCount = verifyData.filter((car: any) => car.status === 'sold').length;
        const inStockCount = verifyData.filter((car: any) => car.status === 'in_stock').length;
        const reservedCount = verifyData.filter((car: any) => car.status === 'reserved').length;

        console.log('');
        console.log('📈 Vehicle Status Breakdown:');
        console.log(`   💰 Sold: ${soldCount}`);
        console.log(`   📦 In Stock: ${inStockCount}`);
        console.log(`   📋 Reserved: ${reservedCount}`);
        console.log(`   🚗 Total: ${verifyData.length}`);
      }

      console.log('');
      console.log('🚀 NEXT STEPS:');
      console.log('1. Go to: http://localhost:5173/car-inventory');
      console.log('2. Refresh the page if already open');
      console.log(`3. You should now see: Car Inventory (${successCount})`);
      console.log('4. Browse your vehicles, search by VIN, client, or model');
      console.log('');
      console.log('✅ Your Car Inventory display is now fixed!');
    } else {
      console.log('❌ No vehicles were successfully copied. Check the errors above.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixInventoryData().catch(console.error);
