-- ===============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ===============================================

-- Car inventory performance
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_location ON car_inventory(location);
CREATE INDEX IF NOT EXISTS idx_car_inventory_pdi_completed ON car_inventory(pdi_completed);
CREATE INDEX IF NOT EXISTS idx_car_inventory_vin ON car_inventory(vin_number);
CREATE INDEX IF NOT EXISTS idx_car_inventory_model ON car_inventory(model);
CREATE INDEX IF NOT EXISTS idx_car_inventory_year ON car_inventory(year);
CREATE INDEX IF NOT EXISTS idx_car_inventory_created_at ON car_inventory(created_at);

-- Repair history performance  
CREATE INDEX IF NOT EXISTS idx_repair_history_car_id ON repair_history(car_id);
CREATE INDEX IF NOT EXISTS idx_repair_history_status ON repair_history(status);
CREATE INDEX IF NOT EXISTS idx_repair_history_created_at ON repair_history(created_at);
CREATE INDEX IF NOT EXISTS idx_repair_history_start_date ON repair_history(start_date);
CREATE INDEX IF NOT EXISTS idx_repair_history_end_date ON repair_history(end_date);
CREATE INDEX IF NOT EXISTS idx_repair_history_assigned_to ON repair_history(assigned_to);

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);

-- Request tracking
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);

-- Financial data indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_source ON revenue(source);

-- Inventory parts indexes
CREATE INDEX IF NOT EXISTS idx_inventory_parts_name ON inventory_parts(name);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_category ON inventory_parts(category);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_quantity ON inventory_parts(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_location ON inventory_parts(location);

-- Employee related indexes
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_id ON employee_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_date ON employee_schedules(date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_car_inventory_status_location ON car_inventory(status, location);
CREATE INDEX IF NOT EXISTS idx_car_inventory_pdi_status ON car_inventory(pdi_completed, status);
CREATE INDEX IF NOT EXISTS idx_repair_history_car_status ON repair_history(car_id, status);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_timestamp ON user_activity(user_id, timestamp);

-- ===============================================
-- PERFORMANCE ANALYSIS FUNCTIONS
-- ===============================================

-- Function to analyze slow queries
CREATE OR REPLACE FUNCTION analyze_slow_queries()
RETURNS TABLE(
    query_text text,
    calls bigint,
    total_exec_time double precision,
    mean_exec_time double precision,
    stddev_exec_time double precision,
    rows bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_stat_statements.query,
        pg_stat_statements.calls,
        pg_stat_statements.total_exec_time,
        pg_stat_statements.mean_exec_time,
        pg_stat_statements.stddev_exec_time,
        pg_stat_statements.rows
    FROM pg_stat_statements 
    WHERE pg_stat_statements.mean_exec_time > 100
    ORDER BY pg_stat_statements.mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name text,
    size_pretty text,
    size_bytes bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename AS table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- MAINTENANCE PROCEDURES
-- ===============================================

-- Procedure to clean up old user activity logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_user_activity()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_activity 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO system_logs (action, details, timestamp)
    VALUES ('cleanup_user_activity', 'Deleted ' || deleted_count || ' old user activity records', NOW());
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procedure to vacuum and analyze all tables
CREATE OR REPLACE FUNCTION maintenance_vacuum_analyze()
RETURNS TEXT AS $$
DECLARE
    table_record RECORD;
    result_text TEXT := '';
BEGIN
    FOR table_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'VACUUM ANALYZE public.' || quote_ident(table_record.tablename);
        result_text := result_text || 'Vacuumed and analyzed: ' || table_record.tablename || E'\n';
    END LOOP;
    
    -- Log the maintenance
    INSERT INTO system_logs (action, details, timestamp)
    VALUES ('maintenance_vacuum', 'Completed vacuum analyze on all tables', NOW());
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname; 