-- Row Level Security Setup for Monza S.A.L.
-- This migration adds comprehensive RLS policies for data security

-- Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create roles table for permission management
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'viewer')),
    department TEXT CHECK (department IN ('sales', 'service', 'parts', 'finance', 'management')),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('cars.read', 'View car inventory', 'cars', 'read'),
('cars.create', 'Add new cars', 'cars', 'create'),
('cars.update', 'Update car information', 'cars', 'update'),
('cars.delete', 'Delete cars', 'cars', 'delete'),
('repairs.read', 'View repair history', 'repairs', 'read'),
('repairs.create', 'Create repair records', 'repairs', 'create'),
('repairs.update', 'Update repair status', 'repairs', 'update'),
('repairs.delete', 'Delete repair records', 'repairs', 'delete'),
('inventory.read', 'View inventory', 'inventory', 'read'),
('inventory.create', 'Add inventory items', 'inventory', 'create'),
('inventory.update', 'Update inventory', 'inventory', 'update'),
('inventory.delete', 'Delete inventory items', 'inventory', 'delete'),
('schedule.read', 'View schedule', 'schedule', 'read'),
('schedule.create', 'Create schedule items', 'schedule', 'create'),
('schedule.update', 'Update schedule', 'schedule', 'update'),
('schedule.delete', 'Delete schedule items', 'schedule', 'delete'),
('users.read', 'View user information', 'users', 'read'),
('users.create', 'Create user accounts', 'users', 'create'),
('users.update', 'Update user information', 'users', 'update'),
('users.delete', 'Delete user accounts', 'users', 'delete'),
('audit.read', 'View audit logs', 'audit', 'read'),
('reports.read', 'View reports', 'reports', 'read'),
('reports.export', 'Export reports', 'reports', 'export')
ON CONFLICT (name) DO NOTHING;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_roles.user_id = get_user_role.user_id
    AND is_active = true
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user permission
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, action_name TEXT, resource_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    has_permission BOOLEAN := false;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM user_roles WHERE user_roles.user_id = check_user_permission.user_id AND is_active = true;
    
    -- Admin has all permissions
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Check specific permissions
    SELECT EXISTS(
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = check_user_permission.user_id
        AND ur.is_active = true
        AND (
            ur.permissions ? (resource_name || '.' || action_name) OR
            ur.permissions ? (resource_name || '.*') OR
            ur.permissions ? '*'
        )
    ) INTO has_permission;
    
    -- Default permissions based on role
    IF NOT has_permission THEN
        CASE user_role
            WHEN 'manager' THEN
                -- Managers can read/update most things
                has_permission := action_name IN ('read', 'update', 'create');
            WHEN 'employee' THEN
                -- Employees can read and update their work
                has_permission := action_name IN ('read', 'update');
            WHEN 'viewer' THEN
                -- Viewers can only read
                has_permission := action_name = 'read';
        END CASE;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data validation function
CREATE OR REPLACE FUNCTION validate_data(data_type TEXT, data_payload JSONB, context_data JSONB DEFAULT '{}'::jsonb)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN := true;
BEGIN
    CASE data_type
        WHEN 'car' THEN
            -- Validate car data
            IF NOT (data_payload ? 'vinNumber') OR LENGTH(data_payload->>'vinNumber') != 17 THEN
                RAISE EXCEPTION 'Invalid VIN number';
            END IF;
            
            IF NOT (data_payload ? 'model') OR LENGTH(TRIM(data_payload->>'model')) = 0 THEN
                RAISE EXCEPTION 'Car model is required';
            END IF;
            
        WHEN 'repair' THEN
            -- Validate repair data
            IF NOT (data_payload ? 'carId') THEN
                RAISE EXCEPTION 'Car ID is required for repairs';
            END IF;
            
            IF NOT (data_payload ? 'description') OR LENGTH(TRIM(data_payload->>'description')) = 0 THEN
                RAISE EXCEPTION 'Repair description is required';
            END IF;
            
        WHEN 'inventory' THEN
            -- Validate inventory data
            IF NOT (data_payload ? 'partName') OR LENGTH(TRIM(data_payload->>'partName')) = 0 THEN
                RAISE EXCEPTION 'Part name is required';
            END IF;
            
            IF NOT (data_payload ? 'quantity') OR (data_payload->>'quantity')::INTEGER < 0 THEN
                RAISE EXCEPTION 'Valid quantity is required';
            END IF;
    END CASE;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for cars table
CREATE POLICY "Users can view cars" ON cars FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'cars'));

CREATE POLICY "Users can insert cars" ON cars FOR INSERT
    WITH CHECK (check_user_permission(auth.uid(), 'create', 'cars'));

CREATE POLICY "Users can update cars" ON cars FOR UPDATE
    USING (check_user_permission(auth.uid(), 'update', 'cars'))
    WITH CHECK (check_user_permission(auth.uid(), 'update', 'cars'));

CREATE POLICY "Users can delete cars" ON cars FOR DELETE
    USING (check_user_permission(auth.uid(), 'delete', 'cars'));

-- RLS Policies for garage_schedule table
CREATE POLICY "Users can view schedule" ON garage_schedule FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'schedule'));

CREATE POLICY "Users can insert schedule" ON garage_schedule FOR INSERT
    WITH CHECK (check_user_permission(auth.uid(), 'create', 'schedule'));

CREATE POLICY "Users can update schedule" ON garage_schedule FOR UPDATE
    USING (check_user_permission(auth.uid(), 'update', 'schedule'))
    WITH CHECK (check_user_permission(auth.uid(), 'update', 'schedule'));

CREATE POLICY "Users can delete schedule" ON garage_schedule FOR DELETE
    USING (check_user_permission(auth.uid(), 'delete', 'schedule'));

-- RLS Policies for repair_history table
CREATE POLICY "Users can view repairs" ON repair_history FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'repairs'));

CREATE POLICY "Users can insert repairs" ON repair_history FOR INSERT
    WITH CHECK (check_user_permission(auth.uid(), 'create', 'repairs'));

CREATE POLICY "Users can update repairs" ON repair_history FOR UPDATE
    USING (check_user_permission(auth.uid(), 'update', 'repairs'))
    WITH CHECK (check_user_permission(auth.uid(), 'update', 'repairs'));

CREATE POLICY "Technicians can update their repairs" ON repair_history FOR UPDATE
    USING (technician = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for inventory table
CREATE POLICY "Users can view inventory" ON inventory FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'inventory'));

CREATE POLICY "Users can insert inventory" ON inventory FOR INSERT
    WITH CHECK (check_user_permission(auth.uid(), 'create', 'inventory'));

CREATE POLICY "Users can update inventory" ON inventory FOR UPDATE
    USING (check_user_permission(auth.uid(), 'update', 'inventory'))
    WITH CHECK (check_user_permission(auth.uid(), 'update', 'inventory'));

-- RLS Policies for users table
CREATE POLICY "Users can view user info" ON users FOR SELECT
    USING (
        id = auth.uid() OR -- Users can see their own info
        check_user_permission(auth.uid(), 'read', 'users')
    );

CREATE POLICY "Admins can manage users" ON users FOR ALL
    USING (check_user_permission(auth.uid(), 'update', 'users'));

-- RLS Policies for user_activity table
CREATE POLICY "Users can view their activity" ON user_activity FOR SELECT
    USING (
        user_id = auth.uid() OR
        check_user_permission(auth.uid(), 'read', 'audit')
    );

CREATE POLICY "System can insert activity" ON user_activity FOR INSERT
    WITH CHECK (true); -- Allow system to log activity

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'audit'));

CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT
    WITH CHECK (true); -- Allow system to create audit logs

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables that have the column
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', r.table_name, r.table_name);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                       r.table_name, r.table_name);
    END LOOP;
END $$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        auth.uid(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER cars_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cars
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER repair_history_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON repair_history
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER inventory_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create validation_logs table for tracking validation failures
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    errors JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_validation_logs_entity_type ON validation_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_validation_logs_user_id ON validation_logs(user_id);

-- Create a default admin user role (replace with actual admin user ID)
-- This should be run after user registration
-- INSERT INTO user_roles (user_id, role, department, permissions) 
-- VALUES ('your-admin-user-id', 'admin', 'management', '["*"]'::jsonb); 