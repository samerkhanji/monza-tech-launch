/**
 * scripts/uploadCarInventory.ts
 * Upload sample car inventory data to Supabase
 * Run: npx tsx scripts/uploadCarInventory.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type CarInventory = {
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  price: number;
  mileage: number;
  status: 'available' | 'sold' | 'reserved' | 'in_service';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  fuel_type: string;
  transmission: string;
  notes?: string;
};

const sampleCars: CarInventory[] = [
  {
    make: 'BMW',
    model: 'X5',
    year: 2023,
    vin: 'WBXPC9C51EP123456',
    color: 'Space Gray',
    price: 75000,
    mileage: 1200,
    status: 'available',
    condition: 'excellent',
    fuel_type: 'gasoline',
    transmission: 'automatic'
  },
  {
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2024,
    vin: 'WDD2059421F123456',
    color: 'Polar White',
    price: 65000,
    mileage: 500,
    status: 'available',
    condition: 'excellent',
    fuel_type: 'gasoline',
    transmission: 'automatic'
  },
  {
    make: 'Audi',
    model: 'A4',
    year: 2023,
    vin: 'WAUZZZ8K1DA123456',
    color: 'Mythos Black',
    price: 55000,
    mileage: 2500,
    status: 'sold',
    condition: 'excellent',
    fuel_type: 'gasoline',
    transmission: 'automatic'
  },
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    vin: '4T1C11AK8PU123456',
    color: 'Pearl White',
    price: 35000,
    mileage: 8000,
    status: 'available',
    condition: 'good',
    fuel_type: 'gasoline',
    transmission: 'automatic'
  },
  {
    make: 'Honda',
    model: 'Accord',
    year: 2022,
    vin: '1HGCV1F3XNA123456',
    color: 'Modern Steel',
    price: 32000,
    mileage: 15000,
    status: 'available',
    condition: 'good',
    fuel_type: 'gasoline',
    transmission: 'automatic'
  },
  {
    make: 'Lexus',
    model: 'ES350',
    year: 2023,
    vin: '58ABK1GG4PU123456',
    color: 'Atomic Silver',
    price: 45000,
    mileage: 3000,
    status: 'in_service',
    condition: 'excellent',
    fuel_type: 'gasoline',
    transmission: 'automatic'
  }
];

async function main() {
  console.log('🚗 Uploading sample car inventory to Supabase...');
  console.log('');

  // Test connection
  try {
    const { error: testError } = await supabase
      .from('cars') // Adjust table name if different
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot access cars table:', testError.message);
      console.log('💡 Make sure you have a "cars" table in your database');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }

  // Upload cars
  const { data, error } = await supabase
    .from('cars')
    .upsert(sampleCars, { onConflict: 'vin' })
    .select('id, make, model, year, vin, status');

  if (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }

  console.log('');
  console.log('📊 Successfully uploaded cars:');
  console.table(data);
  console.log('');
  console.log(`✅ Car inventory upload complete! Added ${data?.length || 0} vehicles`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Check your car inventory in the web app');
  console.log('2. Add more cars via CSV import or web interface');
  console.log('3. Test filtering and search functionality');
}

main().catch(err => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
