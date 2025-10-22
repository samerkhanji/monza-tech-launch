-- Complete Monza TECH Supabase Database Schema
-- This script creates all necessary tables for the complete application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CORE VEHICLE TABLES
-- ========================================

-- Main car inventory table (already exists, but let's ensure it has all fields)
ALTER TABLE public.car_inventory 
ADD COLUMN IF NOT EXISTS current_location VARCHAR(100) DEFAULT 'Showroom Floor 1',
ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS showroom_position VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_reserved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reservation_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS test_drive_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_test_drive TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS software_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS software_last_updated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS software_update_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS software_update_notes TEXT,
ADD COLUMN IF NOT EXISTS pdi_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pdi_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pdi_technician VARCHAR(100),
ADD COLUMN IF NOT EXISTS pdi_notes TEXT,
ADD COLUMN IF NOT EXISTS customs_status VARCHAR(50) DEFAULT 'not_paid',
ADD COLUMN IF NOT EXISTS customs_paid_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customs_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS customs_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS horse_power INTEGER,
ADD COLUMN IF NOT EXISTS torque INTEGER,
ADD COLUMN IF NOT EXISTS acceleration VARCHAR(50),
ADD COLUMN IF NOT EXISTS top_speed INTEGER,
ADD COLUMN IF NOT EXISTS charging_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS range_km INTEGER,
ADD COLUMN IF NOT EXISTS km_driven INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS battery_percentage INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS shipment_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS arrival_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS range_extender_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS high_voltage_battery_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS front_motor_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS rear_motor_number VARCHAR(100);

-- ========================================
-- TEST DRIVE MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS public.test_drives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.car_inventory(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    customer_license VARCHAR(100),
    test_drive_type VARCHAR(50) DEFAULT 'client', -- 'client' or 'demo'
    purpose TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    actual_duration INTEGER, -- in minutes
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    emergency_contact VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    logged_by VARCHAR(100),
    logged_by_name VARCHAR(100),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GARAGE & REPAIR MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS public.garage_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.car_inventory(id) ON DELETE CASCADE,
    garage_location VARCHAR(100) DEFAULT 'Bay 1',
    garage_status VARCHAR(50) DEFAULT 'stored', -- 'stored', 'in_repair', 'ready_for_pickup', 'awaiting_parts'
    arrival_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    assigned_technician VARCHAR(100),
    priority_level VARCHAR(20) DEFAULT 'normal',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.garage_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.car_inventory(id) ON DELETE CASCADE,
    technician_id UUID, -- Will reference employees table
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    work_type VARCHAR(100) NOT NULL, -- 'PDI', 'Repair', 'Maintenance', 'Inspection'
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.repair_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.car_inventory(id) ON DELETE CASCADE,
    repair_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    parts_used TEXT[],
    labor_hours DECIMAL(5,2),
    cost DECIMAL(10,2),
    technician VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PARTS INVENTORY (Enhanced)
-- ========================================

-- Parts inventory table already exists, but let's add missing fields
ALTER TABLE public.parts_inventory 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_quantity INTEGER,
ADD COLUMN IF NOT EXISTS supplier_contact VARCHAR(255),
ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS supplier_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_order_date DATE,
ADD COLUMN IF NOT EXISTS next_order_date DATE,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'In Stock',
ADD COLUMN IF NOT EXISTS location_details TEXT,
ADD COLUMN IF NOT EXISTS compatibility_notes TEXT,
ADD COLUMN IF NOT EXISTS warranty_info TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- ========================================
-- FINANCIAL MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'repair', 'maintenance', 'customs', 'other'
    car_id UUID REFERENCES public.car_inventory(id) ON DELETE SET NULL,
    part_id UUID REFERENCES public.parts_inventory(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'overdue'
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_address TEXT,
    interested_models TEXT[],
    budget_range VARCHAR(100),
    source VARCHAR(100), -- 'website', 'referral', 'walk_in', 'phone', 'social_media'
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost'
    assigned_to VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal',
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- EMPLOYEE MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'terminated', 'on_leave'
    manager_id UUID REFERENCES public.employees(id),
    permissions TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'car_edit', 'part_edit', 'test_drive', 'repair', 'sale'
    description TEXT NOT NULL,
    related_id UUID, -- ID of related record (car, part, etc.)
    related_type VARCHAR(50), -- Type of related record
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MESSAGING & REQUESTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'internal', -- 'internal', 'customer', 'system', 'notification'
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'unread', -- 'unread', 'read', 'archived', 'deleted'
    read_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES public.messages(id),
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    request_type VARCHAR(100) NOT NULL, -- 'car_move', 'part_order', 'repair_approval', 'customs_clearance', 'test_drive_approval'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'in_progress', 'completed'
    assigned_to UUID REFERENCES public.employees(id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SHIPPING & ORDERS
-- ========================================

CREATE TABLE IF NOT EXISTS public.ordered_cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    car_model VARCHAR(100) NOT NULL,
    car_color VARCHAR(50),
    car_specifications TEXT,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'in_production', 'shipped', 'delivered', 'cancelled'
    total_amount DECIMAL(12,2),
    deposit_amount DECIMAL(12,2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.ordered_cars(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100),
    shipping_company VARCHAR(100),
    origin_port VARCHAR(100),
    destination_port VARCHAR(100),
    departure_date DATE,
    arrival_date DATE,
    eta_date DATE,
    current_status VARCHAR(100),
    current_location VARCHAR(255),
    status_updates JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CALENDAR & SCHEDULING
-- ========================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'meeting', 'appointment', 'test_drive', 'delivery', 'maintenance', 'custom'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT false,
    location VARCHAR(255),
    attendees TEXT[],
    organizer_id UUID REFERENCES public.employees(id),
    related_id UUID, -- ID of related record
    related_type VARCHAR(50), -- Type of related record
    color VARCHAR(20),
    recurring_pattern VARCHAR(100), -- 'daily', 'weekly', 'monthly', 'yearly'
    recurring_end_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'cancelled', 'completed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CUSTOMER RELATIONSHIP MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    customer_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'business', 'dealer'
    source VARCHAR(100), -- 'walk_in', 'website', 'referral', 'social_media', 'advertisement'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'prospect', 'customer', 'vip'
    assigned_salesperson UUID REFERENCES public.employees(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    interaction_type VARCHAR(100) NOT NULL, -- 'phone_call', 'email', 'meeting', 'test_drive', 'purchase', 'service'
    subject VARCHAR(255),
    description TEXT NOT NULL,
    outcome VARCHAR(100),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    assigned_to UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INVENTORY HISTORY & AUDIT
-- ========================================

CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL, -- 'car_inventory', 'parts_inventory', 'garage_inventory'
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'insert', 'update', 'delete'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.employees(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- ========================================
-- API KEYS & SECURITY
-- ========================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Car inventory indexes
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON public.car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_location ON public.car_inventory(current_location);
CREATE INDEX IF NOT EXISTS idx_car_inventory_vin ON public.car_inventory(vin);
CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON public.car_inventory(model);

-- Test drive indexes
CREATE INDEX IF NOT EXISTS idx_test_drives_car_id ON public.test_drives(car_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_status ON public.test_drives(status);
CREATE INDEX IF NOT EXISTS idx_test_drives_date ON public.test_drives(scheduled_date);

-- Garage indexes
CREATE INDEX IF NOT EXISTS idx_garage_inventory_car_id ON public.garage_inventory(car_id);
CREATE INDEX IF NOT EXISTS idx_garage_inventory_status ON public.garage_inventory(garage_status);
CREATE INDEX IF NOT EXISTS idx_garage_schedule_date ON public.garage_schedule(scheduled_date);

-- Parts indexes
CREATE INDEX IF NOT EXISTS idx_parts_inventory_model ON public.parts_inventory(car_model);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_status ON public.parts_inventory(status);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);

-- Request indexes
CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);

-- Calendar indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON public.calendar_events(event_type);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.car_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordered_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (basic access)
-- Note: You'll need to customize these policies based on your specific security requirements

-- Example policy for car_inventory (allow read access to authenticated users)
CREATE POLICY "Allow authenticated users to read car inventory" ON public.car_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Example policy for parts_inventory (allow read access to authenticated users)
CREATE POLICY "Allow authenticated users to read parts inventory" ON public.parts_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_car_inventory_updated_at BEFORE UPDATE ON public.car_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_inventory_updated_at BEFORE UPDATE ON public.parts_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_drives_updated_at BEFORE UPDATE ON public.test_drives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_garage_inventory_updated_at BEFORE UPDATE ON public.garage_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_garage_schedule_updated_at BEFORE UPDATE ON public.garage_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_history_updated_at BEFORE UPDATE ON public.repair_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_leads_updated_at BEFORE UPDATE ON public.sales_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordered_cars_updated_at BEFORE UPDATE ON public.ordered_cars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_tracking_updated_at BEFORE UPDATE ON public.shipping_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.inventory_history (table_name, record_id, action, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.inventory_history (table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.inventory_history (table_name, record_id, action, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for inventory history logging
CREATE TRIGGER log_car_inventory_changes AFTER INSERT OR UPDATE OR DELETE ON public.car_inventory FOR EACH ROW EXECUTE FUNCTION log_inventory_change();
CREATE TRIGGER log_parts_inventory_changes AFTER INSERT OR UPDATE OR DELETE ON public.parts_inventory FOR EACH ROW EXECUTE FUNCTION log_inventory_change();

-- ========================================
-- SAMPLE DATA INSERTION (Optional)
-- ========================================

-- Insert sample employees (you can modify these)
INSERT INTO public.employees (employee_id, first_name, last_name, email, position, department, hire_date) VALUES
('EMP001', 'Houssam', 'Khanji', 'houssam@monza-tech.com', 'Owner', 'Management', '2020-01-01'),
('EMP002', 'Samer', 'Khanji', 'samer@monza-tech.com', 'Owner', 'Management', '2020-01-01'),
('EMP003', 'Kareem', 'Khanji', 'kareem@monza-tech.com', 'Owner', 'Management', '2020-01-01'),
('EMP004', 'Mark', 'Manager', 'mark@monza-tech.com', 'Garage Manager', 'Garage', '2021-01-01'),
('EMP005', 'Lara', 'Assistant', 'lara@monza-tech.com', 'Assistant', 'Administration', '2021-02-01'),
('EMP006', 'Samaya', 'Assistant', 'samaya@monza-tech.com', 'Assistant', 'Administration', '2021-02-01'),
('EMP007', 'Khalil', 'Hybrid', 'khalil@monza-tech.com', 'Sales & Garage Manager', 'Sales', '2021-03-01'),
('EMP008', 'Tamara', 'Hybrid', 'tamara@monza-tech.com', 'Sales & Marketing', 'Sales', '2021-03-01'),
('EMP009', 'Elie', 'Hybrid', 'elie@monza-tech.com', 'Technician & Sales', 'Garage', '2021-04-01')
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- FINAL VERIFICATION
-- ========================================

-- Show all created tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Show table counts
SELECT 
    'car_inventory' as table_name,
    COUNT(*) as record_count
FROM public.car_inventory
UNION ALL
SELECT 
    'parts_inventory' as table_name,
    COUNT(*) as record_count
FROM public.parts_inventory
UNION ALL
SELECT 
    'employees' as table_name,
    COUNT(*) as record_count
FROM public.employees;

-- Success message
SELECT '✅ Complete Monza TECH Database Schema Created Successfully!' as status;
