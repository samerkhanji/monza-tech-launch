-- Network Access Control Tables for Monza Tech Software
-- This migration creates tables for managing authorized networks

-- Network Configuration Table
CREATE TABLE IF NOT EXISTS network_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name TEXT NOT NULL,
    network_address TEXT NOT NULL, -- e.g., "192.168.1.0/24"
    subnet_mask TEXT NOT NULL,
    gateway TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    allowed_ports INTEGER[] DEFAULT ARRAY[5173, 3000, 8080],
    access_level TEXT CHECK (access_level IN ('full', 'readonly', 'limited')) DEFAULT 'full',
    description TEXT,
    registered_by TEXT NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network Access Logs Table
CREATE TABLE IF NOT EXISTS network_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES network_configs(id) ON DELETE CASCADE,
    client_ip TEXT NOT NULL,
    user_agent TEXT,
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- milliseconds
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network Security Events Table
CREATE TABLE IF NOT EXISTS network_security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('unauthorized_access', 'suspicious_activity', 'network_registration', 'network_removal')),
    network_id UUID REFERENCES network_configs(id) ON DELETE SET NULL,
    client_ip TEXT,
    user_agent TEXT,
    event_data JSONB DEFAULT '{}'::jsonb,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    description TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_network_configs_network_address ON network_configs(network_address);
CREATE INDEX IF NOT EXISTS idx_network_configs_is_active ON network_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_network_configs_access_level ON network_configs(access_level);

CREATE INDEX IF NOT EXISTS idx_network_access_logs_network_id ON network_access_logs(network_id);
CREATE INDEX IF NOT EXISTS idx_network_access_logs_access_time ON network_access_logs(access_time);
CREATE INDEX IF NOT EXISTS idx_network_access_logs_client_ip ON network_access_logs(client_ip);

CREATE INDEX IF NOT EXISTS idx_network_security_events_event_type ON network_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_network_security_events_severity ON network_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_network_security_events_created_at ON network_security_events(created_at);

-- Function to check if IP is in authorized network
CREATE OR REPLACE FUNCTION is_ip_authorized(client_ip TEXT)
RETURNS TABLE (
    authorized BOOLEAN,
    network_id UUID,
    access_level TEXT,
    network_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as authorized,
        nc.id as network_id,
        nc.access_level,
        nc.network_name
    FROM network_configs nc
    WHERE nc.is_active = true
    AND (
        -- Check if IP matches network address pattern
        (nc.network_address LIKE '192.168.1.%' AND client_ip LIKE '192.168.1.%') OR
        (nc.network_address LIKE '192.168.0.%' AND client_ip LIKE '192.168.0.%') OR
        (nc.network_address LIKE '10.0.%' AND client_ip LIKE '10.0.%') OR
        (nc.network_address LIKE '172.16.%' AND client_ip LIKE '172.16.%') OR
        (nc.network_address LIKE '172.17.%' AND client_ip LIKE '172.17.%') OR
        (nc.network_address LIKE '172.18.%' AND client_ip LIKE '172.18.%') OR
        (nc.network_address LIKE '172.19.%' AND client_ip LIKE '172.19.%') OR
        (nc.network_address LIKE '172.20.%' AND client_ip LIKE '172.20.%') OR
        (nc.network_address LIKE '172.21.%' AND client_ip LIKE '172.21.%') OR
        (nc.network_address LIKE '172.22.%' AND client_ip LIKE '172.22.%') OR
        (nc.network_address LIKE '172.23.%' AND client_ip LIKE '172.23.%') OR
        (nc.network_address LIKE '172.24.%' AND client_ip LIKE '172.24.%') OR
        (nc.network_address LIKE '172.25.%' AND client_ip LIKE '172.25.%') OR
        (nc.network_address LIKE '172.26.%' AND client_ip LIKE '172.26.%') OR
        (nc.network_address LIKE '172.27.%' AND client_ip LIKE '172.27.%') OR
        (nc.network_address LIKE '172.28.%' AND client_ip LIKE '172.28.%') OR
        (nc.network_address LIKE '172.29.%' AND client_ip LIKE '172.29.%') OR
        (nc.network_address LIKE '172.30.%' AND client_ip LIKE '172.30.%') OR
        (nc.network_address LIKE '172.31.%' AND client_ip LIKE '172.31.%')
    )
    LIMIT 1;
    
    -- If no match found, return unauthorized
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log network access
CREATE OR REPLACE FUNCTION log_network_access(
    p_network_id UUID,
    p_client_ip TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_endpoint TEXT,
    p_method TEXT,
    p_status_code INTEGER DEFAULT NULL,
    p_response_time INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO network_access_logs (
        network_id, client_ip, user_agent, endpoint, method, 
        status_code, response_time, success, error_message
    ) VALUES (
        p_network_id, p_client_ip, p_user_agent, p_endpoint, p_method,
        p_status_code, p_response_time, p_success, p_error_message
    ) RETURNING id INTO log_id;
    
    -- Update access count for the network
    UPDATE network_configs 
    SET access_count = access_count + 1,
        last_accessed = NOW(),
        updated_at = NOW()
    WHERE id = p_network_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_network_id UUID DEFAULT NULL,
    p_client_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}'::jsonb,
    p_severity TEXT DEFAULT 'medium',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO network_security_events (
        event_type, network_id, client_ip, user_agent, 
        event_data, severity, description
    ) VALUES (
        p_event_type, p_network_id, p_client_ip, p_user_agent,
        p_event_data, p_severity, p_description
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get network statistics
CREATE OR REPLACE FUNCTION get_network_stats()
RETURNS TABLE (
    total_networks BIGINT,
    active_networks BIGINT,
    total_accesses BIGINT,
    recent_accesses_count BIGINT,
    security_events_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_networks,
        COUNT(*) FILTER (WHERE is_active = true) as active_networks,
        COALESCE(SUM(access_count), 0) as total_accesses,
        (SELECT COUNT(*) FROM network_access_logs WHERE access_time > NOW() - INTERVAL '24 hours') as recent_accesses_count,
        (SELECT COUNT(*) FROM network_security_events WHERE created_at > NOW() - INTERVAL '24 hours') as security_events_count
    FROM network_configs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old access logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_network_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM network_access_logs 
    WHERE access_time < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM network_security_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER update_network_configs_updated_at
    BEFORE UPDATE ON network_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all new tables
ALTER TABLE network_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage network configs" ON network_configs FOR ALL
    USING (check_user_permission(auth.uid(), 'update', 'system'));

CREATE POLICY "System can insert access logs" ON network_access_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view access logs" ON network_access_logs FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'audit'));

CREATE POLICY "System can insert security events" ON network_security_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view security events" ON network_security_events FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'audit'));

CREATE POLICY "Admins can update security events" ON network_security_events FOR UPDATE
    USING (check_user_permission(auth.uid(), 'update', 'system'));

-- Insert default network configuration for localhost
INSERT INTO network_configs (
    network_name, 
    network_address, 
    subnet_mask, 
    gateway, 
    access_level, 
    description, 
    registered_by
) VALUES (
    'Localhost Development',
    '127.0.0.1/32',
    '255.255.255.255',
    '127.0.0.1',
    'full',
    'Default localhost access for development',
    'system'
) ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 