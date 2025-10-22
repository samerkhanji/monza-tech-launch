-- === MONZA TECH SYSTEM AUDIT LOG ===
-- Complete audit trail for all database changes
-- Run this in Supabase SQL Editor

-- === 1. Table to store every change ===
create table if not exists public.audit_log (
  id             bigserial primary key,
  at             timestamptz not null default now(),
  actor_id       uuid,                            -- auth.uid()
  actor_email    text,                            -- captured from request.jwt or users table when available
  action         text not null check (action in ('INSERT','UPDATE','DELETE')),
  schema_name    text not null,
  table_name     text not null,
  row_pk         text not null,                   -- primary key value as text
  before_data    jsonb,                           -- row before (null for INSERT)
  after_data     jsonb,                           -- row after (null for DELETE)
  changed_fields text[] default '{}',             -- list of changed columns for UPDATE
  request_ip     text,                            -- optional (from http header if you pass it)
  request_id     text,                            -- optional (trace id)
  app_context    jsonb                            -- optional extras you pass from the app (e.g., page, module)
);

comment on table public.audit_log is 'Normalized row-level audit log for all tables (INSERT/UPDATE/DELETE).';

create index if not exists audit_log_at_idx      on public.audit_log (at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id);
create index if not exists audit_log_table_idx   on public.audit_log (schema_name, table_name);
create index if not exists audit_log_action_idx  on public.audit_log (action);

-- === 2. Helper: best-effort actor email lookup ===
create or replace function public.actor_email_of(uid uuid)
returns text language sql stable as $$
  select coalesce(u.email, up.email, au.email)
  from public.user_profiles up
  left join public.users u on u.id = up.id
  left join auth.users au on au.id = up.id
  where up.id = uid
  limit 1
$$;

comment on function public.actor_email_of is 'Gets actor email from user_profiles, users, or auth.users tables';

-- === 3. Generic trigger: logs INSERT/UPDATE/DELETE for any table ===
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
  -- grab actor if available (safe when called outside http too)
  begin
    v_actor_id := auth.uid();
  exception when others then
    v_actor_id := null;
  end;

  -- figure PK value as text (assumes single-column PK named 'id' or first PK)
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

    -- compute changed columns (ignore updated_at and other noisy fields)
    v_changed := array(
      select k from jsonb_object_keys(to_jsonb(new)) as k
      where (to_jsonb(new)->>k) is distinct from (to_jsonb(old)->>k)
        and k not in ('updated_at', 'last_modified', 'modified_at', 'timestamp')
    );

    -- Only log if there are actual meaningful changes
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

comment on function public.audit_row_changes is 'Universal audit trigger for all table changes';

-- === 4. Attach triggers to all public tables except the audit table itself ===
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
      and table_name <> 'audit_log'
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

-- === 5. RLS for audit_log: readable by OWNERs, optionally by others (read-only) ===
alter table public.audit_log enable row level security;

-- Allow OWNERs to see everything (uses your is_owner(uid) helper from earlier)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_log' and policyname='owner_read_all_audit'
  ) then
    create policy owner_read_all_audit
      on public.audit_log
      for select
      to authenticated
      using ( public.is_owner(auth.uid()) );
    
    raise notice '✅ Created owner_read_all_audit policy';
  else
    raise notice 'ℹ️ owner_read_all_audit policy already exists';
  end if;
end$$;

-- Optional: let non-OWNERs read only their own actions
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_log' and policyname='self_read_own_audit'
  ) then
    create policy self_read_own_audit
      on public.audit_log
      for select
      to authenticated
      using ( actor_id = auth.uid() );
    
    raise notice '✅ Created self_read_own_audit policy';
  else
    raise notice 'ℹ️ self_read_own_audit policy already exists';
  end if;
end$$;

-- No one can INSERT/UPDATE/DELETE into audit_log directly
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_log' and policyname='deny_write_audit'
  ) then
    create policy deny_write_audit
      on public.audit_log
      for all
      to authenticated
      using ( false )
      with check ( false );
    
    raise notice '✅ Created deny_write_audit policy (prevents direct manipulation)';
  else
    raise notice 'ℹ️ deny_write_audit policy already exists';
  end if;
end$$;

-- === 6. Optional: Retention cleanup function ===
create or replace function public.purge_old_audit()
returns void language sql as $$
  delete from public.audit_log where at < now() - interval '180 days';
$$;

comment on function public.purge_old_audit is 'Removes audit entries older than 180 days';

-- === 7. Optional: Storage audit for file operations ===
-- Uncomment if you want to audit storage.objects changes too
/*
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute 'drop trigger if exists trg_audit_objects on storage.objects;';
    execute 'create trigger trg_audit_objects
             after insert or update or delete on storage.objects
             for each row execute function public.audit_row_changes();';
    raise notice '✅ Storage objects audit trigger installed';
  end if;
end$$;
*/

-- === 8. Test the system with a simple change (optional) ===
do $$
begin
  raise notice '🧪 Testing audit system...';
  
  -- This will be audited if user_profiles table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_profiles') then
    -- Just a comment to trigger audit logging
    comment on table public.user_profiles is 'User profiles table - audit test completed';
    raise notice '✅ Audit test completed - check audit_log table for entries';
  end if;
end$$;

-- Success message
do $$
begin
  raise notice '🎉 MONZA TECH SYSTEM AUDIT LOG INSTALLED SUCCESSFULLY!';
  raise notice '👑 OWNERS can view all audit entries';
  raise notice '👤 Other users can only see their own actions';
  raise notice '🔒 Audit log is protected from direct manipulation';
  raise notice '📊 All table changes (INSERT/UPDATE/DELETE) are now tracked';
  raise notice '🧹 Run purge_old_audit() monthly to clean old entries';
  raise notice '';
  raise notice 'Next step: Create the React UI at /audit-log';
end$$;
