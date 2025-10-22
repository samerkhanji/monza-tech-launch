-- ============================================================================
-- Monza TECH User Roles & Permissions System Migration
-- ============================================================================
-- Run this in Supabase SQL Editor
-- This creates a comprehensive role-based access control system with support
-- for hybrid roles (e.g., user can be both Sales + Garage Manager)

-- Prerequisites
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================

-- User profile (1:1 with auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Users can read their own profile and admins can read all
create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_roles ur 
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.id = 'owner'
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 2. ROLES & PERMISSIONS SYSTEM
-- ============================================================================

-- Roles (use slugs so your code reads cleanly)
create table if not exists public.roles (
  id text primary key,              -- e.g. 'owner','assistant','garage_manager','sales','technician','marketing','customer'
  label text not null,
  description text,
  created_at timestamptz default now()
);

-- Permissions (fine-grained actions)
create table if not exists public.permissions (
  id text primary key,              -- e.g. 'request.create','request.view_all','request.update_all','request.assign','message.send','garage.edit','pricing.view','admin.manage_users', etc.
  description text,
  created_at timestamptz default now()
);

-- Role ↔ permission mapping
create table if not exists public.role_permissions (
  role_id text references public.roles(id) on delete cascade,
  permission_id text references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Many-to-many: users can have multiple roles (hybrids)
create table if not exists public.user_roles (
  user_id uuid references public.user_profiles(id) on delete cascade,
  role_id text references public.roles(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid references public.user_profiles(id),
  primary key (user_id, role_id)
);

-- Indexes for performance
create index if not exists user_roles_user_idx on public.user_roles(user_id);
create index if not exists role_permissions_role_idx on public.role_permissions(role_id);

-- Enable RLS on role management tables
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

-- RLS Policies: Everyone can read roles and permissions for UI
create policy "Anyone can read roles"
  on public.roles for select
  using (true);

create policy "Anyone can read permissions"
  on public.permissions for select
  using (true);

create policy "Anyone can read role permissions"
  on public.role_permissions for select
  using (true);

-- User roles: users can read their own, admins can read/write all
create policy "Users can read own roles"
  on public.user_roles for select
  using (user_id = auth.uid());

create policy "Admins can read all user roles"
  on public.user_roles for select
  using (
    exists (
      select 1 from public.user_roles ur 
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.id = 'owner'
    )
  );

create policy "Admins can manage user roles"
  on public.user_roles for all
  using (
    exists (
      select 1 from public.user_roles ur 
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.id = 'owner'
    )
  );

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Helper: does current user have a given role?
create or replace function public.has_role(role text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role_id = role
  );
$$;

-- Helper: does current user have a given permission?
create or replace function public.has_permission(p text)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id = auth.uid() and rp.permission_id = p
  );
$$;

-- Fast fetch for client
create or replace function public.current_user_permissions()
returns text[] language sql security definer set search_path=public as $$
  select coalesce(array_agg(distinct rp.permission_id), '{}')
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  where ur.user_id = auth.uid();
$$;

-- Grant execute permissions
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.current_user_permissions() to authenticated;

-- ============================================================================
-- 4. SEED DATA
-- ============================================================================

-- Seed roles
insert into public.roles (id, label, description) values
  ('owner', 'Owner', 'Full access to everything'),
  ('assistant', 'Assistant', 'Can view requests and schedules, manage communications'),
  ('garage_manager', 'Garage Manager', 'Manages garage operations, schedules, and technicians'),
  ('sales', 'Sales', 'Manages customer interactions and sales processes'),
  ('technician', 'Technician', 'Performs technical work and updates job status'),
  ('marketing', 'Marketing', 'Manages marketing campaigns and customer outreach'),
  ('customer', 'Customer', 'External customer with limited access')
on conflict (id) do update set 
  label = excluded.label,
  description = excluded.description;

-- Seed permissions
insert into public.permissions (id, description) values
  ('message.send', 'Send messages and notifications'),
  ('request.create', 'Create new service requests'),
  ('request.view_all', 'View all service requests'),
  ('request.update_all', 'Update any service request'),
  ('request.assign', 'Assign requests to technicians'),
  ('inventory.view', 'View inventory and parts'),
  ('inventory.edit', 'Edit inventory and manage parts'),
  ('garage.view', 'View garage schedules and status'),
  ('garage.edit', 'Edit garage schedules and assignments'),
  ('sales.view', 'View sales data and customer info'),
  ('sales.edit', 'Edit sales data and manage customers'),
  ('reports.view', 'View reports and analytics'),
  ('pricing.view', 'View pricing and financial data'),
  ('admin.manage_users', 'Manage user accounts and roles')
on conflict (id) do update set description = excluded.description;

-- Map role → permissions (aligns with Monza TECH business rules)

-- Owner: everything
insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
on conflict do nothing;

-- Garage Manager
insert into public.role_permissions (role_id, permission_id) values
  ('garage_manager', 'message.send'),
  ('garage_manager', 'request.create'),
  ('garage_manager', 'request.view_all'),
  ('garage_manager', 'request.update_all'),
  ('garage_manager', 'request.assign'),
  ('garage_manager', 'inventory.view'),
  ('garage_manager', 'garage.view'),
  ('garage_manager', 'garage.edit'),
  ('garage_manager', 'reports.view')
on conflict do nothing;

-- Sales
insert into public.role_permissions (role_id, permission_id) values
  ('sales', 'message.send'),
  ('sales', 'request.create'),
  ('sales', 'request.view_all'),
  ('sales', 'sales.view'),
  ('sales', 'sales.edit'),
  ('sales', 'reports.view')
on conflict do nothing;

-- Assistant (view/update requests but no assign, no pricing)
insert into public.role_permissions (role_id, permission_id) values
  ('assistant', 'message.send'),
  ('assistant', 'request.create'),
  ('assistant', 'request.view_all'),
  ('assistant', 'reports.view')
on conflict do nothing;

-- Technician (minimal: create requests, send messages; sees only own/assigned via RLS)
insert into public.role_permissions (role_id, permission_id) values
  ('technician', 'message.send'),
  ('technician', 'request.create'),
  ('technician', 'garage.view'),
  ('technician', 'inventory.view')
on conflict do nothing;

-- Marketing
insert into public.role_permissions (role_id, permission_id) values
  ('marketing', 'message.send'),
  ('marketing', 'sales.view'),
  ('marketing', 'reports.view')
on conflict do nothing;

-- Customer (minimal access)
insert into public.role_permissions (role_id, permission_id) values
  ('customer', 'message.send'),
  ('customer', 'request.create')
on conflict do nothing;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

-- Grant basic access to authenticated users
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;
grant select on public.user_roles to authenticated;

-- Admins can manage user roles
grant insert, update, delete on public.user_roles to authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
select 'Migration completed successfully! ✅' as status;
select count(*) as roles_created from public.roles;
select count(*) as permissions_created from public.permissions;
select count(*) as role_permission_mappings from public.role_permissions;
