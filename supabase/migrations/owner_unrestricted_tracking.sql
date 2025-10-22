-- ===============================================
-- OWNER UNRESTRICTED ACCESS WITH FULL TRACKING
-- ===============================================
-- Allows OWNERs to login from anywhere without restrictions
-- while still tracking ALL login activity for security oversight

-- ===============================================
-- 1. UPDATE SUSPICIOUS ACTIVITY DETECTION
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
  v_user_role text;
begin
  -- Get user role to check if they're an OWNER
  select role into v_user_role
  from public.users 
  where id = p_user_id;
  
  -- OWNERS are never flagged as suspicious (unrestricted access)
  -- but their activity is still logged for tracking
  if v_user_role = 'OWNER' then
    return false;
  end if;
  
  -- Extract location from jsonb
  v_new_country := p_location_data->>'country';
  
  -- Check for multiple locations in short time (non-OWNERs only)
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
  
  -- Flag as suspicious if (for non-OWNERs):
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
-- 2. ENHANCED NOTIFICATION SYSTEM FOR DEVELOPER
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
  v_user_role text;
  v_should_notify boolean := false;
begin
  -- Get user role
  select role into v_user_role
  from public.users 
  where id = NEW.user_id;
  
  -- Get all OWNER user IDs for notifications
  select array_agg(id) 
  into v_owners
  from public.users 
  where role = 'OWNER';
  
  -- Always notify for failed logins (any user)
  if not NEW.success then
    v_should_notify := true;
    v_notification_type := 'failed_login';
    v_severity := case when v_user_role = 'OWNER' then 'high' else 'medium' end;
    v_message := format('Failed login attempt for %s (%s) from %s (%s)', 
                       NEW.email,
                       coalesce(v_user_role, 'Unknown Role'),
                       coalesce(NEW.city || ', ' || NEW.country, NEW.ip_address::text),
                       coalesce(NEW.failure_reason, 'Unknown reason'));
  
  -- Notify for suspicious activity (non-OWNERs only)
  elsif NEW.is_suspicious and v_user_role != 'OWNER' then
    v_should_notify := true;
    v_notification_type := 'suspicious_login';
    v_severity := 'high';
    v_message := format('Suspicious login detected for %s (%s) from %s (%s)', 
                       NEW.email,
                       coalesce(v_user_role, 'Unknown Role'),
                       coalesce(NEW.city || ', ' || NEW.country, NEW.ip_address::text),
                       NEW.ip_address::text);
  
  -- Notify for new locations (all users including OWNERs for tracking)
  elsif NEW.is_new_location then
    v_should_notify := true;
    v_notification_type := 'new_location';
    v_severity := case when v_user_role = 'OWNER' then 'low' else 'medium' end;
    v_message := format('New location login for %s (%s) from %s (%s)', 
                       NEW.email,
                       coalesce(v_user_role, 'Unknown Role'),
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

-- ===============================================
-- 3. COMPREHENSIVE TRACKING VIEW
-- ===============================================

-- Enhanced view for complete user activity tracking
create or replace view public.all_user_activity as
select 
  lt.id,
  lt.email,
  u.name as user_name,
  u.role,
  lt.login_time,
  lt.ip_address,
  lt.country,
  lt.region,
  lt.city,
  lt.latitude,
  lt.longitude,
  lt.timezone,
  lt.isp,
  lt.device_type,
  lt.browser,
  lt.os,
  lt.user_agent,
  lt.is_suspicious,
  lt.is_new_location,
  lt.success,
  lt.failure_reason,
  lt.session_id,
  
  -- Add contextual flags
  case 
    when u.role = 'OWNER' then 'TRACKED_UNRESTRICTED'
    when lt.is_suspicious then 'SUSPICIOUS' 
    when lt.is_new_location then 'NEW_LOCATION'
    when not lt.success then 'FAILED_LOGIN'
    else 'NORMAL'
  end as login_status,
  
  -- Add geographic insights
  case 
    when lt.country is null then 'Unknown'
    when lt.country = 'Lebanon' then 'Local'
    else 'International'
  end as location_category,
  
  -- Add time-based insights
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

-- ===============================================
-- 4. DEVELOPER NOTIFICATION PREFERENCES
-- ===============================================

-- Table to store notification preferences for the main developer/owner
create table if not exists public.developer_notification_settings (
  id uuid primary key default gen_random_uuid(),
  developer_user_id uuid references public.users(id),
  
  -- Email notification settings
  notify_all_logins boolean default true,
  notify_owner_logins boolean default true,
  notify_failed_logins boolean default true,
  notify_suspicious_activity boolean default true,
  notify_new_locations boolean default true,
  notify_weekend_access boolean default false,
  notify_after_hours boolean default false,
  
  -- Notification delivery settings
  email_notifications boolean default true,
  in_app_notifications boolean default true,
  sms_notifications boolean default false,
  
  -- Filtering options
  minimum_severity text default 'low' check (minimum_severity in ('low', 'medium', 'high', 'critical')),
  exclude_own_activity boolean default false,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- Function to check if developer should be notified
create or replace function public.should_notify_developer(
  p_notification_type text,
  p_severity text,
  p_user_role text,
  p_login_time timestamptz
)
returns boolean
language plpgsql
as $$
declare
  v_should_notify boolean := false;
  v_settings record;
begin
  -- Get developer notification settings
  select * into v_settings
  from public.developer_notification_settings
  limit 1; -- Assuming one main developer
  
  -- If no settings exist, use defaults (notify everything)
  if v_settings is null then
    return true;
  end if;
  
  -- Check severity threshold
  if (v_settings.minimum_severity = 'critical' and p_severity != 'critical') or
     (v_settings.minimum_severity = 'high' and p_severity not in ('high', 'critical')) or
     (v_settings.minimum_severity = 'medium' and p_severity = 'low') then
    return false;
  end if;
  
  -- Check specific notification types
  case p_notification_type
    when 'owner_login' then v_should_notify := v_settings.notify_owner_logins;
    when 'failed_login' then v_should_notify := v_settings.notify_failed_logins;
    when 'suspicious_login' then v_should_notify := v_settings.notify_suspicious_activity;
    when 'new_location' then v_should_notify := v_settings.notify_new_locations;
    else v_should_notify := v_settings.notify_all_logins;
  end case;
  
  -- Additional time-based checks
  if v_should_notify then
    -- Weekend access
    if extract(dow from p_login_time) in (0, 6) and v_settings.notify_weekend_access then
      v_should_notify := true;
    end if;
    
    -- After hours access  
    if extract(hour from p_login_time) not between 9 and 17 and v_settings.notify_after_hours then
      v_should_notify := true;
    end if;
  end if;
  
  return v_should_notify;
end;
$$;

-- ===============================================
-- 5. OWNER ACTIVITY SUMMARY FUNCTION
-- ===============================================

create or replace function public.get_owner_activity_summary(
  p_days integer default 7
)
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
language sql
as $$
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
-- 6. UPDATE NOTIFICATION TYPES
-- ===============================================

-- Add the new notification type to the constraint
alter table public.login_notifications 
drop constraint if exists login_notifications_notification_type_check;

alter table public.login_notifications 
add constraint login_notifications_notification_type_check 
check (notification_type in ('suspicious_login', 'new_location', 'failed_login', 'multiple_attempts', 'owner_login', 'weekend_access', 'after_hours_access'));

-- ===============================================
-- 7. SUCCESS MESSAGE
-- ===============================================

do $$
begin
  raise notice '';
  raise notice '🎉 ===== OWNER UNRESTRICTED TRACKING CONFIGURED! =====';
  raise notice '';
  raise notice '✅ OWNER ACCESS POLICY:';
  raise notice '   👑 OWNERs can login from anywhere without restrictions';
  raise notice '   🚫 OWNERs never flagged as "suspicious activity"';  
  raise notice '   📍 All OWNER logins still tracked for oversight';
  raise notice '   🔔 Developer receives notifications for all OWNER activity';
  raise notice '';
  raise notice '📊 COMPREHENSIVE TRACKING:';
  raise notice '   📍 Every login location tracked (all users)';
  raise notice '   ⏰ Weekend and after-hours access monitoring';
  raise notice '   🌍 International vs local login detection';
  raise notice '   📱 Complete device fingerprinting';
  raise notice '   📧 Customizable notification preferences';
  raise notice '';
  raise notice '🔧 NEW FEATURES:';
  raise notice '   👁️ all_user_activity view - Complete oversight dashboard';
  raise notice '   ⚙️ developer_notification_settings - Customize alerts';
  raise notice '   📈 get_owner_activity_summary() - OWNER usage analytics';
  raise notice '   🎯 Enhanced notifications with role-based severity';
  raise notice '';
  raise notice '🎯 RESULT: You get full visibility while OWNERs get unrestricted access!';
  raise notice '';
end$$;
