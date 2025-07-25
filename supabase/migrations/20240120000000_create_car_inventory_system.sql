-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE car_status AS ENUM ('in_stock', 'reserved', 'sold');
CREATE TYPE car_category AS ENUM ('EV', 'REV', 'ICEV');
CREATE TYPE car_location AS ENUM ('Showroom Floor 1', 'Showroom Floor 2', 'Garage', 'Inventory', 'External');
CREATE TYPE garage_status AS ENUM ('stored', 'in_repair', 'ready_for_pickup', 'awaiting_parts');
CREATE TYPE pdi_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE customs_status AS ENUM ('not_paid', 'paid', 'pending', 'exempted');
CREATE TYPE test_drive_type AS ENUM ('client', 'employee');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician', 'sales', 'viewer');

-- Create cars table
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin_number VARCHAR(17) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL DEFAULT 'Voyah',
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
    color VARCHAR(50) NOT NULL,
    category car_category NOT NULL DEFAULT 'EV',
    status car_status NOT NULL DEFAULT 'in_stock',
    current_location car_location NOT NULL DEFAULT 'Inventory',
    
    -- Pricing information
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2) NOT NULL,
    
    -- Technical specifications
    battery_percentage INTEGER DEFAULT 100 CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
    range_km INTEGER,
    horse_power INTEGER,
    torque INTEGER,
    acceleration VARCHAR(20),
    top_speed INTEGER,
    charging_time VARCHAR(50),
    warranty VARCHAR(100),
    
    -- Manufacturing details
    manufacturing_date DATE,
    range_extender_number VARCHAR(50),
    high_voltage_battery_number VARCHAR(50),
    front_motor_number VARCHAR(50),
    rear_motor_number VARCHAR(50),
    
    -- Arrival and processing
    arrival_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customs customs_status DEFAULT 'not_paid',
    shipment_code VARCHAR(50),
    
    -- Location specific details
    showroom_entry_date TIMESTAMP WITH TIME ZONE,
    showroom_exit_date TIMESTAMP WITH TIME ZONE,
    showroom_note TEXT,
    garage_entry_date TIMESTAMP WITH TIME ZONE,
    garage_location VARCHAR(50),
    garage_status garage_status,
    garage_notes TEXT,
    
    -- General
    features TEXT[], -- Array of features
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    license_plate VARCHAR(20),
    license_number VARCHAR(50),
    nationality VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create car_client_links table (for reservations and sales)
CREATE TABLE car_client_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('reserved', 'sold')),
    link_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date DATE,
    delivery_notes TEXT,
    sale_price DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create PDI (Pre-Delivery Inspection) table
CREATE TABLE pdi_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    status pdi_status NOT NULL DEFAULT 'pending',
    technician_id UUID REFERENCES auth.users(id),
    technician_name VARCHAR(100),
    
    -- Inspection details
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    estimated_completion DATE,
    
    -- Inspection checklist
    exterior_inspection BOOLEAN DEFAULT FALSE,
    interior_inspection BOOLEAN DEFAULT FALSE,
    engine_inspection BOOLEAN DEFAULT FALSE,
    electronics_inspection BOOLEAN DEFAULT FALSE,
    battery_inspection BOOLEAN DEFAULT FALSE,
    charging_system_inspection BOOLEAN DEFAULT FALSE,
    software_update BOOLEAN DEFAULT FALSE,
    
    -- Results
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    issues_found TEXT[],
    notes TEXT,
    photos TEXT[],
    inspection_report_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test drives table
CREATE TABLE test_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    type test_drive_type NOT NULL,
    
    -- Driver information
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20),
    driver_license VARCHAR(50),
    driver_email VARCHAR(100),
    
    -- Test drive details
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Route and conditions
    planned_route TEXT,
    distance_km INTEGER,
    weather_conditions VARCHAR(50),
    
    -- Results
    driver_feedback TEXT,
    technician_notes TEXT,
    issues_reported TEXT[],
    photos TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create parts inventory table
CREATE TABLE parts_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_number VARCHAR(100) UNIQUE NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    
    -- Compatibility
    compatible_models TEXT[],
    
    -- Stock information
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 5,
    maximum_stock_level INTEGER DEFAULT 100,
    
    -- Pricing
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    
    -- Supplier information
    supplier_name VARCHAR(100),
    supplier_contact TEXT,
    
    -- Physical details
    weight_kg DECIMAL(8,2),
    dimensions TEXT,
    storage_location VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parts usage tracking
CREATE TABLE parts_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts_inventory(id),
    quantity_used INTEGER NOT NULL DEFAULT 1,
    used_for VARCHAR(100), -- 'pdi', 'repair', 'maintenance'
    usage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    technician_id UUID REFERENCES auth.users(id),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'viewer',
    department VARCHAR(50),
    employee_id VARCHAR(20),
    phone VARCHAR(20),
    hire_date DATE,
    
    -- Permissions
    can_edit_cars BOOLEAN DEFAULT FALSE,
    can_delete_cars BOOLEAN DEFAULT FALSE,
    can_manage_pdi BOOLEAN DEFAULT FALSE,
    can_manage_test_drives BOOLEAN DEFAULT FALSE,
    can_view_financials BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(100),
    user_role VARCHAR(20),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create car movements table
CREATE TABLE car_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    from_location car_location,
    to_location car_location NOT NULL,
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(100),
    notes TEXT,
    moved_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial records table
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'customs', 'repair', 'parts'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    reference_number VARCHAR(100),
    
    -- Related records
    client_id UUID REFERENCES clients(id),
    invoice_url TEXT,
    receipt_url TEXT,
    
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_cars_vin ON cars(vin_number);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_location ON cars(current_location);
CREATE INDEX idx_cars_category ON cars(category);
CREATE INDEX idx_cars_created_at ON cars(created_at);

CREATE INDEX idx_pdi_car_id ON pdi_inspections(car_id);
CREATE INDEX idx_pdi_status ON pdi_inspections(status);
CREATE INDEX idx_pdi_completion_date ON pdi_inspections(completion_date);

CREATE INDEX idx_test_drives_car_id ON test_drives(car_id);
CREATE INDEX idx_test_drives_client_id ON test_drives(client_id);
CREATE INDEX idx_test_drives_scheduled_start ON test_drives(scheduled_start);
CREATE INDEX idx_test_drives_active ON test_drives(is_active);

CREATE INDEX idx_parts_part_number ON parts_inventory(part_number);
CREATE INDEX idx_parts_category ON parts_inventory(category);
CREATE INDEX idx_parts_stock ON parts_inventory(quantity_in_stock);

CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX idx_car_movements_car_id ON car_movements(car_id);
CREATE INDEX idx_car_movements_date ON car_movements(movement_date);

CREATE INDEX idx_financial_records_car_id ON financial_records(car_id);
CREATE INDEX idx_financial_records_type ON financial_records(type);
CREATE INDEX idx_financial_records_date ON financial_records(transaction_date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdi_inspections_updated_at BEFORE UPDATE ON pdi_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_drives_updated_at BEFORE UPDATE ON test_drives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_inventory_updated_at BEFORE UPDATE ON parts_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 