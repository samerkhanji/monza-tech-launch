-- production_setup_script.sql
-- Monza S.A.L. Production Setup: OWNER bypass + Audit Log + RLS hardening
-- Safe to re-run; uses IF NOT EXISTS checks.

-- 1) Users table (Auth → App mapping) + role normalization
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null check (role in ('OWNER','GARAGE_MANAGER','ASSISTANT','SALES_MANAGER','MARKETING_MANAGER','TECHNICIAN')),
  created_at timestamptz not null default now()
);

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

-- 2) OWNER helper
create or replace function public.is_owner(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.users where id = uid and role = 'OWNER');
$$;

comment on function public.is_owner is 'True if uid belongs to an OWNER in public.users.';

-- 3) Universal OWNER bypass (PERMISSIVE FOR ALL) on every public table
do $$
declare r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  loop
    execute format('alter table %I.%I enable row level security;', r.table_schema, r.table_name);
    if not exists (
      select 1 from pg_policies
      where schemaname = r.table_schema and tablename = r.table_name and policyname = 'owner_full_access'
    ) then
      execute format($SQL$
        create policy owner_full_access on %I.%I
        as permissive for all to authenticated
        using ( public.is_owner(auth.uid()) )
        with check ( public.is_owner(auth.uid()) );
      $SQL$, r.table_schema, r.table_name);
    end if;
  end loop;
end$$;

-- 4) System Audit Log
create table if not exists public.audit_log (
  id             bigserial primary key,
  at             timestamptz not null default now(),
  actor_id       uuid,
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

create index if not exists audit_log_at_idx      on public.audit_log (at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id);
create index if not exists audit_log_table_idx   on public.audit_log (schema_name, table_name);

create or replace function public.actor_email_of(uid uuid)
returns text language sql stable as $$
  select coalesce(u.email, au.email)
  from public.users u
  left join auth.users au on au.id = u.id
  where u.id = uid
  limit 1;
$$;

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
  begin
    v_actor_id := auth.uid();
  exception when others then
    v_actor_id := null;
  end;

  if TG_OP = 'INSERT' then
    v_pk := coalesce((new).id::text, 'UNKNOWN');
    insert into public.audit_log(actor_id,actor_email,action,schema_name,table_name,row_pk,before_data,after_data,changed_fields)
    values (v_actor_id, public.actor_email_of(v_actor_id), 'INSERT', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk, null, to_jsonb(new), null);
    return new;

  elsif TG_OP = 'UPDATE' then
    v_pk := coalesce((new).id::text, (old).id::text, 'UNKNOWN');
    v_changed := array(
      select k from jsonb_object_keys(to_jsonb(new) - 'updated_at') as k
      where (to_jsonb(new)->>k) is distinct from (to_jsonb(old)->>k)
    );
    insert into public.audit_log(actor_id,actor_email,action,schema_name,table_name,row_pk,before_data,after_data,changed_fields)
    values (v_actor_id, public.actor_email_of(v_actor_id), 'UPDATE', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk, to_jsonb(old), to_jsonb(new), v_changed);
    return new;

  else
    v_pk := coalesce((old).id::text, 'UNKNOWN');
    insert into public.audit_log(actor_id,actor_email,action,schema_name,table_name,row_pk,before_data,after_data,changed_fields)
    values (v_actor_id, public.actor_email_of(v_actor_id), 'DELETE', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk, to_jsonb(old), null, null);
    return old;
  end if;
end;
$$;

-- Attach audit trigger to all existing public tables (except audit_log itself)
do $$
declare r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'audit_log'
  loop
    execute format('drop trigger if exists trg_audit_%I on %I.%I;', r.table_name, r.table_schema, r.table_name);
    execute format('create trigger trg_audit_%I
                    after insert or update or delete on %I.%I
                    for each row execute function public.audit_row_changes();',
                    r.table_name, r.table_schema, r.table_name);
  end loop;
end$$;

-- RLS for audit_log: OWNERs see all; option for users to see their own
alter table public.audit_log enable row level security;

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
  end if;
end$$;

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
  end if;
end$$;

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
  end if;
end$$;

-- 5) Diagnostics helpers
-- List restrictive policies (should be 0 unless intentional)
select schemaname, tablename, policyname, permissive
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

-- Optional: smoketest table (uncomment to verify auditing)
-- create table if not exists public._audit_smoketest(id uuid primary key default gen_random_uuid(), name text);
-- insert into public._audit_smoketest(name) values ('A');
-- update public._audit_smoketest set name='B' where name='A';
-- delete from public._audit_smoketest where name='B');
-- select action, table_name, row_pk, at from public.audit_log where table_name = '_audit_smoketest' order by at desc limit 3;
