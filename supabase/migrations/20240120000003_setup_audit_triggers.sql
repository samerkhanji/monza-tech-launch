-- Create audit trigger function
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- Get user info
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
    
    -- Handle different operations
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Find changed fields
        FOR field_name IN SELECT key FROM jsonb_each(new_data)
        LOOP
            IF old_data->field_name IS DISTINCT FROM new_data->field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_fields,
        user_id,
        user_email,
        user_role,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        auth.uid(),
        user_email,
        user_role,
        inet_client_addr()
    );
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all tables
CREATE TRIGGER audit_cars_changes
    AFTER INSERT OR UPDATE OR DELETE ON cars
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_clients_changes
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_car_client_links_changes
    AFTER INSERT OR UPDATE OR DELETE ON car_client_links
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_pdi_inspections_changes
    AFTER INSERT OR UPDATE OR DELETE ON pdi_inspections
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_test_drives_changes
    AFTER INSERT OR UPDATE OR DELETE ON test_drives
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_parts_inventory_changes
    AFTER INSERT OR UPDATE OR DELETE ON parts_inventory
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_parts_usage_changes
    AFTER INSERT OR UPDATE OR DELETE ON parts_usage
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_user_profiles_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_car_movements_changes
    AFTER INSERT OR UPDATE OR DELETE ON car_movements
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_financial_records_changes
    AFTER INSERT OR UPDATE OR DELETE ON financial_records
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Function to track car location changes
CREATE OR REPLACE FUNCTION track_car_location_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if location actually changed
    IF OLD.current_location IS DISTINCT FROM NEW.current_location THEN
        INSERT INTO car_movements (
            car_id,
            from_location,
            to_location,
            reason,
            moved_by
        ) VALUES (
            NEW.id,
            OLD.current_location,
            NEW.current_location,
            'Automatic tracking',
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for car location tracking
CREATE TRIGGER track_car_location_changes_trigger
    AFTER UPDATE OF current_location ON cars
    FOR EACH ROW EXECUTE FUNCTION track_car_location_changes();

-- Function to update car status based on client links
CREATE OR REPLACE FUNCTION update_car_status_from_links()
RETURNS TRIGGER AS $$
BEGIN
    -- Update car status when client link is created
    IF TG_OP = 'INSERT' THEN
        UPDATE cars 
        SET status = NEW.link_type::car_status
        WHERE id = NEW.car_id;
    END IF;
    
    -- Update car status when client link is deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE cars 
        SET status = 'in_stock'
        WHERE id = OLD.car_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic car status updates
CREATE TRIGGER update_car_status_trigger
    AFTER INSERT OR DELETE ON car_client_links
    FOR EACH ROW EXECUTE FUNCTION update_car_status_from_links();

-- Function to check parts stock levels
CREATE OR REPLACE FUNCTION check_parts_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock level is below minimum after usage
    IF NEW.quantity_in_stock <= NEW.minimum_stock_level THEN
        -- You could send notifications here
        -- For now, we'll just log it
        INSERT INTO audit_logs (
            table_name,
            record_id,
            action,
            new_data,
            user_id
        ) VALUES (
            'parts_inventory',
            NEW.id,
            'LOW_STOCK_ALERT',
            jsonb_build_object(
                'part_number', NEW.part_number,
                'part_name', NEW.part_name,
                'current_stock', NEW.quantity_in_stock,
                'minimum_stock', NEW.minimum_stock_level
            ),
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for parts stock monitoring
CREATE TRIGGER check_parts_stock_trigger
    AFTER UPDATE OF quantity_in_stock ON parts_inventory
    FOR EACH ROW EXECUTE FUNCTION check_parts_stock_levels();

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 