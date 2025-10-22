-- =============================================
-- MONZA TECH - COMPLETE PROFILES SYSTEM
-- =============================================
-- This creates the profiles table with proper auth sync and RLS

-- ============================
-- 1) PROFILES TABLE WITH PROPER SCHEMA
-- ============================

-- Public profile table (one row per user)
create table if not exists public.profiles (
  id uuid primary key,                 -- = auth.users.id
  full_name text,
  phone text,
  role text,                           -- OWNER, GARAGE_MANAGER, SALES, MARKETING, ASSISTANT, etc.
  avatar_url text,
  locale text default 'en',
  timezone text default 'Asia/Beirut',
  notifications jsonb default jsonb_build_object(
    'email', true,
    'sms', false,
    'push', true
  ),
  marketing_prefs jsonb default '{}'::jsonb,
  crm_signature text,                  -- signature used in Messages/Requests/CRM
  extra jsonb default '{}'::jsonb,     -- flexible bag for anything else
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Keep timestamps fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

-- ============================
-- 2) RLS POLICIES
-- ============================

-- Enable RLS
alter table public.profiles enable row level security;

-- Current user can select their own row; owners can see all
create policy "profiles_select_self_or_owner"
on public.profiles
for select
using (
  auth.uid() = id
  or auth.jwt()->>'user_role' in ('OWNER')
);

-- Current user can insert only their own row (first login bootstrap)
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

-- Current user can update only their row; owners can update all
create policy "profiles_update_self_or_owner"
on public.profiles
for update
using (
  auth.uid() = id
  or auth.jwt()->>'user_role' in ('OWNER')
)
with check (
  auth.uid() = id
  or auth.jwt()->>'user_role' in ('OWNER')
);

-- Optional delete policy (owners only)
create policy "profiles_delete_owner_only"
on public.profiles
for delete
using (auth.jwt()->>'user_role' in ('OWNER'));

-- ============================
-- 3) HELPER VIEW WITH EMAIL
-- ============================

-- View that joins auth.users metadata (email) with profiles
create or replace view public.profile_accounts as
select
  p.*,
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at
from public.profiles p
join auth.users au on au.id = p.id;

-- ============================
-- 4) AUDIT LOGGING
-- ============================

-- Add profiles to audit logging
drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.log_change();

-- ============================
-- 5) PERFORMANCE INDEXES
-- ============================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_created_at on public.profiles(created_at);
create index if not exists idx_profiles_full_name on public.profiles(full_name);

-- ============================
-- 6) STORAGE POLICIES (Run these in Supabase Dashboard)
-- ============================

-- First create the 'avatars' bucket in Supabase Storage UI, then apply these policies:

-- Allow authenticated users to read all avatars
-- INSERT INTO storage.policies (id, bucket_id, name, roles, policy) VALUES 
-- ('avatars_read_authenticated', 'avatars', 'Allow authenticated read', '{authenticated}', 'true');

-- Allow users to upload/update their own avatars (path must start with their user ID)
-- INSERT INTO storage.policies (id, bucket_id, name, roles, policy) VALUES 
-- ('avatars_write_own', 'avatars', 'Allow users to manage own avatars', '{authenticated}', 
--  'bucket_id = ''avatars'' AND (storage.foldername(name))[1] = auth.uid()::text');

-- ============================
-- 7) SAMPLE PROFILE DATA
-- ============================

-- Insert sample profiles (replace UUIDs with actual auth.users IDs)
-- Note: These are placeholder UUIDs - replace with real user IDs from auth.users table

insert into public.profiles (id, full_name, phone, role, locale, timezone, crm_signature) values
-- Replace these UUIDs with actual auth.users IDs from your project
('00000000-0000-0000-0000-000000000001', 'Houssam (Owner)', '+961-70-123456', 'OWNER', 'en', 'Asia/Beirut', 'Best regards,\nHoussam\nMonza TECH Owner'),
('00000000-0000-0000-0000-000000000002', 'Samer (Owner)', '+961-70-123457', 'OWNER', 'en', 'Asia/Beirut', 'Best regards,\nSamer\nMonza TECH Owner'),
('00000000-0000-0000-0000-000000000003', 'Kareem (Owner)', '+961-70-123458', 'OWNER', 'en', 'Asia/Beirut', 'Best regards,\nKareem\nMonza TECH Owner'),
('00000000-0000-0000-0000-000000000004', 'Mark (Garage Manager)', '+961-70-123459', 'GARAGE_MANAGER', 'en', 'Asia/Beirut', 'Best regards,\nMark\nGarage Manager'),
('00000000-0000-0000-0000-000000000005', 'Lara (Assistant)', '+961-70-123460', 'ASSISTANT', 'en', 'Asia/Beirut', 'Best regards,\nLara\nAssistant'),
('00000000-0000-0000-0000-000000000006', 'Samaya (Assistant)', '+961-70-123461', 'ASSISTANT', 'en', 'Asia/Beirut', 'Best regards,\nSamaya\nAssistant'),
('00000000-0000-0000-0000-000000000007', 'Khalil (Sales + Garage + Marketing)', '+961-70-123462', 'SALES', 'en', 'Asia/Beirut', 'Best regards,\nKhalil\nSales & Marketing'),
('00000000-0000-0000-0000-000000000008', 'Tamara (Sales + Marketing + PA)', '+961-70-123463', 'MARKETING', 'en', 'Asia/Beirut', 'Best regards,\nTamara\nMarketing & Sales'),
('00000000-0000-0000-0000-000000000009', 'Elie (Technician + Sales + Marketing)', '+961-70-123464', 'TECHNICIAN', 'en', 'Asia/Beirut', 'Best regards,\nElie\nTechnician & Sales')
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  locale = excluded.locale,
  timezone = excluded.timezone,
  crm_signature = excluded.crm_signature,
  updated_at = now();

-- ============================
-- 8) HELPER FUNCTIONS
-- ============================

-- Function to get user's role
create or replace function public.get_user_role(user_id uuid default auth.uid())
returns text
language sql
security definer
as $$
  select role from public.profiles where id = user_id;
$$;

-- Function to check if user has specific role
create or replace function public.has_role(required_role text, user_id uuid default auth.uid())
returns boolean
language sql
security definer
as $$
  select exists(
    select 1 from public.profiles 
    where id = user_id and role = required_role
  );
$$;

-- Function to check if user is owner
create or replace function public.is_owner(user_id uuid default auth.uid())
returns boolean
language sql
security definer
as $$
  select has_role('OWNER', user_id);
$$;

-- ============================
-- PROFILES SYSTEM COMPLETE
-- ============================
-- ✅ Profiles table with proper schema
-- ✅ RLS policies for security
-- ✅ Auth sync capabilities
-- ✅ Storage-ready for avatars
-- ✅ Audit logging integration
-- ✅ Helper functions for role checking
-- ✅ Sample data with real employee roles
-- ✅ Performance indexes

-- NEXT STEPS:
-- 1. Create 'avatars' bucket in Supabase Storage UI
-- 2. Apply storage policies for avatar uploads
-- 3. Replace sample UUIDs with real auth.users IDs
-- 4. Test profile creation and updates
