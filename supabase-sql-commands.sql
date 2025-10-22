-- 🗃️ Supabase Floor 2 Data Clearing Commands
-- Execute these commands in your Supabase SQL Editor

-- 1. Check current data in Floor 2 table
SELECT COUNT(*) as total_cars FROM showroom_floor2_inventory;

-- 2. View all Floor 2 data (optional - to see what will be deleted)
SELECT vinNumber, model, year, color, status 
FROM showroom_floor2_inventory 
ORDER BY created_at DESC;

-- 3. 🔥 DELETE ALL Floor 2 data (MAIN COMMAND)
DELETE FROM showroom_floor2_inventory;

-- 4. Verify deletion
SELECT COUNT(*) as remaining_cars FROM showroom_floor2_inventory;

-- 5. Optional: Reset auto-increment if needed
-- ALTER SEQUENCE showroom_floor2_inventory_id_seq RESTART WITH 1;

-- 6. Check other potentially related tables
SELECT COUNT(*) as floor1_cars FROM showroom_floor1_inventory;
SELECT COUNT(*) as garage_cars FROM garage_inventory;

-- 7. If you want to clear ALL car inventory tables (NUCLEAR OPTION):
-- DELETE FROM showroom_floor1_inventory;
-- DELETE FROM showroom_floor2_inventory;
-- DELETE FROM garage_inventory;

COMMIT;
