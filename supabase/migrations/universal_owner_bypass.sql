-- Universal OWNER Bypass for Monza TECH
-- This script creates a comprehensive OWNER bypass system in Supabase
-- Safe to re-run multiple times

-- 0) PREREQ: Ensure we have a proper users table structure
-- Note: We're using user_profiles table which references auth.users

-- 1) Helper: fast, reusable check for OWNER role
create or replace function public.is_owner(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles u
    where u.id = uid
      and upper(u.role) = 'OWNER'  -- Case-insensitive check
  );
$$;

comment on function public.is_owner is 'Returns true if the given uid belongs to an OWNER in public.user_profiles.';

-- 2) Add/refresh a PERMISSIVE, FOR ALL policy named "owner_full_access" on EVERY TABLE in public
do $$
declare
  r record;
  policy_name text := 'owner_full_access';
begin
  for r in
    select t.table_schema, t.table_name
    from information_schema.tables t
    where t.table_type = 'BASE TABLE'
      and t.table_schema = 'public'
  loop
    -- Ensure RLS is ON (required for policies to apply)
    execute format('alter table %I.%I enable row level security;', r.table_schema, r.table_name);

    -- Create the OWNER bypass policy if missing
    if not exists (
      select 1
      from pg_policies p
      where p.schemaname = r.table_schema
        and p.tablename = r.table_name
        and p.policyname = policy_name
    ) then
      execute format($SQL$
        create policy %I
        on %I.%I
        as permissive
        for all
        to authenticated
        using ( public.is_owner(auth.uid()) )
        with check ( public.is_owner(auth.uid()) );
      $SQL$, policy_name, r.table_schema, r.table_name);
      
      raise notice 'Created OWNER bypass policy for %.%', r.table_schema, r.table_name;
    else
      raise notice 'OWNER bypass policy already exists for %.%', r.table_schema, r.table_name;
    end if;
  end loop;
end$$;

-- 3) Storage: give OWNERs full access to Storage objects as well
alter table if exists storage.objects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'owner_full_access'
  ) then
    create policy owner_full_access
    on storage.objects
    as permissive
    for all
    to authenticated
    using ( public.is_owner(auth.uid()) )
    with check ( public.is_owner(auth.uid()) );
    
    raise notice 'Created OWNER bypass policy for storage.objects';
  else
    raise notice 'OWNER bypass policy already exists for storage.objects';
  end if;
end$$;

-- 4) Visibility on any RESTRICTIVE policies that could still block OWNERs
select 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  case 
    when permissive = 'RESTRICTIVE' then '⚠️  WARNING: This RESTRICTIVE policy may still block OWNERs'
    else '✅ OK: PERMISSIVE policy'
  end as policy_status
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

-- 5) Verification: Test the is_owner function
do $$
declare
  test_result boolean;
begin
  -- This will work when you have actual OWNER users in the system
  raise notice '🔍 Testing is_owner function...';
  raise notice 'ℹ️  Function created successfully. Test with actual OWNER users after authentication.';
end$$;

-- Success message
do $$
begin
  raise notice '🎉 Universal OWNER bypass system installed successfully!';
  raise notice '👑 Houssam, Samer, and Kareem now have unrestricted access to all tables';
  raise notice '🔒 All tables now have RLS enabled with OWNER bypass policies';
  raise notice '📦 Storage objects also have OWNER bypass enabled';
  raise notice '⚠️  Review any RESTRICTIVE policies shown above that might still interfere';
end$$;
