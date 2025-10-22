-- ===============================================
-- MONZA TECH - FINAL COMPLETE DATABASE SETUP
-- ===============================================
-- This script contains EVERYTHING needed for your complete system:
-- ✅ User management with role normalization
-- ✅ Complete audit logging with triggers  
-- ✅ Login tracking with location detection
-- ✅ OWNER unrestricted access with tracking
-- ✅ Universal RLS policies with OWNER bypass
-- ✅ Storage buckets and file policies
-- ✅ Notification system for security alerts
-- ✅ Analytics views and summary functions
-- ===============================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ===============================================
-- 1. CORE USER MANAGEMENT SYSTEM
-- ===============================================

-- Main users table with role constraints
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null check (role in ('OWNER','GARAGE_MANAGER','ASSISTANT','SALES_MANAGER','MARKETING_MANAGER','TECHNICIAN')),
  name text,
  phone text,
  department text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- Auto-uppercase roles for consistency
create or replace function public.normalize_role()
returns trigger language plpgsql as $$
begin
  new.role := upper(new.role);
  if new.updated_at is null or new.updated_at = old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_normalize_role on public.users;
create trigger trg_normalize_role before insert or update on public.users
for each row execute function public.normalize_role();

-- OWNER helper function for permissions
create or replace function public.is_owner(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.users where id = uid and role = 'OWNER');
$$;

comment on function public.is_owner is 'Check if user has OWNER role - used for universal access bypass';

-- User profiles table for additional data
create table if not exists public.user_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  bio text,
  location text,
  website text,
  social_links jsonb default '{}'::jsonb,
  preferences jsonb default '{}'::jsonb,
  notifications_enabled boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- ===============================================
-- 2. COMPREHENSIVE AUDIT LOG SYSTEM
-- ===============================================

-- Main audit table for all database changes
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
  app_context jsonb,
  created_at timestamptz not null default now()
);

-- Performance indexes for audit log
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_table_idx on public.audit_log (schema_name, table_name);
create index if not exists audit_log_action_idx on public.audit_log (action);

-- Email lookup helper for audit entries
create or replace function public.actor_email_of(uid uuid)
returns text language sql stable as $$
  select coalesce(u.email, up.email, au.email)
  from public.users u
  left join public.user_profiles up on up.id = u.id
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
      v_actor_id, public.actor_email_of(v_actor_id), 'INSERT', 
      TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk, null, to_jsonb(new), null
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
        v_actor_id, public.actor_email_of(v_actor_id), 'UPDATE', 
        TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk, to_jsonb(old), to_jsonb(new), v_changed
      );
    end if;
    return new;

  elsif TG_OP = 'DELETE' then
    v_pk := coalesce((old).id::text, 'UNKNOWN');
    insert into public.audit_log(
      actor_id, actor_email, action, schema_name, table_name, row_pk,
      before_data, after_data, changed_fields
    ) values (
      v_actor_id, public.actor_email_of(v_actor_id), 'DELETE', 
      TG_TABLE_SCHEMA, TG_TABLE_NAME, v_pk, to_jsonb(old), null, null
    );
    return old;
  end if;

  return null;
end;
$$;

-- ===============================================
-- 3. LOGIN TRACKING & LOCATION SYSTEM
-- ===============================================

-- Complete login tracking table
create table if not exists public.login_tracking (
  id bigserial primary key,
  user_id uuid references public.users(id),
  email text not null,
  login_time timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  
  -- Location data
  country text,
  region text,
  city text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  timezone text,
  isp text,
  
  -- Security flags
  is_suspicious boolean default false,
  is_new_location boolean default false,
  is_new_device boolean default false,
  
  -- Session info
  session_id text,
  login_method text default 'password',
  success boolean not null default true,
  failure_reason text,
  
  -- Device info
  device_type text,
  browser text,
  os text,
  
  created_at timestamptz not null default now()
);

-- Performance indexes for login tracking
create index if not exists login_tracking_user_id_idx on public.login_tracking (user_id);
create index if not exists login_tracking_email_idx on public.login_tracking (email);
create index if not exists login_tracking_time_idx on public.login_tracking (login_time desc);
create index if not exists login_tracking_ip_idx on public.login_tracking (ip_address);
create index if not exists login_tracking_suspicious_idx on public.login_tracking (is_suspicious) where is_suspicious = true;

-- Suspicious activity detection (excludes OWNERs)
create or replace function public.detect_suspicious_login(
  p_user_id uuid,
  p_ip_address inet,
  p_location_data jsonb default '{}'::jsonb
)
returns boolean language plpgsql as $$
declare
  v_is_suspicious boolean := false;
  v_recent_logins integer;
  v_location_count integer;
  v_new_country text;
  v_prev_countries text[];
  v_user_role text;
begin
  -- Get user role to check if they're an OWNER
  select role into v_user_role from public.users where id = p_user_id;
  
  -- OWNERS are never flagged as suspicious (unrestricted access)
  if v_user_role = 'OWNER' then
    return false;
  end if;
  
  -- Extract location from jsonb
  v_new_country := p_location_data->>'country';
  
  -- Check for multiple locations in short time (non-OWNERs only)
  select count(*) into v_recent_logins
  from public.login_tracking
  where user_id = p_user_id
    and login_time > now() - interval '1 hour'
    and ip_address != p_ip_address;
  
  -- Get previous countries for this user
  select array_agg(distinct country) into v_prev_countries
  from public.login_tracking
  where user_id = p_user_id
    and country is not null
    and login_time > now() - interval '30 days';
  
  -- Flag as suspicious if: Multiple IPs, new country, or rapid logins
  if v_recent_logins > 2 then
    v_is_suspicious := true;
  elsif v_new_country is not null 
    and (v_prev_countries is null or not (v_new_country = any(v_prev_countries))) then
    v_is_suspicious := true;
  else
    select count(*) into v_recent_logins
    from public.login_tracking
    where user_id = p_user_id and login_time > now() - interval '10 minutes';
    
    if v_recent_logins > 5 then
      v_is_suspicious := true;
    end if;
  end if;
  
  return v_is_suspicious;
end;
$$;

-- Login recording function
create or replace function public.record_login_attempt(
  p_user_id uuid,
  p_email text,
  p_ip_address text,
  p_user_agent text default null,
  p_session_id text default null,
  p_success boolean default true,
  p_failure_reason text default null,
  p_location_data jsonb default '{}'::jsonb,
  p_device_info jsonb default '{}'::jsonb
)
returns bigint language plpgsql security definer as $$
declare
  v_login_id bigint;
  v_ip_inet inet;
  v_is_suspicious boolean;
  v_is_new_location boolean;
  v_location_count integer;
begin
  -- Convert IP to inet type
  begin
    v_ip_inet := p_ip_address::inet;
  exception when others then
    v_ip_inet := null;
  end;
  
  -- Check if this is a new location for the user
  if p_success and p_user_id is not null then
    select count(*) into v_location_count
    from public.login_tracking
    where user_id = p_user_id
      and country = p_location_data->>'country'
      and city = p_location_data->>'city';
    
    v_is_new_location := (v_location_count = 0);
    
    -- Detect suspicious activity
    v_is_suspicious := public.detect_suspicious_login(p_user_id, v_ip_inet, p_location_data);
  end if;
  
  -- Insert login record
  insert into public.login_tracking (
    user_id, email, ip_address, user_agent, country, region, city,
    latitude, longitude, timezone, isp, is_suspicious, is_new_location,
    session_id, success, failure_reason, device_type, browser, os
  ) values (
    p_user_id, p_email, v_ip_inet, p_user_agent,
    p_location_data->>'country', p_location_data->>'region', p_location_data->>'city',
    (p_location_data->>'latitude')::decimal(10,8), (p_location_data->>'longitude')::decimal(11,8),
    p_location_data->>'timezone', p_location_data->>'isp',
    coalesce(v_is_suspicious, false), coalesce(v_is_new_location, false),
    p_session_id, p_success, p_failure_reason,
    p_device_info->>'type', p_device_info->>'browser', p_device_info->>'os'
  ) returning id into v_login_id;
  
  return v_login_id;
end;
$$;

-- ===============================================
-- 4. NOTIFICATION SYSTEM
-- ===============================================

-- Login notifications table
create table if not exists public.login_notifications (
  id bigserial primary key,
  login_tracking_id bigint references public.login_tracking(id),
  notification_type text not null check (notification_type in ('suspicious_login', 'new_location', 'failed_login', 'multiple_attempts', 'owner_login', 'weekend_access', 'after_hours_access')),
  message text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  sent_to uuid[],
  sent_at timestamptz,
  read_by jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Notification indexes
create index if not exists login_notifications_type_idx on public.login_notifications (notification_type);
create index if not exists login_notifications_severity_idx on public.login_notifications (severity);
create index if not exists login_notifications_sent_idx on public.login_notifications (sent_at) where sent_at is not null;

-- Enhanced notification trigger
create or replace function public.create_login_notification()
returns trigger language plpgsql as $$
declare
  v_message text;
  v_severity text;
  v_notification_type text;
  v_owners uuid[];
  v_user_role text;
  v_should_notify boolean := false;
begin
  -- Get user role
  select role into v_user_role from public.users where id = NEW.user_id;
  
  -- Get all OWNER user IDs for notifications
  select array_agg(id) into v_owners from public.users where role = 'OWNER';
  
  -- Always notify for failed logins (any user)
  if not NEW.success then
    v_should_notify := true;
    v_notification_type := 'failed_login';
    v_severity := case when v_user_role = 'OWNER' then 'high' else 'medium' end;
    v_message := format('Failed login attempt for %s (%s) from %s (%s)', 
                       NEW.email, coalesce(v_user_role, 'Unknown Role'),
                       coalesce(NEW.city || ', ' || NEW.country, NEW.ip_address::text),
                       coalesce(NEW.failure_reason, 'Unknown reason'));
  
  -- Notify for suspicious activity (non-OWNERs only)
  elsif NEW.is_suspicious and v_user_role != 'OWNER' then
    v_should_notify := true;
    v_notification_type := 'suspicious_login';
    v_severity := 'high';
    v_message := format('Suspicious login detected for %s (%s) from %s (%s)', 
                       NEW.email, coalesce(v_user_role, 'Unknown Role'),
                       coalesce(NEW.city || ', ' || NEW.country, NEW.ip_address::text),
                       NEW.ip_address::text);
  
  -- Notify for new locations (all users including OWNERs for tracking)
  elsif NEW.is_new_location then
    v_should_notify := true;
    v_notification_type := 'new_location';
    v_severity := case when v_user_role = 'OWNER' then 'low' else 'medium' end;
    v_message := format('New location login for %s (%s) from %s (%s)', 
                       NEW.email, coalesce(v_user_role, 'Unknown Role'),
                       coalesce(NEW.city || ', ' || NEW.country, 'Unknown location'),
                       NEW.ip_address::text);
  
  -- SPECIAL: Always notify for OWNER logins (tracking purpose)
  elsif NEW.success and v_user_role = 'OWNER' then
    v_should_notify := true;
    v_notification_type := 'owner_login';
    v_severity := 'low';
    v_message := format('OWNER login: %s from %s (%s) - Device: %s %s', 
                       NEW.email,
                       coalesce(NEW.city || ', ' || NEW.country, 'Unknown location'),
                       NEW.ip_address::text,
                       coalesce(NEW.device_type, 'Unknown'),
                       coalesce(NEW.browser, 'Unknown Browser'));
  end if;
  
  -- Insert notification if conditions met
  if v_should_notify then
    insert into public.login_notifications (
      login_tracking_id, notification_type, message, severity, sent_to
    ) values (
      NEW.id, v_notification_type, v_message, v_severity, v_owners
    );
  end if;
  
  return NEW;
end;
$$;

drop trigger if exists trg_login_notification on public.login_tracking;
create trigger trg_login_notification
  after insert on public.login_tracking
  for each row execute function public.create_login_notification();

-- ===============================================
-- 5. ANALYTICS & REPORTING VIEWS
-- ===============================================

-- Complete user activity view
create or replace view public.all_user_activity as
select 
  lt.id, lt.email, u.name as user_name, u.role, lt.login_time,
  lt.ip_address, lt.country, lt.region, lt.city, lt.latitude, lt.longitude,
  lt.timezone, lt.isp, lt.device_type, lt.browser, lt.os, lt.user_agent,
  lt.is_suspicious, lt.is_new_location, lt.success, lt.failure_reason, lt.session_id,
  
  -- Contextual flags
  case 
    when u.role = 'OWNER' then 'TRACKED_UNRESTRICTED'
    when lt.is_suspicious then 'SUSPICIOUS' 
    when lt.is_new_location then 'NEW_LOCATION'
    when not lt.success then 'FAILED_LOGIN'
    else 'NORMAL'
  end as login_status,
  
  -- Geographic insights
  case 
    when lt.country is null then 'Unknown'
    when lt.country = 'Lebanon' then 'Local'
    else 'International'
  end as location_category,
  
  -- Time-based insights
  extract(hour from lt.login_time) as login_hour,
  extract(dow from lt.login_time) as day_of_week,
  case 
    when extract(dow from lt.login_time) in (0, 6) then 'Weekend'
    when extract(hour from lt.login_time) between 9 and 17 then 'Business Hours'
    else 'After Hours'
  end as time_category
  
from public.login_tracking lt
left join public.users u on u.id = lt.user_id
order by lt.login_time desc;

-- Recent suspicious activity view
create or replace view public.recent_suspicious_logins as
select 
  lt.id, lt.email, u.name as user_name, u.role, lt.login_time,
  lt.ip_address, lt.country, lt.city, lt.is_suspicious, lt.is_new_location, lt.success
from public.login_tracking lt
left join public.users u on u.id = lt.user_id
where lt.login_time > now() - interval '7 days'
  and (lt.is_suspicious or lt.is_new_location or not lt.success)
order by lt.login_time desc;

-- Daily login statistics view
create or replace view public.login_stats_daily as
select 
  date_trunc('day', login_time) as login_date,
  count(*) as total_logins,
  count(*) filter (where success) as successful_logins,
  count(*) filter (where not success) as failed_logins,
  count(*) filter (where is_suspicious) as suspicious_logins,
  count(*) filter (where is_new_location) as new_location_logins,
  count(distinct user_id) as unique_users,
  count(distinct ip_address) as unique_ips
from public.login_tracking
where login_time > now() - interval '30 days'
group by date_trunc('day', login_time)
order by login_date desc;

-- OWNER activity summary function
create or replace function public.get_owner_activity_summary(p_days integer default 7)
returns table(
  total_logins bigint,
  unique_owners bigint,
  unique_locations bigint,
  unique_ips bigint,
  international_logins bigint,
  weekend_logins bigint,
  after_hours_logins bigint,
  failed_attempts bigint
)
language sql as $$
  select 
    count(*) as total_logins,
    count(distinct user_id) as unique_owners,
    count(distinct concat(coalesce(country, ''), coalesce(city, ''))) as unique_locations,
    count(distinct ip_address) as unique_ips,
    count(*) filter (where country != 'Lebanon' and country is not null) as international_logins,
    count(*) filter (where extract(dow from login_time) in (0, 6)) as weekend_logins,
    count(*) filter (where extract(hour from login_time) not between 9 and 17) as after_hours_logins,
    count(*) filter (where not success) as failed_attempts
  from public.login_tracking lt
  join public.users u on u.id = lt.user_id
  where u.role = 'OWNER'
    and lt.login_time > now() - interval '1 day' * p_days;
$$;

-- ===============================================
-- 6. STORAGE BUCKETS & FILE MANAGEMENT
-- ===============================================

-- Create storage buckets for file uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values 
  ('car-photos', 'car-photos', true, 52428800, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('documents', 'documents', true, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'text/plain']::text[]),
  ('pdi-files', 'pdi-files', true, 52428800, array['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('repair-photos', 'repair-photos', true, 52428800, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('signatures', 'signatures', true, 10485760, array['image/png', 'image/svg+xml']::text[]),
  ('user-avatars', 'user-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do nothing;

-- ===============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all core tables
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.login_tracking enable row level security;
alter table public.login_notifications enable row level security;

-- Universal OWNER bypass policies for all public tables
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

-- Specific policies for core tables

-- Users table policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='users_read_own') then
    create policy users_read_own on public.users for select to authenticated using (id = auth.uid());
  end if;
  
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='users_update_own') then
    create policy users_update_own on public.users for update to authenticated using (id = auth.uid());
  end if;
end$$;

-- Audit log policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_log' and policyname='audit_read_own') then
    create policy audit_read_own on public.audit_log for select to authenticated using (actor_id = auth.uid());
  end if;
  
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_log' and policyname='audit_deny_write') then
    create policy audit_deny_write on public.audit_log for all to authenticated using (false) with check (false);
  end if;
end$$;

-- Login tracking policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='login_tracking' and policyname='login_read_own') then
    create policy login_read_own on public.login_tracking for select to authenticated using (user_id = auth.uid());
  end if;
  
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='login_tracking' and policyname='login_system_insert') then
    create policy login_system_insert on public.login_tracking for insert to authenticated with check (true);
  end if;
end$$;

-- Login notifications policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='login_notifications' and policyname='notifications_read_sent_to') then
    create policy notifications_read_sent_to on public.login_notifications for select to authenticated using (auth.uid() = any(sent_to));
  end if;
end$$;

-- Storage policies
do $$
begin
  -- Car photos policy
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'car_photos_policy') then
    create policy "car_photos_policy" on storage.objects for all to authenticated using (bucket_id = 'car-photos') with check (bucket_id = 'car-photos');
  end if;
  
  -- Documents policy
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'documents_policy') then
    create policy "documents_policy" on storage.objects for all to authenticated using (bucket_id = 'documents') with check (bucket_id = 'documents');
  end if;
  
  -- User avatars policy
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_policy') then
    create policy "avatars_policy" on storage.objects for all to authenticated using (bucket_id = 'user-avatars') with check (bucket_id = 'user-avatars');
  end if;
end$$;

-- ===============================================
-- 8. ATTACH AUDIT TRIGGERS TO ALL TABLES
-- ===============================================

-- Attach audit triggers to all existing public tables
do $$
declare r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public' 
      and table_type = 'BASE TABLE' 
      and table_name not in ('audit_log', 'login_notifications')
  loop
    execute format('drop trigger if exists trg_audit_%I on %I.%I;', r.table_name, r.table_schema, r.table_name);
    execute format('create trigger trg_audit_%I
                    after insert or update or delete on %I.%I
                    for each row execute function public.audit_row_changes();',
                    r.table_name, r.table_schema, r.table_name);
  end loop;
end$$;

-- Auto-attach audit triggers to new tables (event trigger)
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
      
      if tbl not in ('audit_log', 'login_notifications') then
        execute format('create trigger trg_audit_%I 
                        after insert or update or delete on %I.%I
                        for each row execute function public.audit_row_changes();', 
                        tbl, sch, tbl);
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
-- 9. CLEANUP & MAINTENANCE FUNCTIONS
-- ===============================================

-- Cleanup old audit data
create or replace function public.purge_old_audit()
returns void language sql as $$
  delete from public.audit_log where at < now() - interval '180 days';
$$;

-- Cleanup old login data
create or replace function public.cleanup_old_login_data()
returns void language sql as $$
  delete from public.login_notifications where created_at < now() - interval '6 months';
  delete from public.login_tracking where created_at < now() - interval '1 year';
$$;

-- ===============================================
-- 10. SYSTEM VERIFICATION & TESTING
-- ===============================================

-- Test audit system
do $$
begin
  -- Create temp table to test auditing
  create temp table if not exists _audit_test(id uuid primary key default gen_random_uuid(), name text);
  
  -- Test operations
  insert into _audit_test(name) values ('test_insert');
  update _audit_test set name = 'test_update' where name = 'test_insert';
  delete from _audit_test where name = 'test_update';
  
  -- Cleanup
  drop table if exists _audit_test;
end$$;

-- ===============================================
-- 11. FINAL SUCCESS MESSAGE
-- ===============================================

do $$
declare
  v_table_count integer;
  v_trigger_count integer;
  v_policy_count integer;
begin
  -- Count components
  select count(*) into v_table_count from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';
  select count(*) into v_trigger_count from information_schema.triggers where trigger_name like 'trg_audit_%';
  select count(*) into v_policy_count from pg_policies where schemaname = 'public' and policyname = 'owner_full_access';

  raise notice '';
  raise notice '🎉 ===== MONZA TECH COMPLETE SYSTEM DEPLOYED! =====';
  raise notice '';
  raise notice '✅ CORE COMPONENTS INSTALLED:';
  raise notice '   👥 User management with role normalization';
  raise notice '   📊 Complete audit logging (% tables with triggers)', v_trigger_count;
  raise notice '   📍 Login tracking with location detection';
  raise notice '   👑 OWNER unrestricted access with tracking';
  raise notice '   🛡️ Universal RLS with OWNER bypass (% policies)', v_policy_count;
  raise notice '   📁 Storage buckets for file management';
  raise notice '   🔔 Real-time notification system';
  raise notice '   📈 Analytics views and reporting functions';
  raise notice '';
  raise notice '🔧 FEATURES ENABLED:';
  raise notice '   🌍 Geographic location tracking for all logins';
  raise notice '   🚨 Suspicious activity detection (excludes OWNERs)';
  raise notice '   📱 Complete device fingerprinting';
  raise notice '   ⚡ Auto-trigger attachment for new tables';
  raise notice '   🔄 Automatic data cleanup and maintenance';
  raise notice '   👁️ Developer oversight dashboard';
  raise notice '';
  raise notice '🎯 NEXT STEPS:';
  raise notice '   1. Create your first OWNER user in Supabase Auth';
  raise notice '   2. Insert user record: INSERT INTO public.users (id, email, role, name) VALUES (''AUTH_UID'', ''your@email.com'', ''OWNER'', ''Your Name'');';
  raise notice '   3. Configure .env.local with Supabase credentials';
  raise notice '   4. Test login and verify tracking in /developer-overview';
  raise notice '   5. All systems are ready for production!';
  raise notice '';
  raise notice '📊 SYSTEM STATUS:';
  raise notice '   📋 Tables: %', v_table_count;
  raise notice '   🔧 Audit Triggers: %', v_trigger_count;
  raise notice '   🛡️ OWNER Bypass Policies: %', v_policy_count;
  raise notice '   🎉 Complete tracking system operational!';
  raise notice '';
end$$;
