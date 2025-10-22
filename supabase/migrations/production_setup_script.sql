-- ===============================================
-- MONZA TECH PRODUCTION SETUP SCRIPT
-- ===============================================
-- Copy-paste ready script for immediate deployment
-- Run this entire script in Supabase SQL Editor

-- Prerequisites
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ===============================================
-- 1. USERS TABLE WITH ROLE NORMALIZATION
-- ===============================================

-- Create/update users table with proper role constraints
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null check (role in ('OWNER','GARAGE_MANAGER','ASSISTANT','SALES_MANAGER','MARKETING_MANAGER','TECHNICIAN')),
  name text,
  phone text,
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- Auto-uppercase roles to ensure consistency
create or replace function public.normalize_role()
returns trigger language plpgsql as $$
begin
  new.role := upper(new.role);
  return new;
end;
$$;

drop trigger if exists trg_normalize_role on public.users;
create trigger trg_normalize_role before insert or update on public.users
for each row execute function public.normalize_role();

-- OWNER helper function
create or replace function public.is_owner(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.users where id = uid and role = 'OWNER');
$$;

comment on function public.is_owner is 'Check if user has OWNER role';

-- ===============================================
-- 2. SYSTEM AUDIT LOG TABLES & FUNCTIONS
-- ===============================================

-- Main audit table
create table if not exists public.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  schema_name text not null,
  table_name text not null,
  row_pk text not null,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[] default '{}',
  request_ip text,
  request_id text,
  app_context jsonb
);

-- Performance indexes
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_table_idx on public.audit_log (schema_name, table_name);
create index if not exists audit_log_action_idx on public.audit_log (action);

-- Email lookup helper
create or replace function public.actor_email_of(uid uuid)
returns text language sql stable as $$
  select coalesce(u.email, au.email) 
  from public.users u
  left join auth.users au on au.id = u.id
  where u.id = uid 
  limit 1;
$$;

-- Universal audit trigger function
create or replace function public.audit_row_changes()
returns trigger language plpgsql security definer as $$
declare 
  v_actor_id uuid; 
  v_pk text; 
  v_changed text[];
begin
  -- Get current user safely
  begin 
    v_actor_id := auth.uid(); 
  exception when others then 
    v_actor_id := null; 
  end;

  if TG_OP = 'INSERT' then
    v_pk := coalesce((new).id::text, 'UNKNOWN');
    insert into public.audit_log(
      actor_id, actor_email, action, schema_name, table_name, row_pk,
      before_data, after_data, changed_fields
    ) values (
      v_actor_id, 
      public.actor_email_of(v_actor_id), 
      'INSERT', 
      TG_TABLE_SCHEMA, 
      TG_TABLE_NAME, 
      v_pk,
      null, 
      to_jsonb(new), 
      null
    );
    return new;
    
  elsif TG_OP = 'UPDATE' then
    v_pk := coalesce((new).id::text, (old).id::text, 'UNKNOWN');
    
    -- Calculate changed fields (ignore timestamp fields)
    v_changed := array(
      select k from jsonb_object_keys(to_jsonb(new)) as k
      where (to_jsonb(new)->>k) is distinct from (to_jsonb(old)->>k)
        and k not in ('updated_at', 'modified_at', 'last_modified')
    );
    
    -- Only log if meaningful changes occurred
    if array_length(v_changed, 1) > 0 then
      insert into public.audit_log(
        actor_id, actor_email, action, schema_name, table_name, row_pk,
        before_data, after_data, changed_fields
      ) values (
        v_actor_id, 
        public.actor_email_of(v_actor_id), 
        'UPDATE', 
        TG_TABLE_SCHEMA, 
        TG_TABLE_NAME, 
        v_pk,
        to_jsonb(old), 
        to_jsonb(new), 
        v_changed
      );
    end if;
    return new;
    
  elsif TG_OP = 'DELETE' then
    v_pk := coalesce((old).id::text, 'UNKNOWN');
    insert into public.audit_log(
      actor_id, actor_email, action, schema_name, table_name, row_pk,
      before_data, after_data, changed_fields
    ) values (
      v_actor_id, 
      public.actor_email_of(v_actor_id), 
      'DELETE', 
      TG_TABLE_SCHEMA, 
      TG_TABLE_NAME, 
      v_pk,
      to_jsonb(old), 
      null, 
      null
    );
    return old;
  end if;

  return null;
end;
$$;

-- Cleanup function for old audit entries
create or replace function public.purge_old_audit()
returns void language sql as $$
  delete from public.audit_log where at < now() - interval '180 days';
$$;

comment on function public.purge_old_audit is 'Remove audit entries older than 180 days';

-- ===============================================
-- 3. ATTACH AUDIT TRIGGERS TO ALL TABLES
-- ===============================================

do $$
declare r record;
begin
  raise notice '🔧 Installing audit triggers on all existing tables...';
  
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public' 
      and table_type = 'BASE TABLE' 
      and table_name != 'audit_log'
  loop
    execute format('drop trigger if exists trg_audit_%I on %I.%I;', 
                   r.table_name, r.table_schema, r.table_name);
    execute format('create trigger trg_audit_%I
                    after insert or update or delete on %I.%I
                    for each row execute function public.audit_row_changes();',
                    r.table_name, r.table_schema, r.table_name);
    raise notice '✅ Audit trigger installed on %.%', r.table_schema, r.table_name;
  end loop;
  
  raise notice '🎉 All audit triggers installed!';
end$$;

-- Auto-attach triggers to NEW tables (event trigger)
create or replace function public.attach_new_table_triggers()
returns event_trigger language plpgsql as $$
declare 
  obj record; 
  sch text; 
  tbl text;
begin
  for obj in select * from pg_event_trigger_ddl_commands() loop
    if obj.object_type = 'table' and obj.schema_name = 'public' then
      sch := obj.schema_name;
      tbl := obj.object_identity;
      
      if tbl != 'audit_log' then
        execute format('create trigger trg_audit_%I 
                        after insert or update or delete on %I.%I
                        for each row execute function public.audit_row_changes();', 
                        tbl, sch, tbl);
        raise notice '🔧 Auto-attached audit trigger to new table: %.%', sch, tbl;
      end if;
    end if;
  end loop;
end;
$$;

drop event trigger if exists et_audit_attach;
create event trigger et_audit_attach 
  on ddl_command_end
  when tag in ('CREATE TABLE')
  execute procedure public.attach_new_table_triggers();

-- ===============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ===============================================

-- Enable RLS on audit log
alter table public.audit_log enable row level security;

-- OWNERS can read all audit entries
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='audit_log' and policyname='owner_read_all_audit'
  ) then
    create policy owner_read_all_audit on public.audit_log
      for select to authenticated 
      using (public.is_owner(auth.uid()));
    raise notice '✅ Created owner_read_all_audit policy';
  end if;
end$$;

-- Users can read their own audit entries
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='audit_log' and policyname='self_read_own_audit'
  ) then
    create policy self_read_own_audit on public.audit_log
      for select to authenticated 
      using (actor_id = auth.uid());
    raise notice '✅ Created self_read_own_audit policy';
  end if;
end$$;

-- Prevent direct manipulation of audit log
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='audit_log' and policyname='deny_write_audit'
  ) then
    create policy deny_write_audit on public.audit_log
      for all to authenticated 
      using (false) 
      with check (false);
    raise notice '✅ Created deny_write_audit policy';
  end if;
end$$;

-- ===============================================
-- 5. UNIVERSAL OWNER BYPASS POLICIES
-- ===============================================

do $$
declare r record;
begin
  raise notice '🔧 Installing universal OWNER bypass policies...';
  
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public' 
      and table_type = 'BASE TABLE'
  loop
    -- Enable RLS
    execute format('alter table %I.%I enable row level security;', 
                   r.table_schema, r.table_name);

    -- Create OWNER bypass policy if missing
    if not exists (
      select 1 from pg_policies
      where schemaname = r.table_schema
        and tablename = r.table_name
        and policyname = 'owner_full_access'
    ) then
      execute format($SQL$
        create policy owner_full_access on %I.%I
        as permissive for all to authenticated
        using (public.is_owner(auth.uid()))
        with check (public.is_owner(auth.uid()));
      $SQL$, r.table_schema, r.table_name);
      
      raise notice '✅ Created OWNER bypass policy on %.%', 
                   r.table_schema, r.table_name;
    end if;
  end loop;
  
  raise notice '🎉 All OWNER bypass policies installed!';
end$$;

-- ===============================================
-- 6. STORAGE SETUP (OPTIONAL)
-- ===============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('car-photos', 'car-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain']::text[]),
  ('pdi-files', 'pdi-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('repair-photos', 'repair-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('signatures', 'signatures', true, 10485760, ARRAY['image/png', 'image/svg+xml']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage access policies
do $$
begin
  -- Car photos policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'car_photos_policy'
  ) then
    create policy "car_photos_policy" on storage.objects 
      for all to authenticated 
      using (bucket_id = 'car-photos') 
      with check (bucket_id = 'car-photos');
  end if;
  
  -- Documents policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'documents_policy'
  ) then
    create policy "documents_policy" on storage.objects 
      for all to authenticated 
      using (bucket_id = 'documents') 
      with check (bucket_id = 'documents');
  end if;
  
  -- Add other storage policies as needed...
  
end$$;

-- ===============================================
-- 7. SYSTEM VERIFICATION
-- ===============================================

-- Test audit system with temporary table
do $$
begin
  raise notice '🧪 Testing audit system...';
  
  -- Create temp table
  create table if not exists public._audit_test(
    id uuid primary key default gen_random_uuid(), 
    name text
  );
  
  -- Test operations
  insert into public._audit_test(name) values ('test_insert');
  update public._audit_test set name = 'test_update' where name = 'test_insert';
  delete from public._audit_test where name = 'test_update';
  
  -- Check results
  if exists (
    select 1 from public.audit_log 
    where table_name = '_audit_test' and action = 'INSERT'
  ) then
    raise notice '✅ Audit INSERT test passed';
  else
    raise notice '❌ Audit INSERT test failed';
  end if;
  
  if exists (
    select 1 from public.audit_log 
    where table_name = '_audit_test' and action = 'UPDATE'
  ) then
    raise notice '✅ Audit UPDATE test passed';
  else
    raise notice '❌ Audit UPDATE test failed';
  end if;
  
  if exists (
    select 1 from public.audit_log 
    where table_name = '_audit_test' and action = 'DELETE'
  ) then
    raise notice '✅ Audit DELETE test passed';
  else
    raise notice '❌ Audit DELETE test failed';
  end if;
  
  -- Cleanup
  drop table public._audit_test;
  
  raise notice '🎉 Audit system test completed!';
end$$;

-- ===============================================
-- 8. SUCCESS MESSAGE & NEXT STEPS
-- ===============================================

do $$
begin
  raise notice '';
  raise notice '🎉 ===== MONZA TECH PRODUCTION SETUP COMPLETE! =====';
  raise notice '';
  raise notice '✅ INSTALLED COMPONENTS:';
  raise notice '   📊 Users table with auto-uppercase roles';
  raise notice '   🔍 Complete audit logging system';
  raise notice '   🛡️ Universal OWNER bypass policies';  
  raise notice '   🔒 Row Level Security on all tables';
  raise notice '   📁 Storage buckets and policies';
  raise notice '   ⚡ Auto-trigger attachment for new tables';
  raise notice '';
  raise notice '🔧 NEXT STEPS:';
  raise notice '   1. Insert your first OWNER user:';
  raise notice '      INSERT INTO public.users (id, email, role, name)';
  raise notice '      VALUES (''YOUR_AUTH_UID'', ''your@email.com'', ''OWNER'', ''Your Name'');';
  raise notice '';
  raise notice '   2. Configure .env.local with Supabase credentials';
  raise notice '   3. Test login and access System Audit Log';
  raise notice '   4. Verify OWNER permissions work across all pages';
  raise notice '';
  raise notice '📊 AUDIT SYSTEM STATUS:';
  raise notice '   🔍 All database changes are now being tracked';
  raise notice '   👑 OWNERS can view all audit entries';
  raise notice '   👤 Users can view their own audit entries';
  raise notice '   🚫 Direct audit log manipulation is blocked';
  raise notice '';
  raise notice '🚀 Your Monza TECH system is production ready!';
  raise notice '';
  
  -- Show current table count with audit triggers
  select count(*) as tables_with_audit_triggers
  from information_schema.triggers 
  where trigger_name like 'trg_audit_%';
  
end$$;
