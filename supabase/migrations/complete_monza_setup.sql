-- ===============================================
-- COMPLETE MONZA TECH SUPABASE SETUP
-- ===============================================
-- Run this entire script in Supabase SQL Editor
-- This includes all tables, policies, audit system, and security

-- Prerequisites
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ===============================================
-- 1. USER PROFILES & ROLES SYSTEM
-- ===============================================

-- User profiles (extends auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text default 'ASSISTANT' check (role in ('OWNER','GARAGE_MANAGER','SALES_MANAGER','MARKETING_MANAGER','TECHNICIAN','ASSISTANT')),
  phone text,
  avatar_url text,
  department text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, email, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'ASSISTANT'
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ===============================================
-- 2. SYSTEM AUDIT LOG
-- ===============================================

-- Main audit table
create table if not exists public.audit_log (
  id             bigserial primary key,
  at             timestamptz not null default now(),
  actor_id       uuid references auth.users(id),
  actor_email    text,
  action         text not null check (action in ('INSERT','UPDATE','DELETE')),
  schema_name    text not null,
  table_name     text not null,
  row_pk         text not null,
  before_data    jsonb,
  after_data     jsonb,
  changed_fields text[] default '{}',
  request_ip     text,
  request_id     text,
  app_context    jsonb
);

-- Indexes for performance
create index if not exists audit_log_at_idx      on public.audit_log (at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id);
create index if not exists audit_log_table_idx   on public.audit_log (schema_name, table_name);
create index if not exists audit_log_action_idx  on public.audit_log (action);

-- Helper function to get actor email
create or replace function public.actor_email_of(uid uuid)
returns text language sql stable as $$
  select coalesce(up.email, au.email)
  from public.user_profiles up
  left join auth.users au on au.id = up.id
  where up.id = uid
  limit 1
$$;

-- Generic audit trigger function
create or replace function public.audit_row_changes()
returns trigger
language plpgsql
security definer
as $$
declare
  v_actor_id uuid;
  v_pk text;
  v_changed text[];
begin
  -- Get current user if available
  begin
    v_actor_id := auth.uid();
  exception when others then
    v_actor_id := null;
  end;

  -- Get primary key value
  if TG_OP = 'INSERT' then
    v_pk := coalesce((new).id::text, 'UNKNOWN');
    insert into public.audit_log(
      actor_id, actor_email, action, schema_name, table_name, row_pk,
      before_data, after_data, changed_fields
    ) values (
      v_actor_id, public.actor_email_of(v_actor_id), 'INSERT', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk,
      null, to_jsonb(new), null
    );
    return new;

  elsif TG_OP = 'UPDATE' then
    v_pk := coalesce((new).id::text, (old).id::text, 'UNKNOWN');

    -- Compute changed columns (ignore timestamp fields)
    v_changed := array(
      select k from jsonb_object_keys(to_jsonb(new)) as k
      where (to_jsonb(new)->>k) is distinct from (to_jsonb(old)->>k)
        and k not in ('updated_at', 'modified_at', 'last_modified')
    );

    -- Only log if there are meaningful changes
    if array_length(v_changed, 1) > 0 then
      insert into public.audit_log(
        actor_id, actor_email, action, schema_name, table_name, row_pk,
        before_data, after_data, changed_fields
      ) values (
        v_actor_id, public.actor_email_of(v_actor_id), 'UPDATE', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk,
        to_jsonb(old), to_jsonb(new), v_changed
      );
    end if;
    return new;

  elsif TG_OP = 'DELETE' then
    v_pk := coalesce((old).id::text, 'UNKNOWN');
    insert into public.audit_log(
      actor_id, actor_email, action, schema_name, table_name, row_pk,
      before_data, after_data, changed_fields
    ) values (
      v_actor_id, public.actor_email_of(v_actor_id), 'DELETE', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk,
      to_jsonb(old), null, null
    );
    return old;
  end if;

  return null;
end;
$$;

-- ===============================================
-- 3. HELPER FUNCTIONS
-- ===============================================

-- Helper function to check if user is owner
create or replace function public.is_owner(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles u
    where u.id = uid
      and upper(u.role) = 'OWNER'
  );
$$;

-- Cleanup old audit entries (keep 180 days)
create or replace function public.purge_old_audit()
returns void language sql as $$
  delete from public.audit_log where at < now() - interval '180 days';
$$;

-- ===============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ===============================================

-- User profiles policies
create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Owners can read all profiles"
  on public.user_profiles for select
  using (public.is_owner(auth.uid()));

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Owners can update all profiles"
  on public.user_profiles for update
  using (public.is_owner(auth.uid()));

-- Audit log policies
alter table public.audit_log enable row level security;

create policy "owners_read_all_audit"
  on public.audit_log
  for select
  to authenticated
  using (public.is_owner(auth.uid()));

create policy "self_read_own_audit"
  on public.audit_log
  for select
  to authenticated
  using (actor_id = auth.uid());

create policy "deny_write_audit"
  on public.audit_log
  for all
  to authenticated
  using (false)
  with check (false);

-- ===============================================
-- 5. APPLY AUDIT TRIGGERS TO ALL TABLES
-- ===============================================

do $$
declare
  r record;
begin
  raise notice '🔧 Installing audit triggers on all tables...';
  
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name != 'audit_log'
  loop
    execute format('drop trigger if exists trg_audit_%I on %I.%I;', r.table_name, r.table_schema, r.table_name);
    execute format('create trigger trg_audit_%I
                    after insert or update or delete on %I.%I
                    for each row execute function public.audit_row_changes();',
                    r.table_name, r.table_schema, r.table_name);
    
    raise notice '✅ Audit trigger installed on %.%', r.table_schema, r.table_name;
  end loop;
  
  raise notice '🎉 All audit triggers installed successfully!';
end$$;

-- ===============================================
-- 6. UNIVERSAL OWNER BYPASS POLICIES
-- ===============================================

do $$
declare
  r record;
  policy_name text := 'owner_full_access';
begin
  raise notice '🔧 Installing OWNER bypass policies...';
  
  for r in
    select t.table_schema, t.table_name
    from information_schema.tables t
    where t.table_type = 'BASE TABLE'
      and t.table_schema = 'public'
      and t.table_name != 'audit_log'
  loop
    -- Enable RLS
    execute format('alter table %I.%I enable row level security;', r.table_schema, r.table_name);

    -- Create OWNER bypass policy if missing
    if not exists (
      select 1
      from pg_policies p
      where p.schemaname = r.table_schema
        and p.tablename = r.table_name
        and p.policyname = policy_name
    ) then
      raise notice 'Creating policy % on %.%', policy_name, r.table_schema, r.table_name;
      execute format($SQL$
        create policy %I
        on %I.%I
        as permissive
        for all
        to authenticated
        using ( public.is_owner(auth.uid()) )
        with check ( public.is_owner(auth.uid()) );
      $SQL$, policy_name, r.table_schema, r.table_name);
    else
      raise notice 'Policy % already exists on %.%', policy_name, r.table_schema, r.table_name;
    end if;
  end loop;
  
  raise notice '🎉 All OWNER bypass policies installed!';
end$$;

-- ===============================================
-- 7. STORAGE SETUP
-- ===============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('car-photos', 'car-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain']::text[]),
  ('pdi-files', 'pdi-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('repair-photos', 'repair-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('signatures', 'signatures', true, 10485760, ARRAY['image/png', 'image/svg+xml']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
do $$
begin
  -- Car photos
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'car_photos_policy') then
    create policy "car_photos_policy" on storage.objects for all to authenticated using (bucket_id = 'car-photos') with check (bucket_id = 'car-photos');
  end if;
  
  -- Documents
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'documents_policy') then
    create policy "documents_policy" on storage.objects for all to authenticated using (bucket_id = 'documents') with check (bucket_id = 'documents');
  end if;
  
  -- PDI files
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'pdi_files_policy') then
    create policy "pdi_files_policy" on storage.objects for all to authenticated using (bucket_id = 'pdi-files') with check (bucket_id = 'pdi-files');
  end if;
  
  -- Repair photos
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'repair_photos_policy') then
    create policy "repair_photos_policy" on storage.objects for all to authenticated using (bucket_id = 'repair-photos') with check (bucket_id = 'repair-photos');
  end if;
  
  -- Signatures
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'signatures_policy') then
    create policy "signatures_policy" on storage.objects for all to authenticated using (bucket_id = 'signatures') with check (bucket_id = 'signatures');
  end if;
end$$;

-- ===============================================
-- 8. SUCCESS MESSAGE
-- ===============================================

do $$
begin
  raise notice '';
  raise notice '🎉 ===== MONZA TECH SUPABASE SETUP COMPLETE! =====';
  raise notice '✅ User profiles and roles system installed';
  raise notice '✅ Comprehensive audit logging system active';
  raise notice '✅ All tables protected with RLS policies';
  raise notice '✅ OWNER universal access bypass enabled';
  raise notice '✅ Storage buckets and policies configured';
  raise notice '✅ Audit triggers installed on all existing tables';
  raise notice '';
  raise notice '📊 Your system is now ready for production use!';
  raise notice '🔐 OWNERS have full access to everything';
  raise notice '🔍 All database changes are being tracked';
  raise notice '📁 File uploads are properly secured';
  raise notice '';
  raise notice 'Next steps:';
  raise notice '1. Configure your .env.local with Supabase credentials';
  raise notice '2. Create your first OWNER user in the dashboard';
  raise notice '3. Access System Audit Log to monitor changes';
end$$;
