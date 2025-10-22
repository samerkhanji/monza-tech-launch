/**
 * scripts/uploadMonzaInventory.ts
 * Upload complete Monza car inventory with all warranty and client data
 * Run: npx tsx scripts/uploadMonzaInventory.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL as string;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Handle MM/DD/YYYY format
  const dateParts = dateStr.split('/');
  if (dateParts.length === 3) {
    const [month, day, year] = dateParts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

async function createInventoryTable() {
  console.log('🔧 Creating/updating car inventory table schema...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.car_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status TEXT NOT NULL CHECK (status IN ('Available', 'Sold', 'Reserved', 'In Service')),
      client_name TEXT,
      vin TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL,
      color TEXT NOT NULL,
      model TEXT NOT NULL,
      model_year INTEGER NOT NULL,
      delivery_date DATE,
      vehicle_warranty_expiry DATE,
      battery_warranty_expiry DATE,
      dms_warranty_deadline DATE,
      notes TEXT,
      service_date DATE,
      contact_info TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON public.car_inventory(status);
    CREATE INDEX IF NOT EXISTS idx_car_inventory_vin ON public.car_inventory(vin);
    CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON public.car_inventory(model);
    CREATE INDEX IF NOT EXISTS idx_car_inventory_client ON public.car_inventory(client_name);
    
    -- Enable RLS
    ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;
    
    -- Create policies (if not exists)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'car_inventory' 
        AND policyname = 'inventory_read_all'
      ) THEN
        CREATE POLICY inventory_read_all ON public.car_inventory
          FOR SELECT TO authenticated USING (true);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'car_inventory' 
        AND policyname = 'inventory_write_owners'
      ) THEN
        CREATE POLICY inventory_write_owners ON public.car_inventory
          FOR ALL TO authenticated 
          USING (public.is_owner(auth.uid()) OR 
                 EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('GARAGE_MANAGER', 'SALES_MANAGER')))
          WITH CHECK (public.is_owner(auth.uid()) OR 
                     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('GARAGE_MANAGER', 'SALES_MANAGER')));
      END IF;
    END$$;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  
  if (error) {
    console.log('Table might already exist, continuing...');
  } else {
    console.log('✅ Table schema created/updated successfully');
  }
}

async function main() {
  console.log('🚗 Uploading complete Monza car inventory to Supabase...');
  console.log('');

  // Test connection
  try {
    const { error: testError } = await supabase
      .from('car_inventory')
      .select('*')
      .limit(1);
    
    if (testError && testError.message.includes('relation "car_inventory" does not exist')) {
      await createInventoryTable();
    } else if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }

  // Use the CSV upload script to import the data
  const { exec } = require('child_process');
  const path = require('path');
  
  const csvPath = path.join(__dirname, '..', 'data', 'monza_car_inventory.csv');
  const command = `npx tsx ${path.join(__dirname, 'csvToSupabase.ts')} "${csvPath}" car_inventory --upsert=vin`;
  
  console.log('📊 Importing inventory data from CSV...');
  console.log('');
  
  exec(command, (error: any, stdout: string, stderr: string) => {
    if (error) {
      console.error('❌ CSV import failed:', error);
      return;
    }
    
    if (stderr) {
      console.error('⚠️ Warnings:', stderr);
    }
    
    console.log(stdout);
    
    // Show summary
    console.log('');
    console.log('🎉 Monza car inventory upload complete!');
    console.log('');
    console.log('📊 What was uploaded:');
    console.log('   🚗 Complete vehicle inventory with VIN numbers');
    console.log('   👥 Client information for sold vehicles');
    console.log('   📅 Delivery dates and warranty information');
    console.log('   🔧 Service dates and DMS integration data');
    console.log('   📝 Notes and special conditions');
    console.log('');
    console.log('✅ Your Monza inventory is now in Supabase!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Check your inventory dashboard in the web app');
    console.log('2. Verify sold vs available vehicle counts');
    console.log('3. Test search and filtering by VIN, client, model');
    console.log('4. Update any missing delivery dates or client info');
  });
}

main().catch(err => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
