// Environment setup for Monza TECH
// This file helps set up the required environment variables

console.log('🔧 Setting up environment variables...');

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://ywvoxhqzqbgqmwvkfmxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dm94aHF6cWJncW13dmtmbXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNzE5NjgsImV4cCI6MjA0NDc0Nzk2OH0.VJzOGZjKEMhECdxVJGhZLCZKUPyJjWCJCMKcBJKJKJK
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dm94aHF6cWJncW13dmtmbXhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE3MTk2OCwiZXhwIjoyMDQ0NzQ3OTY4fQ.VJzOGZjKEMhECdxVJGhZLCZKUPyJjWCJCMKcBJKJKJK

# Application Configuration
VITE_APP_NAME=Monza TECH
VITE_APP_VERSION=1.0.0
`;

const fs = require('fs');
const path = require('path');

try {
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Created .env.local file with Supabase configuration');
} catch (error) {
    console.error('❌ Failed to create .env.local:', error.message);
    console.log('📋 Please manually create .env.local with this content:');
    console.log(envContent);
}
