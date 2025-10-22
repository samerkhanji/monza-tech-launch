-- ============================================================================
-- RLS Policies for Existing Tables - Monza TECH
-- ============================================================================
-- Run this AFTER the main user roles migration (001_user_roles_permissions.sql)
-- This applies Row Level Security to your existing tables

-- ============================================================================
-- REQUESTS TABLE RLS
-- ============================================================================

-- Enable RLS on requests if not already enabled
alter table public.requests enable row level security;

-- Read policies for requests
drop policy if exists "req_select_view_all" on public.requests;
create policy "req_select_view_all"
  on public.requests for select
  using (public.has_permission('request.view_all'));

drop policy if exists "req_select_mine" on public.requests;
create policy "req_select_mine"
  on public.requests for select
  using (created_by = auth.uid() or assignee_id = auth.uid());

-- Create policies for requests
drop policy if exists "req_insert_create" on public.requests;
create policy "req_insert_create"
  on public.requests for insert
  with check (public.has_permission('request.create'));

-- Update policies for requests
drop policy if exists "req_update_all" on public.requests;
create policy "req_update_all"
  on public.requests for update
  using (public.has_permission('request.update_all'))
  with check (public.has_permission('request.update_all'));

drop policy if exists "req_update_self_fields" on public.requests;
create policy "req_update_self_fields"
  on public.requests for update
  using (created_by = auth.uid() or assignee_id = auth.uid())
  with check (
    created_by = auth.uid() or assignee_id = auth.uid()
    -- Lock sensitive columns unless you have 'request.assign'
    and (
      (assignee_id = old.assignee_id and priority = old.priority)
      or public.has_permission('request.assign')
    )
  );

-- ============================================================================
-- CHANNELS & MESSAGES RLS
-- ============================================================================

-- Create channels table if it doesn't exist
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('team','car','ad-hoc')) not null,
  created_at timestamptz default now(),
  created_by uuid references public.user_profiles(id)
);

-- Create channel members table if it doesn't exist
create table if not exists public.channel_members (
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (channel_id, user_id)
);

-- Enable RLS
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;

-- Channels: read if member or admin
drop policy if exists "ch_select_member" on public.channels;
create policy "ch_select_member"
  on public.channels for select
  using (
    exists (
      select 1 from public.channel_members cm
      where cm.channel_id = channels.id and cm.user_id = auth.uid()
    )
    or public.has_permission('request.view_all')
  );

-- Channel membership RLS
drop policy if exists "ch_members_read_self" on public.channel_members;
create policy "ch_members_read_self"
  on public.channel_members for select
  using (user_id = auth.uid() or public.has_permission('request.view_all'));

-- Messages: enable RLS if table exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'messages' and table_schema = 'public') then
    alter table public.messages enable row level security;
    
    -- Drop existing policies if they exist
    drop policy if exists "msg_select_member" on public.messages;
    drop policy if exists "msg_insert_send" on public.messages;
    drop policy if exists "msg_update_own" on public.messages;
    drop policy if exists "msg_update_all" on public.messages;
    drop policy if exists "msg_delete_own" on public.messages;
    drop policy if exists "msg_delete_all" on public.messages;
    
    -- Messages: read if member of channel OR owner
    create policy "msg_select_member"
      on public.messages for select
      using (
        exists (
          select 1 from public.channel_members cm
          where cm.channel_id = messages.channel_id and cm.user_id = auth.uid()
        )
        or public.has_permission('request.view_all')
      );

    -- Send message if member AND has 'message.send'
    create policy "msg_insert_send"
      on public.messages for insert
      with check (
        public.has_permission('message.send') and
        exists (
          select 1 from public.channel_members cm
          where cm.channel_id = messages.channel_id and cm.user_id = auth.uid()
        )
      );

    -- Edit/delete own messages
    create policy "msg_update_own"
      on public.messages for update using (author_id = auth.uid())
      with check (author_id = auth.uid());
      
    create policy "msg_delete_own"
      on public.messages for delete using (author_id = auth.uid());

    -- Owners can edit/delete all messages
    create policy "msg_update_all"
      on public.messages for update using (public.has_role('owner'))
      with check (public.has_role('owner'));
      
    create policy "msg_delete_all"
      on public.messages for delete using (public.has_role('owner'));
  end if;
end $$;

-- ============================================================================
-- INVENTORY & GARAGE TABLES (Examples)
-- ============================================================================

-- For any inventory-related tables, gate by inventory permissions
-- Example pattern:
/*
alter table public.inventory enable row level security;

create policy "inventory_view"
  on public.inventory for select
  using (public.has_permission('inventory.view'));

create policy "inventory_edit"
  on public.inventory for all
  using (public.has_permission('inventory.edit'))
  with check (public.has_permission('inventory.edit'));
*/

-- For garage/schedule tables:
/*
alter table public.garage_schedule enable row level security;

create policy "garage_view"
  on public.garage_schedule for select
  using (public.has_permission('garage.view'));

create policy "garage_edit"
  on public.garage_schedule for all
  using (public.has_permission('garage.edit'))
  with check (public.has_permission('garage.edit'));
*/

-- For sales/pricing sensitive data:
/*
alter table public.pricing enable row level security;

create policy "pricing_view"
  on public.pricing for select
  using (public.has_permission('pricing.view'));

create policy "pricing_edit"
  on public.pricing for all
  using (public.has_role('owner'))
  with check (public.has_role('owner'));
*/

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

grant select, insert, update, delete on public.channels to authenticated;
grant select, insert, update, delete on public.channel_members to authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select 'RLS policies applied successfully! ✅' as status;

-- List all tables with RLS enabled
select 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
from pg_tables 
where schemaname = 'public' 
  and rowsecurity = true
order by tablename;
