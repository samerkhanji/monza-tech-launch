/**
 * scripts/check-all-inventory-status.ts
 * Check the status distribution of all vehicles in car_inventory
 * Run: npx tsx scripts/check-all-inventory-status.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllInventoryStatus() {
  console.log('🔍 MONZA TECH - Complete Inventory Status Check');
  console.log('===============================================');
  console.log('');

  try {
    // Get all records from car_inventory
    console.log('📊 Reading all records from car_inventory...');
    
    const { data: allInventory, error: inventoryError } = await supabase
      .from('car_inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (inventoryError) {
      console.log(`❌ Error reading car_inventory: ${inventoryError.message}`);
      return;
    }

    const totalRecords = allInventory?.length || 0;
    console.log(`✅ Successfully read ${totalRecords} total records`);
    console.log('');

    // Analyze status distribution
    console.log('📋 Status Distribution:');
    const statusCounts: { [key: string]: number } = {};
    
    allInventory?.forEach(car => {
      const status = car.status || car.Status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / totalRecords) * 100).toFixed(1);
      console.log(`   - ${status}: ${count} (${percentage}%)`);
    });

    console.log('');

    // Analyze model distribution
    console.log('🚗 Model Distribution:');
    const modelCounts: { [key: string]: number } = {};
    
    allInventory?.forEach(car => {
      const model = car.model || car.Model || 'unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    Object.entries(modelCounts).forEach(([model, count]) => {
      const percentage = ((count / totalRecords) * 100).toFixed(1);
      console.log(`   - ${model}: ${count} (${percentage}%)`);
    });

    console.log('');

    // Analyze year distribution
    console.log('📅 Year Distribution:');
    const yearCounts: { [key: string]: number } = {};
    
    allInventory?.forEach(car => {
      const year = car.year || car.model_year || car.Model_Year || 'unknown';
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    Object.entries(yearCounts).forEach(([year, count]) => {
      const percentage = ((count / totalRecords) * 100).toFixed(1);
      console.log(`   - ${year}: ${count} (${percentage}%)`);
    });

    console.log('');

    // Show sample records for each status
    console.log('📋 Sample Records by Status:');
    Object.keys(statusCounts).forEach(status => {
      const sampleCar = allInventory?.find(car => 
        (car.status || car.Status) === status
      );
      
      if (sampleCar) {
        console.log(`   ${status.toUpperCase()}:`);
        console.log(`     - VIN: ${sampleCar.vin || sampleCar.VIN}`);
        console.log(`     - Model: ${sampleCar.model || sampleCar.Model}`);
        console.log(`     - Year: ${sampleCar.year || sampleCar.model_year || sampleCar.Model_Year}`);
        console.log(`     - Color: ${sampleCar.color || sampleCar.Color}`);
        console.log(`     - Brand: ${sampleCar.brand || sampleCar.Brand}`);
        console.log('');
      }
    });

    console.log('🎯 SUMMARY:');
    console.log('===========');
    console.log(`✅ Total vehicles: ${totalRecords}`);
    console.log(`✅ Statuses found: ${Object.keys(statusCounts).length}`);
    console.log(`✅ Models found: ${Object.keys(modelCounts).length}`);
    console.log(`✅ Years found: ${Object.keys(yearCounts).length}`);
    console.log('');
    console.log('🚀 Dashboard should now display this data correctly!');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkAllInventoryStatus();
