-- Monza TECH User Roles & Permissions System
-- Run this in Supabase SQL Editor

-- Prereqs
create extension if not exists "pgcrypto";

-- User profile (1:1 with auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
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

-- Roles (use slugs so your code reads cleanly)
create table if not exists public.roles (
  id text primary key,              -- e.g. 'owner','assistant','garage_manager','sales','technician','marketing','customer'
  label text not null
);

-- Permissions (fine-grained actions)
create table if not exists public.permissions (
  id text primary key               -- e.g. 'request.create','request.view_all','request.update_all','request.assign','message.send','garage.edit','pricing.view','admin.manage_users', etc.
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
  primary key (user_id, role_id)
);

create index if not exists user_roles_user_idx on public.user_roles(user_id);
create index if not exists role_permissions_role_idx on public.role_permissions(role_id);

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

grant execute on function public.has_role(text) to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.current_user_permissions() to authenticated;

-- ===== Seed roles =====
insert into public.roles (id,label) values
  ('owner','Owner'),
  ('assistant','Assistant'),
  ('garage_manager','Garage Manager'),
  ('sales','Sales'),
  ('technician','Technician'),
  ('marketing','Marketing'),
  ('customer','Customer')
on conflict (id) do nothing;

-- ===== Seed permissions (add more anytime) =====
insert into public.permissions (id) values
  ('message.send'),
  ('request.create'),
  ('request.view_all'),
  ('request.update_all'),
  ('request.assign'),
  ('inventory.view'),
  ('inventory.edit'),
  ('garage.view'),
  ('garage.edit'),
  ('sales.view'),
  ('sales.edit'),
  ('reports.view'),
  ('pricing.view'),
  ('admin.manage_users'),
  ('cars.view'),
  ('cars.edit'),
  ('orders.view'),
  ('orders.edit'),
  ('schedule.view'),
  ('schedule.edit'),
  ('financial.view'),
  ('customers.view'),
  ('customers.edit')
on conflict (id) do nothing;

-- ===== Map role → permissions (aligns with your rules) =====
-- Owner: everything
insert into public.role_permissions
select 'owner', id from public.permissions
on conflict do nothing;

-- Garage Manager
insert into public.role_permissions (role_id, permission_id) values
  ('garage_manager','message.send'),
  ('garage_manager','request.create'),
  ('garage_manager','request.view_all'),
  ('garage_manager','request.update_all'),
  ('garage_manager','request.assign'),
  ('garage_manager','inventory.view'),
  ('garage_manager','inventory.edit'),
  ('garage_manager','garage.view'),
  ('garage_manager','garage.edit'),
  ('garage_manager','reports.view'),
  ('garage_manager','cars.view'),
  ('garage_manager','cars.edit'),
  ('garage_manager','schedule.view'),
  ('garage_manager','schedule.edit'),
  ('garage_manager','customers.view')
on conflict do nothing;

-- Sales
insert into public.role_permissions (role_id, permission_id) values
  ('sales','message.send'),
  ('sales','request.create'),
  ('sales','request.view_all'),
  ('sales','sales.view'),
  ('sales','sales.edit'),
  ('sales','reports.view'),
  ('sales','cars.view'),
  ('sales','orders.view'),
  ('sales','orders.edit'),
  ('sales','customers.view'),
  ('sales','customers.edit'),
  ('sales','pricing.view')
on conflict do nothing;

-- Assistant (view/update requests but no assign, no pricing)
insert into public.role_permissions (role_id, permission_id) values
  ('assistant','message.send'),
  ('assistant','request.create'),
  ('assistant','request.view_all'),
  ('assistant','reports.view'),
  ('assistant','cars.view'),
  ('assistant','inventory.view'),
  ('assistant','garage.view'),
  ('assistant','schedule.view'),
  ('assistant','customers.view')
on conflict do nothing;

-- Technician (minimal: create requests, send messages; sees only own/assigned via RLS)
insert into public.role_permissions (role_id, permission_id) values
  ('technician','message.send'),
  ('technician','request.create'),
  ('technician','garage.view'),
  ('technician','cars.view'),
  ('technician','schedule.view'),
  ('technician','inventory.view')
on conflict do nothing;

-- Marketing
insert into public.role_permissions (role_id, permission_id) values
  ('marketing','message.send'),
  ('marketing','sales.view'),
  ('marketing','reports.view'),
  ('marketing','cars.view'),
  ('marketing','customers.view')
on conflict do nothing;

-- Customer (typically none; keep minimal if you ever expose externally)
-- No permissions granted to customer role by default

-- ===== Row Level Security Setup =====

-- Enable RLS on core tables
alter table public.user_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

-- User profiles: users can read their own, admins can read all
create policy user_profiles_select_own
  on public.user_profiles for select
  using (id = auth.uid());

create policy user_profiles_select_admin
  on public.user_profiles for select
  using (public.has_permission('admin.manage_users'));

create policy user_profiles_update_own
  on public.user_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Roles: everyone can read (for display purposes)
create policy roles_select_all
  on public.roles for select
  using (true);

-- Permissions: everyone can read (for display purposes)
create policy permissions_select_all
  on public.permissions for select
  using (true);

-- Role permissions: everyone can read (for checking permissions)
create policy role_permissions_select_all
  on public.role_permissions for select
  using (true);

-- User roles: users can see their own, admins can see/manage all
create policy user_roles_select_own
  on public.user_roles for select
  using (user_id = auth.uid());

create policy user_roles_select_admin
  on public.user_roles for select
  using (public.has_permission('admin.manage_users'));

create policy user_roles_insert_admin
  on public.user_roles for insert
  with check (public.has_permission('admin.manage_users'));

create policy user_roles_delete_admin
  on public.user_roles for delete
  using (public.has_permission('admin.manage_users'));

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on public.user_profiles to authenticated;
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant all on public.user_roles to authenticated;
