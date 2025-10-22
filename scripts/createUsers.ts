/**
 * User Creation Script for Monza TECH
 * 
 * This script creates users and assigns roles using the Supabase service role.
 * Run this script server-side with environment variables set.
 * 
 * Required environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  roles: string[];
}

async function createUser({ email, password, full_name, phone, roles }: CreateUserParams) {
  try {
    console.log(`Creating user: ${full_name} (${email})`);
    
    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone }
    });

    if (authError) {
      console.error(`Failed to create user ${email}:`, authError);
      return null;
    }

    const userId = authData.user.id;
    console.log(`✅ Created user ${full_name} with ID: ${userId}`);

    // Update user profile with phone if provided
    if (phone) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ phone })
        .eq('id', userId);

      if (profileError) {
        console.warn(`Failed to update phone for ${email}:`, profileError);
      }
    }

    // Assign roles
    if (roles.length > 0) {
      const roleInserts = roles.map(role_id => ({
        user_id: userId,
        role_id
      }));

      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (rolesError) {
        console.error(`Failed to assign roles to ${email}:`, rolesError);
      } else {
        console.log(`✅ Assigned roles [${roles.join(', ')}] to ${full_name}`);
      }
    }

    return authData.user;
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
    return null;
  }
}

async function seedMonzaTeam() {
  console.log('🚀 Starting Monza TECH team user creation...\n');

  const team = [
    {
      email: "houssam@monza.com",
      password: "MonzaTech2024!",
      full_name: "Houssam (Owner)",
      phone: "+961-70-123-456",
      roles: ["owner"]
    },
    {
      email: "kareem@monza.com", 
      password: "MonzaTech2024!",
      full_name: "Kareem (Owner)",
      phone: "+961-70-123-457",
      roles: ["owner"]
    },
    {
      email: "samer@monza.com",
      password: "MonzaTech2024!",
      full_name: "Samer (Assistant)", 
      phone: "+961-70-123-458",
      roles: ["assistant"]
    },
    {
      email: "mark@monza.com",
      password: "MonzaTech2024!",
      full_name: "Mark (Garage Manager)",
      phone: "+961-70-123-459",
      roles: ["garage_manager"]
    },
    {
      email: "khalil@monza.com",
      password: "MonzaTech2024!",
      full_name: "Khalil (Sales + Garage)",
      phone: "+961-70-123-460",
      roles: ["sales", "garage_manager"] // Hybrid role
    },
    {
      email: "tamara@monza.com",
      password: "MonzaTech2024!",
      full_name: "Tamara (Sales + Marketing)",
      phone: "+961-70-123-461", 
      roles: ["sales", "marketing"] // Hybrid role
    },
    {
      email: "elie@monza.com",
      password: "MonzaTech2024!",
      full_name: "Elie (Technician)",
      phone: "+961-70-123-462",
      roles: ["technician"]
    },
    {
      email: "sarah@monza.com",
      password: "MonzaTech2024!",
      full_name: "Sarah (Receptionist)",
      phone: "+961-70-123-463",
      roles: ["assistant"]
    },
    {
      email: "ahmed@monza.com",
      password: "MonzaTech2024!",
      full_name: "Ahmed (Mechanic)", 
      phone: "+961-70-123-464",
      roles: ["technician"]
    },
    {
      email: "maya@monza.com",
      password: "MonzaTech2024!",
      full_name: "Maya (Accountant)",
      phone: "+961-70-123-465",
      roles: ["assistant"] // Can view financial data but not edit
    },
    {
      email: "omar@monza.com",
      password: "MonzaTech2024!",
      full_name: "Omar (Parts Manager)",
      phone: "+961-70-123-466",
      roles: ["garage_manager"] // Can manage inventory
    },
    {
      email: "lina@monza.com",
      password: "MonzaTech2024!",
      full_name: "Lina (Marketing)",
      phone: "+961-70-123-467",
      roles: ["marketing"]
    },
    {
      email: "nader@monza.com",
      password: "MonzaTech2024!",
      full_name: "Nader (Security)",
      phone: "+961-70-123-468",
      roles: ["assistant"] // Basic access
    },
    {
      email: "rania@monza.com",
      password: "MonzaTech2024!",
      full_name: "Rania (HR)",
      phone: "+961-70-123-469",
      roles: ["assistant"] // Can view but not manage users
    },
    {
      email: "fadi@monza.com",
      password: "MonzaTech2024!",
      full_name: "Fadi (IT Support)",
      phone: "+961-70-123-470",
      roles: ["technician", "assistant"] // Hybrid role
    }
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const member of team) {
    const user = await createUser(member);
    if (user) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed to create: ${failureCount} users`);
  console.log(`\n🎉 Monza TECH team setup complete!`);
}

// Check environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Run the script
seedMonzaTeam()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });