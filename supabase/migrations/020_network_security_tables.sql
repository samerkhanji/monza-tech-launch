-- Network Security Tables for Monza Tech Software
-- This migration creates tables for managing authorized networks

-- Authorized Networks Table
CREATE TABLE IF NOT EXISTS authorized_networks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    network_range TEXT NOT NULL, -- CIDR notation e.g., "192.168.1.0/24"
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    allowed_features TEXT[] DEFAULT ARRAY['*'], -- Features this network can access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(network_range)
);

-- Network Access Logs Table
CREATE TABLE IF NOT EXISTS network_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES authorized_networks(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feature TEXT NOT NULL, -- Which feature was accessed
    success BOOLEAN NOT NULL,
    reason TEXT, -- Why access was granted/denied
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Network Security Settings Table
CREATE TABLE IF NOT EXISTS network_security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default security settings
INSERT INTO network_security_settings (setting_key, setting_value, description) VALUES
('default_features', '["*"]'::jsonb, 'Default features allowed for new networks'),
('max_failed_attempts', '5'::jsonb, 'Maximum failed access attempts before blocking'),
('session_timeout_minutes', '480'::jsonb, 'Session timeout in minutes (8 hours)'),
('require_network_auth', 'true'::jsonb, 'Whether network authorization is required'),
('allowed_countries', '["LB", "US", "CA", "GB"]'::jsonb, 'Allowed countries for network access'),
('blocked_ips', '[]'::jsonb, 'List of blocked IP addresses')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_authorized_networks_range ON authorized_networks(network_range);
CREATE INDEX IF NOT EXISTS idx_authorized_networks_active ON authorized_networks(is_active);
CREATE INDEX IF NOT EXISTS idx_network_access_logs_network_id ON network_access_logs(network_id);
CREATE INDEX IF NOT EXISTS idx_network_access_logs_access_time ON network_access_logs(access_time);
CREATE INDEX IF NOT EXISTS idx_network_access_logs_ip_address ON network_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_access_logs_success ON network_access_logs(success);

-- Function to check if IP is in network range
CREATE OR REPLACE FUNCTION is_ip_in_network(ip_address INET, network_range TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    network_ip INET;
    prefix_length INTEGER;
BEGIN
    -- Parse network range (e.g., "192.168.1.0/24")
    network_ip := split_part(network_range, '/', 1)::INET;
    prefix_length := split_part(network_range, '/', 2)::INTEGER;
    
    -- Check if IP is in the network range
    RETURN ip_address << network_ip OR ip_address = network_ip;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get network info for IP
CREATE OR REPLACE FUNCTION get_network_for_ip(ip_address INET)
RETURNS TABLE (
    network_id UUID,
    network_name TEXT,
    network_range TEXT,
    is_active BOOLEAN,
    allowed_features TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.id,
        an.name,
        an.network_range,
        an.is_active,
        an.allowed_features
    FROM authorized_networks an
    WHERE is_ip_in_network(ip_address, an.network_range)
    AND an.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to log network access
CREATE OR REPLACE FUNCTION log_network_access(
    p_network_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_feature TEXT,
    p_success BOOLEAN,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO network_access_logs (
        network_id, ip_address, user_agent, feature, success, reason
    ) VALUES (
        p_network_id, p_ip_address, p_user_agent, p_feature, p_success, p_reason
    ) RETURNING id INTO log_id;
    
    -- Update access count and last accessed time
    UPDATE authorized_networks 
    SET 
        access_count = access_count + 1,
        last_accessed = NOW()
    WHERE id = p_network_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check network authorization
CREATE OR REPLACE FUNCTION check_network_authorization(
    p_ip_address INET,
    p_feature TEXT DEFAULT '*'
)
RETURNS TABLE (
    authorized BOOLEAN,
    network_id UUID,
    network_name TEXT,
    message TEXT
) AS $$
DECLARE
    network_record RECORD;
BEGIN
    -- Check if network authorization is required
    IF NOT (SELECT setting_value::BOOLEAN FROM network_security_settings WHERE setting_key = 'require_network_auth') THEN
        RETURN QUERY SELECT true, NULL::UUID, 'No Auth Required'::TEXT, 'Network authorization disabled'::TEXT;
        RETURN;
    END IF;
    
    -- Get network for IP
    SELECT * INTO network_record FROM get_network_for_ip(p_ip_address);
    
    IF network_record IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Unknown'::TEXT, 'IP not in authorized network'::TEXT;
        RETURN;
    END IF;
    
    IF NOT network_record.is_active THEN
        RETURN QUERY SELECT false, network_record.network_id, network_record.network_name, 'Network is disabled'::TEXT;
        RETURN;
    END IF;
    
    -- Check feature access
    IF NOT (p_feature = ANY(network_record.allowed_features) OR '*' = ANY(network_record.allowed_features)) THEN
        RETURN QUERY SELECT false, network_record.network_id, network_record.network_name, 
            format('Feature %s not allowed for this network', p_feature)::TEXT;
        RETURN;
    END IF;
    
    -- Log successful access
    PERFORM log_network_access(
        network_record.network_id, 
        p_ip_address, 
        current_setting('request.headers')::json->>'user-agent',
        p_feature, 
        true
    );
    
    RETURN QUERY SELECT true, network_record.network_id, network_record.network_name, 
        format('Access granted from network %s', network_record.network_name)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get network statistics
CREATE OR REPLACE FUNCTION get_network_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    network_id UUID,
    network_name TEXT,
    total_accesses BIGINT,
    successful_accesses BIGINT,
    failed_accesses BIGINT,
    last_access TIMESTAMP WITH TIME ZONE,
    unique_ips BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.id,
        an.name,
        COUNT(nal.id) as total_accesses,
        COUNT(nal.id) FILTER (WHERE nal.success = true) as successful_accesses,
        COUNT(nal.id) FILTER (WHERE nal.success = false) as failed_accesses,
        MAX(nal.access_time) as last_access,
        COUNT(DISTINCT nal.ip_address) as unique_ips
    FROM authorized_networks an
    LEFT JOIN network_access_logs nal ON an.id = nal.network_id
    AND nal.access_time >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY an.id, an.name
    ORDER BY total_accesses DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tables
ALTER TABLE authorized_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_security_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage authorized networks" ON authorized_networks FOR ALL
    USING (check_user_permission(auth.uid(), 'update', 'security'));

CREATE POLICY "Users can view authorized networks" ON authorized_networks FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'security'));

CREATE POLICY "System can insert network access logs" ON network_access_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view network access logs" ON network_access_logs FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'audit'));

CREATE POLICY "Admins can manage security settings" ON network_security_settings FOR ALL
    USING (check_user_permission(auth.uid(), 'update', 'security'));

CREATE POLICY "Users can view security settings" ON network_security_settings FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'security'));

-- Apply updated_at triggers
CREATE TRIGGER update_authorized_networks_updated_at
    BEFORE UPDATE ON authorized_networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_security_settings_updated_at
    BEFORE UPDATE ON network_security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 