-- API Integrations Tables for Monza S.A.L.
-- This migration creates tables for supplier and banking integrations

-- Supplier Configuration Table
CREATE TABLE IF NOT EXISTS supplier_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    api_endpoint TEXT NOT NULL,
    api_key TEXT NOT NULL,
    auth_type TEXT CHECK (auth_type IN ('bearer', 'api_key', 'basic')) DEFAULT 'bearer',
    is_active BOOLEAN DEFAULT true,
    supported_operations TEXT[] DEFAULT ARRAY['quote', 'purchase', 'inventory', 'tracking'],
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Configuration Table
CREATE TABLE IF NOT EXISTS bank_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name TEXT NOT NULL,
    api_endpoint TEXT NOT NULL,
    api_key TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('checking', 'savings', 'business')) DEFAULT 'business',
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    features TEXT[] DEFAULT ARRAY['balance_inquiry', 'payments', 'transaction_history'],
    contact_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Part Quotes Table
CREATE TABLE IF NOT EXISTS part_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_number TEXT NOT NULL,
    part_name TEXT,
    supplier TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    availability TEXT CHECK (availability IN ('in_stock', 'on_order', 'discontinued')) DEFAULT 'on_order',
    lead_time INTEGER DEFAULT 7, -- days
    minimum_quantity INTEGER DEFAULT 1,
    quoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(part_number, supplier)
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES supplier_configs(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('draft', 'sent', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'draft',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    tracking_number TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Inventory Table
CREATE TABLE IF NOT EXISTS supplier_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_number TEXT NOT NULL,
    supplier TEXT NOT NULL,
    available_quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(part_number, supplier)
);

-- Account Balances Table
CREATE TABLE IF NOT EXISTS account_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES bank_configs(id) ON DELETE CASCADE,
    available DECIMAL(15,2) NOT NULL DEFAULT 0,
    current DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES bank_configs(id) ON DELETE CASCADE,
    external_id TEXT, -- Bank's transaction ID
    type TEXT CHECK (type IN ('debit', 'credit')) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    reference TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    balance_after DECIMAL(15,2),
    fees DECIMAL(8,2) DEFAULT 0,
    category TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, external_id)
);

-- Account Reconciliations Table
CREATE TABLE IF NOT EXISTS account_reconciliations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES bank_configs(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    expected_balance DECIMAL(15,2) NOT NULL,
    actual_balance DECIMAL(15,2) NOT NULL,
    difference DECIMAL(15,2) GENERATED ALWAYS AS (actual_balance - expected_balance) STORED,
    is_reconciled BOOLEAN DEFAULT false,
    discrepancies INTEGER DEFAULT 0,
    notes TEXT,
    reconciled_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Logs Table for debugging and monitoring
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type TEXT CHECK (service_type IN ('supplier', 'banking')) NOT NULL,
    service_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Integration Status Table
CREATE TABLE IF NOT EXISTS integration_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_type TEXT CHECK (integration_type IN ('supplier', 'banking')) NOT NULL,
    integration_id UUID NOT NULL,
    is_connected BOOLEAN DEFAULT false,
    last_connected TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    sync_enabled BOOLEAN DEFAULT false,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_type, integration_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_part_quotes_part_number ON part_quotes(part_number);
CREATE INDEX IF NOT EXISTS idx_part_quotes_supplier ON part_quotes(supplier);
CREATE INDEX IF NOT EXISTS idx_part_quotes_valid_until ON part_quotes(valid_until);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_supplier_inventory_part_number ON supplier_inventory(part_number);
CREATE INDEX IF NOT EXISTS idx_supplier_inventory_supplier ON supplier_inventory(supplier);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

CREATE INDEX IF NOT EXISTS idx_api_logs_service_type ON api_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);

CREATE INDEX IF NOT EXISTS idx_integration_status_type_id ON integration_status(integration_type, integration_id);

-- Insert sample supplier configurations
INSERT INTO supplier_configs (name, api_endpoint, api_key, supported_operations, contact_email) VALUES
('AutoParts Direct', 'https://api.autopartsdirect.com', 'sample_api_key_1', ARRAY['quote', 'purchase', 'inventory'], 'orders@autopartsdirect.com'),
('EV Components Ltd', 'https://api.evcomponents.com', 'sample_api_key_2', ARRAY['quote', 'inventory', 'tracking'], 'sales@evcomponents.com'),
('Voyah Parts Supply', 'https://api.voyahparts.com', 'sample_api_key_3', ARRAY['quote', 'purchase', 'inventory', 'tracking'], 'support@voyahparts.com')
ON CONFLICT DO NOTHING;

-- Insert sample bank configuration
INSERT INTO bank_configs (bank_name, api_endpoint, api_key, account_number, account_type, currency, features) VALUES
('Commercial Bank Lebanon', 'https://api.cbl.com.lb', 'sample_bank_api_key', '123456789', 'business', 'USD', ARRAY['balance_inquiry', 'payments', 'transaction_history'])
ON CONFLICT DO NOTHING;

-- Create functions for API integration management

-- Function to log API requests
CREATE OR REPLACE FUNCTION log_api_request(
    p_service_type TEXT,
    p_service_id UUID,
    p_endpoint TEXT,
    p_method TEXT,
    p_request_data JSONB DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL,
    p_status_code INTEGER DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO api_logs (
        service_type, service_id, endpoint, method, request_data, 
        response_data, status_code, response_time_ms, error_message, user_id
    ) VALUES (
        p_service_type, p_service_id, p_endpoint, p_method, p_request_data,
        p_response_data, p_status_code, p_response_time_ms, p_error_message, p_user_id
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update integration status
CREATE OR REPLACE FUNCTION update_integration_status(
    p_integration_type TEXT,
    p_integration_id UUID,
    p_is_connected BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO integration_status (
        integration_type, integration_id, is_connected, last_connected, last_error, error_count
    ) VALUES (
        p_integration_type, p_integration_id, p_is_connected, 
        CASE WHEN p_is_connected THEN NOW() ELSE NULL END,
        p_error_message,
        CASE WHEN p_is_connected THEN 0 ELSE 1 END
    )
    ON CONFLICT (integration_type, integration_id) DO UPDATE SET
        is_connected = p_is_connected,
        last_connected = CASE WHEN p_is_connected THEN NOW() ELSE integration_status.last_connected END,
        last_error = p_error_message,
        error_count = CASE 
            WHEN p_is_connected THEN 0 
            ELSE integration_status.error_count + 1 
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old API logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get supplier quotes summary
CREATE OR REPLACE FUNCTION get_supplier_quotes_summary(p_part_number TEXT)
RETURNS TABLE (
    supplier TEXT,
    price DECIMAL(10,2),
    currency TEXT,
    availability TEXT,
    lead_time INTEGER,
    valid_until TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pq.supplier,
        pq.price,
        pq.currency,
        pq.availability,
        pq.lead_time,
        pq.valid_until
    FROM part_quotes pq
    WHERE pq.part_number = p_part_number
    AND pq.valid_until > NOW()
    ORDER BY pq.price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER update_supplier_configs_updated_at
    BEFORE UPDATE ON supplier_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_configs_updated_at
    BEFORE UPDATE ON bank_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_inventory_updated_at
    BEFORE UPDATE ON supplier_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_status_updated_at
    BEFORE UPDATE ON integration_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all new tables
ALTER TABLE supplier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view supplier configs" ON supplier_configs FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'suppliers'));

CREATE POLICY "Admins can manage supplier configs" ON supplier_configs FOR ALL
    USING (check_user_permission(auth.uid(), 'update', 'suppliers'));

CREATE POLICY "Users can view bank configs" ON bank_configs FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'banking'));

CREATE POLICY "Finance users can manage bank configs" ON bank_configs FOR ALL
    USING (check_user_permission(auth.uid(), 'update', 'banking'));

CREATE POLICY "Users can view quotes" ON part_quotes FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'inventory'));

CREATE POLICY "Users can view purchase orders" ON purchase_orders FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'inventory'));

CREATE POLICY "Users can create purchase orders" ON purchase_orders FOR INSERT
    WITH CHECK (check_user_permission(auth.uid(), 'create', 'inventory'));

CREATE POLICY "Users can view transactions" ON transactions FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'banking'));

CREATE POLICY "System can insert API logs" ON api_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view API logs" ON api_logs FOR SELECT
    USING (check_user_permission(auth.uid(), 'read', 'audit'));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 