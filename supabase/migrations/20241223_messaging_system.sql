-- Messaging and Request Center Database Schema
-- Created: 2024-12-23

-- Channels (teams, cars, ad-hoc groups)
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('team','car','ad-hoc')) NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages (with optional thread_root for replies)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  body text NOT NULL,
  thread_root uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  mentions uuid[] DEFAULT '{}',     -- user ids
  attachments jsonb DEFAULT '[]',   -- [{url, name, type, size}]
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Requests (structured items, linkable from messages)
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,                    -- 'Parts','Sales','Garage','Other', etc
  priority text CHECK (priority IN ('urgent','medium','low')) DEFAULT 'medium',
  status text CHECK (status IN ('open','in_progress','blocked','done','cancelled')) DEFAULT 'open',
  created_by uuid REFERENCES auth.users(id),
  assignee_id uuid REFERENCES auth.users(id),
  recipients text[] DEFAULT '{}',   -- ['Owners','Assistants','Garage Manager',...]
  channel_id uuid REFERENCES public.channels(id),  -- where it was created
  related_car_id uuid,              -- optional: link a car
  sla_due_at timestamptz,           -- for breach calc
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Request activity log
CREATE TABLE IF NOT EXISTS public.request_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,             -- 'created', 'assigned', 'status_changed', 'commented'
  old_value text,
  new_value text,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN ('request','message','car','mention')) NOT NULL,
  ref_id uuid,                      -- request_id or message_id or car_id
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Helpful views for the request center
CREATE OR REPLACE VIEW public.view_request_summary AS
SELECT
  r.id, r.title, r.priority, r.status, r.category,
  r.assignee_id, r.recipients, r.sla_due_at,
  (now() > r.sla_due_at) AS sla_breached,
  r.created_at, r.updated_at,
  u1.email AS created_by_email,
  u2.email AS assignee_email,
  c.name AS channel_name
FROM public.requests r
LEFT JOIN auth.users u1 ON r.created_by = u1.id
LEFT JOIN auth.users u2 ON r.assignee_id = u2.id
LEFT JOIN public.channels c ON r.channel_id = c.id;

-- View for message threads
CREATE OR REPLACE VIEW public.view_message_threads AS
SELECT
  m.id, m.channel_id, m.author_id, m.body,
  m.thread_root, m.mentions, m.attachments,
  m.created_at, m.edited_at,
  u.email AS author_email,
  c.name AS channel_name,
  COUNT(replies.id) AS reply_count
FROM public.messages m
LEFT JOIN auth.users u ON m.author_id = u.id
LEFT JOIN public.channels c ON m.channel_id = c.id
LEFT JOIN public.messages replies ON replies.thread_root = m.id
GROUP BY m.id, u.email, c.name;

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Channels: authenticated users can read all, but only admins can create/modify
CREATE POLICY "Anyone can view channels" ON public.channels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage channels" ON public.channels
  FOR ALL USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
  );

-- Messages: channel members can read/write
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their messages" ON public.messages
  FOR UPDATE USING (auth.uid() = author_id);

-- Requests: flexible access based on role and assignment
CREATE POLICY "Users can view relevant requests" ON public.requests
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Request creator
      created_by = auth.uid() OR
      -- Assigned user
      assignee_id = auth.uid() OR
      -- Owners/admins see all
      auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
    )
  );

CREATE POLICY "Users can create requests" ON public.requests
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authorized users can update requests" ON public.requests
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() = assignee_id OR
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
  );

-- Request activities: read for request viewers, write for actors
CREATE POLICY "Users can view request activities" ON public.request_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests r 
      WHERE r.id = request_id AND (
        r.created_by = auth.uid() OR
        r.assignee_id = auth.uid() OR
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'owner', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can create request activities" ON public.request_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: users see only their own
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_root ON public.messages(thread_root);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON public.requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_assignee ON public.requests(assignee_id);
CREATE INDEX IF NOT EXISTS idx_requests_sla_due ON public.requests(sla_due_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

-- Create default channels
INSERT INTO public.channels (name, type, description, created_by) VALUES
  ('General', 'team', 'General team discussions', NULL),
  ('Garage', 'team', 'Garage and service discussions', NULL),
  ('Sales', 'team', 'Sales team coordination', NULL),
  ('Parts', 'team', 'Parts and inventory discussions', NULL)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

GRANT SELECT ON public.view_request_summary TO authenticated;
GRANT SELECT ON public.view_message_threads TO authenticated;
