-- =============================================
-- MONZA TECH - PROFILES TABLE AND RLS IMPROVEMENTS
-- =============================================
-- This adds the missing profiles table and improves RLS policies

-- ============================
-- A. USER PROFILES
-- ============================

-- 1) Public profiles (1 row per auth user)
create table if not exists public.profiles (
  id uuid primary key,                 -- = auth.users.id
  full_name text,
  phone text,
  role text,                           -- OWNER, GARAGE_MANAGER, SALES, etc. (UI hint; keep auth claim for RLS)
  avatar_url text,
  locale text default 'en',
  timezone text default 'Asia/Beirut',
  notifications jsonb default jsonb_build_object('email', true, 'sms', false, 'push', true),
  marketing_prefs jsonb default '{}'::jsonb,
  crm_signature text,
  extra jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Touch trigger (keep updated_at fresh)
create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_profiles_updated_at();

-- 3) RLS: each user can read/update self; OWNERs can read/update all
alter table public.profiles enable row level security;

-- Select own profile or any if OWNER
create policy "profiles_select_self_or_owner"
on public.profiles
for select using (
  auth.uid() = id
  or coalesce(auth.jwt()->>'user_role','') = 'OWNER'
);

-- Insert only your own row (bootstrap on first login)
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

-- Update only your own row; OWNER can update anyone
create policy "profiles_update_self_or_owner"
on public.profiles
for update
using (
  auth.uid() = id
  or coalesce(auth.jwt()->>'user_role','') = 'OWNER'
)
with check (
  auth.uid() = id
  or coalesce(auth.jwt()->>'user_role','') = 'OWNER'
);

-- 4) Optional helper view that joins email from auth.users
create or replace view public.profile_accounts as
select p.*, au.email
from public.profiles p
join auth.users au on au.id = p.id;

-- 5) Audit log trigger for profiles
drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.log_change();

-- ============================
-- B. RLS HARDENING (IMPROVED POLICIES)
-- ============================

-- THREADS - Replace generic policies with specific ones
drop policy if exists "threads_write_roles" on public.threads;
create policy "threads_insert_auth" on public.threads
for insert with check (auth.role() = 'authenticated');
create policy "threads_update_auth" on public.threads
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "threads_delete_auth" on public.threads
for delete using (auth.role() = 'authenticated');

-- THREAD_MESSAGES
drop policy if exists "thread_messages_write_roles" on public.thread_messages;
create policy "thread_messages_insert_auth" on public.thread_messages
for insert with check (auth.role() = 'authenticated');
create policy "thread_messages_update_auth" on public.thread_messages
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "thread_messages_delete_auth" on public.thread_messages
for delete using (auth.role() = 'authenticated');

-- PDI INSPECTIONS
drop policy if exists "pdi_write_roles" on public.pdi_inspections;
create policy "pdi_insert_auth" on public.pdi_inspections
for insert with check (auth.role() = 'authenticated');
create policy "pdi_update_auth" on public.pdi_inspections
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "pdi_delete_auth" on public.pdi_inspections
for delete using (auth.role() = 'authenticated');

-- TEST_DRIVES
drop policy if exists "test_drives_write_roles" on public.test_drives;
create policy "test_drives_insert_auth" on public.test_drives
for insert with check (auth.role() = 'authenticated');
create policy "test_drives_update_auth" on public.test_drives
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "test_drives_delete_auth" on public.test_drives
for delete using (auth.role() = 'authenticated');

-- FINANCIAL_ENTRIES
drop policy if exists "financial_write_roles" on public.financial_entries;
create policy "financial_insert_auth" on public.financial_entries
for insert with check (auth.role() = 'authenticated');
create policy "financial_update_auth" on public.financial_entries
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "financial_delete_auth" on public.financial_entries
for delete using (auth.role() = 'authenticated');

-- CRM_CONTACTS
drop policy if exists "crm_contacts_write_roles" on public.crm_contacts;
create policy "crm_contacts_insert_auth" on public.crm_contacts
for insert with check (auth.role() = 'authenticated');
create policy "crm_contacts_update_auth" on public.crm_contacts
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "crm_contacts_delete_auth" on public.crm_contacts
for delete using (auth.role() = 'authenticated');

-- CRM_INTERACTIONS
drop policy if exists "crm_interactions_write_roles" on public.crm_interactions;
create policy "crm_interactions_insert_auth" on public.crm_interactions
for insert with check (auth.role() = 'authenticated');
create policy "crm_interactions_update_auth" on public.crm_interactions
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "crm_interactions_delete_auth" on public.crm_interactions
for delete using (auth.role() = 'authenticated');

-- MARKETING_ACTIVITIES
drop policy if exists "marketing_write_roles" on public.marketing_activities;
create policy "marketing_insert_auth" on public.marketing_activities
for insert with check (auth.role() = 'authenticated');
create policy "marketing_update_auth" on public.marketing_activities
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "marketing_delete_auth" on public.marketing_activities
for delete using (auth.role() = 'authenticated');

-- BUSINESS_CALENDAR
drop policy if exists "calendar_write_roles" on public.business_calendar;
create policy "calendar_insert_auth" on public.business_calendar
for insert with check (auth.role() = 'authenticated');
create policy "calendar_update_auth" on public.business_calendar
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "calendar_delete_auth" on public.business_calendar
for delete using (auth.role() = 'authenticated');

-- ============================
-- C. SAMPLE PROFILE DATA
-- ============================
-- Insert sample profiles (replace with actual user IDs)
insert into public.profiles (id, full_name, phone, role, locale, timezone) values
-- Replace these UUIDs with actual auth.users IDs from your project
('00000000-0000-0000-0000-000000000001', 'Houssam (Owner)', '+961-70-123456', 'OWNER', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000002', 'Samer (Owner)', '+961-70-123457', 'OWNER', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000003', 'Kareem (Owner)', '+961-70-123458', 'OWNER', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000004', 'Mark (Garage Manager)', '+961-70-123459', 'GARAGE_MANAGER', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000005', 'Lara (Assistant)', '+961-70-123460', 'ASSISTANT', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000006', 'Samaya (Assistant)', '+961-70-123461', 'ASSISTANT', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000007', 'Khalil (Hybrid)', '+961-70-123462', 'SALES', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000008', 'Tamara (Hybrid)', '+961-70-123463', 'SALES', 'en', 'Asia/Beirut'),
('00000000-0000-0000-0000-000000000009', 'Elie (Hybrid)', '+961-70-123464', 'TECHNICIAN', 'en', 'Asia/Beirut')
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  locale = excluded.locale,
  timezone = excluded.timezone,
  updated_at = now();

-- ============================
-- D. PERFORMANCE INDEXES
-- ============================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_created_at on public.profiles(created_at);

-- ============================
-- PROFILES UPDATE COMPLETE
-- ============================
-- ✅ Profiles table with proper RLS
-- ✅ Improved RLS policies for all tables
-- ✅ Audit logging for profiles
-- ✅ Sample profile data
-- ✅ Performance indexes
