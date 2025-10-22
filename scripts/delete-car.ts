import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteCar() {
  try {
    console.log('🔍 Searching for car with VIN: FEE23543242423...');
    
    // First, check if the car exists
    const { data: car, error: searchError } = await supabase
      .from('car_inventory')
      .select('*')
      .eq('vin', 'FEE23543242423')
      .single();

    if (searchError) {
      if (searchError.code === 'PGRST116') {
        console.log('❌ Car with VIN FEE23543242423 not found');
        return;
      }
      throw searchError;
    }

    console.log('✅ Found car:', car);

    // Delete the car
    const { error: deleteError } = await supabase
      .from('car_inventory')
      .delete()
      .eq('vin', 'FEE23543242423');

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Successfully deleted car with VIN: FEE23543242423');
    
    // Verify deletion
    const { data: verifyCar, error: verifyError } = await supabase
      .from('car_inventory')
      .select('*')
      .eq('vin', 'FEE23543242423')
      .single();

    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('✅ Verification: Car successfully deleted');
    } else {
      console.log('⚠️ Warning: Car might still exist');
    }

  } catch (error) {
    console.error('❌ Error deleting car:', error);
  }
}

deleteCar();
