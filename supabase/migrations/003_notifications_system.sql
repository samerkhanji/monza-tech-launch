-- =====================================================
-- Monza TECH Notification System Migration
-- =====================================================
-- This creates a comprehensive notification system for:
-- - Messages (chat notifications, mentions)
-- - Car updates (movements, status changes, PDI)
-- - Requests (approvals, tasks requiring action)

-- Enable required extensions
create extension if not exists pgcrypto;

-- =====================================================
-- Main notifications table
-- =====================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('message','car','request')),
  title text not null,
  body text,
  entity_id text, -- e.g., chat_id, car_id, request_id
  route text,     -- frontend route to open (fallbacks exist in component)
  read_at timestamptz,
  meta jsonb,     -- arbitrary payload { priority, request_status, etc. }
  actor_id uuid,  -- who generated this notification (optional)
  recipient_id uuid not null, -- user who sees it
  action_required boolean not null default false,
  action_state text not null default 'pending' check (action_state in ('pending','accepted','denied'))
);

-- =====================================================
-- Performance indexes
-- =====================================================
create index if not exists notifications_recipient_type_idx 
  on public.notifications(recipient_id, type, read_at);
create index if not exists notifications_type_idx 
  on public.notifications(type);
create index if not exists notifications_created_at_idx 
  on public.notifications(created_at desc);
create index if not exists notifications_meta_priority_idx 
  on public.notifications((meta->>'priority'));

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "user_can_read_own_notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

-- Users can update their own notifications (mark as read, etc.)
create policy "user_can_update_own_notifications" on public.notifications
  for update using (auth.uid() = recipient_id);

-- Service/system can insert notifications for any user
-- Note: Tighten this policy based on your security requirements
create policy "system_can_insert_notifications" on public.notifications
  for insert with check (true);

-- Users can delete their own notifications (optional)
create policy "user_can_delete_own_notifications" on public.notifications
  for delete using (auth.uid() = recipient_id);

-- =====================================================
-- Helper functions for common notification operations
-- =====================================================

-- Function to create a message notification
create or replace function create_message_notification(
  p_recipient_id uuid,
  p_sender_name text,
  p_message_text text,
  p_chat_id text default null,
  p_route text default null
) returns uuid as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (
    type,
    title,
    body,
    entity_id,
    route,
    recipient_id,
    meta
  ) values (
    'message',
    format('New message from %s', p_sender_name),
    left(p_message_text, 200), -- truncate long messages
    p_chat_id,
    coalesce(p_route, format('/message-center')),
    p_recipient_id,
    jsonb_build_object('sender', p_sender_name, 'chat_id', p_chat_id)
  ) returning id into notification_id;
  
  return notification_id;
end;
$$ language plpgsql security definer;

-- Function to create a car notification
create or replace function create_car_notification(
  p_recipient_id uuid,
  p_title text,
  p_body text,
  p_car_id text default null,
  p_vin text default null,
  p_route text default null,
  p_priority text default 'normal'
) returns uuid as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (
    type,
    title,
    body,
    entity_id,
    route,
    recipient_id,
    meta
  ) values (
    'car',
    p_title,
    p_body,
    coalesce(p_car_id, p_vin),
    coalesce(p_route, '/car-inventory'),
    p_recipient_id,
    jsonb_build_object('priority', p_priority, 'vin', p_vin, 'car_id', p_car_id)
  ) returning id into notification_id;
  
  return notification_id;
end;
$$ language plpgsql security definer;

-- Function to create a request notification
create or replace function create_request_notification(
  p_recipient_id uuid,
  p_title text,
  p_body text,
  p_request_id text default null,
  p_requires_action boolean default false,
  p_route text default null,
  p_priority text default 'normal'
) returns uuid as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (
    type,
    title,
    body,
    entity_id,
    route,
    recipient_id,
    action_required,
    meta
  ) values (
    'request',
    p_title,
    p_body,
    p_request_id,
    coalesce(p_route, '/message-center'),
    p_recipient_id,
    p_requires_action,
    jsonb_build_object('priority', p_priority, 'request_id', p_request_id)
  ) returning id into notification_id;
  
  return notification_id;
end;
$$ language plpgsql security definer;

-- Function to mark notification as read
create or replace function mark_notification_read(p_notification_id uuid)
returns boolean as $$
begin
  update public.notifications 
  set read_at = now() 
  where id = p_notification_id 
    and recipient_id = auth.uid();
  
  return found;
end;
$$ language plpgsql security definer;

-- Function to get unread count for user by type
create or replace function get_unread_notification_count(
  p_user_id uuid,
  p_type text default null
)
returns integer as $$
begin
  if p_type is null then
    return (
      select count(*)::integer
      from public.notifications
      where recipient_id = p_user_id
        and read_at is null
    );
  else
    return (
      select count(*)::integer
      from public.notifications
      where recipient_id = p_user_id
        and type = p_type
        and read_at is null
    );
  end if;
end;
$$ language plpgsql security definer;

-- =====================================================
-- Sample data for testing (remove in production)
-- =====================================================

-- Insert sample notifications for testing
-- Note: Replace 'user-uuid-here' with actual user UUIDs from your auth.users table

/*
-- Sample message notification
select create_message_notification(
  'user-uuid-here'::uuid,
  'Khalil Mansour',
  'The Voyah Free is ready for PDI inspection. Please check the electrical systems.',
  'chat-123',
  '/message-center'
);

-- Sample car notification  
select create_car_notification(
  'user-uuid-here'::uuid,
  'Car Moved to Showroom Floor 1',
  'VOYAH FREE • VIN: LDP95H961SE900274 has been moved from garage to showroom.',
  'car-456',
  'LDP95H961SE900274',
  '/car-inventory',
  'high'
);

-- Sample request notification
select create_request_notification(
  'user-uuid-here'::uuid,
  'Approve Parts Purchase (USD 450)',
  'Mike Johnson requested front brake pads and rotors for Tesla Model 3 repair.',
  'request-789',
  true,
  '/message-center',
  'urgent'
);
*/

-- =====================================================
-- Enable realtime for notifications table
-- =====================================================
-- Note: This needs to be enabled in Supabase Dashboard under:
-- Database → Replication → Add table → notifications
-- Or you can run this if you have sufficient permissions:

-- alter publication supabase_realtime add table public.notifications;

-- =====================================================
-- Comments and documentation
-- =====================================================

comment on table public.notifications is 'Unified notification system for messages, car updates, and requests';
comment on column public.notifications.type is 'Type of notification: message, car, or request';
comment on column public.notifications.entity_id is 'ID of the related entity (chat_id, car_id, request_id)';
comment on column public.notifications.route is 'Frontend route to navigate to when notification is opened';
comment on column public.notifications.meta is 'Additional metadata as JSON (priority, sender info, etc.)';
comment on column public.notifications.action_required is 'Whether this notification requires user action (approve/deny)';
comment on column public.notifications.action_state is 'State of required action: pending, accepted, or denied';

-- Migration completed successfully
-- Next steps:
-- 1. Enable realtime replication for notifications table in Supabase Dashboard
-- 2. Integrate TopRightNotificationCenters component into your layout
-- 3. Start creating notifications from your app using the helper functions
