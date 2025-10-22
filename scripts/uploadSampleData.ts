/**
 * scripts/uploadSampleData.ts
 * Seed Monza users into public.users via Service Role (server-side only).
 * Run: npx tsx scripts/uploadSampleData.ts
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

type UserSeed = {
  id?: string;       // optional UUID if you want to match an existing auth user id
  email: string;
  role: 'OWNER' | 'GARAGE_MANAGER' | 'ASSISTANT' | 'SALES_MANAGER' | 'MARKETING_MANAGER' | 'TECHNICIAN';
  name?: string | null;
  phone?: string | null;
  department?: string | null;
};

// ⚠️ If you already created auth users in Supabase Auth, you can paste their UUIDs into `id`
// below to map them 1:1. If not, you can leave `id` undefined and only seed the app users table.
const users: UserSeed[] = [
  { 
    email: 'houssam@monza.com', 
    role: 'OWNER', 
    name: 'Houssam', 
    department: 'Management',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'samer@monza.com', 
    role: 'OWNER', 
    name: 'Samer', 
    department: 'Management',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'kareem@monza.com', 
    role: 'OWNER', 
    name: 'Kareem', 
    department: 'Management',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'mark@monza.com', 
    role: 'GARAGE_MANAGER', 
    name: 'Mark', 
    department: 'Garage Operations',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'lara@monza.com', 
    role: 'ASSISTANT', 
    name: 'Lara', 
    department: 'Administration',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'samaya@monza.com', 
    role: 'ASSISTANT', 
    name: 'Samaya', 
    department: 'Administration',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'khalil@monza.com', 
    role: 'SALES_MANAGER', 
    name: 'Khalil', 
    department: 'Sales & Marketing',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'tamara@monza.com', 
    role: 'MARKETING_MANAGER', 
    name: 'Tamara', 
    department: 'Sales & Marketing',
    phone: '+961-xxx-xxxx'
  },
  { 
    email: 'elie@monza.com', 
    role: 'TECHNICIAN', 
    name: 'Elie', 
    department: 'Technical Services',
    phone: '+961-xxx-xxxx'
  },
];

async function main() {
  console.log('🚀 Seeding Monza TECH employees into public.users…');
  console.log('');

  // Test connection first
  try {
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count(*)')
      .single();
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }

  // Upsert users
  const { data, error } = await supabase
    .from('users')
    .upsert(
      users.map(u => ({
        id: u.id ?? undefined,
        email: u.email.toLowerCase(),
        role: u.role.toUpperCase(),
        name: u.name ?? null,
        phone: u.phone ?? null,
        department: u.department ?? null,
      })),
      { onConflict: 'email' }
    )
    .select('id, email, role, name, department');

  if (error) {
    console.error('❌ Upsert failed:', error);
    process.exit(1);
  }

  console.log('');
  console.log('📊 Successfully seeded employees:');
  console.table(data);
  console.log('');
  console.log('✅ Monza TECH employee data seed complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Create auth users in Supabase for each employee');
  console.log('2. Update the users table with proper auth UUIDs');
  console.log('3. Test login with each user account');
  console.log('4. Verify role-based access controls work');
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});