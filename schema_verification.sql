

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."car_category" AS ENUM (
    'EV',
    'REV',
    'ICEV'
);


ALTER TYPE "public"."car_category" OWNER TO "postgres";


CREATE TYPE "public"."car_location" AS ENUM (
    'Showroom Floor 1',
    'Showroom Floor 2',
    'Garage',
    'Inventory',
    'External'
);


ALTER TYPE "public"."car_location" OWNER TO "postgres";


CREATE TYPE "public"."car_status" AS ENUM (
    'in_stock',
    'reserved',
    'sold'
);


ALTER TYPE "public"."car_status" OWNER TO "postgres";


CREATE TYPE "public"."customs_status" AS ENUM (
    'not_paid',
    'paid',
    'pending',
    'exempted'
);


ALTER TYPE "public"."customs_status" OWNER TO "postgres";


CREATE TYPE "public"."garage_status" AS ENUM (
    'stored',
    'in_repair',
    'ready_for_pickup',
    'awaiting_parts'
);


ALTER TYPE "public"."garage_status" OWNER TO "postgres";


CREATE TYPE "public"."pdi_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);


ALTER TYPE "public"."pdi_status" OWNER TO "postgres";


CREATE TYPE "public"."test_drive_type" AS ENUM (
    'client',
    'employee'
);


ALTER TYPE "public"."test_drive_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'manager',
    'technician',
    'sales',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_request"("request_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."can_access_request"("request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_requests"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'manager');
END;
$$;


ALTER FUNCTION "public"."can_manage_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_send_broadcasts"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'manager');
END;
$$;


ALTER FUNCTION "public"."can_send_broadcasts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_delete_cars"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE(
    (SELECT can_delete_cars FROM user_profiles WHERE id = auth.uid()),
    FALSE
  ) OR get_user_role() IN ('admin');
END;
$$;


ALTER FUNCTION "public"."can_user_delete_cars"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_edit_cars"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE(
    (SELECT can_edit_cars FROM user_profiles WHERE id = auth.uid()),
    FALSE
  ) OR get_user_role() IN ('admin', 'manager');
END;
$$;


ALTER FUNCTION "public"."can_user_edit_cars"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_parts_stock_levels"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_parts_stock_levels"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_car_sale"("car_id" "uuid", "client_id" "uuid", "sale_price" numeric, "delivery_date" "date" DEFAULT CURRENT_DATE) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."complete_car_sale"("car_id" "uuid", "client_id" "uuid", "sale_price" numeric, "delivery_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_pdi_inspection"("car_id" "uuid", "technician_name" "text", "overall_score" integer, "inspection_notes" "text", "issues_found" "text"[] DEFAULT NULL::"text"[], "photos" "text"[] DEFAULT NULL::"text"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."complete_pdi_inspection"("car_id" "uuid", "technician_name" "text", "overall_score" integer, "inspection_notes" "text", "issues_found" "text"[], "photos" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."end_test_drive"("test_drive_id" "uuid", "driver_feedback" "text" DEFAULT NULL::"text", "technician_notes" "text" DEFAULT NULL::"text", "issues_reported" "text"[] DEFAULT NULL::"text"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."end_test_drive"("test_drive_id" "uuid", "driver_feedback" "text", "technician_notes" "text", "issues_reported" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_car_details"("car_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_car_details"("car_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventory_stats"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_inventory_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM user_profiles WHERE id = auth.uid()),
        'viewer'
    );
END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_assignment_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_assignment_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_mention_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_mention_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."log_audit_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_car"("car_id" "uuid", "new_location" "public"."car_location", "reason" "text" DEFAULT NULL::"text", "notes" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."move_car"("car_id" "uuid", "new_location" "public"."car_location", "reason" "text", "notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_car"("car_id" "uuid", "client_id" "uuid", "delivery_date" "date" DEFAULT NULL::"date", "sale_price" numeric DEFAULT NULL::numeric) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."reserve_car"("car_id" "uuid", "client_id" "uuid", "delivery_date" "date", "sale_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."schedule_test_drive"("car_id" "uuid", "driver_name" "text", "driver_phone" "text", "driver_license" "text", "scheduled_start" timestamp with time zone, "scheduled_end" timestamp with time zone, "test_drive_type" "public"."test_drive_type" DEFAULT 'client'::"public"."test_drive_type", "client_id" "uuid" DEFAULT NULL::"uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."schedule_test_drive"("car_id" "uuid", "driver_name" "text", "driver_phone" "text", "driver_license" "text", "scheduled_start" timestamp with time zone, "scheduled_end" timestamp with time zone, "test_drive_type" "public"."test_drive_type", "client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_car_location_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."track_car_location_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_car_status_from_links"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_car_status_from_links"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_parts_for_car"("car_id" "uuid", "parts_data" "json") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."use_parts_for_car"("car_id" "uuid", "parts_data" "json") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "table_name" character varying(50) NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" character varying(20) NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_fields" "text"[],
    "user_id" "uuid",
    "user_email" character varying(100),
    "user_role" character varying(20),
    "ip_address" "inet",
    "user_agent" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."broadcasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid",
    "title" "text" NOT NULL,
    "message_text" "text" NOT NULL,
    "audience" "text"[],
    "is_urgent" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."broadcasts" OWNER TO "postgres";


COMMENT ON TABLE "public"."broadcasts" IS 'Announcements sent to all employees or selected roles';



CREATE TABLE IF NOT EXISTS "public"."business_calendar" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "event_type" "text" DEFAULT 'meeting'::"text" NOT NULL,
    "attendees" "text"[],
    "location" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_calendar" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."car_client_links" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "link_type" character varying(20) NOT NULL,
    "link_date" timestamp with time zone DEFAULT "now"(),
    "delivery_date" "date",
    "delivery_notes" "text",
    "sale_price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "car_client_links_link_type_check" CHECK ((("link_type")::"text" = ANY ((ARRAY['reserved'::character varying, 'sold'::character varying])::"text"[])))
);


ALTER TABLE "public"."car_client_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."car_movements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "from_location" "public"."car_location",
    "to_location" "public"."car_location" NOT NULL,
    "movement_date" timestamp with time zone DEFAULT "now"(),
    "reason" character varying(100),
    "notes" "text",
    "moved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."car_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cars" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "vin_number" character varying(17) NOT NULL,
    "model" character varying(100) NOT NULL,
    "brand" character varying(50) DEFAULT 'Voyah'::character varying NOT NULL,
    "year" integer NOT NULL,
    "color" character varying(50) NOT NULL,
    "category" "public"."car_category" DEFAULT 'EV'::"public"."car_category" NOT NULL,
    "status" "public"."car_status" DEFAULT 'in_stock'::"public"."car_status" NOT NULL,
    "current_location" "public"."car_location" DEFAULT 'Inventory'::"public"."car_location" NOT NULL,
    "purchase_price" numeric(10,2),
    "selling_price" numeric(10,2) NOT NULL,
    "battery_percentage" integer DEFAULT 100,
    "range_km" integer,
    "horse_power" integer,
    "torque" integer,
    "acceleration" character varying(20),
    "top_speed" integer,
    "charging_time" character varying(50),
    "warranty" character varying(100),
    "manufacturing_date" "date",
    "range_extender_number" character varying(50),
    "high_voltage_battery_number" character varying(50),
    "front_motor_number" character varying(50),
    "rear_motor_number" character varying(50),
    "arrival_date" timestamp with time zone DEFAULT "now"(),
    "customs" "public"."customs_status" DEFAULT 'not_paid'::"public"."customs_status",
    "shipment_code" character varying(50),
    "showroom_entry_date" timestamp with time zone,
    "showroom_exit_date" timestamp with time zone,
    "showroom_note" "text",
    "garage_entry_date" timestamp with time zone,
    "garage_location" character varying(50),
    "garage_status" "public"."garage_status",
    "garage_notes" "text",
    "features" "text"[],
    "notes" "text",
    "photos" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "kilometers_driven" integer DEFAULT 0,
    CONSTRAINT "cars_battery_percentage_check" CHECK ((("battery_percentage" >= 0) AND ("battery_percentage" <= 100))),
    CONSTRAINT "cars_kilometers_driven_check" CHECK (("kilometers_driven" >= 0)),
    CONSTRAINT "cars_year_check" CHECK ((("year" >= 2020) AND ("year" <= 2030)))
);


ALTER TABLE "public"."cars" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cars"."kilometers_driven" IS 'Actual kilometers driven by the vehicle, used for depreciation calculations';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "email" character varying(100),
    "address" "text",
    "license_plate" character varying(20),
    "license_number" character varying(50),
    "nationality" character varying(50),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "car_id" "uuid",
    "type" character varying(50) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "description" "text",
    "reference_number" character varying(100),
    "client_id" "uuid",
    "invoice_url" "text",
    "receipt_url" "text",
    "transaction_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."financial_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "sender_id" "uuid",
    "message_text" "text" NOT NULL,
    "mentions" "uuid"[],
    "is_broadcast" boolean DEFAULT false,
    "parent_message_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Threaded conversations for each request with @mentions support';



CREATE TABLE IF NOT EXISTS "public"."parts_inventory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "part_number" character varying(100) NOT NULL,
    "part_name" character varying(200) NOT NULL,
    "description" "text",
    "category" character varying(50),
    "compatible_models" "text"[],
    "quantity_in_stock" integer DEFAULT 0 NOT NULL,
    "minimum_stock_level" integer DEFAULT 5,
    "maximum_stock_level" integer DEFAULT 100,
    "cost_price" numeric(10,2),
    "selling_price" numeric(10,2),
    "supplier_name" character varying(100),
    "supplier_contact" "text",
    "weight_kg" numeric(8,2),
    "dimensions" "text",
    "storage_location" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parts_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parts_usage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "quantity_used" integer DEFAULT 1 NOT NULL,
    "used_for" character varying(100),
    "usage_date" timestamp with time zone DEFAULT "now"(),
    "technician_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parts_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdi_inspections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "status" "public"."pdi_status" DEFAULT 'pending'::"public"."pdi_status" NOT NULL,
    "technician_id" "uuid",
    "technician_name" character varying(100),
    "start_date" timestamp with time zone,
    "completion_date" timestamp with time zone,
    "estimated_completion" "date",
    "exterior_inspection" boolean DEFAULT false,
    "interior_inspection" boolean DEFAULT false,
    "engine_inspection" boolean DEFAULT false,
    "electronics_inspection" boolean DEFAULT false,
    "battery_inspection" boolean DEFAULT false,
    "charging_system_inspection" boolean DEFAULT false,
    "software_update" boolean DEFAULT false,
    "overall_score" integer,
    "issues_found" "text"[],
    "notes" "text",
    "photos" "text"[],
    "inspection_report_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pdi_inspections_overall_score_check" CHECK ((("overall_score" >= 0) AND ("overall_score" <= 100)))
);


ALTER TABLE "public"."pdi_inspections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "request_id" "uuid",
    "message_id" "uuid",
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "request_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['mention'::"text", 'assignment'::"text", 'status_change'::"text", 'new_request'::"text", 'broadcast'::"text"])))
);


ALTER TABLE "public"."request_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."request_notifications" IS 'Notifications for mentions, assignments, and status changes';



CREATE TABLE IF NOT EXISTS "public"."request_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "user_id" "uuid",
    "old_status" "text",
    "new_status" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."request_status_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."request_status_history" IS 'Audit trail of request status changes';



CREATE TABLE IF NOT EXISTS "public"."request_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."request_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."request_tags" IS 'Tags for categorizing and organizing requests';



CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "type" "text" DEFAULT 'task'::"text",
    "created_by" "uuid",
    "assigned_to" "uuid",
    "tags" "text"[],
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "requests_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'urgent'::"text"]))),
    CONSTRAINT "requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'done'::"text", 'pending_review'::"text"]))),
    CONSTRAINT "requests_type_check" CHECK (("type" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'question'::"text", 'task'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."requests" IS 'Structured requests with title, description, priority, and status';



CREATE TABLE IF NOT EXISTS "public"."showroom_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "price" numeric,
    "description" "text",
    "supplier" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."showroom_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_drives" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "type" "public"."test_drive_type" NOT NULL,
    "driver_name" character varying(100) NOT NULL,
    "driver_phone" character varying(20),
    "driver_license" character varying(50),
    "driver_email" character varying(100),
    "scheduled_start" timestamp with time zone NOT NULL,
    "scheduled_end" timestamp with time zone NOT NULL,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "planned_route" "text",
    "distance_km" integer,
    "weather_conditions" character varying(50),
    "driver_feedback" "text",
    "technician_notes" "text",
    "issues_reported" "text"[],
    "photos" "text"[],
    "is_active" boolean DEFAULT false,
    "completed" boolean DEFAULT false,
    "cancelled" boolean DEFAULT false,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."test_drives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" character varying(100),
    "role" "public"."user_role" DEFAULT 'viewer'::"public"."user_role" NOT NULL,
    "department" character varying(50),
    "employee_id" character varying(20),
    "phone" character varying(20),
    "hire_date" "date",
    "can_edit_cars" boolean DEFAULT false,
    "can_delete_cars" boolean DEFAULT false,
    "can_manage_pdi" boolean DEFAULT false,
    "can_manage_test_drives" boolean DEFAULT false,
    "can_view_financials" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "user_name" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_tracking" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."broadcasts"
    ADD CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_calendar"
    ADD CONSTRAINT "business_calendar_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car_client_links"
    ADD CONSTRAINT "car_client_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car_movements"
    ADD CONSTRAINT "car_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_vin_number_key" UNIQUE ("vin_number");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_records"
    ADD CONSTRAINT "financial_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts_inventory"
    ADD CONSTRAINT "parts_inventory_part_number_key" UNIQUE ("part_number");



ALTER TABLE ONLY "public"."parts_inventory"
    ADD CONSTRAINT "parts_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts_usage"
    ADD CONSTRAINT "parts_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdi_inspections"
    ADD CONSTRAINT "pdi_inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_notifications"
    ADD CONSTRAINT "request_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_status_history"
    ADD CONSTRAINT "request_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_tags"
    ADD CONSTRAINT "request_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."request_tags"
    ADD CONSTRAINT "request_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showroom_inventory"
    ADD CONSTRAINT "showroom_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_drives"
    ADD CONSTRAINT "test_drives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_tracking"
    ADD CONSTRAINT "workflow_tracking_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_record_id" ON "public"."audit_logs" USING "btree" ("record_id");



CREATE INDEX "idx_audit_logs_table_name" ON "public"."audit_logs" USING "btree" ("table_name");



CREATE INDEX "idx_audit_logs_timestamp" ON "public"."audit_logs" USING "btree" ("timestamp");



CREATE INDEX "idx_broadcasts_audience" ON "public"."broadcasts" USING "gin" ("audience");



CREATE INDEX "idx_broadcasts_created_at" ON "public"."broadcasts" USING "btree" ("created_at");



CREATE INDEX "idx_broadcasts_sender_id" ON "public"."broadcasts" USING "btree" ("sender_id");



CREATE INDEX "idx_car_movements_car_id" ON "public"."car_movements" USING "btree" ("car_id");



CREATE INDEX "idx_car_movements_date" ON "public"."car_movements" USING "btree" ("movement_date");



CREATE INDEX "idx_cars_category" ON "public"."cars" USING "btree" ("category");



CREATE INDEX "idx_cars_created_at" ON "public"."cars" USING "btree" ("created_at");



CREATE INDEX "idx_cars_kilometers_driven" ON "public"."cars" USING "btree" ("kilometers_driven");



CREATE INDEX "idx_cars_location" ON "public"."cars" USING "btree" ("current_location");



CREATE INDEX "idx_cars_status" ON "public"."cars" USING "btree" ("status");



CREATE INDEX "idx_cars_vin" ON "public"."cars" USING "btree" ("vin_number");



CREATE INDEX "idx_financial_records_car_id" ON "public"."financial_records" USING "btree" ("car_id");



CREATE INDEX "idx_financial_records_date" ON "public"."financial_records" USING "btree" ("transaction_date");



CREATE INDEX "idx_financial_records_type" ON "public"."financial_records" USING "btree" ("type");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_mentions" ON "public"."messages" USING "gin" ("mentions");



CREATE INDEX "idx_messages_parent_id" ON "public"."messages" USING "btree" ("parent_message_id");



CREATE INDEX "idx_messages_request_id" ON "public"."messages" USING "btree" ("request_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."request_notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_is_read" ON "public"."request_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_request_id" ON "public"."request_notifications" USING "btree" ("request_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."request_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_parts_category" ON "public"."parts_inventory" USING "btree" ("category");



CREATE INDEX "idx_parts_part_number" ON "public"."parts_inventory" USING "btree" ("part_number");



CREATE INDEX "idx_parts_stock" ON "public"."parts_inventory" USING "btree" ("quantity_in_stock");



CREATE INDEX "idx_pdi_car_id" ON "public"."pdi_inspections" USING "btree" ("car_id");



CREATE INDEX "idx_pdi_completion_date" ON "public"."pdi_inspections" USING "btree" ("completion_date");



CREATE INDEX "idx_pdi_status" ON "public"."pdi_inspections" USING "btree" ("status");



CREATE INDEX "idx_requests_assigned_to" ON "public"."requests" USING "btree" ("assigned_to");



CREATE INDEX "idx_requests_created_at" ON "public"."requests" USING "btree" ("created_at");



CREATE INDEX "idx_requests_created_by" ON "public"."requests" USING "btree" ("created_by");



CREATE INDEX "idx_requests_due_date" ON "public"."requests" USING "btree" ("due_date");



CREATE INDEX "idx_requests_priority" ON "public"."requests" USING "btree" ("priority");



CREATE INDEX "idx_requests_status" ON "public"."requests" USING "btree" ("status");



CREATE INDEX "idx_requests_tags" ON "public"."requests" USING "gin" ("tags");



CREATE INDEX "idx_requests_type" ON "public"."requests" USING "btree" ("type");



CREATE INDEX "idx_status_history_created_at" ON "public"."request_status_history" USING "btree" ("created_at");



CREATE INDEX "idx_status_history_request_id" ON "public"."request_status_history" USING "btree" ("request_id");



CREATE INDEX "idx_status_history_user_id" ON "public"."request_status_history" USING "btree" ("user_id");



CREATE INDEX "idx_test_drives_active" ON "public"."test_drives" USING "btree" ("is_active");



CREATE INDEX "idx_test_drives_car_id" ON "public"."test_drives" USING "btree" ("car_id");



CREATE INDEX "idx_test_drives_client_id" ON "public"."test_drives" USING "btree" ("client_id");



CREATE INDEX "idx_test_drives_scheduled_start" ON "public"."test_drives" USING "btree" ("scheduled_start");



CREATE OR REPLACE TRIGGER "audit_car_client_links_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."car_client_links" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_car_movements_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."car_movements" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_cars_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."cars" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_clients_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_financial_records_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."financial_records" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_parts_inventory_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."parts_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_parts_usage_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."parts_usage" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_pdi_inspections_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."pdi_inspections" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_test_drives_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."test_drives" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "audit_user_profiles_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit_changes"();



CREATE OR REPLACE TRIGGER "check_parts_stock_trigger" AFTER UPDATE OF "quantity_in_stock" ON "public"."parts_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."check_parts_stock_levels"();



CREATE OR REPLACE TRIGGER "track_car_location_changes_trigger" AFTER UPDATE OF "current_location" ON "public"."cars" FOR EACH ROW EXECUTE FUNCTION "public"."track_car_location_changes"();



CREATE OR REPLACE TRIGGER "trigger_assignment_notifications" AFTER INSERT OR UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_assignment_notifications"();



CREATE OR REPLACE TRIGGER "trigger_mention_notifications" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_mention_notifications"();



CREATE OR REPLACE TRIGGER "trigger_status_change" AFTER UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_status_change"();



CREATE OR REPLACE TRIGGER "update_business_calendar_updated_at" BEFORE UPDATE ON "public"."business_calendar" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_car_status_trigger" AFTER INSERT OR DELETE ON "public"."car_client_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_car_status_from_links"();



CREATE OR REPLACE TRIGGER "update_cars_updated_at" BEFORE UPDATE ON "public"."cars" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parts_inventory_updated_at" BEFORE UPDATE ON "public"."parts_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pdi_inspections_updated_at" BEFORE UPDATE ON "public"."pdi_inspections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_requests_updated_at" BEFORE UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_showroom_inventory_updated_at" BEFORE UPDATE ON "public"."showroom_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_test_drives_updated_at" BEFORE UPDATE ON "public"."test_drives" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."broadcasts"
    ADD CONSTRAINT "broadcasts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."car_client_links"
    ADD CONSTRAINT "car_client_links_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."car_client_links"
    ADD CONSTRAINT "car_client_links_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."car_client_links"
    ADD CONSTRAINT "car_client_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."car_movements"
    ADD CONSTRAINT "car_movements_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."car_movements"
    ADD CONSTRAINT "car_movements_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."financial_records"
    ADD CONSTRAINT "financial_records_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."financial_records"
    ADD CONSTRAINT "financial_records_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."financial_records"
    ADD CONSTRAINT "financial_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parts_usage"
    ADD CONSTRAINT "parts_usage_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parts_usage"
    ADD CONSTRAINT "parts_usage_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id");



ALTER TABLE ONLY "public"."parts_usage"
    ADD CONSTRAINT "parts_usage_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pdi_inspections"
    ADD CONSTRAINT "pdi_inspections_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdi_inspections"
    ADD CONSTRAINT "pdi_inspections_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."request_notifications"
    ADD CONSTRAINT "request_notifications_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_notifications"
    ADD CONSTRAINT "request_notifications_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_notifications"
    ADD CONSTRAINT "request_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_status_history"
    ADD CONSTRAINT "request_status_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_status_history"
    ADD CONSTRAINT "request_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_drives"
    ADD CONSTRAINT "test_drives_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_drives"
    ADD CONSTRAINT "test_drives_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."test_drives"
    ADD CONSTRAINT "test_drives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can update any profile" ON "public"."user_profiles" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Admins can view all profiles" ON "public"."user_profiles" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "All authenticated users can view broadcasts" ON "public"."broadcasts" FOR SELECT USING (true);



CREATE POLICY "All authenticated users can view tags" ON "public"."request_tags" FOR SELECT USING (true);



CREATE POLICY "Audit logs are viewable by authenticated users" ON "public"."audit_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Audit logs can only be inserted by system" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Car movements are viewable by authenticated users" ON "public"."car_movements" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Car movements can be inserted by authenticated users" ON "public"."car_movements" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Car movements can be updated by authorized users" ON "public"."car_movements" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Car-client links are viewable by authenticated users" ON "public"."car_client_links" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Car-client links can be deleted by authorized users" ON "public"."car_client_links" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Car-client links can be inserted by authenticated users" ON "public"."car_client_links" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Car-client links can be updated by authenticated users" ON "public"."car_client_links" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Cars are viewable by authenticated users" ON "public"."cars" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Cars can be deleted by authorized users" ON "public"."cars" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND "public"."can_user_delete_cars"()));



CREATE POLICY "Cars can be inserted by authorized users" ON "public"."cars" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("public"."can_user_edit_cars"() OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'sales'::"text"])))));



CREATE POLICY "Cars can be updated by authorized users" ON "public"."cars" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND "public"."can_user_edit_cars"()));



CREATE POLICY "Clients are viewable by authenticated users" ON "public"."clients" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Clients can be deleted by authorized users" ON "public"."clients" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Clients can be inserted by authenticated users" ON "public"."clients" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Clients can be updated by authenticated users" ON "public"."clients" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Financial records are viewable by authorized users" ON "public"."financial_records" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"])) OR COALESCE(( SELECT "user_profiles"."can_view_financials"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())), false))));



CREATE POLICY "Financial records can be deleted by authorized users" ON "public"."financial_records" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Financial records can be inserted by authorized users" ON "public"."financial_records" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"])) OR COALESCE(( SELECT "user_profiles"."can_view_financials"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())), false))));



CREATE POLICY "Financial records can be updated by authorized users" ON "public"."financial_records" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Managers and admins can delete requests" ON "public"."requests" FOR DELETE USING ("public"."can_manage_requests"());



CREATE POLICY "Managers can view profiles in their department" ON "public"."user_profiles" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = 'manager'::"text")));



CREATE POLICY "Only authorized users can create broadcasts" ON "public"."broadcasts" FOR INSERT WITH CHECK ("public"."can_send_broadcasts"());



CREATE POLICY "Only broadcast creators can delete broadcasts" ON "public"."broadcasts" FOR DELETE USING ((("sender_id" = "auth"."uid"()) AND "public"."can_send_broadcasts"()));



CREATE POLICY "Only broadcast creators can update broadcasts" ON "public"."broadcasts" FOR UPDATE USING ((("sender_id" = "auth"."uid"()) AND "public"."can_send_broadcasts"()));



CREATE POLICY "Only managers and admins can manage tags" ON "public"."request_tags" USING ("public"."can_manage_requests"());



CREATE POLICY "PDI inspections are viewable by authenticated users" ON "public"."pdi_inspections" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "PDI inspections can be deleted by authorized users" ON "public"."pdi_inspections" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "PDI inspections can be inserted by technicians" ON "public"."pdi_inspections" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'technician'::"text"])) OR COALESCE(( SELECT "user_profiles"."can_manage_pdi"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())), false))));



CREATE POLICY "PDI inspections can be updated by technicians" ON "public"."pdi_inspections" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'technician'::"text"])) OR COALESCE(( SELECT "user_profiles"."can_manage_pdi"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())), false))));



CREATE POLICY "Parts inventory can be deleted by authorized users" ON "public"."parts_inventory" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Parts inventory can be inserted by authorized users" ON "public"."parts_inventory" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'technician'::"text"]))));



CREATE POLICY "Parts inventory can be updated by authorized users" ON "public"."parts_inventory" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'technician'::"text"]))));



CREATE POLICY "Parts inventory is viewable by authenticated users" ON "public"."parts_inventory" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Parts usage can be deleted by authorized users" ON "public"."parts_usage" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Parts usage can be inserted by technicians" ON "public"."parts_usage" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'technician'::"text"]))));



CREATE POLICY "Parts usage can be updated by technicians" ON "public"."parts_usage" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'technician'::"text"]))));



CREATE POLICY "Parts usage is viewable by authenticated users" ON "public"."parts_usage" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "System can create notifications" ON "public"."request_notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create status history" ON "public"."request_status_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "Test drives are viewable by authenticated users" ON "public"."test_drives" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Test drives can be deleted by authorized users" ON "public"."test_drives" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Test drives can be inserted by authorized users" ON "public"."test_drives" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'sales'::"text"])) OR COALESCE(( SELECT "user_profiles"."can_manage_test_drives"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())), false))));



CREATE POLICY "Test drives can be updated by authorized users" ON "public"."test_drives" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'sales'::"text"])) OR COALESCE(( SELECT "user_profiles"."can_manage_test_drives"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())), false))));



CREATE POLICY "User profiles can be inserted on signup" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can create messages for requests they can access" ON "public"."messages" FOR INSERT WITH CHECK ("public"."can_access_request"("request_id"));



CREATE POLICY "Users can create requests" ON "public"."requests" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own messages" ON "public"."messages" FOR DELETE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can insert workflow tracking" ON "public"."workflow_tracking" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can manage business calendar" ON "public"."business_calendar" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can manage showroom inventory" ON "public"."showroom_inventory" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can update kilometers_driven" ON "public"."cars" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can update requests they created or are assigned to" ON "public"."requests" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR "public"."can_manage_requests"()));



CREATE POLICY "Users can update their own messages" ON "public"."messages" FOR UPDATE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notifications" ON "public"."request_notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view business calendar" ON "public"."business_calendar" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view messages for requests they can access" ON "public"."messages" FOR SELECT USING ("public"."can_access_request"("request_id"));



CREATE POLICY "Users can view requests they created, are assigned to, or are m" ON "public"."requests" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR "public"."can_manage_requests"() OR (EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."request_id" = "requests"."id") AND ("auth"."uid"() = ANY ("m"."mentions")))))));



CREATE POLICY "Users can view showroom inventory" ON "public"."showroom_inventory" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view status history for requests they can access" ON "public"."request_status_history" FOR SELECT USING ("public"."can_access_request"("request_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."request_notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view workflow tracking" ON "public"."workflow_tracking" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."broadcasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_calendar" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_client_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdi_inspections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."showroom_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_drives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_tracking" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_request"("request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_request"("request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_request"("request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_manage_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_send_broadcasts"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_send_broadcasts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_send_broadcasts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_delete_cars"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_delete_cars"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_delete_cars"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_edit_cars"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_edit_cars"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_edit_cars"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_parts_stock_levels"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_parts_stock_levels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_parts_stock_levels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_car_sale"("car_id" "uuid", "client_id" "uuid", "sale_price" numeric, "delivery_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_car_sale"("car_id" "uuid", "client_id" "uuid", "sale_price" numeric, "delivery_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_car_sale"("car_id" "uuid", "client_id" "uuid", "sale_price" numeric, "delivery_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_pdi_inspection"("car_id" "uuid", "technician_name" "text", "overall_score" integer, "inspection_notes" "text", "issues_found" "text"[], "photos" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_pdi_inspection"("car_id" "uuid", "technician_name" "text", "overall_score" integer, "inspection_notes" "text", "issues_found" "text"[], "photos" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_pdi_inspection"("car_id" "uuid", "technician_name" "text", "overall_score" integer, "inspection_notes" "text", "issues_found" "text"[], "photos" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."end_test_drive"("test_drive_id" "uuid", "driver_feedback" "text", "technician_notes" "text", "issues_reported" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."end_test_drive"("test_drive_id" "uuid", "driver_feedback" "text", "technician_notes" "text", "issues_reported" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."end_test_drive"("test_drive_id" "uuid", "driver_feedback" "text", "technician_notes" "text", "issues_reported" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_car_details"("car_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_car_details"("car_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_car_details"("car_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_assignment_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_assignment_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_assignment_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_mention_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_mention_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_mention_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."move_car"("car_id" "uuid", "new_location" "public"."car_location", "reason" "text", "notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."move_car"("car_id" "uuid", "new_location" "public"."car_location", "reason" "text", "notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_car"("car_id" "uuid", "new_location" "public"."car_location", "reason" "text", "notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_car"("car_id" "uuid", "client_id" "uuid", "delivery_date" "date", "sale_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_car"("car_id" "uuid", "client_id" "uuid", "delivery_date" "date", "sale_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_car"("car_id" "uuid", "client_id" "uuid", "delivery_date" "date", "sale_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."schedule_test_drive"("car_id" "uuid", "driver_name" "text", "driver_phone" "text", "driver_license" "text", "scheduled_start" timestamp with time zone, "scheduled_end" timestamp with time zone, "test_drive_type" "public"."test_drive_type", "client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."schedule_test_drive"("car_id" "uuid", "driver_name" "text", "driver_phone" "text", "driver_license" "text", "scheduled_start" timestamp with time zone, "scheduled_end" timestamp with time zone, "test_drive_type" "public"."test_drive_type", "client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."schedule_test_drive"("car_id" "uuid", "driver_name" "text", "driver_phone" "text", "driver_license" "text", "scheduled_start" timestamp with time zone, "scheduled_end" timestamp with time zone, "test_drive_type" "public"."test_drive_type", "client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_car_location_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_car_location_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_car_location_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_car_status_from_links"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_car_status_from_links"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_car_status_from_links"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."use_parts_for_car"("car_id" "uuid", "parts_data" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."use_parts_for_car"("car_id" "uuid", "parts_data" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_parts_for_car"("car_id" "uuid", "parts_data" "json") TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."broadcasts" TO "anon";
GRANT ALL ON TABLE "public"."broadcasts" TO "authenticated";
GRANT ALL ON TABLE "public"."broadcasts" TO "service_role";



GRANT ALL ON TABLE "public"."business_calendar" TO "anon";
GRANT ALL ON TABLE "public"."business_calendar" TO "authenticated";
GRANT ALL ON TABLE "public"."business_calendar" TO "service_role";



GRANT ALL ON TABLE "public"."car_client_links" TO "anon";
GRANT ALL ON TABLE "public"."car_client_links" TO "authenticated";
GRANT ALL ON TABLE "public"."car_client_links" TO "service_role";



GRANT ALL ON TABLE "public"."car_movements" TO "anon";
GRANT ALL ON TABLE "public"."car_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."car_movements" TO "service_role";



GRANT ALL ON TABLE "public"."cars" TO "anon";
GRANT ALL ON TABLE "public"."cars" TO "authenticated";
GRANT ALL ON TABLE "public"."cars" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."financial_records" TO "anon";
GRANT ALL ON TABLE "public"."financial_records" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_records" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."parts_inventory" TO "anon";
GRANT ALL ON TABLE "public"."parts_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."parts_usage" TO "anon";
GRANT ALL ON TABLE "public"."parts_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_usage" TO "service_role";



GRANT ALL ON TABLE "public"."pdi_inspections" TO "anon";
GRANT ALL ON TABLE "public"."pdi_inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."pdi_inspections" TO "service_role";



GRANT ALL ON TABLE "public"."request_notifications" TO "anon";
GRANT ALL ON TABLE "public"."request_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."request_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."request_status_history" TO "anon";
GRANT ALL ON TABLE "public"."request_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."request_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."request_tags" TO "anon";
GRANT ALL ON TABLE "public"."request_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."request_tags" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."showroom_inventory" TO "anon";
GRANT ALL ON TABLE "public"."showroom_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."showroom_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."test_drives" TO "anon";
GRANT ALL ON TABLE "public"."test_drives" TO "authenticated";
GRANT ALL ON TABLE "public"."test_drives" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_tracking" TO "anon";
GRANT ALL ON TABLE "public"."workflow_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_tracking" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
