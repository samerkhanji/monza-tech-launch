-- Complete Request + Messaging Center Migration
-- This migration creates all necessary tables, triggers, and policies for the messaging system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Requests table for structured requests
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'urgent')) NOT NULL DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'in_progress', 'done', 'pending_review')) DEFAULT 'open',
    type TEXT CHECK (type IN ('bug', 'feature', 'question', 'task', 'other')) DEFAULT 'task',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[], -- Array of tags for categorization
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for threaded conversations
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    mentions UUID[], -- Array of user IDs mentioned with @
    is_broadcast BOOLEAN DEFAULT FALSE, -- If this is a broadcast message
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For threaded replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Broadcasts table for announcements
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message_text TEXT NOT NULL,
    audience TEXT[], -- List of roles OR user IDs
    is_urgent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table for tracking mentions and assignments
CREATE TABLE IF NOT EXISTS public.request_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    notification_type TEXT CHECK (notification_type IN ('mention', 'assignment', 'status_change', 'new_request', 'broadcast')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request status history for audit trail
CREATE TABLE IF NOT EXISTS public.request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request tags for categorization
CREATE TABLE IF NOT EXISTS public.request_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON requests(created_by);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_due_date ON requests(due_date);
CREATE INDEX IF NOT EXISTS idx_requests_tags ON requests USING GIN(tags);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING GIN(mentions);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON request_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON request_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON request_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON request_notifications(created_at);

-- Broadcasts indexes
CREATE INDEX IF NOT EXISTS idx_broadcasts_sender_id ON broadcasts(sender_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at);
CREATE INDEX IF NOT EXISTS idx_broadcasts_audience ON broadcasts USING GIN(audience);

-- Status history indexes
CREATE INDEX IF NOT EXISTS idx_status_history_request_id ON request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_status_history_user_id ON request_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON request_status_history(created_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM user_profiles WHERE id = auth.uid()),
        'viewer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access request
CREATE OR REPLACE FUNCTION can_access_request(request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM requests r
        WHERE r.id = request_id
        AND (
            r.created_by = auth.uid() OR
            r.assigned_to = auth.uid() OR
            EXISTS(
                SELECT 1 FROM messages m
                WHERE m.request_id = r.id
                AND auth.uid() = ANY(m.mentions)
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage requests
CREATE OR REPLACE FUNCTION can_manage_requests()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can send broadcasts
CREATE OR REPLACE FUNCTION can_send_broadcasts()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for updating updated_at on requests
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for handling mentions in messages
CREATE OR REPLACE FUNCTION handle_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user UUID;
BEGIN
    -- Create notifications for each mentioned user
    IF NEW.mentions IS NOT NULL THEN
        FOREACH mentioned_user IN ARRAY NEW.mentions
        LOOP
            INSERT INTO request_notifications (
                user_id, request_id, message_id, notification_type, title, message
            ) VALUES (
                mentioned_user,
                NEW.request_id,
                NEW.id,
                'mention',
                'You were mentioned in a request',
                'You were mentioned in request: ' || (SELECT title FROM requests WHERE id = NEW.request_id)
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mention_notifications
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_mention_notifications();

-- Trigger for handling request assignments
CREATE OR REPLACE FUNCTION handle_assignment_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify newly assigned user
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
        INSERT INTO request_notifications (
            user_id, request_id, notification_type, title, message
        ) VALUES (
            NEW.assigned_to,
            NEW.id,
            'assignment',
            'New request assigned to you',
            'You have been assigned to: ' || NEW.title
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assignment_notifications
    AFTER INSERT OR UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_assignment_notifications();

-- Trigger for tracking status changes
CREATE OR REPLACE FUNCTION handle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO request_status_history (
            request_id, user_id, old_status, new_status
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status,
            NEW.status
        );
        
        -- Notify involved users about status change
        INSERT INTO request_notifications (
            user_id, request_id, notification_type, title, message
        )
        SELECT 
            user_id,
            NEW.id,
            'status_change',
            'Request status updated',
            'Request "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status
        FROM (
            SELECT DISTINCT created_by as user_id FROM requests WHERE id = NEW.id
            UNION
            SELECT assigned_to FROM requests WHERE id = NEW.id AND assigned_to IS NOT NULL
        ) involved_users
        WHERE user_id != auth.uid(); -- Don't notify the person making the change
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_status_change
    AFTER UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_tags ENABLE ROW LEVEL SECURITY;

-- Requests policies
CREATE POLICY "Users can view requests they created, are assigned to, or are mentioned in" ON requests
    FOR SELECT USING (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        can_manage_requests() OR
        EXISTS(
            SELECT 1 FROM messages m
            WHERE m.request_id = requests.id
            AND auth.uid() = ANY(m.mentions)
        )
    );

CREATE POLICY "Users can create requests" ON requests
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update requests they created or are assigned to" ON requests
    FOR UPDATE USING (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        can_manage_requests()
    );

CREATE POLICY "Managers and admins can delete requests" ON requests
    FOR DELETE USING (can_manage_requests());

-- Messages policies
CREATE POLICY "Users can view messages for requests they can access" ON messages
    FOR SELECT USING (can_access_request(request_id));

CREATE POLICY "Users can create messages for requests they can access" ON messages
    FOR INSERT WITH CHECK (can_access_request(request_id));

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- Broadcasts policies
CREATE POLICY "All authenticated users can view broadcasts" ON broadcasts
    FOR SELECT USING (true);

CREATE POLICY "Only authorized users can create broadcasts" ON broadcasts
    FOR INSERT WITH CHECK (can_send_broadcasts());

CREATE POLICY "Only broadcast creators can update broadcasts" ON broadcasts
    FOR UPDATE USING (sender_id = auth.uid() AND can_send_broadcasts());

CREATE POLICY "Only broadcast creators can delete broadcasts" ON broadcasts
    FOR DELETE USING (sender_id = auth.uid() AND can_send_broadcasts());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON request_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON request_notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON request_notifications
    FOR INSERT WITH CHECK (true);

-- Status history policies
CREATE POLICY "Users can view status history for requests they can access" ON request_status_history
    FOR SELECT USING (can_access_request(request_id));

CREATE POLICY "System can create status history" ON request_status_history
    FOR INSERT WITH CHECK (true);

-- Tags policies
CREATE POLICY "All authenticated users can view tags" ON request_tags
    FOR SELECT USING (true);

CREATE POLICY "Only managers and admins can manage tags" ON request_tags
    FOR ALL USING (can_manage_requests());

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample request tags
INSERT INTO request_tags (name, color, description) VALUES
('bug', '#EF4444', 'Software bugs and issues'),
('feature', '#10B981', 'New feature requests'),
('question', '#3B82F6', 'General questions'),
('task', '#F59E0B', 'General tasks'),
('urgent', '#DC2626', 'Urgent matters')
ON CONFLICT (name) DO NOTHING;

-- Insert sample requests (only if user_profiles table has data)
DO $$
DECLARE
    sample_user UUID;
BEGIN
    -- Get a sample user if available
    SELECT id INTO sample_user FROM user_profiles LIMIT 1;
    
    IF sample_user IS NOT NULL THEN
        INSERT INTO requests (title, description, priority, status, type, created_by, tags) VALUES
        ('Fix login issue', 'Users are unable to log in with their credentials', 'urgent', 'open', 'bug', sample_user, ARRAY['bug', 'urgent']),
        ('Add dark mode', 'Implement dark mode theme for better user experience', 'medium', 'open', 'feature', sample_user, ARRAY['feature']),
        ('Update documentation', 'Update API documentation with new endpoints', 'low', 'in_progress', 'task', sample_user, ARRAY['task']),
        ('Database optimization', 'Optimize database queries for better performance', 'medium', 'open', 'task', sample_user, ARRAY['task']),
        ('Security audit', 'Conduct security audit of the application', 'urgent', 'pending_review', 'task', sample_user, ARRAY['urgent'])
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- FINAL COMMENTS
-- ============================================================================

COMMENT ON TABLE requests IS 'Structured requests with title, description, priority, and status';
COMMENT ON TABLE messages IS 'Threaded conversations for each request with @mentions support';
COMMENT ON TABLE broadcasts IS 'Announcements sent to all employees or selected roles';
COMMENT ON TABLE request_notifications IS 'Notifications for mentions, assignments, and status changes';
COMMENT ON TABLE request_status_history IS 'Audit trail of request status changes';
COMMENT ON TABLE request_tags IS 'Tags for categorizing and organizing requests'; 