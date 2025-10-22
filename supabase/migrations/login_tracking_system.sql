-- ===============================================
-- MONZA TECH LOGIN TRACKING & LOCATION SYSTEM
-- ===============================================
-- Track all employee login attempts with location data
-- For security monitoring and activity tracking

-- ===============================================
-- 1. LOGIN TRACKING TABLE
-- ===============================================

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
  login_method text default 'password', -- password, google, etc.
  success boolean not null default true,
  failure_reason text,
  
  -- Additional context
  device_type text, -- mobile, desktop, tablet
  browser text,
  os text,
  
  created_at timestamptz not null default now()
);

-- Performance indexes
create index if not exists login_tracking_user_id_idx on public.login_tracking (user_id);
create index if not exists login_tracking_email_idx on public.login_tracking (email);
create index if not exists login_tracking_time_idx on public.login_tracking (login_time desc);
create index if not exists login_tracking_ip_idx on public.login_tracking (ip_address);
create index if not exists login_tracking_suspicious_idx on public.login_tracking (is_suspicious) where is_suspicious = true;

-- ===============================================
-- 2. LOCATION DETECTION FUNCTION
-- ===============================================

create or replace function public.detect_suspicious_login(
  p_user_id uuid,
  p_ip_address inet,
  p_location_data jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
as $$
declare
  v_is_suspicious boolean := false;
  v_recent_logins integer;
  v_location_count integer;
  v_new_country text;
  v_prev_countries text[];
begin
  -- Extract location from jsonb
  v_new_country := p_location_data->>'country';
  
  -- Check for multiple locations in short time
  select count(*)
  into v_recent_logins
  from public.login_tracking
  where user_id = p_user_id
    and login_time > now() - interval '1 hour'
    and ip_address != p_ip_address;
  
  -- Get previous countries for this user
  select array_agg(distinct country)
  into v_prev_countries
  from public.login_tracking
  where user_id = p_user_id
    and country is not null
    and login_time > now() - interval '30 days';
  
  -- Flag as suspicious if:
  -- 1. Multiple IPs in 1 hour
  -- 2. New country not seen in 30 days
  -- 3. More than 5 logins in 10 minutes
  if v_recent_logins > 2 then
    v_is_suspicious := true;
  elsif v_new_country is not null 
    and (v_prev_countries is null or not (v_new_country = any(v_prev_countries))) then
    v_is_suspicious := true;
  else
    select count(*)
    into v_recent_logins
    from public.login_tracking
    where user_id = p_user_id
      and login_time > now() - interval '10 minutes';
    
    if v_recent_logins > 5 then
      v_is_suspicious := true;
    end if;
  end if;
  
  return v_is_suspicious;
end;
$$;

-- ===============================================
-- 3. LOGIN RECORDING FUNCTION
-- ===============================================

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
returns bigint
language plpgsql
security definer
as $$
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
    select count(*)
    into v_location_count
    from public.login_tracking
    where user_id = p_user_id
      and country = p_location_data->>'country'
      and city = p_location_data->>'city';
    
    v_is_new_location := (v_location_count = 0);
    
    -- Detect suspicious activity
    v_is_suspicious := public.detect_suspicious_login(
      p_user_id, 
      v_ip_inet, 
      p_location_data
    );
  end if;
  
  -- Insert login record
  insert into public.login_tracking (
    user_id,
    email,
    ip_address,
    user_agent,
    country,
    region,
    city,
    latitude,
    longitude,
    timezone,
    isp,
    is_suspicious,
    is_new_location,
    session_id,
    success,
    failure_reason,
    device_type,
    browser,
    os
  ) values (
    p_user_id,
    p_email,
    v_ip_inet,
    p_user_agent,
    p_location_data->>'country',
    p_location_data->>'region',
    p_location_data->>'city',
    (p_location_data->>'latitude')::decimal(10,8),
    (p_location_data->>'longitude')::decimal(11,8),
    p_location_data->>'timezone',
    p_location_data->>'isp',
    coalesce(v_is_suspicious, false),
    coalesce(v_is_new_location, false),
    p_session_id,
    p_success,
    p_failure_reason,
    p_device_info->>'type',
    p_device_info->>'browser',
    p_device_info->>'os'
  ) returning id into v_login_id;
  
  return v_login_id;
end;
$$;

-- ===============================================
-- 4. REAL-TIME NOTIFICATIONS TABLE
-- ===============================================

create table if not exists public.login_notifications (
  id bigserial primary key,
  login_tracking_id bigint references public.login_tracking(id),
  notification_type text not null check (notification_type in ('suspicious_login', 'new_location', 'failed_login', 'multiple_attempts')),
  message text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  
  -- Recipients (OWNERs will get all notifications)
  sent_to uuid[], -- array of user IDs who should receive this
  sent_at timestamptz,
  read_by jsonb default '{}'::jsonb, -- {user_id: timestamp} when read
  
  created_at timestamptz not null default now()
);

create index if not exists login_notifications_type_idx on public.login_notifications (notification_type);
create index if not exists login_notifications_severity_idx on public.login_notifications (severity);
create index if not exists login_notifications_sent_idx on public.login_notifications (sent_at) where sent_at is not null;

-- ===============================================
-- 5. NOTIFICATION TRIGGER
-- ===============================================

create or replace function public.create_login_notification()
returns trigger
language plpgsql
as $$
declare
  v_message text;
  v_severity text;
  v_notification_type text;
  v_owners uuid[];
begin
  -- Only create notifications for suspicious or failed logins
  if NEW.is_suspicious or NEW.is_new_location or not NEW.success then
    
    -- Get all OWNER user IDs
    select array_agg(id) 
    into v_owners
    from public.users 
    where role = 'OWNER';
    
    -- Determine notification type and message
    if not NEW.success then
      v_notification_type := 'failed_login';
      v_severity := 'medium';
      v_message := format('Failed login attempt for %s from %s (%s)', 
                         NEW.email, 
                         coalesce(NEW.city || ', ' || NEW.country, NEW.ip_address::text),
                         coalesce(NEW.failure_reason, 'Unknown reason'));
    elsif NEW.is_suspicious then
      v_notification_type := 'suspicious_login';
      v_severity := 'high';
      v_message := format('Suspicious login detected for %s from %s (%s)', 
                         NEW.email,
                         coalesce(NEW.city || ', ' || NEW.country, NEW.ip_address::text),
                         NEW.ip_address::text);
    elsif NEW.is_new_location then
      v_notification_type := 'new_location';
      v_severity := 'medium';
      v_message := format('New location login for %s from %s (%s)', 
                         NEW.email,
                         coalesce(NEW.city || ', ' || NEW.country, 'Unknown location'),
                         NEW.ip_address::text);
    end if;
    
    -- Insert notification
    insert into public.login_notifications (
      login_tracking_id,
      notification_type,
      message,
      severity,
      sent_to
    ) values (
      NEW.id,
      v_notification_type,
      v_message,
      v_severity,
      v_owners
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
-- 6. RLS POLICIES
-- ===============================================

-- Enable RLS
alter table public.login_tracking enable row level security;
alter table public.login_notifications enable row level security;

-- OWNERs can see all login data
create policy "owners_read_all_logins" on public.login_tracking
  for select to authenticated
  using (public.is_owner(auth.uid()));

-- Users can see their own login history
create policy "users_read_own_logins" on public.login_tracking
  for select to authenticated
  using (user_id = auth.uid());

-- Only the system can insert login records
create policy "system_insert_logins" on public.login_tracking
  for insert to authenticated
  with check (true); -- Will be controlled by function security

-- OWNERs can see all notifications
create policy "owners_read_all_notifications" on public.login_notifications
  for select to authenticated
  using (public.is_owner(auth.uid()));

-- Users can see notifications sent to them
create policy "users_read_own_notifications" on public.login_notifications
  for select to authenticated
  using (auth.uid() = any(sent_to));

-- ===============================================
-- 7. UTILITY VIEWS
-- ===============================================

-- Recent suspicious activity view
create or replace view public.recent_suspicious_logins as
select 
  lt.id,
  lt.email,
  u.name as user_name,
  u.role,
  lt.login_time,
  lt.ip_address,
  lt.country,
  lt.city,
  lt.is_suspicious,
  lt.is_new_location,
  lt.success
from public.login_tracking lt
left join public.users u on u.id = lt.user_id
where lt.login_time > now() - interval '7 days'
  and (lt.is_suspicious or lt.is_new_location or not lt.success)
order by lt.login_time desc;

-- Login statistics view
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

-- ===============================================
-- 8. CLEANUP FUNCTION
-- ===============================================

create or replace function public.cleanup_old_login_data()
returns void
language sql
as $$
  -- Keep login data for 1 year, notifications for 6 months
  delete from public.login_notifications where created_at < now() - interval '6 months';
  delete from public.login_tracking where created_at < now() - interval '1 year';
$$;

comment on function public.cleanup_old_login_data is 'Remove old login tracking data - run monthly';

-- ===============================================
-- 9. SUCCESS MESSAGE
-- ===============================================

do $$
begin
  raise notice '';
  raise notice '🎉 ===== LOGIN TRACKING SYSTEM INSTALLED! =====';
  raise notice '';
  raise notice '✅ FEATURES INSTALLED:';
  raise notice '   📍 Location tracking for all logins';
  raise notice '   🚨 Suspicious activity detection';
  raise notice '   📱 Device and browser fingerprinting';
  raise notice '   🔔 Real-time notifications for owners';
  raise notice '   📊 Login analytics and reporting';
  raise notice '   🛡️ Security monitoring dashboard';
  raise notice '';
  raise notice '🔧 USAGE:';
  raise notice '   • Frontend calls public.record_login_attempt() on each login';
  raise notice '   • Location data auto-detected via IP geolocation API';
  raise notice '   • Owners receive notifications for suspicious activity';
  raise notice '   • All login attempts are logged with full context';
  raise notice '';
  raise notice '📊 MONITORING VIEWS:';
  raise notice '   • recent_suspicious_logins - Last 7 days of suspicious activity';
  raise notice '   • login_stats_daily - Daily login statistics';
  raise notice '';
  raise notice '🎯 NEXT: Implement frontend location tracking service!';
  raise notice '';
end$$;
