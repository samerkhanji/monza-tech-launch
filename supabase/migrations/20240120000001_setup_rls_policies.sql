-- Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'viewer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit cars
CREATE OR REPLACE FUNCTION can_user_edit_cars()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT can_edit_cars FROM user_profiles WHERE id = auth.uid()),
    FALSE
  ) OR get_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can delete cars
CREATE OR REPLACE FUNCTION can_user_delete_cars()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT can_delete_cars FROM user_profiles WHERE id = auth.uid()),
    FALSE
  ) OR get_user_role() IN ('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cars table policies
CREATE POLICY "Cars are viewable by authenticated users" ON cars
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cars can be inserted by authorized users" ON cars
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (can_user_edit_cars() OR get_user_role() IN ('admin', 'manager', 'sales'))
  );

CREATE POLICY "Cars can be updated by authorized users" ON cars
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    can_user_edit_cars()
  );

CREATE POLICY "Cars can be deleted by authorized users" ON cars
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    can_user_delete_cars()
  );

-- Clients table policies
CREATE POLICY "Clients are viewable by authenticated users" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can be inserted by authenticated users" ON clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Clients can be updated by authenticated users" ON clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can be deleted by authorized users" ON clients
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- Car-Client links policies
CREATE POLICY "Car-client links are viewable by authenticated users" ON car_client_links
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Car-client links can be inserted by authenticated users" ON car_client_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Car-client links can be updated by authenticated users" ON car_client_links
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Car-client links can be deleted by authorized users" ON car_client_links
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- PDI inspections policies
CREATE POLICY "PDI inspections are viewable by authenticated users" ON pdi_inspections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "PDI inspections can be inserted by technicians" ON pdi_inspections
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (get_user_role() IN ('admin', 'manager', 'technician') OR 
     COALESCE((SELECT can_manage_pdi FROM user_profiles WHERE id = auth.uid()), FALSE))
  );

CREATE POLICY "PDI inspections can be updated by technicians" ON pdi_inspections
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    (get_user_role() IN ('admin', 'manager', 'technician') OR 
     COALESCE((SELECT can_manage_pdi FROM user_profiles WHERE id = auth.uid()), FALSE))
  );

CREATE POLICY "PDI inspections can be deleted by authorized users" ON pdi_inspections
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- Test drives policies
CREATE POLICY "Test drives are viewable by authenticated users" ON test_drives
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Test drives can be inserted by authorized users" ON test_drives
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (get_user_role() IN ('admin', 'manager', 'sales') OR 
     COALESCE((SELECT can_manage_test_drives FROM user_profiles WHERE id = auth.uid()), FALSE))
  );

CREATE POLICY "Test drives can be updated by authorized users" ON test_drives
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    (get_user_role() IN ('admin', 'manager', 'sales') OR 
     COALESCE((SELECT can_manage_test_drives FROM user_profiles WHERE id = auth.uid()), FALSE))
  );

CREATE POLICY "Test drives can be deleted by authorized users" ON test_drives
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- Parts inventory policies
CREATE POLICY "Parts inventory is viewable by authenticated users" ON parts_inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Parts inventory can be inserted by authorized users" ON parts_inventory
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager', 'technician')
  );

CREATE POLICY "Parts inventory can be updated by authorized users" ON parts_inventory
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager', 'technician')
  );

CREATE POLICY "Parts inventory can be deleted by authorized users" ON parts_inventory
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- Parts usage policies
CREATE POLICY "Parts usage is viewable by authenticated users" ON parts_usage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Parts usage can be inserted by technicians" ON parts_usage
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager', 'technician')
  );

CREATE POLICY "Parts usage can be updated by technicians" ON parts_usage
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager', 'technician')
  );

CREATE POLICY "Parts usage can be deleted by authorized users" ON parts_usage
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    get_user_role() = 'admin'
  );

CREATE POLICY "Managers can view profiles in their department" ON user_profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    get_user_role() = 'manager'
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() = 'admin'
  );

CREATE POLICY "User profiles can be inserted on signup" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Audit logs policies (read-only for most users)
CREATE POLICY "Audit logs are viewable by authenticated users" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Audit logs can only be inserted by system" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Car movements policies
CREATE POLICY "Car movements are viewable by authenticated users" ON car_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Car movements can be inserted by authenticated users" ON car_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Car movements can be updated by authorized users" ON car_movements
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

-- Financial records policies
CREATE POLICY "Financial records are viewable by authorized users" ON financial_records
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (get_user_role() IN ('admin', 'manager') OR 
     COALESCE((SELECT can_view_financials FROM user_profiles WHERE id = auth.uid()), FALSE))
  );

CREATE POLICY "Financial records can be inserted by authorized users" ON financial_records
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (get_user_role() IN ('admin', 'manager') OR 
     COALESCE((SELECT can_view_financials FROM user_profiles WHERE id = auth.uid()), FALSE))
  );

CREATE POLICY "Financial records can be updated by authorized users" ON financial_records
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() IN ('admin', 'manager')
  );

CREATE POLICY "Financial records can be deleted by authorized users" ON financial_records
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    get_user_role() = 'admin'
  ); 