# 🛠️ Database Fix Guide for Monza Tech

## 🚨 **Current Issues**

Your Monza Tech application is experiencing several database-related errors:

1. **404 Errors**: `PATCH .../car_inventory → 404` (table doesn't exist)
2. **RPC Errors**: `POST .../rpc/move_car → 404` (function doesn't exist)  
3. **Audit Errors**: `42P01 relation "public.audit_log" does not exist`
4. **Notifications Error**: `GET .../notifications_unread_counts → 404`

## 🎯 **Root Cause**

The frontend code uses `car_inventory` table, but your Supabase database has a `cars` table instead. This mismatch causes all the 404 errors and prevents car movement functionality.

## 🚀 **Step-by-Step Fix**

### **Step 1: Run the Database Fix Script**

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `complete-database-fix.sql`
4. Click **Run** to execute the script

This will:
- ✅ Create the missing `audit_log` table
- ✅ Create `car_inventory` view (points to `cars` table)
- ✅ Create `notifications_unread_counts` view
- ✅ Create `move_car` and `move_car_manual` RPC functions
- ✅ Set up proper RLS policies

### **Step 2: Verify the Fix**

Run these verification queries in Supabase SQL Editor:

```sql
-- 1) Check that all required tables/views exist
SELECT 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_schema='public' 
  AND table_name IN ('cars','car_inventory','notifications_unread_counts','audit_log')
ORDER BY table_name;

-- 2) Check that RPC functions exist
SELECT
  n.nspname AS schema, 
  p.proname AS function_name, 
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' 
  AND p.proname IN ('move_car', 'move_car_manual');

-- 3) Test car update (replace with a real car ID)
UPDATE public.cars
SET location = 'SHOWROOM_2'
WHERE id = (SELECT id FROM public.cars LIMIT 1)
RETURNING id, location;
```

### **Step 3: Test the Application**

1. **Open the app**: http://localhost:5174/
2. **Go to Showroom Floor 1**
3. **Select a car** and click the **actions menu**
4. **Click "Move Car"** - the dialog should open
5. **Select a destination** (e.g., "Showroom Floor 2")
6. **Click "Move Car"** - the car should move successfully

## 📋 **What Each File Does**

### `complete-database-fix.sql`
- **Primary fix script** - Run this in Supabase SQL Editor
- Creates all missing tables, views, and functions
- Sets up proper permissions and policies

### `fix-audit-table.sql` 
- **Alternative fix** for just the audit table issue
- Use this if you only want to fix the audit error

### `create-safe-car-update-rpc.sql`
- **RPC functions only** - Creates safe car movement functions
- Use this if you want to add RPC functions separately

## 🔍 **Understanding the Fix**

### **The View Solution**
Instead of changing all frontend code from `car_inventory` to `cars`, we create a view:

```sql
CREATE OR REPLACE VIEW public.car_inventory AS
SELECT 
  id,
  vin as vinNumber,
  model,
  brand,
  -- ... more fields mapped correctly
FROM public.cars;
```

This lets the frontend continue using `car_inventory` while the data comes from `cars`.

### **The RPC Functions**
We create two movement functions:

1. **`move_car(car_id, destination)`** - Simple move
2. **`move_car_manual(car_id, destination, notes)`** - Move with notes

## ⚠️ **Troubleshooting**

### **If you still get 404 errors:**
1. Check that you ran the complete script successfully
2. Verify your Supabase URL and API key in `.env`
3. Check browser console for more specific error messages

### **If cars don't move:**
1. Check that you have cars in the `cars` table
2. Verify the car IDs are UUIDs (not numbers)
3. Check Supabase logs for more details

### **If audit errors persist:**
1. The audit triggers might need to be disabled temporarily
2. Run this in SQL Editor:
```sql
DROP TRIGGER IF EXISTS trg_audit_cars ON public.cars;
```

## 🎯 **Expected Results**

After running the fix:
- ✅ No more 404 errors in browser console
- ✅ Move car dialog opens and works
- ✅ Cars successfully move between locations
- ✅ Database updates reflect in the UI immediately
- ✅ All audit logging works correctly

## 📞 **Need Help?**

If you encounter any issues:
1. Check the browser console for error messages
2. Check Supabase logs in your dashboard
3. Run the verification queries to see what's missing
4. Share the specific error messages for further assistance

---

**The fix should resolve all the database connectivity issues and make the car movement functionality work perfectly! 🚗✨**
