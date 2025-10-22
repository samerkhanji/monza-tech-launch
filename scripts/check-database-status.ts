import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking database status...');
    
    // Check if car_inventory table exists and has data
    const { data: cars, error: carsError } = await supabase
      .from('car_inventory')
      .select('*')
      .limit(5);

    if (carsError) {
      console.error('❌ Error accessing car_inventory:', carsError);
    } else {
      console.log('✅ car_inventory table accessible');
      console.log(`📊 Found ${cars?.length || 0} cars`);
      if (cars && cars.length > 0) {
        console.log('🚗 Sample car:', cars[0]);
      }
    }

    // Check if cars table exists (fallback)
    const { data: carsTable, error: carsTableError } = await supabase
      .from('cars')
      .select('*')
      .limit(5);

    if (carsTableError) {
      console.log('ℹ️ cars table not accessible (expected)');
    } else {
      console.log('⚠️ cars table exists with data:', carsTable?.length || 0);
    }

    // Check dashboard views
    const views = [
      'view_dashboard_kpis',
      'view_inventory_by_model',
      'view_sales_pipeline',
      'view_garage_backlog',
      'view_today_schedule',
      'view_parts_low_stock'
    ];

    for (const viewName of views) {
      try {
        const { data: viewData, error: viewError } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);

        if (viewError) {
          console.log(`❌ ${viewName}: ${viewError.message}`);
        } else {
          console.log(`✅ ${viewName}: accessible`);
        }
      } catch (err) {
        console.log(`❌ ${viewName}: ${err}`);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabaseStatus();
