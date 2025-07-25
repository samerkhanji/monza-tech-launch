-- Function to get car inventory statistics
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_cars', (SELECT COUNT(*) FROM cars),
        'available_cars', (SELECT COUNT(*) FROM cars WHERE status = 'in_stock'),
        'reserved_cars', (SELECT COUNT(*) FROM cars WHERE status = 'reserved'),
        'sold_cars', (SELECT COUNT(*) FROM cars WHERE status = 'sold'),
        'cars_by_location', (
            SELECT json_object_agg(current_location, count)
            FROM (
                SELECT current_location, COUNT(*) as count
                FROM cars
                GROUP BY current_location
            ) location_counts
        ),
        'cars_by_category', (
            SELECT json_object_agg(category, count)
            FROM (
                SELECT category, COUNT(*) as count
                FROM cars
                GROUP BY category
            ) category_counts
        ),
        'pending_pdis', (SELECT COUNT(*) FROM pdi_inspections WHERE status = 'pending'),
        'active_test_drives', (SELECT COUNT(*) FROM test_drives WHERE is_active = TRUE),
        'total_parts', (SELECT COUNT(*) FROM parts_inventory),
        'low_stock_parts', (SELECT COUNT(*) FROM parts_inventory WHERE quantity_in_stock <= minimum_stock_level)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get car details with related information
CREATE OR REPLACE FUNCTION get_car_details(car_id UUID)
RETURNS JSON AS $$
DECLARE
    car_details JSON;
BEGIN
    SELECT json_build_object(
        'car', (SELECT to_json(cars) FROM cars WHERE id = car_id),
        'client_info', (
            SELECT json_build_object(
                'client', to_json(clients),
                'link_type', car_client_links.link_type,
                'link_date', car_client_links.link_date,
                'delivery_date', car_client_links.delivery_date
            )
            FROM car_client_links
            JOIN clients ON clients.id = car_client_links.client_id
            WHERE car_client_links.car_id = get_car_details.car_id
            LIMIT 1
        ),
        'pdi_status', (
            SELECT json_build_object(
                'status', status,
                'technician_name', technician_name,
                'completion_date', completion_date,
                'overall_score', overall_score,
                'notes', notes
            )
            FROM pdi_inspections
            WHERE car_id = get_car_details.car_id
            ORDER BY created_at DESC
            LIMIT 1
        ),
        'active_test_drive', (
            SELECT json_build_object(
                'driver_name', driver_name,
                'scheduled_start', scheduled_start,
                'scheduled_end', scheduled_end,
                'type', type
            )
            FROM test_drives
            WHERE car_id = get_car_details.car_id AND is_active = TRUE
            LIMIT 1
        ),
        'movement_history', (
            SELECT json_agg(
                json_build_object(
                    'from_location', from_location,
                    'to_location', to_location,
                    'movement_date', movement_date,
                    'reason', reason
                )
                ORDER BY movement_date DESC
            )
            FROM car_movements
            WHERE car_id = get_car_details.car_id
            LIMIT 10
        )
    ) INTO car_details;
    
    RETURN car_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move car to different location
CREATE OR REPLACE FUNCTION move_car(
    car_id UUID,
    new_location car_location,
    reason TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    old_location car_location;
    result JSON;
BEGIN
    -- Get current location
    SELECT current_location INTO old_location FROM cars WHERE id = car_id;
    
    -- Update car location
    UPDATE cars 
    SET 
        current_location = new_location,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = car_id;
    
    -- Record movement
    INSERT INTO car_movements (car_id, from_location, to_location, reason, notes, moved_by)
    VALUES (car_id, old_location, new_location, reason, notes, auth.uid());
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'Car moved successfully',
        'from_location', old_location,
        'to_location', new_location
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reserve car for client
CREATE OR REPLACE FUNCTION reserve_car(
    car_id UUID,
    client_id UUID,
    delivery_date DATE DEFAULT NULL,
    sale_price DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if car is available
    IF NOT EXISTS (SELECT 1 FROM cars WHERE id = car_id AND status = 'in_stock') THEN
        SELECT json_build_object(
            'success', FALSE,
            'message', 'Car is not available for reservation'
        ) INTO result;
        RETURN result;
    END IF;
    
    -- Create car-client link
    INSERT INTO car_client_links (car_id, client_id, link_type, delivery_date, sale_price)
    VALUES (car_id, client_id, 'reserved', delivery_date, sale_price);
    
    -- Update car status (handled by trigger)
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'Car reserved successfully'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete car sale
CREATE OR REPLACE FUNCTION complete_car_sale(
    car_id UUID,
    client_id UUID,
    sale_price DECIMAL,
    delivery_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Update or create car-client link
    INSERT INTO car_client_links (car_id, client_id, link_type, delivery_date, sale_price)
    VALUES (car_id, client_id, 'sold', delivery_date, sale_price)
    ON CONFLICT (car_id, client_id) 
    DO UPDATE SET 
        link_type = 'sold',
        delivery_date = complete_car_sale.delivery_date,
        sale_price = complete_car_sale.sale_price;
    
    -- Create financial record
    INSERT INTO financial_records (car_id, client_id, type, amount, description, transaction_date, created_by)
    VALUES (car_id, client_id, 'sale', sale_price, 'Car sale', delivery_date, auth.uid());
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'Car sale completed successfully'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule test drive
CREATE OR REPLACE FUNCTION schedule_test_drive(
    car_id UUID,
    driver_name TEXT,
    driver_phone TEXT,
    driver_license TEXT,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    test_drive_type test_drive_type DEFAULT 'client',
    client_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    test_drive_id UUID;
BEGIN
    -- Check if car is available for test drive
    IF EXISTS (SELECT 1 FROM test_drives WHERE car_id = schedule_test_drive.car_id AND is_active = TRUE) THEN
        SELECT json_build_object(
            'success', FALSE,
            'message', 'Car is currently on another test drive'
        ) INTO result;
        RETURN result;
    END IF;
    
    -- Create test drive record
    INSERT INTO test_drives (
        car_id, client_id, type, driver_name, driver_phone, driver_license,
        scheduled_start, scheduled_end, is_active, created_by
    ) VALUES (
        car_id, client_id, test_drive_type, driver_name, driver_phone, driver_license,
        scheduled_start, scheduled_end, TRUE, auth.uid()
    ) RETURNING id INTO test_drive_id;
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'Test drive scheduled successfully',
        'test_drive_id', test_drive_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end test drive
CREATE OR REPLACE FUNCTION end_test_drive(
    test_drive_id UUID,
    driver_feedback TEXT DEFAULT NULL,
    technician_notes TEXT DEFAULT NULL,
    issues_reported TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Update test drive record
    UPDATE test_drives 
    SET 
        actual_end = NOW(),
        is_active = FALSE,
        completed = TRUE,
        driver_feedback = end_test_drive.driver_feedback,
        technician_notes = end_test_drive.technician_notes,
        issues_reported = end_test_drive.issues_reported,
        updated_at = NOW()
    WHERE id = test_drive_id;
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'Test drive completed successfully'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete PDI inspection
CREATE OR REPLACE FUNCTION complete_pdi_inspection(
    car_id UUID,
    technician_name TEXT,
    overall_score INTEGER,
    inspection_notes TEXT,
    issues_found TEXT[] DEFAULT NULL,
    photos TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    pdi_id UUID;
BEGIN
    -- Update or create PDI record
    INSERT INTO pdi_inspections (
        car_id, technician_id, technician_name, status, completion_date,
        overall_score, notes, issues_found, photos
    ) VALUES (
        car_id, auth.uid(), technician_name, 'completed', NOW(),
        overall_score, inspection_notes, issues_found, photos
    )
    ON CONFLICT (car_id) 
    DO UPDATE SET
        technician_id = auth.uid(),
        technician_name = complete_pdi_inspection.technician_name,
        status = 'completed',
        completion_date = NOW(),
        overall_score = complete_pdi_inspection.overall_score,
        notes = complete_pdi_inspection.inspection_notes,
        issues_found = complete_pdi_inspection.issues_found,
        photos = complete_pdi_inspection.photos,
        updated_at = NOW()
    RETURNING id INTO pdi_id;
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'PDI inspection completed successfully',
        'pdi_id', pdi_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use parts for a car
CREATE OR REPLACE FUNCTION use_parts_for_car(
    car_id UUID,
    parts_data JSON -- Array of {part_id: UUID, quantity: INTEGER, used_for: TEXT}
)
RETURNS JSON AS $$
DECLARE
    part_record RECORD;
    result JSON;
    total_parts_used INTEGER := 0;
BEGIN
    -- Process each part usage
    FOR part_record IN SELECT * FROM json_to_recordset(parts_data) AS x(part_id UUID, quantity INTEGER, used_for TEXT)
    LOOP
        -- Check if enough parts are available
        IF (SELECT quantity_in_stock FROM parts_inventory WHERE id = part_record.part_id) < part_record.quantity THEN
            SELECT json_build_object(
                'success', FALSE,
                'message', 'Insufficient parts in stock for part ID: ' || part_record.part_id
            ) INTO result;
            RETURN result;
        END IF;
        
        -- Record parts usage
        INSERT INTO parts_usage (car_id, part_id, quantity_used, used_for, technician_id)
        VALUES (car_id, part_record.part_id, part_record.quantity, part_record.used_for, auth.uid());
        
        -- Update parts inventory
        UPDATE parts_inventory 
        SET quantity_in_stock = quantity_in_stock - part_record.quantity
        WHERE id = part_record.part_id;
        
        total_parts_used := total_parts_used + part_record.quantity;
    END LOOP;
    
    SELECT json_build_object(
        'success', TRUE,
        'message', 'Parts usage recorded successfully',
        'total_parts_used', total_parts_used
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 